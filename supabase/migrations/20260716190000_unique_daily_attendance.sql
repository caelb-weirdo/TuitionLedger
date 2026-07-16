-- One attendance result per student, class, and calendar date.
-- Prefer an already marked Present record when cleaning historical duplicates.
with ranked_records as (
  select
    ar.id,
    row_number() over (
      partition by ar.class_id, ar.student_id, ar.attendance_date
      order by
        case when ar.status = 'Present' then 0 else 1 end,
        ar.marked_at desc nulls last,
        ats.starts_at desc
    ) as duplicate_rank
  from public.attendance_records ar
  join public.attendance_sessions ats on ats.id = ar.session_id
)
delete from public.attendance_records ar
using ranked_records ranked
where ar.id = ranked.id
  and ranked.duplicate_rank > 1;

create unique index if not exists uq_attendance_student_class_date
  on public.attendance_records(class_id, student_id, attendance_date);
