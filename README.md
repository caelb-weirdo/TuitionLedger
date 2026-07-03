<div align="center">

<img src="https://img.shields.io/badge/TuitionLedger-v1.0-0D9488?style=for-the-badge&labelColor=0f172a" alt="TuitionLedger" />

# TuitionLedger

**A mobile-first tuition management system built for Sri Lankan tutors.**  
QR attendance · Fee tracking · Device verification · WhatsApp reminders

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-tuitionledger.netlify.app-0D9488?style=for-the-badge)](https://tuitionledger.netlify.app)
[![API Health](https://img.shields.io/badge/⚡_API-tuition--ledger--backend.vercel.app-000000?style=for-the-badge)](https://tuition-ledger-backend.vercel.app/api/health)

<br/>

![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/Flask_3-000000?style=flat-square&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## The Problem

Individual tutors in Sri Lanka manage classes manually — paper registers, WhatsApp groups, and memory. This leads to proxy attendance, forgotten fee payments, and no audit trail. TuitionLedger replaces all of that with a single lightweight web app that works on any device, no installation required.

---

## Features at a Glance

<table>
<tr>
<td width="50%">

**🔐 Authentication & Roles**
- JWT-based login with 24-hour expiry
- Separate tutor and student portals
- Role-based route guards on every endpoint

**📱 QR Attendance**
- Tutors generate time-limited session QR codes
- Students scan from any browser — no app needed
- Expired QR, duplicate scan, and unapproved device all blocked
- Manual correction with mandatory audit reason

**🔒 Device Verification**
- Browser UUID stored in localStorage
- Tutor approves one device per student
- Prevents proxy attendance at the system level

</td>
<td width="50%">

**💰 Fee Tracking**
- Per-student, per-class, per-month fee records
- Statuses: `paid` · `unpaid` · `partial` · `overdue`
- Duplicate monthly records blocked by DB constraint

**📲 WhatsApp Reminders**
- `wa.me` click-to-chat links (no third-party API)
- Tutor sends manually, confirms in-app
- Full reminder history with status log

**📊 Reports & Settings**
- Attendance and fee reports with print support
- Configurable QR expiry time per tutor
- Custom reminder message templates

</td>
</tr>
</table>

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + Vite | React 19 · Vite 8 |
| **Routing** | React Router DOM | v7 |
| **HTTP** | Axios | v1 |
| **QR** | qrcode.react | v4 |
| **Linting** | oxlint | v1 |
| **Backend** | Python Flask | 3.0.3 |
| **CORS** | flask-cors | 4.0.1 |
| **Auth** | PyJWT + Werkzeug | JWT 2.9 · Werkzeug 3.0 |
| **DB Driver** | psycopg3 | ≥ 3.1.18 |
| **Database** | Supabase PostgreSQL | — |
| **Frontend host** | Netlify | — |
| **Backend host** | Vercel (serverless) | — |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Netlify)                        │
│  Page → Service → Axios ──────────────────────────────────────────► │
└─────────────────────────────────────────────────────┬───────────────┘
                                                      │ HTTPS
┌─────────────────────────────────────────────────────▼───────────────┐
│                           BACKEND (Vercel)                          │
│  Route → Controller → Service → Repository                         │
└─────────────────────────────────────────────────────┬───────────────┘
                                                      │ psycopg3
┌─────────────────────────────────────────────────────▼───────────────┐
│                      DATABASE (Supabase PostgreSQL)                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Patterns

| Pattern | Implementation |
|---|---|
| **Repository Pattern** | All DB queries isolated in `repositories/` — controllers never touch SQL |
| **Service Layer** | Business rules (QR expiry, device checks, duplicate prevention) in `services/` |
| **Strategy Pattern** | `QRAttendanceStrategy` vs `ManualAttendanceStrategy` for attendance marking |
| **Factory Pattern** | `ReminderFactory` builds WhatsApp or phone reminder objects |

---

## Project Structure

```
TuitionLedger/
│
├── frontend/                        # React + Vite SPA
│   ├── src/
│   │   ├── components/              # Badge, Modal, Skeleton, EmptyState, ProtectedRoute
│   │   ├── context/                 # AuthContext, ToastContext
│   │   ├── layouts/                 # TutorLayout (sidebar), StudentLayout (bottom nav)
│   │   ├── pages/                   # One file per route
│   │   ├── services/                # Axios wrappers per domain
│   │   ├── styles/                  # variables.css, global.css, layout.css, components.css
│   │   └── utils/                   # deviceToken.js, formatDate.js
│   ├── public/                      # favicon.svg, icons.svg
│   ├── index.html
│   ├── vite.config.js
│   └── netlify.toml
│
├── backend/                         # Python Flask REST API
│   ├── api/
│   │   └── index.py                 # Vercel serverless entry point
│   ├── app/
│   │   ├── config/                  # database.py, settings.py
│   │   ├── controllers/             # Thin request/response handlers
│   │   ├── middleware/              # JWT auth_middleware.py
│   │   ├── repositories/            # Pure SQL via psycopg3
│   │   ├── routes/                  # URL → controller mapping
│   │   ├── services/                # All business logic lives here
│   │   └── utils/                   # password, token, qr, phone, validation, response
│   ├── database/
│   │   ├── schema.sql               # Complete DB schema
│   │   └── seed.py                  # Demo data seeder
│   ├── requirements.txt
│   ├── run.py                       # Local dev server
│   └── vercel.json
│
└── docs/
    ├── DEPLOYMENT.md                # Full deploy guide (Supabase → Vercel → Netlify)
    ├── TESTING.md                   # Manual testing checklist
    └── VIVA_NOTES.md                # Architecture Q&A reference
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- A free [Supabase](https://supabase.com) account

---

### 1 — Database (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste and run `backend/database/schema.sql`
3. Copy the connection string from **Project Settings → Database**

---

### 2 — Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:

```env
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
FLASK_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
python run.py
# API running at http://localhost:5000/api
```

Seed demo data (optional):

```bash
python -m database.seed
```

---

### 3 — Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

```bash
npm run dev
# App running at http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Tutor | `tutor@tuitionledger.com` | `Tutor@123` |
| Student | `kamal@student.com` | `Student@123` |

---

## Deployment

> Full guide → [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Deploy in this exact order: **Supabase → Vercel → Netlify**

### Vercel (backend)

| Variable | Value |
|---|---|
| `SUPABASE_DB_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Random secret, 32+ characters |
| `FRONTEND_URL` | Your Netlify URL e.g. `https://tuitionledger.netlify.app` |
| `FLASK_ENV` | `production` |

### Netlify (frontend)

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://your-backend.vercel.app/api` |

### Verify

```bash
curl https://your-backend.vercel.app/api/health
# {"success": true, "message": "TuitionLedger API is running"}
```

---

## API Reference

Base URL: `https://tuition-ledger-backend.vercel.app/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | — | Login, returns JWT |
| `GET` | `/auth/me` | ✓ | Current user info |
| `GET` | `/dashboard/summary` | Tutor | Dashboard stats |
| `GET` | `/students` | Tutor | List students |
| `POST` | `/students` | Tutor | Create student |
| `PUT` | `/students/:id` | Tutor | Update student |
| `DELETE` | `/students/:id` | Tutor | Delete student |
| `GET` | `/classes` | Tutor | List classes |
| `POST` | `/classes` | Tutor | Create class |
| `POST` | `/classes/:id/enroll` | Tutor | Enrol student |
| `GET` | `/devices` | Tutor | List devices |
| `PUT` | `/devices/:id/approve` | Tutor | Approve device |
| `PUT` | `/devices/:id/reject` | Tutor | Reject device |
| `POST` | `/attendance-sessions` | Tutor | Generate QR session |
| `POST` | `/attendance/mark` | Student | Mark attendance via QR |
| `PUT` | `/attendance/:id` | Tutor | Manual correction |
| `GET` | `/fees` | Tutor | List fee records |
| `GET` | `/fees/unpaid` | Tutor | Unpaid fees only |
| `POST` | `/fees` | Tutor | Create fee record |
| `PUT` | `/fees/:id` | Tutor | Update fee status |
| `POST` | `/reminders/whatsapp/prepare` | Tutor | Generate WhatsApp link |
| `GET` | `/settings` | Tutor | Get tutor settings |
| `PUT` | `/settings` | Tutor | Update settings |

---

## Database Schema

| Table | Purpose |
|---|---|
| `app_users` | All user accounts (tutors + students) |
| `students` | Student profiles, linked to a tutor |
| `classes` | Class definitions per tutor |
| `class_enrollments` | Student ↔ class many-to-many |
| `devices` | Approved browser UUIDs per student |
| `attendance_sessions` | QR tokens with expiry timestamps |
| `attendance_records` | Individual attendance entries per session |
| `fee_payments` | Monthly fee record per student per class |
| `reminders` | Reminder log with send status |
| `tutor_settings` | Per-tutor config (QR window, templates) |

Full schema → [`backend/database/schema.sql`](backend/database/schema.sql)

---

## Design System

| Token | Value |
|---|---|
| Primary | `#0D9488` — Teal 600 |
| Success | `#16A34A` — Green 600 |
| Danger | `#DC2626` — Red 600 |
| Background | `#F8FAFC` — Slate 50 |
| Card | White · `border-radius: 16px` · soft shadow |
| Typography | Inter |
| Desktop nav | 240px fixed sidebar |
| Mobile nav | 64px bottom navigation bar |
| Badge style | Pill shape with semantic colour fill |

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit using conventional commits: `git commit -m "feat: describe your change"`
4. Push and open a PR against `main`

---

<div align="center">

Made with ☕ for Sri Lankan tutors

**[Live App](https://tuitionledger.netlify.app)** · **[API](https://tuition-ledger-backend.vercel.app/api/health)** · **[Deployment Guide](docs/DEPLOYMENT.md)**

</div>
