import psycopg
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request
from urllib.parse import quote

from core import auth_required, database, response, tutor_id
from validators import (
    browser_id,
    grade,
    fee_month,
    fee_status,
    person_name,
    secure_token,
    sri_lankan_phone,
    student_code,
    uuid_value,
)

student_routes = Blueprint("students", __name__)


def student_payload(data):
    return (
        person_name(data.get("full_name"), "Full name"),
        sri_lankan_phone(data.get("student_phone"), "Student phone"),
        person_name(data.get("guardian_name"), "Guardian name"),
        sri_lankan_phone(data.get("guardian_whatsapp"), "Guardian WhatsApp"),
        grade(data.get("grade")),
    )


@student_routes.get("/api/students")
@auth_required
def students():
    with database() as db:
        rows = db.execute(
            """select s.*,
            coalesce((
              select json_agg(json_build_object('id',c.id,'class_name',c.class_name) order by c.class_name)
              from class_students cs join classes c on c.id=cs.class_id
              where cs.student_id=s.id and cs.status='Active' and c.status='Active'
            ),'[]'::json) as enrolled_classes
            from students s where s.tutor_id=%s and s.status='Active' order by s.created_at desc""",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@student_routes.get("/api/students/overview")
@auth_required
def students_overview():
    """Load the Students page in one authenticated database round trip."""
    owner = tutor_id()
    with database() as db:
        student_rows = db.execute(
            """select s.*,
            coalesce((
              select json_agg(json_build_object('id',c.id,'class_name',c.class_name) order by c.class_name)
              from class_students cs join classes c on c.id=cs.class_id
              where cs.student_id=s.id and cs.status='Active' and c.status='Active'
            ),'[]'::json) as enrolled_classes
            from students s where s.tutor_id=%s and s.status='Active' order by s.created_at desc""",
            (owner,),
        ).fetchall()
        registration_rows = db.execute(
            "select * from registration_requests where tutor_id=%s order by submitted_at desc",
            (owner,),
        ).fetchall()
        browser_rows = db.execute(
            """select br.*,s.student_code,s.full_name from browser_requests br
            join students s on s.id=br.student_id
            where br.tutor_id=%s order by br.submitted_at desc""",
            (owner,),
        ).fetchall()
    return response(
        {
            "students": [dict(row) for row in student_rows],
            "registration_requests": [dict(row) for row in registration_rows],
            "browser_requests": [dict(row) for row in browser_rows],
        }
    )


@student_routes.post("/api/students")
@auth_required
def add_student():
    values = student_payload(request.get_json(silent=True) or {})
    with database() as db:
        code = db.execute(
            "select next_student_code(%s) code", (tutor_id(),)
        ).fetchone()["code"]
        row = db.execute(
            """insert into students(tutor_id,student_code,full_name,student_phone,guardian_name,guardian_whatsapp,grade,browser_status,status)
            values(%s,%s,%s,%s,%s,%s,%s,'Not Connected','Active') returning *""",
            (tutor_id(), code, *values),
        ).fetchone()
        db.commit()
    return response(dict(row), "Student created.", 201)


@student_routes.put("/api/students/<student_id>")
@auth_required
def edit_student(student_id):
    uuid_value(student_id, "Student")
    values = student_payload(request.get_json(silent=True) or {})
    with database() as db:
        row = db.execute(
            """update students set full_name=%s,student_phone=%s,guardian_name=%s,guardian_whatsapp=%s,grade=%s,updated_at=now()
            where id=%s and tutor_id=%s and status='Active' returning *""",
            (*values, student_id, tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Student not found.",
        200 if row else 404,
    )


@student_routes.delete("/api/students/<student_id>")
@auth_required
def archive_student(student_id):
    uuid_value(student_id, "Student")
    with database() as db:
        row = db.execute(
            """update students set status='Archived',browser_id=null,browser_status='Not Connected',updated_at=now()
            where id=%s and tutor_id=%s and status='Active' returning id""",
            (student_id, tutor_id()),
        ).fetchone()
        if row:
            db.execute(
                "update class_students set status='Removed' where student_id=%s",
                (student_id,),
            )
        db.commit()
    return response(
        dict(row) if row else None,
        "Student archived." if row else "Student not found.",
        200 if row else 404,
    )


@student_routes.post("/api/students/<student_id>/reset-browser")
@auth_required
def reset_browser(student_id):
    uuid_value(student_id, "Student")
    with database() as db:
        row = db.execute(
            "update students set browser_id=null,browser_status='Not Connected',updated_at=now() where id=%s and tutor_id=%s and status='Active' returning *",
            (student_id, tutor_id()),
        ).fetchone()
        if row:
            db.execute(
                "update browser_requests set status='Rejected',reviewed_at=now() where student_id=%s and status='Pending'",
                (student_id,),
            )
        db.commit()
    return response(
        dict(row) if row else None,
        None if row else "Student not found.",
        200 if row else 404,
    )


@student_routes.get("/api/students/<student_id>/monthly-summary")
@auth_required
def student_monthly_summary(student_id):
    uuid_value(student_id, "Student")
    month = fee_month(request.args.get("month"))
    with database() as db:
        student = db.execute(
            "select * from students where id=%s and tutor_id=%s and status='Active'",
            (student_id, tutor_id()),
        ).fetchone()
        if not student:
            return response(message="Student not found.", status=404)
        fees = db.execute(
            """select f.*,c.class_name from fee_records f join classes c on c.id=f.class_id
            where f.student_id=%s and f.tutor_id=%s and f.month=%s order by c.class_name""",
            (student_id, tutor_id(), month),
        ).fetchall()
        attendance = db.execute(
            """select ar.*,c.class_name from attendance_records ar join classes c on c.id=ar.class_id
            where ar.student_id=%s and c.tutor_id=%s and ar.attendance_date >= %s::date
            and ar.attendance_date < (%s::date + interval '1 month') order by ar.attendance_date desc,c.class_name""",
            (student_id, tutor_id(), month, month),
        ).fetchall()
    fee_rows = [dict(row) for row in fees]
    attendance_rows = [dict(row) for row in attendance]
    present = sum(row["status"] == "Present" for row in attendance_rows)
    absent = sum(row["status"] == "Absent" for row in attendance_rows)
    total_attendance = present + absent
    return response(
        {
            "student": dict(student),
            "fees": fee_rows,
            "combined_amount": sum(row["amount"] for row in fee_rows),
            "payment_status": "Paid"
            if fee_rows and all(row["status"] == "Paid" for row in fee_rows)
            else "Unpaid",
            "attendance": attendance_rows,
            "present": present,
            "absent": absent,
            "attendance_rate": round(present * 100 / total_attendance)
            if total_attendance
            else 0,
        }
    )


@student_routes.put("/api/students/<student_id>/fees/<month_text>")
@auth_required
def update_student_month_fees(student_id, month_text):
    uuid_value(student_id, "Student")
    month = fee_month(month_text)
    status = fee_status((request.get_json(silent=True) or {}).get("status"))
    with database() as db:
        rows = db.execute(
            """update fee_records set status=%s,paid_at=case when %s='Paid' then now() else null end,updated_at=now()
            where student_id=%s and tutor_id=%s and month=%s returning id""",
            (status, status, student_id, tutor_id(), month),
        ).fetchall()
        db.commit()
    return response(
        {"updated": len(rows), "status": status}, "Monthly payment updated."
    )


@student_routes.get("/api/students/<student_id>/fees/<month_text>/whatsapp")
@auth_required
def student_month_whatsapp(student_id, month_text):
    uuid_value(student_id, "Student")
    month = fee_month(month_text)
    with database() as db:
        student = db.execute(
            "select full_name,guardian_whatsapp from students where id=%s and tutor_id=%s and status='Active'",
            (student_id, tutor_id()),
        ).fetchone()
        rows = db.execute(
            """select f.amount,c.class_name from fee_records f join classes c on c.id=f.class_id
            where f.student_id=%s and f.tutor_id=%s and f.month=%s and f.status='Unpaid' order by c.class_name""",
            (student_id, tutor_id(), month),
        ).fetchall()
    if not student or not rows:
        return response(message="No unpaid fees found.", status=404)
    total = sum(row["amount"] for row in rows)
    classes = ", ".join(row["class_name"] for row in rows)
    message = f"Hello, this is a reminder that {student['full_name']}'s fees for {month:%B %Y} are unpaid. Classes: {classes}. Total: Rs. {total}. Thank you."
    phone = sri_lankan_phone(
        student["guardian_whatsapp"], "Guardian WhatsApp"
    ).removeprefix("+")
    return response(
        {
            "url": f"https://wa.me/{phone}?text={quote(message, safe='')}",
            "message": message,
        }
    )


@student_routes.post("/api/registration-qr")
@auth_required
def registration_qr():
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    with database() as db:
        db.execute(
            "delete from registration_tokens where expires_at < now() - interval '7 days'"
        )
        row = db.execute(
            "insert into registration_tokens(tutor_id,token,expires_at) values(%s,%s,%s) returning *",
            (tutor_id(), token, expires),
        ).fetchone()
        db.commit()
    return response(dict(row), status=201)


@student_routes.post("/api/register-student")
def register_student():
    data = request.get_json(silent=True) or {}
    token = secure_token(data.get("registration_token"), "Registration token")
    browser = browser_id(data.get("browser_id"))
    values = student_payload(data)
    with database() as db:
        registration = db.execute(
            "select * from registration_tokens where token=%s", (token,)
        ).fetchone()
        if not registration or registration["expires_at"] <= datetime.now(timezone.utc):
            return response(message="Registration link has expired.", status=410)
        connected = db.execute(
            "select 1 from students where tutor_id=%s and browser_id=%s and status='Active' and browser_status='Approved'",
            (registration["tutor_id"], browser),
        ).fetchone()
        if connected:
            return response(message="This browser is already connected.", status=409)
        try:
            row = db.execute(
                """insert into registration_requests(tutor_id,full_name,student_phone,guardian_name,guardian_whatsapp,grade,browser_id,status)
                values(%s,%s,%s,%s,%s,%s,%s,'Pending') returning id,status,submitted_at""",
                (registration["tutor_id"], *values, browser),
            ).fetchone()
            db.commit()
        except psycopg.errors.UniqueViolation:
            db.rollback()
            return response(
                message="A registration request is already pending.", status=409
            )
    return response(dict(row), "Registration submitted successfully.", 201)


@student_routes.get("/api/registration-requests/<request_id>/status")
def registration_status(request_id):
    uuid_value(request_id, "Request")
    browser = browser_id(request.args.get("browser_id"))
    with database() as db:
        row = db.execute(
            """select r.status,s.student_code from registration_requests r left join students s
            on s.tutor_id=r.tutor_id and s.browser_id=r.browser_id and r.status='Approved'
            where r.id=%s and r.browser_id=%s""",
            (request_id, browser),
        ).fetchone()
    return response(
        dict(row) if row else None,
        None if row else "Request not found.",
        200 if row else 404,
    )


@student_routes.get("/api/registration-requests")
@auth_required
def registration_requests():
    with database() as db:
        rows = db.execute(
            "select * from registration_requests where tutor_id=%s order by submitted_at desc",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@student_routes.get("/api/registration-requests/<request_id>")
@auth_required
def registration_request(request_id):
    uuid_value(request_id, "Request")
    with database() as db:
        row = db.execute(
            "select * from registration_requests where id=%s and tutor_id=%s",
            (request_id, tutor_id()),
        ).fetchone()
    return response(
        dict(row) if row else None,
        None if row else "Registration request not found.",
        200 if row else 404,
    )


def review_registration(request_id, decision):
    uuid_value(request_id, "Request")
    with database() as db:
        req = db.execute(
            "select * from registration_requests where id=%s and tutor_id=%s and status='Pending' for update",
            (request_id, tutor_id()),
        ).fetchone()
        if not req:
            return response(
                message="Pending registration request not found.", status=404
            )
        if decision == "Rejected":
            row = db.execute(
                "update registration_requests set status='Rejected',reviewed_at=now() where id=%s returning *",
                (request_id,),
            ).fetchone()
            db.commit()
            return response(dict(row), "Registration rejected.")
        if db.execute(
            "select 1 from students where tutor_id=%s and browser_id=%s and status='Active' and browser_status='Approved'",
            (tutor_id(), req["browser_id"]),
        ).fetchone():
            return response(message="This browser is already connected.", status=409)
        code = db.execute(
            "select next_student_code(%s) code", (tutor_id(),)
        ).fetchone()["code"]
        row = db.execute(
            """insert into students(tutor_id,student_code,full_name,student_phone,guardian_name,guardian_whatsapp,grade,browser_id,browser_status,status)
            values(%s,%s,%s,%s,%s,%s,%s,%s,'Approved','Active') returning *""",
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
            "update registration_requests set status='Approved',approved_at=now(),reviewed_at=now() where id=%s",
            (request_id,),
        )
        db.commit()
    return response(dict(row), "Registration approved.")


@student_routes.post("/api/registration-requests/<request_id>/approve")
@auth_required
def approve_registration(request_id):
    return review_registration(request_id, "Approved")


@student_routes.post("/api/registration-requests/<request_id>/reject")
@auth_required
def reject_registration(request_id):
    return review_registration(request_id, "Rejected")


@student_routes.post("/api/browser-requests")
def create_browser_request():
    data = request.get_json(silent=True) or {}
    code = student_code(data.get("student_code"))
    browser = browser_id(data.get("browser_id"))
    owner = uuid_value(data.get("tutor_id"), "Tutor")
    with database() as db:
        student = db.execute(
            "select id,browser_status from students where tutor_id=%s and student_code=%s and status='Active'",
            (owner, code),
        ).fetchone()
        if not student:
            return response(message="Student ID could not be connected.", status=404)
        if student["browser_status"] == "Approved":
            return response(
                message="Ask your tutor to reset the previous browser first.",
                status=409,
            )
        try:
            row = db.execute(
                "insert into browser_requests(tutor_id,student_id,browser_id) values(%s,%s,%s) returning id,status,submitted_at",
                (owner, student["id"], browser),
            ).fetchone()
            db.execute(
                "update students set browser_status='Pending',updated_at=now() where id=%s",
                (student["id"],),
            )
            db.commit()
        except psycopg.errors.UniqueViolation:
            db.rollback()
            return response(message="A browser request is already pending.", status=409)
    return response(dict(row), "Browser request submitted.", 201)


@student_routes.get("/api/browser-requests")
@auth_required
def browser_requests():
    with database() as db:
        rows = db.execute(
            """select br.*,s.student_code,s.full_name from browser_requests br join students s on s.id=br.student_id
            where br.tutor_id=%s order by br.submitted_at desc""",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@student_routes.get("/api/browser-requests/<request_id>/status")
def browser_request_status(request_id):
    uuid_value(request_id, "Request")
    browser = browser_id(request.args.get("browser_id"))
    with database() as db:
        row = db.execute(
            """select br.status,s.student_code from browser_requests br
            join students s on s.id=br.student_id where br.id=%s and br.browser_id=%s""",
            (request_id, browser),
        ).fetchone()
    return response(
        dict(row) if row else None,
        None if row else "Request not found.",
        200 if row else 404,
    )


@student_routes.post("/api/browser-requests/bulk-approve")
@auth_required
def bulk_approve_browser_requests():
    raw_ids = (request.get_json(silent=True) or {}).get("request_ids")
    if not isinstance(raw_ids, list) or not raw_ids or len(raw_ids) > 100:
        return response(message="Choose between 1 and 100 browser requests.", status=422)
    request_ids = list(dict.fromkeys(str(uuid_value(value, "Request")) for value in raw_ids))
    approved = 0
    failed = []
    with database() as db:
        requests = db.execute(
            """select br.id,br.student_id,br.browser_id from browser_requests br
            join students s on s.id=br.student_id
            where br.id=any(%s::uuid[]) and br.tutor_id=%s and s.tutor_id=%s
              and br.status='Pending' and s.status='Active' for update""",
            (request_ids, tutor_id(), tutor_id()),
        ).fetchall()
        found = {str(item["id"]) for item in requests}
        failed.extend(value for value in request_ids if value not in found)
        for item in requests:
            conflict = db.execute(
                "select 1 from students where tutor_id=%s and browser_id=%s and id<>%s and browser_status='Approved' and status='Active'",
                (tutor_id(), item["browser_id"], item["student_id"]),
            ).fetchone()
            if conflict:
                failed.append(str(item["id"]))
                continue
            db.execute(
                "update browser_requests set status='Approved',reviewed_at=now() where id=%s returning id",
                (item["id"],),
            ).fetchone()
            db.execute(
                "update students set browser_id=%s,browser_status='Approved',updated_at=now() where id=%s and tutor_id=%s",
                (item["browser_id"], item["student_id"], tutor_id()),
            )
            approved += 1
        db.commit()
    return response({"approved": approved, "failed": failed}, "Selected browser requests processed.")


def review_browser_request(request_id, decision):
    uuid_value(request_id, "Request")
    with database() as db:
        req = db.execute(
            "select br.*,s.browser_status,s.status student_status from browser_requests br join students s on s.id=br.student_id where br.id=%s and br.tutor_id=%s and br.status='Pending' for update",
            (request_id, tutor_id()),
        ).fetchone()
        if not req:
            return response(message="Pending browser request not found.", status=404)
        if decision == "Approved" and req["student_status"] == "Active":
            if db.execute(
                "select 1 from students where tutor_id=%s and browser_id=%s and status='Active' and browser_status='Approved' and id<>%s",
                (tutor_id(), req["browser_id"], req["student_id"]),
            ).fetchone():
                return response(
                    message="This browser is already connected.", status=409
                )
            db.execute(
                "update students set browser_id=%s,browser_status='Approved',updated_at=now() where id=%s and tutor_id=%s",
                (req["browser_id"], req["student_id"], tutor_id()),
            )
        else:
            decision = "Rejected"
            db.execute(
                "update students set browser_status='Not Connected',updated_at=now() where id=%s and tutor_id=%s",
                (req["student_id"], tutor_id()),
            )
        row = db.execute(
            "update browser_requests set status=%s,reviewed_at=now() where id=%s returning *",
            (decision, request_id),
        ).fetchone()
        db.commit()
    return response(dict(row), f"Browser request {decision.lower()}.")


@student_routes.post("/api/browser-requests/<request_id>/approve")
@auth_required
def approve_browser_request(request_id):
    return review_browser_request(request_id, "Approved")


@student_routes.post("/api/browser-requests/<request_id>/reject")
@auth_required
def reject_browser_request(request_id):
    return review_browser_request(request_id, "Rejected")
