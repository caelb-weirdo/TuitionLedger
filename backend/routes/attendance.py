import secrets
from datetime import datetime, timedelta, timezone
import psycopg
from flask import Blueprint, request

from core import auth_required, database, response, tutor_id
from validators import (
    attendance_date,
    attendance_status,
    browser_id,
    manual_reason,
    qr_duration,
    secure_token,
    uuid_value,
)
from scheduling import schedule_window, session_expiry, validate_override

attendance_routes = Blueprint("attendance", __name__)


def current_time():
    return datetime.now(timezone.utc)


@attendance_routes.post("/api/attendance-sessions")
@auth_required
def create_session():
    data = request.get_json(silent=True) or {}
    class_id = str(uuid_value(data.get("class_id"), "Class"))
    duration = qr_duration(data.get("duration_minutes"))
    now = current_time()
    is_extra = data.get("is_extra_session") is True
    with database() as db:
        owned = db.execute(
            "select * from classes where id=%s and tutor_id=%s and status='Active' for update",
            (class_id, tutor_id()),
        ).fetchone()
        if not owned:
            return response(message="Class not found.", status=404)
        db.execute(
            "update attendance_sessions set status='Expired' where class_id=%s and tutor_id=%s and status='Active' and expires_at<=%s",
            (class_id, tutor_id(), now),
        )
        active = db.execute(
            "select id,expires_at from attendance_sessions where class_id=%s and tutor_id=%s and status='Active' and expires_at>%s for update",
            (class_id, tutor_id(), now),
        ).fetchone()
        if active:
            return response(dict(active), "An attendance session is already active for this class.", 409, code="ACTIVE_SESSION_EXISTS")
        window = schedule_window(owned, now)
        if data.get("attendance_date"):
            supplied_date = attendance_date(data["attendance_date"])
            if supplied_date.isoformat() != window["attendance_date"]:
                return response(message="Attendance date must be today's Colombo date.", status=422)
        try:
            override_reason = validate_override(
                is_extra,
                data.get("override_reason"),
                data.get("other_reason"),
            )
        except ValueError as error:
            return response(message=str(error), status=422)
        if not window["available_now"] and not is_extra:
            schedule_data = {key: value for key, value in window.items() if key not in {"available_now", "scheduled_start_at", "scheduled_end_at"}}
            return response(schedule_data, "This class is outside its normal attendance window.", 409, code="OUTSIDE_CLASS_SCHEDULE")
        expires = session_expiry(now, duration, window, is_extra)
        try:
            row = db.execute(
                """insert into attendance_sessions(tutor_id,class_id,attendance_date,qr_token,starts_at,expires_at,duration_minutes,status,is_extra_session,override_reason,scheduled_start_at,scheduled_end_at)
                values(%s,%s,%s,%s,%s,%s,%s,'Active',%s,%s,%s,%s) returning *""",
                (
                    tutor_id(), class_id, window["attendance_date"], secrets.token_urlsafe(32), now,
                    expires, duration, is_extra, override_reason,
                    window["scheduled_start_at"] if not is_extra else None,
                    window["scheduled_end_at"] if not is_extra else None,
                ),
            ).fetchone()
        except psycopg.errors.UniqueViolation:
            db.rollback()
            return response(message="An attendance session is already active for this class.", status=409, code="ACTIVE_SESSION_EXISTS")
        db.execute(
            """insert into attendance_records(session_id,class_id,student_id,attendance_date,status,marked_method)
            select %s,%s,cs.student_id,%s,'Absent','QR' from class_students cs join students s on s.id=cs.student_id
            where cs.class_id=%s and cs.status='Active' and s.status='Active'
            on conflict(class_id,student_id,attendance_date) do update
            set session_id=excluded.session_id,updated_at=now()""",
            (row["id"], class_id, window["attendance_date"], class_id),
        )
        db.commit()
    return response(dict(row), "Attendance session created.", 201)


@attendance_routes.post("/api/attendance-sessions/<session_id>/end")
@auth_required
def end_session(session_id):
    uuid_value(session_id, "Session")
    with database() as db:
        row = db.execute(
            "update attendance_sessions set status='Ended' where id=%s and tutor_id=%s and status='Active' returning *",
            (session_id, tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Active session not found.",
        200 if row else 404,
    )


@attendance_routes.get("/api/attendance-sessions/<session_id>/progress")
@auth_required
def session_progress(session_id):
    uuid_value(session_id, "Session")
    with database() as db:
        session = db.execute(
            "select id,status,starts_at,expires_at,is_extra_session from attendance_sessions where id=%s and tutor_id=%s",
            (session_id, tutor_id()),
        ).fetchone()
        if not session:
            return response(message="Attendance session not found.", status=404)
        totals = db.execute(
            """select count(*)::int as expected,
            count(*) filter (where status='Present')::int as present
            from attendance_records where session_id=%s""",
            (session_id,),
        ).fetchone()
        recent = db.execute(
            """select s.full_name,s.student_code,ar.marked_at
            from attendance_records ar join students s on s.id=ar.student_id
            where ar.session_id=%s and ar.status='Present'
            order by ar.marked_at desc limit 5""",
            (session_id,),
        ).fetchall()
    return response(
        {
            **dict(session),
            "expected": totals["expected"],
            "present": totals["present"],
            "recent_scans": [dict(row) for row in recent],
        }
    )


@attendance_routes.get("/api/attendance/classes/<class_id>")
@auth_required
def attendance_history(class_id):
    uuid_value(class_id, "Class")
    date_filter = request.args.get("date")
    params = [class_id, tutor_id()]
    extra = ""
    if date_filter:
        params.append(attendance_date(date_filter))
        extra = " and ar.attendance_date=%s"
    with database() as db:
        rows = db.execute(
            """select ar.*,s.student_code,s.full_name,ats.is_extra_session,ats.override_reason from attendance_records ar join students s on s.id=ar.student_id
            join attendance_sessions ats on ats.id=ar.session_id
            join classes c on c.id=ar.class_id where ar.class_id=%s and c.tutor_id=%s"""
            + extra
            + " order by ar.attendance_date desc,s.full_name",
            tuple(params),
        ).fetchall()
    return response([dict(row) for row in rows])


@attendance_routes.post("/api/attendance/scan")
def scan():
    data = request.get_json(silent=True) or {}
    token = secure_token(data.get("qr_token"), "Attendance token")
    browser = browser_id(data.get("browser_id"))
    with database() as db:
        session = db.execute(
            "select * from attendance_sessions where qr_token=%s", (token,)
        ).fetchone()
        if not session:
            return response({"result": "Expired"}, "QR code expired.", 410)
        if session["status"] == "Ended":
            return response({"result": "Ended"}, "Attendance session has ended.", 410)
        if session["status"] != "Active" or session["expires_at"] <= datetime.now(
            timezone.utc
        ):
            return response({"result": "Expired"}, "QR code expired.", 410)
        student = db.execute(
            "select * from students where browser_id=%s and browser_status='Approved' and status='Active' and tutor_id=%s",
            (browser, session["tutor_id"]),
        ).fetchone()
        if not student:
            return response(
                {"result": "Wrong Browser"},
                "This browser is not approved for attendance.",
                403,
            )
        enrolled = db.execute(
            """select cs.id, c.grade as class_grade, s.grade as student_grade
            from class_students cs
            join classes c on c.id=cs.class_id
            join students s on s.id=cs.student_id
            where cs.class_id=%s and cs.student_id=%s and cs.status='Active'
              and c.status='Active' and s.status='Active'""",
            (session["class_id"], student["id"]),
        ).fetchone()
        if enrolled and enrolled["student_grade"] != enrolled["class_grade"]:
            return response(
                {"result": "Wrong Grade"},
                "Your grade does not match this class.",
                403,
            )
        if not enrolled:
            return response(
                {"result": "Not Enrolled"}, "You are not enrolled in this class.", 403
            )
        row = db.execute(
            """update attendance_records set status='Present',marked_method='QR',manual_reason=null,marked_at=now(),updated_at=now()
            where session_id=%s and student_id=%s and status='Absent' returning *""",
            (session["id"], student["id"]),
        ).fetchone()
        if not row:
            existing = db.execute(
                "select * from attendance_records where session_id=%s and student_id=%s",
                (session["id"], student["id"]),
            ).fetchone()
            if existing:
                return response(
                    {"result": "Already Marked", "attendance": dict(existing)},
                    "Your attendance was already recorded.",
                )
            return response(message="Attendance record is unavailable.", status=409)
        db.commit()
    return response(
        {
            "result": "Present",
            "attendance": dict(row),
            "student": {"full_name": student["full_name"], "student_code": student["student_code"]},
            "class": {"id": session["class_id"]},
            "attendance_date": str(session["attendance_date"]),
            "recorded_at": str(row["marked_at"]),
        },
        "Attendance marked Present.",
    )


@attendance_routes.post("/api/attendance/manual")
@auth_required
def manual_correction():
    data = request.get_json(silent=True) or {}
    session_id = str(uuid_value(data.get("session_id"), "Session"))
    class_id = str(uuid_value(data.get("class_id"), "Class"))
    student_id = str(uuid_value(data.get("student_id"), "Student"))
    status = attendance_status(data.get("status"))
    reason = manual_reason(data.get("reason"))
    with database() as db:
        row = db.execute(
            """update attendance_records ar set status=%s,marked_method='Manual',manual_reason=%s,marked_at=now(),updated_at=now()
            from attendance_sessions ats,classes c,class_students cs,students s
            where ar.session_id=ats.id and ar.class_id=c.id and ar.student_id=s.id and cs.class_id=c.id and cs.student_id=s.id
            and ar.session_id=%s and ar.class_id=%s and ar.student_id=%s and ats.tutor_id=%s and c.tutor_id=%s and s.tutor_id=%s returning ar.*""",
            (
                status,
                reason,
                session_id,
                class_id,
                student_id,
                tutor_id(),
                tutor_id(),
                tutor_id(),
            ),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Attendance record not found.",
        200 if row else 404,
    )
