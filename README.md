# TuitionLedger

<div align="center">

## A calmer way to run tuition classes

**Tutor operations, browser-trusted student attendance, and monthly fees in one focused workspace.**

<p>
  <img alt="Vanilla JavaScript" src="https://img.shields.io/badge/Tutor%20UI-Vanilla%20JS%20%2B%20Vite-102a43?style=for-the-badge&logo=javascript&logoColor=white">
  <img alt="Flask" src="https://img.shields.io/badge/API-Flask-3ba7ff?style=for-the-badge&logo=flask&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Data-Supabase-4fd1c5?style=for-the-badge&logo=supabase&logoColor=102a43">
  <img alt="PWA" src="https://img.shields.io/badge/Tutor-PWA-f6c85f?style=for-the-badge&logo=pwa&logoColor=102a43">
</p>

[Tutor + Student Frontend](https://tuitionledger-frontend.vercel.app) · [API health](https://tuitionledger-backend.vercel.app/health)

</div>

![TuitionLedger landing page](docs/assets/landing-page.png)

<div align="center"><sub>The Frosted Touch landing experience: one calm workspace for tutors and one trusted browser flow for students.</sub></div>

---

## Product overview

TuitionLedger is a full-stack HNDIT group-project MVP for tutors who need a simple, reliable way to manage students, classes, attendance, and fees. Tutors use an installable PWA with five focused workspaces. Students use a deliberately small responsive website: no installation, password, dashboard, or unnecessary controls.

The product is built around one trust boundary: a tutor approves a student's browser once, and that browser is then used to scan attendance QR codes.

### Core promise

> **Register once. Approve clearly. Scan quickly. Keep the ledger accurate.**

## What is included

| Area | Capability |
| --- | --- |
| Tutor authentication | Supabase email sign-up, confirmation, login, session persistence, sign-out |
| Student directory | Add, edit, archive, browser reset, search-ready records, sequential IDs (`STU001`) |
| Registration | Tutor-generated QR, mobile registration form, pending approval, approve/reject |
| Classes | Class CRUD, schedules, monthly fees, enrollment, short-lived attendance QR, countdown and session ending |
| Attendance | Date/class history, present/absent status and manual correction |
| Fees | Monthly fee generation, paid/unpaid status, WhatsApp click-to-chat reminder |
| Tutor PWA | Manifest, service worker, install support and a read-only offline fallback |
| Student QR Website | Same-origin registration, browser approval and attendance states without a student login or install prompt |
| Design system | Frosted Touch surfaces, rounded cards, soft gradients, bento dashboard, matte-glass icons |

## System at a glance

```mermaid
flowchart LR
    Frontend["One Vite Frontend\nTutor PWA + Student QR flows"]
    Tutor["Tutor routes\nHash-based workspace"]
    Student["Student routes\nQuery-based registration / scan"]
    API["Flask API\nVercel Function"]
    Auth["Supabase Auth"]
    DB[("Supabase PostgreSQL\nRLS + ownership")]
    WA["WhatsApp\nclick-to-chat"]

    Frontend --> Tutor
    Frontend --> Student
    Tutor -->|Bearer token| API
    Student -->|public registration / scan| API
    API --> Auth
    API --> DB
    Tutor -->|reminder link| WA
```

## End-to-end workflow

```mermaid
sequenceDiagram
    participant T as Tutor
    participant W as Tutor PWA
    participant S as Student Website
    participant A as Flask API
    participant D as Supabase

    T->>W: Sign up or sign in
    W->>A: Authenticate request
    A->>D: Validate Supabase session
    T->>W: Generate registration QR
    W-->>S: Student opens QR link
    S->>A: Submit details + browser ID
    A->>D: Save pending request
    A-->>W: Show pending request
    T->>W: Approve request
    A->>D: Create student as STU001
    T->>W: Open Classes, enrol student + start QR
    W-->>S: Student scans class QR
    S->>A: Send QR token + browser ID
    A->>D: Validate session, enrollment, browser
    A-->>W: Attendance appears as Present
```

## Repository map

```text
TuitionLedger/
├── tutor-frontend/          # One Vite deployment for Tutor + Student flows
│   ├── src/main.js          # Chooses Tutor routes or Student query flows
│   ├── src/app.css          # Consolidated Tutor Frosted Touch stylesheet
│   ├── src/student/         # Registration, browser connection and attendance
│   ├── src/core/            # Shared API, configuration and URL helpers
│   └── public/              # Tutor manifest, service worker, icons and offline page
├── backend/                 # Flask API and Vercel Python entrypoint
│   ├── app.py               # App creation, CORS and error handling
│   ├── routes/              # Auth, Dashboard, Students, Classes, Attendance, Fees
│   ├── api/index.py         # Vercel adapter
│   └── requirements.txt
├── supabase/migrations/     # Incremental database source of truth
├── supabase/schema.sql      # Reference schema aligned with migrations
├── .gitignore
└── README.md
```

## Tutor PWA pages

| Route | Purpose |
| --- | --- |
| `#top` | Landing page, product explanation and tutor actions |
| `#login` | Tutor sign-in with modern password visibility control |
| `#signup` | Tutor account creation and email-confirmation guidance |
| `#dashboard` | Overview: totals, today's classes and recent activity |
| `#students` | Student CRUD, registration QR, approvals, browser reset and read-only enrolled classes |
| `#classes` | Class CRUD, enrollment, attendance QR, duration, countdown and session ending |
| `#attendance` | Date/class attendance history and manual present/absent correction |
| `#fees` | Monthly ledger, paid/unpaid updates and WhatsApp reminders |

## Student QR Website states

```mermaid
stateDiagram-v2
    [*] --> Register
    Register --> Waiting: Submit registration
    Waiting --> Approved: Tutor approves
    Waiting --> Rejected: Tutor rejects
    Approved --> Scan: Open class QR
    Scan --> Present: Valid trusted browser
    Scan --> Duplicate: Already scanned
    Scan --> Expired: QR expired
    Scan --> WrongBrowser: Browser not approved
    Scan --> NotEnrolled: Student not enrolled
    Scan --> NetworkError: API unavailable
```

## Data model

```mermaid
erDiagram
    TUTORS ||--o{ STUDENTS : owns
    TUTORS ||--o{ CLASSES : owns
    STUDENTS ||--o{ REGISTRATION_REQUESTS : submits
    CLASSES ||--o{ CLASS_STUDENTS : contains
    STUDENTS ||--o{ CLASS_STUDENTS : enrolls
    CLASSES ||--o{ ATTENDANCE_SESSIONS : opens
    ATTENDANCE_SESSIONS ||--o{ ATTENDANCE_RECORDS : records
    STUDENTS ||--o{ ATTENDANCE_RECORDS : receives
    STUDENTS ||--o{ FEE_RECORDS : owes
    CLASSES ||--o{ FEE_RECORDS : generates
```

Every tutor-managed table carries ownership data. Row Level Security and server-side tutor checks prevent one tutor from reading or changing another tutor's records.

## API surface

All responses use one predictable envelope:

```json
{ "success": true, "data": {} }
```

Errors use the same shape:

```json
{ "success": false, "message": "Readable error message" }
```

### Authentication and profile

```text
POST  /api/auth/signup
POST  /api/auth/login
POST  /api/auth/refresh
GET   /api/tutor
PUT   /api/tutor
```

### Dashboard, students and registration

```text
GET    /api/dashboard
GET    /api/students
GET    /api/students/overview
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
GET    /api/students/:id/monthly-summary
POST   /api/students/:id/reset-browser
POST   /api/registration-qr
POST   /api/register-student
GET    /api/registration-requests
GET    /api/registration-requests/:id
GET    /api/registration-requests/:id/status
POST   /api/registration-requests/:id/approve
POST   /api/registration-requests/:id/reject
POST   /api/browser-requests
GET    /api/browser-requests
GET    /api/browser-requests/:id/status
POST   /api/browser-requests/:id/approve
POST   /api/browser-requests/:id/reject
```

### Classes, attendance and fees

```text
GET    /api/classes
GET    /api/classes/:id
POST   /api/classes
PUT    /api/classes/:id
DELETE /api/classes/:id
GET    /api/classes/:id/students
POST   /api/classes/:id/students
POST   /api/classes/:id/students/bulk
DELETE /api/classes/:id/students/:student_id
POST   /api/attendance-sessions
POST   /api/attendance-sessions/:id/end
GET    /api/attendance/classes/:class_id
POST   /api/attendance/scan
POST   /api/attendance/manual
GET    /api/fees/ledger?month=YYYY-MM
PUT    /api/students/:id/fees/:month
GET    /api/students/:id/fees/:month/whatsapp
```

## Local setup

### Requirements

- Node.js 18 or newer
- Python 3.11 or newer
- A Supabase project with Auth and PostgreSQL enabled
- PowerShell, Bash, or an equivalent terminal

### 1. Configure Supabase

Copy the example environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set values in `backend/.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
DATABASE_URL=your_session_pooler_connection_string
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
AUTH_REDIRECT_URL=http://localhost:5173/#login
```

Use the **Session pooler** connection string from Supabase Dashboard → Connect → Connection Pooling. URL-encode special characters in the database password. Never commit `.env`, service-role keys, or database passwords.

Do **not** run the destructive reference `supabase/schema.sql` against an existing database. Back up and inspect the live schema, then apply the reviewed incremental migration:

```text
supabase/migrations/20260716102500_final_requirements_foundation.sql
```

See [migration verification](docs/DATABASE_MIGRATION_VERIFICATION.md) before changing production data.

### 2. Start the Flask API

```powershell
cd backend
python -m pip install -r requirements.txt
python -m flask --app app run --host 0.0.0.0 --port 8000
```

Check it at [http://localhost:8000/health](http://localhost:8000/health).

### 3. Start the Tutor PWA

```powershell
cd tutor-frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Test the Student QR Website

The Student registration, browser-connection and attendance pages are served by the same frontend on port `5173`. Tutor-generated QR codes use query parameters such as:

```text
http://localhost:5173/?registration_token=...
http://localhost:5173/?attendance_token=...
http://localhost:5173/?connect=true&tutor=...
```

Student query flows do not register or remove service workers and do not show a PWA install prompt.

## Verification checklist

Run the fast checks before every deployment:

```powershell
cd tutor-frontend
npm test
npm run build

cd ..
python -m compileall -q backend
python -m pytest backend/tests -q
git diff --check
```

### Acceptance test

- [ ] Tutor sign-up displays a clear success or error state.
- [ ] Confirmation email returns to the current tutor login URL.
- [ ] Tutor can sign in and sign out.
- [ ] Tutor can create Grade 11 Maths and Grade 10 Science.
- [ ] Registration QR opens the same-origin Student QR Website.
- [ ] Student submission appears as pending.
- [ ] Approval creates `STU001` on a fresh database.
- [ ] Student enrollment is managed from Classes and shown read-only in Students.
- [ ] Attendance QR starts from Classes, counts down, ends, and accepts the approved browser.
- [ ] Attendance contains history and manual correction but no QR controls.
- [ ] Duplicate, expired, wrong-browser and not-enrolled states are friendly.
- [ ] Fee status changes from unpaid to paid.
- [ ] WhatsApp click-to-chat contains the correct student and amount.
- [ ] Tutor manifest, icons, service worker and install support load successfully.
- [ ] Student query pages do not register, remove or offer a service worker.
- [ ] Tutor and Student flows work from the same frontend deployment.

## Production deployment

TuitionLedger now uses **two Vercel projects** backed by one Supabase project:

| Service | Vercel project/root directory | URL |
| --- | --- | --- |
| Tutor PWA + Student QR Website | `tutor-frontend` | [tuitionledger-frontend.vercel.app](https://tuitionledger-frontend.vercel.app) |
| Flask backend | `backend` | [tuitionledger-backend.vercel.app](https://tuitionledger-backend.vercel.app) |

Configure production variables:

```env
# Frontend Vercel project
VITE_API_BASE_URL=https://tuitionledger-backend.vercel.app

# Backend Vercel project
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
DATABASE_URL=your_session_pooler_connection_string
ALLOWED_ORIGINS=https://tuitionledger-frontend.vercel.app
AUTH_REDIRECT_URL=https://tuitionledger-frontend.vercel.app/#login
```

Also add the tutor login URL to Supabase Authentication → URL Configuration:

```text
https://tuitionledger-frontend.vercel.app/#login
```

Deploy each Vercel project using its root directory. The old `student-mobile` Vercel project should only be deleted after registration, browser connection and attendance QR links have been tested on the combined frontend.

## Design language

The interface uses **Frosted Touch**: translucent glass panels, diffused shadows, rounded geometry, a soft cyan/lavender atmosphere, navy text, matte-glass icons, and bento-style dashboard summaries. The visual system is intentionally expressive without hiding the simple Vanilla JavaScript implementation.

## Security boundaries

- Supabase Auth owns tutor identity and email confirmation.
- Flask validates bearer tokens before protected operations.
- Tutor ownership is enforced in API queries and PostgreSQL RLS policies.
- Student access is browser-trusted rather than password-based.
- Attendance QR tokens are short-lived and single-purpose.
- WhatsApp is only a generated click-to-chat URL; no automated messaging service is used.
- Technical database and Python errors are converted into readable UI messages.

## Known boundaries

- Students do not install an app and do not have a password login or tutor dashboard.
- The Tutor PWA caches only its shell; live database editing remains online-only.
- WhatsApp reminders require the tutor to click and send them.
- Attendance requires enrollment and an approved browser.
- Supabase must be reachable for database-backed workflows.
- This is an HNDIT group-project MVP, not a replacement for a full accounting platform.

## Project status

TuitionLedger is an actively developed full-stack MVP. Keep the schema, API response envelope, tutor ownership rules, and live acceptance workflow aligned when adding features.

## License

Educational project for the TuitionLedger HNDIT group.
