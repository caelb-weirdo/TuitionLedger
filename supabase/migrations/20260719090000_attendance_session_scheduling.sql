-- Attendance timetable enforcement and extra-session audit fields.
-- Safe to apply once through Supabase migrations; existing sessions remain normal.
alter table public.attendance_sessions
  add column if not exists is_extra_session boolean not null default false,
  add column if not exists override_reason text,
  add column if not exists scheduled_start_at timestamptz,
  add column if not exists scheduled_end_at timestamptz;

alter table public.attendance_sessions
  drop constraint if exists attendance_sessions_extra_reason_check;

alter table public.attendance_sessions
  add constraint attendance_sessions_extra_reason_check check (
    (is_extra_session and override_reason is not null and char_length(btrim(override_reason)) between 3 and 300)
    or (not is_extra_session and override_reason is null)
  );

-- Older sessions could remain labelled Active after their QR expired.
update public.attendance_sessions
set status = 'Expired'
where status = 'Active' and expires_at <= now();

create index if not exists attendance_sessions_active_class_idx
  on public.attendance_sessions (class_id, expires_at)
  where status = 'Active';

create unique index if not exists attendance_sessions_one_active_class_idx
  on public.attendance_sessions (class_id)
  where status = 'Active';
