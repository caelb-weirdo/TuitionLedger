from flask import Blueprint, request

from core import auth_required, database, response, tutor_id
from validators import fee_month


fee_routes = Blueprint("fees", __name__)


def ensure_month(db, month, owner):
    return db.execute(
        """insert into fee_records(tutor_id,student_id,class_id,month,amount,status)
        select %s,cs.student_id,c.id,%s,c.monthly_fee,'Unpaid' from classes c
        join class_students cs on cs.class_id=c.id join students s on s.id=cs.student_id
        where c.tutor_id=%s and c.status='Active' and cs.status='Active' and s.status='Active'
        on conflict(student_id,class_id,month) do nothing returning id""",
        (owner, month, owner),
    ).fetchall()


@fee_routes.get("/api/fees/ledger")
@auth_required
def fee_ledger():
    month = fee_month(request.args.get("month"))
    owner = tutor_id()
    with database() as db:
        ensure_month(db, month, owner)
        rows = db.execute(
            """select s.id as student_id,s.student_code,s.full_name,s.grade,
            count(f.id)::int as class_count,coalesce(sum(f.amount),0) as combined_amount,
            case when bool_and(f.status='Paid') then 'Paid' else 'Unpaid' end as payment_status,
            json_agg(json_build_object('id',f.id,'class_id',f.class_id,'class_name',c.class_name,
              'amount',f.amount,'status',f.status) order by c.class_name) as fees
            from fee_records f join students s on s.id=f.student_id join classes c on c.id=f.class_id
            where f.tutor_id=%s and f.month=%s and s.status='Active'
            group by s.id,s.student_code,s.full_name,s.grade order by s.full_name""",
            (owner, month),
        ).fetchall()
        db.commit()
    return response([dict(row) for row in rows])
