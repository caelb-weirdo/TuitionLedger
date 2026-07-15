create extension if not exists pgcrypto;

drop table if exists fee_records, attendance_records, attendance_sessions, class_students,
  registration_requests, registration_tokens, classes, students, tutors cascade;

create table tutors (
  id uuid primary key,
  full_name text not null default '', email text not null unique,
  phone text not null default '', center_name text not null default '', created_at timestamptz not null default now()
);
create table tutor_student_counters (
  tutor_id uuid primary key references tutors(id) on delete cascade,
  next_number integer not null default 1 check (next_number > 0)
);
create or replace function next_student_code(p_tutor_id uuid)
returns text language sql as $$
  insert into tutor_student_counters(tutor_id, next_number)
  values (p_tutor_id, 2)
  on conflict (tutor_id) do update
    set next_number = tutor_student_counters.next_number + 1
  returning 'STU' || lpad((next_number - 1)::text, 3, '0');
$$;
create table students (
  id uuid primary key default gen_random_uuid(), tutor_id uuid not null references tutors(id) on delete cascade,
  student_code text not null, full_name text not null, student_phone text not null,
  guardian_name text not null, guardian_whatsapp text not null, grade text not null check (grade in ('Grade 10','Grade 11')),
  browser_id text, browser_status text not null default 'Pending' check (browser_status in ('Approved','Pending','Reset Needed')),
  created_at timestamptz not null default now(), unique(tutor_id, student_code)
);
create table classes (
  id uuid primary key default gen_random_uuid(), tutor_id uuid not null references tutors(id) on delete cascade,
  grade text not null check (grade in ('Grade 10','Grade 11')),
  subject text not null check (subject in ('Maths','Science','English','Tamil','History')),
  class_name text not null, day smallint not null check (day between 0 and 6), start_time time not null,
  end_time time not null, monthly_fee numeric(10,2) not null check (monthly_fee >= 0), created_at timestamptz not null default now()
);
create table class_students (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade, enrolled_at timestamptz not null default now(),
  status text not null default 'Active' check (status in ('Active','Removed')), unique(class_id, student_id)
);
create table registration_tokens (
  id uuid primary key default gen_random_uuid(), tutor_id uuid not null references tutors(id) on delete cascade,
  token text not null unique, expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table registration_requests (
  id uuid primary key default gen_random_uuid(), tutor_id uuid not null references tutors(id) on delete cascade,
  full_name text not null, student_phone text not null, guardian_name text not null, guardian_whatsapp text not null,
  grade text not null check (grade in ('Grade 10','Grade 11')), requested_classes text[] not null default '{}',
  browser_id text not null, status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  submitted_at timestamptz not null default now(), approved_at timestamptz
);
create table attendance_sessions (
  id uuid primary key default gen_random_uuid(), tutor_id uuid not null references tutors(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade, attendance_date date not null default current_date, qr_token text not null unique,
  starts_at timestamptz not null default now(), expires_at timestamptz not null,
  duration_minutes smallint not null check (duration_minutes in (5,10)), status text not null default 'Active' check (status in ('Active','Ended','Expired'))
);
create table attendance_records (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references attendance_sessions(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade, student_id uuid not null references students(id) on delete cascade,
  attendance_date date not null default current_date, status text not null check (status in ('Present','Absent')),
  marked_method text not null check (marked_method in ('QR','Manual')), marked_at timestamptz not null default now(), unique(session_id, student_id)
);
create table fee_records (
  id uuid primary key default gen_random_uuid(), tutor_id uuid not null references tutors(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade, class_id uuid not null references classes(id) on delete cascade,
  month date not null, amount numeric(10,2) not null check (amount >= 0), status text not null default 'Unpaid' check (status in ('Paid','Unpaid')),
  paid_at timestamptz, updated_at timestamptz not null default now(), unique(student_id, class_id, month)
);

alter table tutors enable row level security;
alter table tutor_student_counters enable row level security;
alter table students enable row level security;
alter table classes enable row level security;
alter table class_students enable row level security;
alter table registration_tokens enable row level security;
alter table registration_requests enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table fee_records enable row level security;

create policy tutors_own on tutors for all using (id = auth.uid()) with check (id = auth.uid());
create policy counters_own on tutor_student_counters for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
create policy students_own on students for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
create policy classes_own on classes for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
create policy class_students_own on class_students for all using (exists(select 1 from classes c where c.id = class_id and c.tutor_id = auth.uid())) with check (exists(select 1 from classes c where c.id = class_id and c.tutor_id = auth.uid()));
create policy tokens_own on registration_tokens for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
create policy requests_own on registration_requests for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
create policy sessions_own on attendance_sessions for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
create policy records_own on attendance_records for all using (exists(select 1 from attendance_sessions s where s.id = session_id and s.tutor_id = auth.uid())) with check (exists(select 1 from attendance_sessions s where s.id = session_id and s.tutor_id = auth.uid()));
create policy fees_own on fee_records for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
