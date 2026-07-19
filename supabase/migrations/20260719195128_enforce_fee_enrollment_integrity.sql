create or replace function public.enforce_fee_record_active_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_tutor uuid;
  v_student_tutor uuid;
  v_class_status text;
  v_student_status text;
  v_class_grade text;
  v_student_grade text;
  v_enrollment_status text;
  v_monthly_fee numeric;
begin
  select c.tutor_id, s.tutor_id, c.status, s.status, c.grade, s.grade,
         cs.status, c.monthly_fee
    into v_class_tutor, v_student_tutor, v_class_status, v_student_status,
         v_class_grade, v_student_grade, v_enrollment_status, v_monthly_fee
  from public.classes c
  join public.students s on s.id = new.student_id
  left join public.class_students cs
    on cs.class_id = c.id
   and cs.student_id = s.id
  where c.id = new.class_id;

  if not found then
    raise exception 'Student or class not found for fee record.';
  end if;

  if v_class_tutor is distinct from v_student_tutor
     or new.tutor_id is distinct from v_class_tutor then
    raise exception 'Fee record tutor does not match the student and class.';
  end if;

  if v_class_status <> 'Active'
     or v_student_status <> 'Active'
     or v_enrollment_status is distinct from 'Active' then
    raise exception 'Fee records require an active student, class, and enrollment.';
  end if;

  if v_class_grade is distinct from v_student_grade then
    raise exception 'Student grade does not match the class grade.';
  end if;

  if tg_op = 'INSERT' then
    new.amount := v_monthly_fee;
  end if;

  return new;
end;
$$;

drop trigger if exists fee_records_active_enrollment_guard on public.fee_records;
create trigger fee_records_active_enrollment_guard
before insert or update of tutor_id, student_id, class_id
on public.fee_records
for each row
execute function public.enforce_fee_record_active_enrollment();

create or replace function public.cleanup_fees_for_inactive_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_class_id uuid;
  v_should_cleanup boolean := false;
  v_reason text := 'Enrollment removed: archived current and future fee row';
begin
  if tg_op = 'DELETE' then
    v_student_id := old.student_id;
    v_class_id := old.class_id;
    v_should_cleanup := old.status = 'Active';
  else
    v_student_id := old.student_id;
    v_class_id := old.class_id;
    v_should_cleanup := old.status = 'Active'
      and (
        new.status is distinct from 'Active'
        or new.student_id is distinct from old.student_id
        or new.class_id is distinct from old.class_id
      );
  end if;

  if v_should_cleanup then
    insert into public.fee_record_integrity_archive(
      original_fee_id, tutor_id, student_id, class_id, month, amount,
      status, paid_at, original_updated_at, reason
    )
    select f.id, f.tutor_id, f.student_id, f.class_id, f.month, f.amount,
           f.status, f.paid_at, f.updated_at, v_reason
    from public.fee_records f
    where f.student_id = v_student_id
      and f.class_id = v_class_id
      and f.month >= date_trunc('month', current_date)::date
    on conflict (original_fee_id, reason) do nothing;

    delete from public.fee_records f
    where f.student_id = v_student_id
      and f.class_id = v_class_id
      and f.month >= date_trunc('month', current_date)::date;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists class_students_fee_cleanup_update on public.class_students;
create trigger class_students_fee_cleanup_update
after update of status, student_id, class_id
on public.class_students
for each row
execute function public.cleanup_fees_for_inactive_enrollment();

drop trigger if exists class_students_fee_cleanup_delete on public.class_students;
create trigger class_students_fee_cleanup_delete
after delete
on public.class_students
for each row
execute function public.cleanup_fees_for_inactive_enrollment();

create or replace function public.sync_current_fees_after_class_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text;
begin
  if new.monthly_fee is not distinct from old.monthly_fee then
    return new;
  end if;

  v_reason := format(
    'Class fee changed from %s to %s: archived current and future amount',
    old.monthly_fee,
    new.monthly_fee
  );

  insert into public.fee_record_integrity_archive(
    original_fee_id, tutor_id, student_id, class_id, month, amount,
    status, paid_at, original_updated_at, reason
  )
  select f.id, f.tutor_id, f.student_id, f.class_id, f.month, f.amount,
         f.status, f.paid_at, f.updated_at, v_reason
  from public.fee_records f
  where f.class_id = new.id
    and f.month >= date_trunc('month', current_date)::date
    and exists (
      select 1
      from public.class_students cs
      where cs.student_id = f.student_id
        and cs.class_id = f.class_id
        and cs.status = 'Active'
    )
  on conflict (original_fee_id, reason) do nothing;

  update public.fee_records f
  set amount = new.monthly_fee,
      updated_at = now()
  where f.class_id = new.id
    and f.month >= date_trunc('month', current_date)::date
    and exists (
      select 1
      from public.class_students cs
      where cs.student_id = f.student_id
        and cs.class_id = f.class_id
        and cs.status = 'Active'
    );

  return new;
end;
$$;

drop trigger if exists classes_current_fee_sync on public.classes;
create trigger classes_current_fee_sync
after update of monthly_fee
on public.classes
for each row
execute function public.sync_current_fees_after_class_price_change();
