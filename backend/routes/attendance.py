import secrets
from datetime import datetime, timedelta, timezone
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

attendance_routes = Blueprint("attendance", __name__)


@attendance_routes.post("/api/attendance-sessions")
@auth_required
def create_session():
    data = request.get_json(silent=True) or {}
    class_id = str(uuid_value(data.get("class_id"), "Class"))
    duration = qr_duration(data.get("duration_minutes"))
    selected_date = attendance_date(
        data.get("attendance_date") or datetime.now(timezone.utc).date().isoformat()
    )
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=duration)
    with database() as db:
        owned = db.execute(
            "select 1 from classes where id=%s and tutor_id=%s and status='Active'",
            (class_id, tutor_id()),
        ).fetchone()
        if not owned:
            return response(message="Class not found.", status=404)
        db.execute(
            "update attendance_sessions set status='Ended' where class_id=%s and tutor_id=%s and status='Active'",
            (class_id, tutor_id()),
        )
        row = db.execute(
            """insert into attendance_sessions(tutor_id,class_id,attendance_date,qr_token,starts_at,expires_at,duration_minutes,status)
            values(%s,%s,%s,%s,%s,%s,%s,'Active') returning *""",
            (
                tutor_id(),
                class_id,
                selected_date,
                secrets.token_urlsafe(32),
                now,
                expires,
                duration,
            ),
        ).fetchone()
        db.execute(
            """insert into attendance_records(session_id,class_id,student_id,attendance_date,status,marked_method)
            select %s,%s,cs.student_id,%s,'Absent','QR' from class_students cs join students s on s.id=cs.student_id
            where cs.class_id=%s and cs.status='Active' and s.status='Active' on conflict(session_id,student_id) do nothing""",
            (row["id"], class_id, selected_date, class_id),
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
            """select ar.*,s.student_code,s.full_name from attendance_records ar join students s on s.id=ar.student_id
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
            "select 1 from class_students where class_id=%s and student_id=%s and status='Active'",
            (session["class_id"], student["id"]),
        ).fetchone()
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
        {"result": "Present", "attendance": dict(row)}, "Attendance marked Present."
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
