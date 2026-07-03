# Document 06 — Backend Schema

## Database Summary

TuitionLedger uses Supabase PostgreSQL.

The database supports:

- Tutor and student login accounts
- Student profiles
- Class management
- Class enrollments
- Device registration and approval
- QR attendance sessions
- Attendance records
- Monthly fee tracking
- WhatsApp/phone reminder records
- Tutor settings
- Demo seed data

## ID Strategy

Use UUID primary keys for all main tables.

Recommended:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

## Main Tables

- app_users
- students
- classes
- class_enrollments
- devices
- attendance_sessions
- attendance_records
- fee_payments
- reminders
- tutor_settings

Future table:

- audit_logs

## Table: app_users

Stores login accounts for tutors and students.

Fields:

```text
id UUID PRIMARY KEY
name TEXT NOT NULL
email TEXT UNIQUE
username TEXT UNIQUE
password_hash TEXT NOT NULL
role TEXT NOT NULL
phone_local TEXT
phone_whatsapp TEXT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Role values:

- tutor
- student

Notes:

- Tutors and students are in the same table.
- Passwords are stored as hashes.
- Students can log in with email or username.

## Table: students

Stores student-specific details.

Fields:

```text
id UUID PRIMARY KEY
user_id UUID FK → app_users.id
tutor_id UUID FK → app_users.id
student_code TEXT UNIQUE
full_name TEXT NOT NULL
parent_name TEXT
parent_phone_local TEXT
parent_phone_whatsapp TEXT
parent_email TEXT
address TEXT
notes TEXT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Notes:

- Parent details are stored inside students table for MVP.
- Parent login is not included.
- Store both local and WhatsApp-ready phone formats.

Example:

- Local: `0771234567`
- WhatsApp: `94771234567`

## Table: classes

Stores tuition class details.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
subject TEXT NOT NULL
class_name TEXT NOT NULL
schedule_day TEXT
start_time TIME
end_time TIME
fee_amount NUMERIC(10,2)
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

## Table: class_enrollments

Connects students and classes.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
student_id UUID FK → students.id
class_id UUID FK → classes.id
enrolled_at TIMESTAMP
status TEXT DEFAULT 'active'
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Status values:

- active
- inactive
- completed

Unique rule:

```text
student_id + class_id
```

## Table: devices

Stores student device registration requests.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
student_id UUID FK → students.id
device_token TEXT NOT NULL
device_name TEXT
browser_info TEXT
status TEXT DEFAULT 'pending'
requested_at TIMESTAMP
approved_at TIMESTAMP NULL
rejected_at TIMESTAMP NULL
approved_by UUID FK → app_users.id NULL
rejection_reason TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Status values:

- pending
- approved
- rejected

Rule:

- Each student can have only one approved device.
- Enforce with backend logic and database constraint.

## Table: attendance_sessions

Stores QR attendance sessions.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
class_id UUID FK → classes.id
session_token TEXT UNIQUE NOT NULL
start_time TIMESTAMP NOT NULL
expires_at TIMESTAMP NOT NULL
status TEXT DEFAULT 'active'
qr_time_limit_minutes INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Status values:

- active
- expired
- closed

QR link example:

```text
https://tuitionledger.netlify.app/mark-attendance?session_token=SECURE_TOKEN
```

## Table: attendance_records

Stores student attendance records.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
student_id UUID FK → students.id
class_id UUID FK → classes.id
session_id UUID FK → attendance_sessions.id
status TEXT NOT NULL
marked_at TIMESTAMP
method TEXT NOT NULL
device_id UUID FK → devices.id NULL
updated_by UUID FK → app_users.id NULL
manual_reason TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Attendance statuses:

- present
- absent
- late

Methods:

- qr
- manual

Duplicate prevention:

```text
student_id + session_id UNIQUE
```

Manual rule:

- If method is manual, `manual_reason` is required.

## Absent Record Rule

When a session closes:

1. Get all students enrolled in the class.
2. Check who has no attendance record.
3. Create absent records for those students.
4. Reports become complete.

## Table: fee_payments

Stores monthly fee records.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
student_id UUID FK → students.id
class_id UUID FK → classes.id
month INTEGER NOT NULL
year INTEGER NOT NULL
amount_due NUMERIC(10,2)
amount_paid NUMERIC(10,2)
status TEXT NOT NULL
payment_date DATE NULL
notes TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Status values:

- paid
- unpaid
- partial
- overdue

Unique rule:

```text
student_id + class_id + month + year
```

Partial payment rule:

- Store `amount_due` and `amount_paid` in the same record.

## Table: reminders

Stores reminder history.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
student_id UUID FK → students.id
fee_payment_id UUID FK → fee_payments.id NULL
parent_phone_local TEXT
parent_phone_whatsapp TEXT
reminder_type TEXT NOT NULL
message TEXT
status TEXT DEFAULT 'prepared'
confirmed_at TIMESTAMP NULL
created_by UUID FK → app_users.id
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Reminder types:

- whatsapp
- phone

Reminder statuses:

- prepared
- confirmed_sent
- failed
- cancelled

## Table: tutor_settings

Stores tutor preferences.

Fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id UNIQUE
default_qr_minutes INTEGER DEFAULT 5
whatsapp_template TEXT
phone_template TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

Default WhatsApp template:

```text
Dear Parent, this is a reminder that {student_name}'s tuition class fee for {month} is still pending. Please complete the payment as soon as possible. Thank you.
```

## Future Table: audit_logs

Audit logs are future version. MVP stores manual attendance reasons already.

Future fields:

```text
id UUID PRIMARY KEY
tutor_id UUID FK → app_users.id
user_id UUID FK → app_users.id
action_type TEXT
table_name TEXT
record_id UUID
old_value JSONB
new_value JSONB
description TEXT
created_at TIMESTAMP
```

## Soft Delete Rule

Important records use soft delete:

```text
is_active = false
deleted_at = current timestamp
```

Use for:

- Users
- Students
- Classes
- Enrollments
- Devices
- Attendance records
- Fee payments
- Reminders

## Timestamp Rule

All main tables include:

- created_at
- updated_at

## Tutor Ownership Rule

Important tables include `tutor_id` to separate tutor data.

Tables with tutor_id:

- students
- classes
- class_enrollments
- devices
- attendance_sessions
- attendance_records
- fee_payments
- reminders
- tutor_settings

## Supabase RLS

For MVP, Flask backend controls access. Supabase Row Level Security can be added later.

Backend must enforce:

- Tutor can only access own records.
- Student can only access own attendance actions.
- Parent has no login.

## Indexes

Recommended indexes:

```text
app_users.email
app_users.username
app_users.role
students.tutor_id
students.user_id
students.student_code
classes.tutor_id
class_enrollments.student_id
class_enrollments.class_id
class_enrollments.tutor_id
devices.student_id
devices.tutor_id
devices.status
attendance_sessions.class_id
attendance_sessions.tutor_id
attendance_sessions.session_token
attendance_sessions.status
attendance_records.student_id
attendance_records.class_id
attendance_records.session_id
attendance_records.tutor_id
attendance_records.status
fee_payments.student_id
fee_payments.class_id
fee_payments.tutor_id
fee_payments.month
fee_payments.year
fee_payments.status
reminders.student_id
reminders.tutor_id
reminders.status
```

## Important Constraints

- app_users.email UNIQUE
- app_users.username UNIQUE
- students.student_code UNIQUE
- student_id + class_id UNIQUE in enrollments
- attendance_sessions.session_token UNIQUE
- student_id + session_id UNIQUE in attendance_records
- student_id + class_id + month + year UNIQUE in fee_payments
- tutor_settings.tutor_id UNIQUE

## Seed Data

Create sample:

- 1 tutor
- 8–10 students
- 2–3 classes
- enrollments
- pending/approved/rejected devices
- present/absent/late attendance
- paid/unpaid/partial/overdue fees
- prepared/confirmed reminders

## Backend Schema Rules

- Never trust frontend data only.
- Always check tutor ownership.
- Always verify student enrollment.
- Always verify QR expiry in backend.
- Always verify device approval.
- Always block duplicate attendance.
- Always hash passwords.
- Always store manual attendance reason.
- Always use soft delete.
- Always use safe Supabase client methods or parameterized queries.
