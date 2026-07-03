# Document 08 — Security & Validation Rules

## Security Summary

TuitionLedger must protect student data, tutor records, QR attendance sessions, device registration, and fee payment information.

The system must not rely only on frontend checks. All important rules must be validated in the Flask backend.

## Password Rules

### Minimum Length

8 characters.

### Complexity

Must include letters and numbers.

### Storage

Passwords must be stored as hashes only.

Recommended:

- Werkzeug password hashing

## Failed Login Protection

For MVP, account locking is future version.

For MVP:

- Show invalid credentials message.
- Do not reveal whether identifier or password is wrong.

## JWT Authentication

- JWT expiry: 24 hours
- Frontend storage: localStorage
- Header: `Authorization: Bearer TOKEN`

Backend validates token on protected routes.

## Account Creation

### Tutor Accounts

Tutor accounts are seeded/admin-created for MVP.

### Student Accounts

Tutor creates student accounts.

Students cannot self-register in version 1.

## Roles

- tutor
- student

Parents do not log in.

## Tutor Permission Rules

Tutors can access only records where:

```text
record.tutor_id == logged_in_tutor.id
```

Applies to:

- Students
- Classes
- Enrollments
- Devices
- Attendance sessions
- Attendance records
- Fees
- Reminders
- Reports
- Settings

## Student Permission Rules

Students can only access their own attendance-related data.

Students cannot access:

- Tutor dashboard
- Other students
- Fee management
- Reports
- Device approvals
- Reminder history
- Class management

Permission error:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "error": "FORBIDDEN"
}
```

## Device Token Rules

### Storage

Student device token is stored in browser localStorage.

### Generation

Frontend generates token, preferably with:

```js
crypto.randomUUID()
```

### Privacy

Do not use:

- MAC address
- GPS
- IMEI
- Hardware serial number

## Device Registration Rules

If student logs in from browser without token:

1. Frontend creates token.
2. Backend creates pending device request.
3. Tutor approves/rejects.
4. Attendance works only after approval.

If localStorage token is deleted:

> Student must request device approval again.

Each student can have only one approved device.

If student uses a new device:

- Create pending request
- Do not mark attendance
- Show approval message

## QR Token Rules

QR token must be a long secure random token.

QR must contain only session token.

Do not expose:

- Student ID
- Tutor ID
- Parent phone
- Fee amount
- Database IDs
- Passwords
- Sensitive data

## QR Expiry Rules

Backend always validates expiry.

Frontend countdown is only display.

Backend check:

```text
current_time <= attendance_session.expires_at
```

Expired response:

```json
{
  "success": false,
  "message": "QR code has expired",
  "error": "SESSION_EXPIRED"
}
```

Expired QR codes are blocked completely.

## Attendance Validation Rules

Before marking attendance, backend checks:

1. Student is logged in
2. JWT is valid
3. QR session exists
4. QR session is active
5. QR is not expired
6. Student is enrolled in class
7. Device is approved
8. Attendance is not already marked
9. Student belongs to correct tutor/class context

## Duplicate Attendance Prevention

Use:

- Backend check
- Database unique rule

Unique rule:

```text
student_id + session_id
```

Duplicate response:

```json
{
  "success": false,
  "message": "Attendance already marked",
  "error": "ATTENDANCE_ALREADY_MARKED"
}
```

## Student Enrollment Validation

Student cannot mark attendance for a class they are not enrolled in.

Error:

```json
{
  "success": false,
  "message": "You are not enrolled in this class",
  "error": "STUDENT_NOT_ENROLLED"
}
```

## Manual Attendance Rules

Only tutor can manually update attendance.

Manual reason is required.

Manual update stores:

- Student
- Class/session
- Status
- Reason
- Updated by tutor ID
- Updated time

## Attendance Status Rules

Allowed statuses:

- present
- absent
- late

Reject anything else.

## Fee Rules

Only tutor can create/update/delete fee records.

Allowed fee statuses:

- paid
- unpaid
- partial
- overdue

### Fee Amount Validation

```text
amount_due >= 0
amount_paid >= 0
```

### Partial Payment

If status is partial:

```text
amount_paid > 0
amount_paid < amount_due
```

### Paid Payment

If status is paid:

```text
amount_paid == amount_due
```

### Overdue

For MVP, tutor manually marks overdue.

### Duplicate Fee Rule

One fee record per:

```text
student + class + month + year
```

## Reminder Rules

Only tutor can:

- Prepare WhatsApp reminder
- Prepare phone reminder
- Confirm reminder sent
- View reminder history

## WhatsApp Reminder Rules

The system must not say WhatsApp messages are automatically sent.

Correct flow:

1. Backend prepares message.
2. System creates WhatsApp link.
3. Tutor clicks link.
4. WhatsApp opens.
5. Tutor manually sends.
6. Tutor confirms in TuitionLedger.
7. System marks reminder as confirmed.

## Parent Phone Validation

Parent phone is required for WhatsApp and phone reminders.

Error:

```json
{
  "success": false,
  "message": "Parent phone number is required for this reminder",
  "error": "PARENT_PHONE_REQUIRED"
}
```

## Phone Format Rules

Store both:

- local format: `0771234567`
- WhatsApp-ready: `94771234567`

Use `94771234567` in `wa.me` links.

Do not use plus sign or spaces in `wa.me` number.

## Soft Delete Rules

Use soft delete for important records:

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

## Input Sanitization

Backend must validate and clean:

- Names
- Phone numbers
- Emails
- Usernames
- Class names
- Fee amounts
- Status values
- Reminder messages
- Query parameters

## SQL Injection Protection

Allowed:

- Supabase client safe methods
- Parameterized queries

Avoid raw SQL string concatenation.

## CORS Rules

Allow only:

- Netlify frontend URL
- Local dev frontend URL

Examples:

```text
https://tuitionledger.netlify.app
http://localhost:5173
```

Do not allow all origins in production.

## Environment Variables

Secrets must stay in:

- `.env` files
- Platform environment variables

Never hardcode secrets or put backend secrets in frontend.

## Error Message Rules

Use user-friendly messages. Do not expose:

- Stack traces
- Database errors
- Passwords
- Secret keys

## Reports Access

Reports are tutor-only.

Students and parents cannot view reports.

## Student Privacy

Students can only access own attendance-related data.

They cannot access:

- Other students
- Parent phone numbers
- Fee records
- Tutor reports

## Reminder History Visibility

Reminder history is tutor-only.

## Security Priority

Highest priority:

> Backend validation and role checks.

Frontend hiding is not security.

## Validation Checklists

### Before Marking Attendance

- Valid JWT
- Role = student
- QR session exists
- QR session active
- QR not expired
- Student enrolled
- Device approved
- Attendance not already marked

### Before Tutor Modifies Data

- Valid JWT
- Role = tutor
- Record belongs to tutor_id
- Input is valid

### Before Preparing Reminder

- Valid JWT
- Role = tutor
- Student belongs to tutor
- Parent phone exists
- Fee record exists if needed
- Reminder type valid

## Future Security Improvements

- Failed login lock
- HTTP-only cookie auth
- Supabase RLS
- Email verification
- Password reset
- Two-factor authentication
- Audit logs
- Automatic overdue detection
