from urllib.parse import quote
from flask import Blueprint, request

from core import auth_required, database, response, tutor_id
from validators import fee_month, fee_status, sri_lankan_phone, uuid_value

fee_routes = Blueprint("fees", __name__)


def ensure_month(db, month, owner):
    return db.execute(
        """insert into fee_records(tutor_id,student_id,class_id,month,amount,status)
        select %s,cs.student_id,c.id,%s,c.monthly_fee,'Unpaid' from classes c
        join class_students cs on cs.class_id=c.id join students s on s.id=cs.student_id
        where c.tutor_id=%s and c.status='Active' and cs.status='Active' and s.status='Active'
        on conflict(student_id,class_id,month) do nothing returning *""",
        (owner, month, owner),
    ).fetchall()


@fee_routes.post("/api/fees/ensure")
@auth_required
def ensure_fees():
    month = fee_month((request.get_json(silent=True) or {}).get("month"))
    with database() as db:
        rows = ensure_month(db, month, tutor_id())
        db.commit()
    return response({"created": len(rows)}, "Monthly fee records are ready.")


@fee_routes.get("/api/fees")
@auth_required
def fees():
    with database() as db:
        rows = db.execute(
            """select f.*,s.student_code,s.full_name,c.class_name from fee_records f join students s on s.id=f.student_id
            join classes c on c.id=f.class_id where f.tutor_id=%s order by f.month desc,s.full_name""",
            (tutor_id(),),
        ).fetchall()
    return response([dict(row) for row in rows])


@fee_routes.get("/api/fees/ledger")
@auth_required
def fee_ledger():
    month = fee_month(request.args.get("month"))
    with database() as db:
        rows = db.execute(
            """select s.id as student_id,s.student_code,s.full_name,s.grade,
            count(f.id)::int as class_count,coalesce(sum(f.amount),0) as combined_amount,
            case when bool_and(f.status='Paid') then 'Paid' else 'Unpaid' end as payment_status,
            json_agg(json_build_object('id',f.id,'class_id',f.class_id,'class_name',c.class_name,
              'amount',f.amount,'status',f.status) order by c.class_name) as fees
            from fee_records f join students s on s.id=f.student_id join classes c on c.id=f.class_id
            where f.tutor_id=%s and f.month=%s and s.status='Active'
            group by s.id,s.student_code,s.full_name,s.grade order by s.full_name""",
            (tutor_id(), month),
        ).fetchall()
    return response([dict(row) for row in rows])


@fee_routes.post("/api/fees/generate")
@auth_required
def generate_fees():
    month = fee_month((request.get_json(silent=True) or {}).get("month"))
    with database() as db:
        rows = ensure_month(db, month, tutor_id())
        db.commit()
    return response([dict(row) for row in rows], "Monthly fee records generated.", 201)


@fee_routes.put("/api/fees/<fee_id>")
@auth_required
def update_fee(fee_id):
    uuid_value(fee_id, "Fee record")
    status = fee_status((request.get_json(silent=True) or {}).get("status"))
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


@fee_routes.get("/api/fees/<fee_id>/whatsapp")
@auth_required
def whatsapp(fee_id):
    uuid_value(fee_id, "Fee record")
    with database() as db:
        row = db.execute(
            """select f.amount,f.month,s.full_name,s.guardian_whatsapp,c.class_name from fee_records f
            join students s on s.id=f.student_id join classes c on c.id=f.class_id where f.id=%s and f.tutor_id=%s""",
            (fee_id, tutor_id()),
        ).fetchone()
    if not row:
        return response(message="Fee record not found.", status=404)
    phone = sri_lankan_phone(
        row["guardian_whatsapp"], "Guardian WhatsApp"
    ).removeprefix("+")
    message = f"Hello, this is a reminder that {row['full_name']}'s {row['class_name']} fee of Rs. {row['amount']} for {row['month']:%B %Y} is unpaid. Thank you."
    return response(
        {
            "phone": phone,
            "message": message,
            "url": f"https://wa.me/{phone}?text={quote(message, safe='')}",
        }
    )
