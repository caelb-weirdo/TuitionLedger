begin;

insert into public.fee_record_integrity_archive (
  original_fee_id, tutor_id, student_id, class_id, month, amount,
  status, paid_at, original_updated_at, reason
)
select
  f.id, f.tutor_id, f.student_id, f.class_id, f.month, f.amount,
  f.status, f.paid_at, f.updated_at, 'Cross-grade fee cleanup'
from public.fee_records f
join public.students s on s.id = f.student_id
join public.classes c on c.id = f.class_id
where s.grade <> c.grade
on conflict (original_fee_id, reason) do nothing;

delete from public.fee_records f
using public.students s, public.classes c
where s.id = f.student_id
  and c.id = f.class_id
  and s.grade <> c.grade;

commit;
