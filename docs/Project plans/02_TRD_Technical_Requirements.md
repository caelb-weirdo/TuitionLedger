# Document 02 — Technical Requirements Document

## Technical Summary

TuitionLedger will be built as a mobile-friendly web-based system using a React frontend, a Python Flask backend API, and Supabase PostgreSQL as the database.

The frontend will be deployed on Netlify. The backend will be deployed on Vercel as a Flask API. Supabase will provide the hosted PostgreSQL database.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React |
| Styling | Plain CSS |
| Icons | Font Awesome |
| Backend | Python Flask |
| Database | Supabase PostgreSQL |
| Frontend Hosting | Netlify |
| Backend Hosting | Vercel |
| API Style | REST API using JSON |
| Authentication | Custom email/username + password |
| Password Security | Hashed passwords |
| UI Design Tool | Google Stitch |

## Frontend

### Technology

React.

### Styling

Plain CSS files. This keeps the styling easy to understand and explain.

### Icons

Font Awesome icons will be used for navigation, cards, buttons, and status indicators.

### Frontend Hosting

Netlify.

### Frontend Responsibilities

- Landing page
- Login page
- Tutor dashboard
- Student dashboard
- Class management UI
- Student management UI
- QR display page
- Mark attendance page
- Fee management UI
- Reminder buttons
- Reports UI
- Settings UI
- Responsive layout
- API calls to Flask backend

## Backend

### Technology

Python Flask.

### Backend Hosting

Vercel.

### Important Vercel Rule

The Flask backend must be Vercel-compatible. It should not be built only as a traditional always-running local Flask server.

### Backend Responsibilities

- Authentication logic
- Password hashing and checking
- JWT creation and verification
- Role checking
- Device registration and approval
- QR session generation
- QR session validation
- Attendance marking
- Duplicate attendance prevention
- Manual attendance updates
- Fee payment records
- Reminder history records
- Report data
- API responses

## Database

### Provider

Supabase.

### Database Type

PostgreSQL.

### Expected Main Tables

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

## Authentication

### Type

Custom email/username and password login.

### Password Security

Passwords must be hashed before saving. Recommended library:

- Werkzeug password hashing

### Roles

Version 1 includes:

- tutor
- student

Parents do not log in for version 1.

## Device Verification

### Device Identification Method

Browser-generated device token stored in `localStorage`.

A web app cannot reliably access a real MAC address. IP address is also not reliable.

### Device Registration Flow

1. Student logs in.
2. Frontend checks if browser has a saved device token.
3. If no token exists, frontend generates one.
4. Device token is sent to backend.
5. Backend creates a pending device request.
6. Tutor approves or rejects request.
7. Student can mark attendance only after device approval.

### Rule

Each student can have only one approved device.

## QR Attendance

### QR Generation

Backend generates a secure attendance session token.

### QR Code Content

The QR should contain only a secure attendance link:

```text
https://tuitionledger.netlify.app/mark-attendance?session_token=SECURE_TOKEN
```

### QR Expiry

Expiry is displayed in frontend but always validated by backend.

### QR Time Limit

Tutor can choose validity time, such as:

- 3 minutes
- 5 minutes
- 10 minutes

## Attendance Marking Flow

1. Tutor creates QR session.
2. Student scans QR with phone camera.
3. QR opens attendance link.
4. Student logs in if needed.
5. Frontend sends session token and device token to backend.
6. Backend validates login, session, expiry, enrollment, device approval, and duplicate status.
7. Backend saves attendance.
8. Frontend shows result.

## Reminder System

### WhatsApp

Use `wa.me` click-to-chat links.

The system prepares a message but does not automatically send it.

### Phone

Use `tel:` links for mobile calling.

### Email

Email reminders are excluded from MVP.

## Reports

Reports appear as web tables with print support.

Required reports:

- Monthly attendance report
- Monthly fee report
- Unpaid students report
- Student-wise full history report

PDF/Excel export is future version.

## Dashboard Analytics

Use summary cards instead of advanced charts for MVP.

Cards include:

- Total students
- Present today
- Absent today
- Late today
- Paid this month
- Unpaid this month
- Partial payments
- Overdue payments
- Pending devices

## UI Design Workflow

1. Complete documents.
2. Use UI/UX brief and design system.
3. Generate landing, login, and dashboard in Google Stitch.
4. Review design.
5. Rebuild approved design in React.

## API Style

REST API using JSON.

Example success response:

```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {}
}
```

Example error response:

```json
{
  "success": false,
  "message": "QR code has expired",
  "error": "SESSION_EXPIRED"
}
```

## Environment Variables

Use `.env` files and deployment platform environment variables.

Examples:

```text
SUPABASE_URL
SUPABASE_DB_URL
SUPABASE_KEY
JWT_SECRET
FLASK_ENV
FRONTEND_URL
VITE_API_BASE_URL
```

## Deployment

- Database: Supabase PostgreSQL
- Backend: Vercel
- Frontend: Netlify

Development should still work locally.

## Browser Support

The system must support:

- Desktop browsers
- Mobile browsers
- Android phone browser
- Tablet browser

## Technical Constraints

- Must be mobile-friendly.
- Must hash passwords.
- Must not store secrets in frontend.
- Must not expose sensitive data in QR code.
- Must not rely only on frontend validation.
- Must keep WhatsApp integration free using click-to-chat.
- Must keep code understandable for student-level explanation.
