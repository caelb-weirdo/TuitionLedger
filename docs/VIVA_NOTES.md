# Viva Preparation Notes — TuitionLedger

## Problem Solved
Manual tuition management causes proxy attendance, forgotten payments, and slow parent communication.

## Target Users
- Individual tuition tutors
- Small tuition class owners in Sri Lanka

## Key Features Explained

### QR Attendance
- Tutor generates secure session token (not student ID in QR)
- QR link: `https://tuitionledger.netlify.app/mark-attendance?session_token=...`
- Backend validates: expiry, enrollment, device, duplicate

### Device Verification
- Browser generates UUID stored in localStorage
- Tutor approves one device per student
- Prevents proxy attendance

### WhatsApp Reminders
- Uses wa.me click-to-chat ONLY
- Tutor manually sends message
- Tutor confirms in app → status = confirmed_sent
- NOT automatic sending

### Fee Tracking
- One record per student + class + month + year
- Statuses: paid, unpaid, partial, overdue

## Architecture (Viva Answer)

```
Route → Controller → Service → Repository → Supabase PostgreSQL
```

- **Routes**: URL mapping only
- **Controllers**: Request/response handling
- **Services**: Business rules (QR expiry, device check, duplicates)
- **Repositories**: Database queries

## Design Patterns

1. **Repository Pattern** — all DB access
2. **Service Layer** — business logic
3. **Strategy Pattern** — QRAttendanceStrategy vs ManualAttendanceStrategy
4. **Factory Pattern** — ReminderFactory for WhatsApp/phone

## Security

- JWT 24h expiry
- Password hashing (Werkzeug)
- Backend validates everything (never trust frontend only)
- Tutor ownership via tutor_id
- Role checks on every endpoint

## Database Tables

app_users, students, classes, class_enrollments, devices,
attendance_sessions, attendance_records, fee_payments, reminders, tutor_settings

## Deployment Stack

- Supabase PostgreSQL
- Vercel (Flask API)
- Netlify (React frontend)

## Google Stitch UI

Light SaaS dashboard with teal primary, green success, soft cards,
sidebar desktop, bottom nav mobile — rebuilt in React per design system.
