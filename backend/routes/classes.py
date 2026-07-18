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
            """select c.*,
            count(cs.student_id) filter (where cs.status='Active')::int as student_count
            from classes c
            left join class_students cs on cs.class_id=c.id
            where c.tutor_id=%s and c.status='Active'
            group by c.id
            order by c.day,c.start_time""",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@class_routes.get("/api/classes/<class_id>")
@auth_required
def get_class(class_id):
    uuid_value(class_id, "Class")
    with database() as db:
        row = db.execute(
            """select c.*,
            count(cs.student_id) filter (where cs.status='Active')::int as student_count
            from classes c
            left join class_students cs on cs.class_id=c.id
            where c.id=%s and c.tutor_id=%s and c.status='Active'
            group by c.id""",
            (class_id, tutor_id()),
        ).fetchone()
    return response(
        dict(row) if row else None,
        None if row else "Class not found.",
        200 if row else 404,
    )


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


@class_routes.post("/api/classes/<class_id>/students/bulk")
@auth_required
def enroll_students_bulk(class_id):
    uuid_value(class_id, "Class")
    raw_ids = (request.get_json(silent=True) or {}).get("student_ids")
    if not isinstance(raw_ids, list) or not raw_ids or len(raw_ids) > 200:
        return response(message="Choose between 1 and 200 students.", status=422)
    student_ids = list(
        dict.fromkeys(str(uuid_value(value, "Student")) for value in raw_ids)
    )
    with database() as db:
        owned_class = db.execute(
            "select 1 from classes where id=%s and tutor_id=%s and status='Active'",
            (class_id, tutor_id()),
        ).fetchone()
        if not owned_class:
            return response(message="Class not found.", status=404)
        valid_rows = db.execute(
            "select id from students where id=any(%s::uuid[]) and tutor_id=%s and status='Active'",
            (student_ids, tutor_id()),
        ).fetchall()
        valid_ids = [str(row["id"]) for row in valid_rows]
        failed = [value for value in student_ids if value not in valid_ids]
        existing_rows = (
            db.execute(
                "select student_id from class_students where class_id=%s and student_id=any(%s::uuid[]) and status='Active'",
                (class_id, valid_ids),
            ).fetchall()
            if valid_ids
            else []
        )
        existing = {str(row["student_id"]) for row in existing_rows}
        changed = [value for value in valid_ids if value not in existing]
        rows = (
            db.execute(
                """insert into class_students(class_id,student_id,status)
            select %s,student_id,'Active' from unnest(%s::uuid[]) student_id
            on conflict(class_id,student_id) do update set status='Active',enrolled_at=now()
            returning student_id""",
                (class_id, changed),
            ).fetchall()
            if changed
            else []
        )
        db.commit()
    return response(
        {
            "enrolled": len(rows),
            "already_enrolled": len(existing),
            "failed": failed,
        },
        "Selected students enrolled.",
    )


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
