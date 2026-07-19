begin;

create table if not exists public.fee_record_integrity_archive (
  archive_id uuid primary key default gen_random_uuid(),
  original_fee_id uuid not null,
  tutor_id uuid not null,
  student_id uuid not null,
  class_id uuid not null,
  month date not null,
  amount numeric(10,2) not null,
  status text not null,
  paid_at timestamptz,
  original_updated_at timestamptz,
  archived_at timestamptz not null default now(),
  reason text not null,
  unique (original_fee_id, reason)
);

alter table public.fee_record_integrity_archive enable row level security;

drop policy if exists fee_record_integrity_archive_own on public.fee_record_integrity_archive;
create policy fee_record_integrity_archive_own
on public.fee_record_integrity_archive
for select
to authenticated
using (tutor_id = (select auth.uid()));

with mismatches as (
  select cs.student_id, cs.class_id
  from public.class_students cs
  join public.students s on s.id = cs.student_id
  join public.classes c on c.id = cs.class_id
  where cs.status = 'Active'
    and s.grade <> c.grade
)
insert into public.fee_record_integrity_archive (
  original_fee_id, tutor_id, student_id, class_id, month, amount,
  status, paid_at, original_updated_at, reason
)
select
  f.id, f.tutor_id, f.student_id, f.class_id, f.month, f.amount,
  f.status, f.paid_at, f.updated_at, 'Cross-grade enrollment cleanup'
from public.fee_records f
join mismatches m
  on m.student_id = f.student_id and m.class_id = f.class_id
on conflict (original_fee_id, reason) do nothing;

with mismatches as (
  select cs.student_id, cs.class_id
  from public.class_students cs
  join public.students s on s.id = cs.student_id
  join public.classes c on c.id = cs.class_id
  where cs.status = 'Active'
    and s.grade <> c.grade
)
delete from public.fee_records f
using mismatches m
where f.student_id = m.student_id
  and f.class_id = m.class_id;

update public.class_students cs
set status = 'Removed'
from public.students s, public.classes c
where s.id = cs.student_id
  and c.id = cs.class_id
  and cs.status = 'Active'
  and s.grade <> c.grade;

update public.fee_records f
set amount = c.monthly_fee,
    updated_at = now()
from public.class_students cs, public.students s, public.classes c
where cs.student_id = f.student_id
  and cs.class_id = f.class_id
  and s.id = cs.student_id
  and c.id = cs.class_id
  and cs.status = 'Active'
  and s.status = 'Active'
  and c.status = 'Active'
  and s.grade = c.grade
  and f.status = 'Unpaid'
  and f.amount is distinct from c.monthly_fee;

create or replace function public.enforce_class_student_grade_match()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  student_grade text;
  class_grade text;
begin
  if new.status <> 'Active' then
    return new;
  end if;

  select grade into student_grade
  from public.students
  where id = new.student_id;

  select grade into class_grade
  from public.classes
  where id = new.class_id;

  if student_grade is null or class_grade is null then
    raise exception 'Student or class not found.' using errcode = '23503';
  end if;

  if student_grade <> class_grade then
    raise exception 'Student grade does not match this class grade.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_student_grade_mismatch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.grade is distinct from old.grade and exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = new.id
      and cs.status = 'Active'
      and c.status = 'Active'
      and c.grade <> new.grade
  ) then
    raise exception 'Remove incompatible class enrollments before changing the student grade.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_class_grade_mismatch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.grade is distinct from old.grade and exists (
    select 1
    from public.class_students cs
    join public.students s on s.id = cs.student_id
    where cs.class_id = new.id
      and cs.status = 'Active'
      and s.status = 'Active'
      and s.grade <> new.grade
  ) then
    raise exception 'Remove incompatible students before changing the class grade.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists class_students_grade_match on public.class_students;
create trigger class_students_grade_match
before insert or update of class_id, student_id, status
on public.class_students
for each row
execute function public.enforce_class_student_grade_match();

drop trigger if exists students_grade_match_guard on public.students;
create trigger students_grade_match_guard
before update of grade
on public.students
for each row
execute function public.prevent_student_grade_mismatch();

drop trigger if exists classes_grade_match_guard on public.classes;
create trigger classes_grade_match_guard
before update of grade
on public.classes
for each row
execute function public.prevent_class_grade_mismatch();

commit;
