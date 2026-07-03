# Document 07 — API Contract

## API Summary

TuitionLedger uses a Flask REST API. The React frontend communicates with the backend using JSON.

All routes use the `/api` prefix.

## Base URL

Local example:

```text
http://localhost:5000/api
```

Production example:

```text
https://tuitionledger-backend.vercel.app/api
```

Frontend environment variable:

```text
VITE_API_BASE_URL
```

## Standard Success Response

```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

## Standard Error Response

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": "ERROR_CODE"
}
```

## Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "errors": {
    "parent_phone": "Parent phone is required"
  }
}
```

## Authentication

- Token type: JWT
- Frontend storage: localStorage
- Header format:

```http
Authorization: Bearer TOKEN
```

## Auth Endpoints

### Login

```http
POST /api/auth/login
```

Auth required: No.

Request:

```json
{
  "identifier": "student@example.com or username",
  "password": "password123"
}
```

Success:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "uuid",
      "name": "User Name",
      "role": "tutor"
    }
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Invalid login credentials",
  "error": "INVALID_CREDENTIALS"
}
```

### Logout

No backend logout endpoint required. Frontend clears localStorage and redirects to login.

### Current User

```http
GET /api/auth/me
```

Auth required: Yes.

Returns current logged-in user from JWT.

## Student Endpoints

### Get Students

```http
GET /api/students
```

Role: tutor.

Query:

- search
- class_id
- page
- limit

### Add Student

```http
POST /api/students
```

Role: tutor.

Request:

```json
{
  "full_name": "Kamal Perera",
  "username": "kamal001",
  "email": "kamal@example.com",
  "password": "student123",
  "parent_name": "Mr. Perera",
  "parent_phone_local": "0771234567",
  "parent_phone_whatsapp": "94771234567",
  "parent_email": "parent@example.com",
  "address": "Trincomalee",
  "class_ids": ["class-uuid-1"]
}
```

### Update Student

```http
PUT /api/students/{id}
```

Role: tutor.

### Delete Student

```http
DELETE /api/students/{id}
```

Role: tutor.

Behavior: soft delete.

## Class Endpoints

### Get Classes

```http
GET /api/classes
```

Role: tutor.

### Add Class

```http
POST /api/classes
```

Request:

```json
{
  "subject": "ICT",
  "class_name": "Grade 10 ICT",
  "schedule_day": "Saturday",
  "start_time": "09:00",
  "end_time": "11:00",
  "fee_amount": 1500
}
```

### Update Class

```http
PUT /api/classes/{id}
```

### Delete Class

```http
DELETE /api/classes/{id}
```

Soft delete.

## Enrollment Endpoint

### Create Enrollment

```http
POST /api/enrollments
```

Role: tutor.

Request:

```json
{
  "student_id": "student-uuid",
  "class_id": "class-uuid"
}
```

Duplicate error:

```json
{
  "success": false,
  "message": "Student is already enrolled in this class",
  "error": "ENROLLMENT_ALREADY_EXISTS"
}
```

## Device Endpoints

### Request Device

```http
POST /api/devices/request
```

Role: student.

Request:

```json
{
  "device_token": "browser-generated-device-token",
  "device_name": "Chrome on Android",
  "browser_info": "Mozilla/5.0..."
}
```

### Get Devices

```http
GET /api/devices
```

Role: tutor.

Query:

- status
- student_id
- page
- limit

### Approve Device

```http
PUT /api/devices/{id}/approve
```

Role: tutor.

### Reject Device

```http
PUT /api/devices/{id}/reject
```

Role: tutor.

Request:

```json
{
  "reason": "Student is using another device"
}
```

## Attendance Session Endpoints

### Generate Attendance Session

```http
POST /api/attendance-sessions
```

Role: tutor.

Request:

```json
{
  "class_id": "class-uuid",
  "qr_time_limit_minutes": 5
}
```

Success returns:

```json
{
  "success": true,
  "message": "QR attendance session created successfully",
  "data": {
    "session_id": "uuid",
    "session_token": "secure-token",
    "qr_link": "https://tuitionledger.netlify.app/mark-attendance?session_token=secure-token",
    "expires_at": "2026-07-03T10:05:00Z"
  }
}
```

### Get Attendance Session by Token

```http
GET /api/attendance-sessions/{token}
```

Auth required: yes.

### Close Attendance Session

```http
PUT /api/attendance-sessions/{id}/close
```

Role: tutor.

Creates absent records for enrolled students who did not scan.

## Attendance Endpoints

### Mark Attendance

```http
POST /api/attendance/mark
```

Role: student.

Request:

```json
{
  "session_token": "secure-token",
  "device_token": "browser-generated-device-token"
}
```

Backend validates:

- Student is logged in
- QR session exists
- QR session is active
- QR is not expired
- Student belongs to the class
- Device is approved
- Attendance is not already marked

Success:

```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "status": "present",
    "marked_at": "2026-07-03T10:01:00Z"
  }
}
```

Common errors:

```json
{
  "success": false,
  "message": "Attendance already marked",
  "error": "ATTENDANCE_ALREADY_MARKED"
}
```

```json
{
  "success": false,
  "message": "QR code has expired",
  "error": "SESSION_EXPIRED"
}
```

```json
{
  "success": false,
  "message": "This device is not approved yet",
  "error": "DEVICE_NOT_APPROVED"
}
```

### Manual Attendance

```http
POST /api/attendance/manual
```

Role: tutor.

Request:

```json
{
  "student_id": "student-uuid",
  "class_id": "class-uuid",
  "session_id": "session-uuid",
  "status": "late",
  "manual_reason": "Student arrived late because of transport issue"
}
```

### Get Attendance Records

```http
GET /api/attendance
```

Role: tutor.

Query:

- class_id
- student_id
- month
- year
- status
- page
- limit

## Fee Endpoints

### Get Fee Records

```http
GET /api/fees
```

Role: tutor.

Query:

- student_id
- class_id
- month
- year
- status
- page
- limit

### Add Fee Record

```http
POST /api/fees
```

Role: tutor.

Request:

```json
{
  "student_id": "student-uuid",
  "class_id": "class-uuid",
  "month": 7,
  "year": 2026,
  "amount_due": 1500,
  "amount_paid": 1000,
  "status": "partial",
  "payment_date": "2026-07-03",
  "notes": "Paid part of the fee"
}
```

### Update Fee Record

```http
PUT /api/fees/{id}
```

### Get Unpaid Students

```http
GET /api/fees/unpaid
```

Role: tutor.

Returns unpaid, partial, and overdue students.

## Reminder Endpoints

### Prepare WhatsApp Reminder

```http
POST /api/reminders/whatsapp/prepare
```

Role: tutor.

Request:

```json
{
  "student_id": "student-uuid",
  "fee_payment_id": "fee-payment-uuid"
}
```

Returns reminder ID, message, and `wa.me` link.

### Prepare Phone Reminder

```http
POST /api/reminders/phone/prepare
```

Role: tutor.

Returns reminder ID and `tel:` link.

### Confirm Reminder Sent

```http
PUT /api/reminders/{id}/confirm
```

Role: tutor.

Request:

```json
{
  "status": "confirmed_sent"
}
```

### Get Reminder History

```http
GET /api/reminders
```

Role: tutor.

Query:

- student_id
- type
- status
- month
- year
- page
- limit

## Reports Endpoint

```http
GET /api/reports
```

Role: tutor.

Query:

- type
- month
- year
- class_id
- student_id

Report types:

- attendance
- fees
- unpaid
- student-history

Example:

```text
GET /api/reports?type=attendance&month=7&year=2026&class_id=uuid
```

## Dashboard Endpoint

```http
GET /api/dashboard/summary
```

Role: tutor.

Query:

- month
- year

Returns summary card data and recent activity.

## Settings Endpoints

### Get Settings

```http
GET /api/settings
```

Role: tutor.

### Update Settings

```http
PUT /api/settings
```

Request:

```json
{
  "default_qr_minutes": 5,
  "whatsapp_template": "Dear Parent, this is a reminder that {student_name}'s tuition fee for {month} is pending.",
  "phone_template": "Call parent regarding pending fee."
}
```

## Pagination

Use:

- page
- limit

Example:

```text
GET /api/students?page=1&limit=10
```

Response contains:

```json
{
  "page": 1,
  "limit": 10,
  "total": 50
}
```

## Common Error Codes

Authentication:

- INVALID_CREDENTIALS
- TOKEN_MISSING
- TOKEN_INVALID
- TOKEN_EXPIRED

Permission:

- FORBIDDEN

Validation:

- VALIDATION_ERROR

QR/attendance:

- SESSION_EXPIRED
- SESSION_NOT_FOUND
- SESSION_CLOSED
- ATTENDANCE_ALREADY_MARKED
- STUDENT_NOT_ENROLLED
- DEVICE_NOT_APPROVED
- DEVICE_PENDING
- DEVICE_REJECTED

Student/class/fee:

- STUDENT_NOT_FOUND
- CLASS_NOT_FOUND
- FEE_RECORD_NOT_FOUND
- FEE_RECORD_ALREADY_EXISTS
- ENROLLMENT_ALREADY_EXISTS

Server:

- SERVER_ERROR
- DATABASE_ERROR

## Permission Rules

Tutor can access only own records.

Student can only access own attendance flow.

Parent has no login access.

## API Documentation Standard

Each endpoint should document:

- Path
- Method
- Required role
- Request body
- Query parameters
- Success response
- Error response
- Backend validation rules
