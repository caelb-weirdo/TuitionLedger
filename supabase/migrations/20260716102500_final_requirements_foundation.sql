-- Final-requirements foundation migration.
-- Additive and data-preserving: this intentionally does not drop the legacy
-- device/PWA tables found in the live database or the deprecated
-- registration_requests.requested_classes column used by the currently
-- deployed backend. That column can be removed only after the new backend is live.

begin;

create table if not exists public.browser_requests (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutors(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  browser_id text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (char_length(browser_id) between 20 and 100),
  check (
    (status = 'Pending' and reviewed_at is null)
    or (status in ('Approved', 'Rejected') and reviewed_at is not null)
  )
);

alter table public.students
  add column if not exists status text not null default 'Active',
  add column if not exists updated_at timestamptz not null default now();

update public.students
set browser_status = 'Not Connected', browser_id = null
where browser_status = 'Reset Needed';

alter table public.students
  alter column browser_status set default 'Not Connected';

alter table public.students
  drop constraint if exists students_browser_status_check;

alter table public.students
  add constraint students_browser_status_check
    check (browser_status in ('Not Connected', 'Pending', 'Approved')),
  add constraint students_status_check
    check (status in ('Active', 'Archived')),
  add constraint students_student_phone_check
    check (student_phone ~ '^\+94[0-9]{9}$') not valid,
  add constraint students_guardian_whatsapp_check
    check (guardian_whatsapp ~ '^\+94[0-9]{9}$') not valid;

alter table public.classes
  add column if not exists status text not null default 'Active',
  add column if not exists updated_at timestamptz not null default now();

alter table public.classes
  add constraint classes_status_check
    check (status in ('Active', 'Archived')),
  add constraint classes_end_after_start_check
    check (end_time > start_time);

alter table public.registration_requests
  add column if not exists reviewed_at timestamptz;

update public.registration_requests
set reviewed_at = approved_at
where reviewed_at is null and approved_at is not null;

alter table public.attendance_records
  add column if not exists manual_reason text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.attendance_records
  add constraint attendance_records_manual_reason_check
  check (
    (marked_method = 'Manual' and char_length(trim(manual_reason)) between 3 and 300)
    or (marked_method = 'QR' and manual_reason is null)
  ) not valid;

alter table public.fee_records
  add constraint fee_records_month_first_day_check
    check (extract(day from month) = 1) not valid;

create unique index if not exists uq_students_approved_browser
  on public.students(tutor_id, browser_id)
  where status = 'Active' and browser_status = 'Approved' and browser_id is not null;

create unique index if not exists uq_pending_registration_browser
  on public.registration_requests(tutor_id, browser_id)
  where status = 'Pending';

create unique index if not exists uq_pending_browser_request_student
  on public.browser_requests(student_id)
  where status = 'Pending';

create unique index if not exists uq_pending_browser_request_browser
  on public.browser_requests(tutor_id, browser_id)
  where status = 'Pending';

create unique index if not exists uq_active_class_definition
  on public.classes(tutor_id, lower(class_name), grade, subject, day, start_time)
  where status = 'Active';

create unique index if not exists uq_active_attendance_session
  on public.attendance_sessions(class_id, attendance_date)
  where status = 'Active';

create index if not exists idx_students_tutor_status
  on public.students(tutor_id, status);
create index if not exists idx_students_tutor_code
  on public.students(tutor_id, student_code);
create index if not exists idx_registration_requests_tutor_status
  on public.registration_requests(tutor_id, status);
create index if not exists idx_browser_requests_tutor_status
  on public.browser_requests(tutor_id, status, submitted_at desc);
create index if not exists idx_class_students_class_status
  on public.class_students(class_id, status);
create index if not exists idx_attendance_sessions_class_date
  on public.attendance_sessions(class_id, attendance_date desc);
create index if not exists idx_attendance_records_class_date
  on public.attendance_records(class_id, attendance_date desc);
create index if not exists idx_fee_records_tutor_month_status
  on public.fee_records(tutor_id, month desc, status);

alter table public.browser_requests enable row level security;

drop policy if exists tutors_own on public.tutors;
create policy tutors_own on public.tutors for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists counters_own on public.tutor_student_counters;
create policy counters_own on public.tutor_student_counters for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

drop policy if exists students_own on public.students;
create policy students_own on public.students for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

drop policy if exists classes_own on public.classes;
create policy classes_own on public.classes for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

drop policy if exists class_students_own on public.class_students;
create policy class_students_own on public.class_students for all to authenticated
  using (exists (
    select 1 from public.classes c
    where c.id = class_id and c.tutor_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.classes c
    where c.id = class_id and c.tutor_id = (select auth.uid())
  ));

drop policy if exists tokens_own on public.registration_tokens;
create policy tokens_own on public.registration_tokens for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

drop policy if exists requests_own on public.registration_requests;
create policy requests_own on public.registration_requests for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

drop policy if exists browser_requests_own on public.browser_requests;
create policy browser_requests_own on public.browser_requests for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

drop policy if exists sessions_own on public.attendance_sessions;
create policy sessions_own on public.attendance_sessions for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

drop policy if exists records_own on public.attendance_records;
create policy records_own on public.attendance_records for all to authenticated
  using (exists (
    select 1 from public.attendance_sessions s
    where s.id = session_id and s.tutor_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.attendance_sessions s
    where s.id = session_id and s.tutor_id = (select auth.uid())
  ));

drop policy if exists fees_own on public.fee_records;
create policy fees_own on public.fee_records for all to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

commit;
