import psycopg
from flask import Blueprint, request

from core import auth_required, database, response, tutor_id
from validators import (
    grade,
    money,
    required_text,
    subject,
    time_range,
    uuid_value,
    weekday,
)

class_routes = Blueprint("classes", __name__)


def class_payload(data):
    start, end = time_range(data.get("start_time"), data.get("end_time"))
    return (
        grade(data.get("grade")),
        subject(data.get("subject")),
        required_text(data.get("class_name"), "Class name", 2, 120),
        weekday(data.get("day")),
        start,
        end,
        money(data.get("monthly_fee")),
    )


@class_routes.get("/api/classes")
@auth_required
def classes():
    with database() as db:
        rows = db.execute(
            "select * from classes where tutor_id=%s and status='Active' order by day,start_time",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@class_routes.post("/api/classes")
@auth_required
def add_class():
    values = class_payload(request.get_json(silent=True) or {})
    with database() as db:
        try:
            row = db.execute(
                """insert into classes(tutor_id,grade,subject,class_name,day,start_time,end_time,monthly_fee,status)
                values(%s,%s,%s,%s,%s,%s,%s,%s,'Active') returning *""",
                (tutor_id(), *values),
            ).fetchone()
            db.commit()
        except psycopg.errors.UniqueViolation:
            db.rollback()
            return response(message="A matching class already exists.", status=409)
    return response(dict(row), "Class created.", 201)


@class_routes.put("/api/classes/<class_id>")
@auth_required
def edit_class(class_id):
    uuid_value(class_id, "Class")
    values = class_payload(request.get_json(silent=True) or {})
    with database() as db:
        try:
            row = db.execute(
                """update classes set grade=%s,subject=%s,class_name=%s,day=%s,start_time=%s,end_time=%s,monthly_fee=%s,updated_at=now()
                where id=%s and tutor_id=%s and status='Active' returning *""",
                (*values, class_id, tutor_id()),
            ).fetchone()
            db.commit()
        except psycopg.errors.UniqueViolation:
            db.rollback()
            return response(message="A matching class already exists.", status=409)
    return response(
        dict(row) if row else None,
        None if row else "Class not found.",
        200 if row else 404,
    )


@class_routes.delete("/api/classes/<class_id>")
@auth_required
def archive_class(class_id):
    uuid_value(class_id, "Class")
    with database() as db:
        row = db.execute(
            "update classes set status='Archived',updated_at=now() where id=%s and tutor_id=%s and status='Active' returning id",
            (class_id, tutor_id()),
        ).fetchone()
        if row:
            db.execute(
                "update class_students set status='Removed' where class_id=%s",
                (class_id,),
            )
            db.execute(
                "update attendance_sessions set status='Ended' where class_id=%s and status='Active'",
                (class_id,),
            )
        db.commit()
    return response(
        dict(row) if row else None,
        "Class archived." if row else "Class not found.",
        200 if row else 404,
    )


@class_routes.get("/api/classes/<class_id>/students")
@auth_required
def class_students(class_id):
    uuid_value(class_id, "Class")
    with database() as db:
        rows = db.execute(
            """select s.* from students s join class_students cs on cs.student_id=s.id join classes c on c.id=cs.class_id
            where c.id=%s and c.tutor_id=%s and c.status='Active' and s.tutor_id=%s and s.status='Active' and cs.status='Active' order by s.full_name""",
            (class_id, tutor_id(), tutor_id()),
        ).fetchall()
    return response([dict(row) for row in rows])


@class_routes.post("/api/classes/<class_id>/students")
@auth_required
def enroll_student(class_id):
    uuid_value(class_id, "Class")
    student_id = str(
        uuid_value((request.get_json(silent=True) or {}).get("student_id"), "Student")
    )
    with database() as db:
        owned = db.execute(
            "select 1 from classes c join students s on s.tutor_id=c.tutor_id where c.id=%s and s.id=%s and c.tutor_id=%s and c.status='Active' and s.status='Active'",
            (class_id, student_id, tutor_id()),
        ).fetchone()
        if not owned:
            return response(message="Student or class not found.", status=404)
        row = db.execute(
            """insert into class_students(class_id,student_id,status) values(%s,%s,'Active')
            on conflict(class_id,student_id) do update set status='Active',enrolled_at=now()
            where class_students.status='Removed' returning *""",
            (class_id, student_id),
        ).fetchone()
        if not row:
            return response(
                message="Student is already enrolled in this class.", status=409
            )
        db.commit()
    return response(dict(row), "Student enrolled.", 201)


@class_routes.delete("/api/classes/<class_id>/students/<student_id>")
@auth_required
def remove_student(class_id, student_id):
    uuid_value(class_id, "Class")
    uuid_value(student_id, "Student")
    with database() as db:
        row = db.execute(
            """update class_students cs set status='Removed' from classes c,students s
            where cs.class_id=c.id and cs.student_id=s.id and c.id=%s and s.id=%s and c.tutor_id=%s and s.tutor_id=%s and cs.status='Active' returning cs.id""",
            (class_id, student_id, tutor_id(), tutor_id()),
        ).fetchone()
        db.commit()
    return response(
        dict(row) if row else None,
        "Enrollment removed." if row else "Enrollment not found.",
        200 if row else 404,
    )
