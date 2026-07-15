import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import quote

import psycopg
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from core import auth_call, auth_required, database, response, tutor_id

load_dotenv()
app = Flask(__name__)
configured_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", "*")).split(
        ","
    )
    if origin.strip()
]
# Keep local development origins while allowing the deployed tutor and student
# clients to call this API from the browser.
deployed_origins = [
    os.getenv("TUTOR_APP_URL", "https://tuitionledger-frontend.vercel.app"),
    os.getenv("STUDENT_APP_URL", "https://student-mobile-pwa.vercel.app"),
]
local_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://localhost:4174",
]
origins = (
    ["*"]
    if "*" in configured_origins
    else sorted(set(configured_origins + local_origins + deployed_origins))
)
CORS(app, origins=origins)


@app.get("/health")
def health():
    return response(
        {"service": "TuitionLedger API", "time": datetime.now(timezone.utc).isoformat()}
    )


@app.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email, password = str(data.get("email", "")).strip(), str(data.get("password", ""))
    if not email or len(password) < 8:
        return response(
            message="Use an email and a password with at least 8 characters.",
            status=422,
        )
    try:
        redirect_url = os.getenv(
            "AUTH_REDIRECT_URL",
            f"{os.getenv('TUTOR_APP_URL', 'https://tuitionledger-frontend.vercel.app')}/#login",
        )
        result = auth_call(
            f"/auth/v1/signup?redirect_to={quote(redirect_url, safe='')}",
            {"email": email, "password": password, "data": {"role": "tutor"}},
        )
        return response(
            {"user": result.get("user"), "session": result.get("access_token")},
            "Account created. Check your email if confirmation is enabled.",
            201,
        )
    except HTTPError as error:
        detail = json.loads(error.read().decode()) if error.fp else {}
        return response(
            message=detail.get("msg")
            or detail.get("error_description")
            or "That email could not be registered.",
            status=400,
        )
    except (URLError, TimeoutError):
        return response(message="Supabase Auth could not be reached.", status=502)


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email, password = str(data.get("email", "")).strip(), str(data.get("password", ""))
    if not email or not password:
        return response(message="Email and password are required.", status=422)
    try:
        result = auth_call(
            "/auth/v1/token?grant_type=password", {"email": email, "password": password}
        )
        return response(
            {
                "access_token": result.get("access_token"),
                "refresh_token": result.get("refresh_token"),
                "user": result.get("user"),
            }
        )
    except HTTPError as error:
        detail = json.loads(error.read().decode()) if error.fp else {}
        return response(
            message=detail.get("msg")
            or detail.get("error_description")
            or "Invalid email or password.",
            status=401,
        )
    except (URLError, TimeoutError):
        return response(message="Supabase Auth could not be reached.", status=502)


@app.get("/api/tutor")
@auth_required
def get_tutor():
    with database() as db:
        row = db.execute("select * from tutors where id=%s", (tutor_id(),)).fetchone()
    return response(
        dict(row) if row else {"id": tutor_id(), "email": g.user.get("email")}
    )


@app.put("/api/tutor")
@auth_required
def update_tutor():
    data = request.get_json(silent=True) or {}
    with database() as db:
        row = db.execute(
            """insert into tutors(id,full_name,email,phone,center_name) values(%s,%s,%s,%s,%s)
          on conflict(id) do update set full_name=excluded.full_name, phone=excluded.phone, center_name=excluded.center_name
          returning *""",
            (
                tutor_id(),
                str(data.get("full_name", "")).strip(),
                g.user.get("email", ""),
                str(data.get("phone", "")).strip(),
                str(data.get("center_name", "")).strip(),
            ),
        ).fetchone()
        db.commit()
    return response(dict(row))


@app.get("/api/students")
@auth_required
def students():
    with database() as db:
        rows = db.execute(
            "select * from students where tutor_id=%s order by created_at desc",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@app.post("/api/students")
@auth_required
def add_student():
    data = request.get_json(silent=True) or {}
    required = [
        "full_name",
        "student_phone",
        "guardian_name",
        "guardian_whatsapp",
        "grade",
    ]
    if any(not str(data.get(k, "")).strip() for k in required):
        return response(message="Complete every student field.", status=422)
    with database() as db:
        code = db.execute(
            "select next_student_code(%s) as code", (tutor_id(),)
        ).fetchone()["code"]
        row = db.execute(
            """insert into students(tutor_id,student_code,full_name,student_phone,guardian_name,guardian_whatsapp,grade,browser_status)
          values(%s,%s,%s,%s,%s,%s,%s,'Pending') returning *""",
            (tutor_id(), code, *(str(data[k]).strip() for k in required)),
        ).fetchone()
        db.commit()
    return response(dict(row), status=201)


@app.put("/api/students/<student_id>")
@auth_required
def edit_student(student_id):
    data = request.get_json(silent=True) or {}
    with database() as db:
        row = db.execute(
            """update students set full_name=%s,student_phone=%s,guardian_name=%s,guardian_whatsapp=%s,grade=%s
          where id=%s and tutor_id=%s returning *""",
            tuple(
                str(data.get(k, "")).strip()
                for k in [
                    "full_name",
                    "student_phone",
                    "guardian_name",
                    "guardian_whatsapp",
                    "grade",
                ]
            )
            + (student_id, tutor_id()),
        ).fetchone()
        if not row:
            return response(message="Student not found.", status=404)
        db.commit()
    return response(dict(row))


@app.delete("/api/students/<student_id>")
@auth_required
def delete_student(student_id):
    with database() as db:
        result = db.execute(
            "delete from students where id=%s and tutor_id=%s", (student_id, tutor_id())
        )
        db.commit()
    return response(
        message="Student deleted." if result.rowcount else "Student not found.",
        status=200 if result.rowcount else 404,
    )


@app.post("/api/students/<student_id>/reset-browser")
@auth_required
def reset_browser(student_id):
    with database() as db:
        row = db.execute(
            "update students set browser_id=null,browser_status='Reset Needed' where id=%s and tutor_id=%s returning *",
            (student_id, tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Student not found.",
        200 if row else 404,
    )


@app.post("/api/registration-qr")
@auth_required
def registration_qr():
    token = secrets.token_urlsafe(24)
    with database() as db:
        row = db.execute(
            "insert into registration_tokens(tutor_id,token,expires_at) values(%s,%s,%s) returning token,expires_at",
            (tutor_id(), token, datetime.now(timezone.utc) + timedelta(hours=24)),
        ).fetchone()
        db.commit()
    return response(dict(row), status=201)


@app.post("/api/register-student")
def register_student():
    data = request.get_json(silent=True) or {}
    required = [
        "registration_token",
        "full_name",
        "student_phone",
        "guardian_name",
        "guardian_whatsapp",
        "grade",
        "browser_id",
    ]
    if any(not str(data.get(k, "")).strip() for k in required):
        return response(message="Complete every registration field.", status=422)
    with database() as db:
        token = db.execute(
            "select * from registration_tokens where token=%s and expires_at>now()",
            (data["registration_token"],),
        ).fetchone()
        if not token:
            return response(message="Registration link has expired.", status=410)
        row = db.execute(
            """insert into registration_requests(tutor_id,full_name,student_phone,guardian_name,guardian_whatsapp,grade,requested_classes,browser_id)
          values(%s,%s,%s,%s,%s,%s,%s,%s) returning id,status""",
            (
                token["tutor_id"],
                data["full_name"].strip(),
                data["student_phone"].strip(),
                data["guardian_name"].strip(),
                data["guardian_whatsapp"].strip(),
                data["grade"],
                data.get("requested_classes", []),
                data["browser_id"].strip(),
            ),
        ).fetchone()
        db.commit()
    return response(dict(row), status=201)


@app.get("/api/registration-requests/<request_id>/status")
def registration_request_status(request_id):
    """Return only the status for the browser that created the request."""
    browser_id = request.args.get("browser_id", "").strip()
    if not browser_id:
        return response(message="Browser identity is required.", status=422)
    with database() as db:
        row = db.execute(
            """select rr.status, s.student_code
               from registration_requests rr
               left join students s on s.tutor_id=rr.tutor_id and s.browser_id=rr.browser_id
               where rr.id=%s and rr.browser_id=%s""",
            (request_id, browser_id),
        ).fetchone()
    if not row:
        return response(message="Registration request not found.", status=404)
    return response({"status": row["status"], "student_code": row["student_code"]})


@app.get("/api/registration-requests")
@auth_required
def registration_requests():
    with database() as db:
        rows = db.execute(
            "select * from registration_requests where tutor_id=%s order by submitted_at desc",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@app.post("/api/registration-requests/<request_id>/approve")
@auth_required
def approve_registration(request_id):
    with database() as db:
        req = db.execute(
            "select * from registration_requests where id=%s and tutor_id=%s and status='Pending'",
            (request_id, tutor_id()),
        ).fetchone()
        if not req:
            return response(message="Registration request not found.", status=404)
        code = db.execute(
            "select next_student_code(%s) as code", (tutor_id(),)
        ).fetchone()["code"]
        student = db.execute(
            """insert into students(tutor_id,student_code,full_name,student_phone,guardian_name,guardian_whatsapp,grade,browser_id,browser_status)
          values(%s,%s,%s,%s,%s,%s,%s,%s,'Approved') returning *""",
            (
                tutor_id(),
                code,
                req["full_name"],
                req["student_phone"],
                req["guardian_name"],
                req["guardian_whatsapp"],
                req["grade"],
                req["browser_id"],
            ),
        ).fetchone()
        db.execute(
            "update registration_requests set status='Approved',approved_at=now() where id=%s",
            (request_id,),
        )
        db.commit()
    return response(dict(student))


@app.post("/api/registration-requests/<request_id>/reject")
@auth_required
def reject_registration(request_id):
    with database() as db:
        result = db.execute(
            "update registration_requests set status='Rejected' where id=%s and tutor_id=%s and status='Pending'",
            (request_id, tutor_id()),
        )
        db.commit()
    return response(
        message="Registration rejected."
        if result.rowcount
        else "Registration request not found.",
        status=200 if result.rowcount else 404,
    )


@app.get("/api/classes")
@auth_required
def classes():
    with database() as db:
        rows = db.execute(
            "select * from classes where tutor_id=%s order by day,start_time",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@app.post("/api/classes")
@auth_required
def add_class():
    data = request.get_json(silent=True) or {}
    required = [
        "grade",
        "subject",
        "class_name",
        "day",
        "start_time",
        "end_time",
        "monthly_fee",
    ]
    if any(str(data.get(k, "")).strip() == "" for k in required):
        return response(message="Complete every class field.", status=422)
    with database() as db:
        row = db.execute(
            """insert into classes(tutor_id,grade,subject,class_name,day,start_time,end_time,monthly_fee) values(%s,%s,%s,%s,%s,%s,%s,%s) returning *""",
            (tutor_id(), *(data[k] for k in required)),
        ).fetchone()
        db.commit()
    return response(dict(row), status=201)


@app.put("/api/classes/<class_id>")
@auth_required
def edit_class(class_id):
    data = request.get_json(silent=True) or {}
    fields = [
        "grade",
        "subject",
        "class_name",
        "day",
        "start_time",
        "end_time",
        "monthly_fee",
    ]
    with database() as db:
        row = db.execute(
            "update classes set grade=%s,subject=%s,class_name=%s,day=%s,start_time=%s,end_time=%s,monthly_fee=%s where id=%s and tutor_id=%s returning *",
            tuple(data.get(k) for k in fields) + (class_id, tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Class not found.",
        200 if row else 404,
    )


@app.delete("/api/classes/<class_id>")
@auth_required
def delete_class(class_id):
    with database() as db:
        result = db.execute(
            "delete from classes where id=%s and tutor_id=%s", (class_id, tutor_id())
        )
        db.commit()
    return response(
        message="Class deleted." if result.rowcount else "Class not found.",
        status=200 if result.rowcount else 404,
    )


@app.get("/api/classes/<class_id>/students")
@auth_required
def class_students(class_id):
    with database() as db:
        rows = db.execute(
            "select s.* from students s join class_students cs on cs.student_id=s.id where cs.class_id=%s and cs.status='Active' and s.tutor_id=%s",
            (class_id, tutor_id()),
        ).fetchall()
    return response([dict(row) for row in rows])


@app.post("/api/classes/<class_id>/students")
@auth_required
def enroll_student(class_id):
    student_id = (request.get_json(silent=True) or {}).get("student_id")
    with database() as db:
        row = db.execute(
            "insert into class_students(class_id,student_id) select %s,id from students where id=%s and tutor_id=%s on conflict(class_id,student_id) do update set status='Active' returning *",
            (class_id, student_id, tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Student or class not found.",
        201 if row else 404,
    )


@app.delete("/api/classes/<class_id>/students/<student_id>")
@auth_required
def unenroll_student(class_id, student_id):
    with database() as db:
        result = db.execute(
            "update class_students set status='Removed' where class_id=%s and student_id=%s",
            (class_id, student_id),
        )
        db.commit()
    return response(
        message="Student removed." if result.rowcount else "Enrollment not found.",
        status=200 if result.rowcount else 404,
    )


@app.post("/api/attendance-sessions")
@auth_required
def create_session():
    data = request.get_json(silent=True) or {}
    try:
        duration = int(data.get("duration_minutes", 0))
    except (TypeError, ValueError):
        duration = 0
    if duration not in (5, 10):
        return response(message="Choose a 5 or 10 minute session.", status=422)
    attendance_date = str(data.get("attendance_date", "")).strip()
    if not attendance_date:
        attendance_date = datetime.now(timezone.utc).date().isoformat()
    token = secrets.token_urlsafe(24)
    now = datetime.now(timezone.utc)
    with database() as db:
        row = db.execute(
            "insert into attendance_sessions(tutor_id,class_id,attendance_date,qr_token,starts_at,expires_at,duration_minutes) select %s,id,%s,%s,%s,%s,%s from classes where id=%s and tutor_id=%s returning *",
            (
                tutor_id(),
                attendance_date,
                token,
                now,
                now + timedelta(minutes=duration),
                duration,
                data.get("class_id"),
                tutor_id(),
            ),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Class not found.",
        201 if row else 404,
    )


@app.post("/api/attendance-sessions/<session_id>/end")
@auth_required
def end_session(session_id):
    with database() as db:
        row = db.execute(
            "update attendance_sessions set status='Ended' where id=%s and tutor_id=%s returning *",
            (session_id, tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Session not found.",
        200 if row else 404,
    )


@app.get("/api/attendance/classes/<class_id>")
@auth_required
def attendance_list(class_id):
    with database() as db:
        rows = db.execute(
            "select ar.*,s.student_code,s.full_name from attendance_records ar join students s on s.id=ar.student_id join classes c on c.id=ar.class_id where ar.class_id=%s and c.tutor_id=%s order by ar.marked_at desc",
            (class_id, tutor_id()),
        ).fetchall()
    return response([dict(row) for row in rows])


@app.post("/api/attendance/scan")
def scan_attendance():
    data = request.get_json(silent=True) or {}
    required = ["qr_token", "browser_id"]
    if any(not str(data.get(k, "")).strip() for k in required):
        return response(
            message="Attendance token and browser are required.", status=422
        )
    with database() as db:
        session = db.execute(
            "select * from attendance_sessions where qr_token=%s", (data["qr_token"],)
        ).fetchone()
        if (
            not session
            or session["status"] != "Active"
            or session["expires_at"] <= datetime.now(timezone.utc)
        ):
            return response(message="QR code expired.", status=410)
        student = db.execute(
            "select * from students where browser_id=%s and browser_status='Approved' and tutor_id=%s",
            (data["browser_id"], session["tutor_id"]),
        ).fetchone()
        if not student:
            return response(message="This browser is not approved.", status=403)
        enrolled = db.execute(
            "select 1 from class_students where class_id=%s and student_id=%s and status='Active'",
            (session["class_id"], student["id"]),
        ).fetchone()
        if not enrolled:
            return response(message="You are not enrolled in this class.", status=403)
        try:
            row = db.execute(
                "insert into attendance_records(session_id,class_id,student_id,attendance_date,status,marked_method) values(%s,%s,%s,%s,'Present','QR') returning *",
                (
                    session["id"],
                    session["class_id"],
                    student["id"],
                    session["attendance_date"],
                ),
            ).fetchone()
            db.commit()
        except psycopg.errors.UniqueViolation:
            db.rollback()
            return response(message="Attendance already marked.", status=409)
    return response(dict(row), status=201)


@app.post("/api/attendance/manual")
@auth_required
def manual_attendance():
    data = request.get_json(silent=True) or {}
    if (
        not data.get("session_id")
        or not data.get("class_id")
        or not data.get("student_id")
        or data.get("status") not in ("Present", "Absent")
    ):
        return response(
            message="Choose a session, student, class, and attendance status.",
            status=422,
        )
    with database() as db:
        row = db.execute(
            "insert into attendance_records(session_id,class_id,student_id,attendance_date,status,marked_method) select s.id,s.class_id,%s,s.attendance_date,%s,'Manual' from attendance_sessions s where s.id=%s and s.class_id=%s and s.tutor_id=%s and s.status='Active' on conflict(session_id,student_id) do update set status=excluded.status,marked_method='Manual',marked_at=now() returning *",
            (
                data.get("student_id"),
                data.get("status"),
                data.get("session_id"),
                data.get("class_id"),
                tutor_id(),
            ),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Attendance could not be updated.",
        200 if row else 404,
    )


@app.get("/api/fees")
@auth_required
def fees():
    with database() as db:
        rows = db.execute(
            "select f.*,s.student_code,s.full_name,c.class_name from fee_records f join students s on s.id=f.student_id join classes c on c.id=f.class_id where f.tutor_id=%s order by f.month desc",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@app.post("/api/fees/generate")
@auth_required
def generate_fees():
    month = (request.get_json(silent=True) or {}).get("month")
    with database() as db:
        db.execute(
            "insert into fee_records(tutor_id,student_id,class_id,month,amount) select %s,cs.student_id,c.id,%s,c.monthly_fee from classes c join class_students cs on cs.class_id=c.id and cs.status='Active' where c.tutor_id=%s on conflict(student_id,class_id,month) do nothing",
            (tutor_id(), month, tutor_id()),
        )
        db.commit()
    return response(message="Fee records generated.")


@app.put("/api/fees/<fee_id>")
@auth_required
def update_fee(fee_id):
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("Paid", "Unpaid"):
        return response(message="Fee status must be Paid or Unpaid.", status=422)
    with database() as db:
        row = db.execute(
            "update fee_records set status=%s,paid_at=case when %s='Paid' then now() else null end,updated_at=now() where id=%s and tutor_id=%s returning *",
            (status, status, fee_id, tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Fee record not found.",
        200 if row else 404,
    )


@app.get("/api/fees/<fee_id>/whatsapp")
@auth_required
def fee_whatsapp(fee_id):
    with database() as db:
        row = db.execute(
            "select f.amount,f.month,s.full_name,s.guardian_whatsapp,c.class_name from fee_records f join students s on s.id=f.student_id join classes c on c.id=f.class_id where f.id=%s and f.tutor_id=%s",
            (fee_id, tutor_id()),
        ).fetchone()
    if not row:
        return response(message="Fee record not found.", status=404)
    message = f"Hello, this is a reminder that {row['full_name']}'s {row['class_name']} fee of Rs. {row['amount']} for {row['month']} is unpaid. Thank you."
    return response(
        {
            "phone": row["guardian_whatsapp"],
            "message": message,
            "url": f"https://wa.me/{row['guardian_whatsapp']}?text={quote(message)}",
        }
    )


@app.errorhandler(psycopg.OperationalError)
def db_error(error):
    app.logger.exception("Database connection failed: %s", error)
    return response(message="The data service is temporarily unavailable.", status=503)


@app.errorhandler(Exception)
def unknown_error(_error):
    app.logger.exception("Unhandled API error")
    return response(message="Something went wrong. Please try again.", status=500)


if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", "8000")), debug=True)
