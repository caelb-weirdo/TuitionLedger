-- Allow all attendance session durations offered by the tutor UI.
alter table public.attendance_sessions
  drop constraint if exists attendance_sessions_duration_minutes_check;

alter table public.attendance_sessions
  add constraint attendance_sessions_duration_minutes_check
  check (duration_minutes in (5, 10, 15));
