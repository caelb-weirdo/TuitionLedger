-- Adds the selected class date to existing attendance sessions without resetting data.
alter table if exists attendance_sessions
  add column if not exists attendance_date date not null default current_date;

update attendance_sessions
set attendance_date = starts_at::date
where attendance_date is null;
