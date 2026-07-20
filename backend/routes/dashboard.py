from flask import Blueprint

from core import auth_required, database, response, tutor_id


dashboard_routes = Blueprint("dashboard", __name__)


@dashboard_routes.get("/api/dashboard")
@auth_required
def dashboard_summary():
    owner = tutor_id()
    with database() as db:
        summary = db.execute(
            """select
            (select count(*) from students where tutor_id=%s and status='Active')::int as total_students,
            (select count(*) from classes where tutor_id=%s and status='Active')::int as total_classes,
            (select count(*) from registration_requests where tutor_id=%s and status='Pending')::int as pending_registrations,
            (select count(distinct f.student_id)
             from fee_records f
             join students s on s.id=f.student_id
             where f.tutor_id=%s and f.status='Unpaid' and s.status='Active')::int as unpaid_fees""",
            (owner, owner, owner, owner),
        ).fetchone()
        today_classes = db.execute(
            """select id,class_name,grade,subject,start_time,end_time
            from classes
            where tutor_id=%s and status='Active'
              and day=extract(dow from now() at time zone 'Asia/Colombo')::int
            order by start_time""",
            (owner,),
        ).fetchall()
        registrations = db.execute(
            """select full_name,status,submitted_at
            from registration_requests
            where tutor_id=%s
            order by submitted_at desc
            limit 3""",
            (owner,),
        ).fetchall()
        unpaid_fees = db.execute(
            """select s.full_name,f.status,f.month
            from fee_records f
            join students s on s.id=f.student_id
            where f.tutor_id=%s and f.status='Unpaid' and s.status='Active'
            order by f.updated_at desc
            limit 3""",
            (owner,),
        ).fetchall()

    data = dict(summary or {})
    data["today_classes"] = [dict(row) for row in today_classes]
    data["recent_activity"] = (
        [
            {
                "label": f"{row['full_name']} registration",
                "detail": row["status"],
                "href": "#students",
            }
            for row in registrations
        ]
        + [
            {
                "label": f"{row['full_name']} fee",
                "detail": row["status"],
                "href": "#fees",
            }
            for row in unpaid_fees
        ]
    )[:5]
    return response(data)
