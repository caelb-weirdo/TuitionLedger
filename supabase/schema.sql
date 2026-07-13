create extension if not exists pgcrypto;

create table if not exists tutors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  center_name text,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_code text unique,
  full_name text not null,
  phone text,
  guardian_name text,
  guardian_whatsapp text,
  grade text not null check (grade in ('Grade 10','Grade 11')),
  browser_id text,
  browser_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  grade text not null check (grade in ('Grade 10','Grade 11')),
  subject text not null check (subject in ('Maths','Science','English','Tamil','History')),
  name text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  monthly_fee numeric(10,2) not null check (monthly_fee >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists class_students (
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table if not exists registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  guardian_name text,
  guardian_whatsapp text,
  grade text not null check (grade in ('Grade 10','Grade 11')),
  requested_subjects text[] not null default '{}',
  browser_id text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now()
);

create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references attendance_sessions(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('present','absent')),
  marked_by text not null check (marked_by in ('qr','manual')),
  marked_at timestamptz not null default now(),
  unique(session_id, student_id)
);

create table if not exists fee_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  billing_month date not null,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'unpaid' check (status in ('paid','unpaid')),
  paid_at timestamptz,
  unique(student_id, class_id, billing_month)
);

create index if not exists idx_attendance_session_student on attendance_records(session_id, student_id);
create index if not exists idx_fees_status_month on fee_records(status, billing_month);

