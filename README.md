# TuitionLedger

A mobile-first tuition class management system for individual tutors and small tuition centres. Handles QR-based attendance, fee tracking, device verification, and WhatsApp parent reminders — purpose-built for the Sri Lankan tuition market.

[![Frontend — Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7?logo=netlify&logoColor=white)](https://netlify.com)
[![Backend — Vercel](https://img.shields.io/badge/Backend-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Database — Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Credentials](#demo-credentials)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Manual tuition management leads to proxy attendance, forgotten payments, and slow parent communication. TuitionLedger solves this with a lightweight web app that tutors can run on any device — no native app install required.

**Target users:** Individual tutors and small tuition class owners in Sri Lanka.

---

## Features

| Feature | Description |
|---|---|
| Role-based auth | Separate tutor and student portals with JWT authentication |
| Student management | Add, edit, and enrol students into classes |
| Class management | Create classes, manage schedules and enrolments |
| QR attendance | Tutors generate time-limited QR codes; students scan to mark attendance |
| Device verification | One approved device per student prevents proxy attendance |
| Manual correction | Tutors can override attendance records with a mandatory reason |
| Fee tracking | Per-student monthly fee records with paid / unpaid / partial / overdue statuses |
| WhatsApp reminders | Click-to-chat wa.me links — tutor sends manually and confirms in-app |
| Reports | Attendance and fee reports with print support |
| Tutor settings | Configurable QR expiry time and reminder message templates |
| Responsive UI | Sidebar layout on desktop, bottom navigation on mobile |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | React 19, Vite 8 |
| Routing | React Router DOM | v7 |
| HTTP client | Axios | v1 |
| QR generation | qrcode.react | v4 |
| Linting | oxlint | v1 |
| Backend | Python Flask | 3.0.3 |
| CORS | flask-cors | 4.0.1 |
| Auth | PyJWT + Werkzeug | JWT 2.9, Werkzeug 3.0 |
| Database driver | psycopg3 | ≥3.1.18 |
| Database | Supabase PostgreSQL | — |
| Frontend hosting | Netlify | — |
| Backend hosting | Vercel (serverless) | — |

---

## Architecture

```
Frontend                          Backend                        Database
─────────────────────             ──────────────────────────     ──────────────
Page Component
  └─ Service (api.js)  ──HTTPS──► Route
       └─ Axios                     └─ Controller               Supabase
                                         └─ Service      ──────► PostgreSQL
                                               └─ Repository
```

### Design Patterns

| Pattern | Where used |
|---|---|
| Repository Pattern | All database access is isolated in `repositories/` |
| Service Layer | Business rules (QR expiry, device checks, duplicate prevention) live in `services/` |
| Strategy Pattern | `QRAttendanceStrategy` and `ManualAttendanceStrategy` for attendance marking |
| Factory Pattern | `ReminderFactory` produces WhatsApp or phone reminder objects |

---

## Project Structure

```
TuitionLedger/
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # Auth and Toast context providers
│   │   ├── layouts/              # TutorLayout, StudentLayout
│   │   ├── pages/                # Route-level page components
│   │   ├── services/             # Axios API service modules
│   │   ├── styles/               # Global CSS, variables, layout
│   │   └── utils/                # Helper utilities
│   ├── public/
│   ├── index.html
│   └── vite.config.js
│
├── backend/                      # Python Flask API
│   ├── app/
│   │   ├── config/               # Database connection, app settings
│   │   ├── controllers/          # Request/response handlers
│   │   ├── middleware/           # JWT auth middleware
│   │   ├── repositories/         # Supabase/PostgreSQL queries
│   │   ├── routes/               # URL-to-controller mappings
│   │   ├── services/             # Business logic layer
│   │   └── utils/                # Password, token, QR, validation helpers
│   ├── api/
│   │   └── index.py              # Vercel serverless entry point
│   ├── database/
│   │   ├── schema.sql            # Full database schema
│   │   └── seed.py               # Demo data seeder
│   ├── requirements.txt
│   ├── run.py                    # Local development server
│   └── vercel.json
│
├── docs/
│   ├── DEPLOYMENT.md             # Step-by-step deployment guide
│   ├── TESTING.md                # Manual testing checklist
│   └── VIVA_NOTES.md             # Architecture and design notes
│
└── Vibe-Coding/                  # Project specification documents
    ├── 01_PRD_Product_Requirements.md
    ├── 02_TRD_Technical_Requirements.md
    ├── 06_Backend_Schema.md
    ├── 07_API_Contract.md
    └── ...
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A free [Supabase](https://supabase.com) account

### 1. Database setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `backend/database/schema.sql`
3. Copy your database connection string from **Project Settings → Database**

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key
FLASK_ENV=development
FRONTEND_URL=http://localhost:5173
```

Start the server:

```bash
python run.py
```

The API will be available at `http://localhost:5000/api`.

Optionally seed demo data:

```bash
python -m database.seed
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Demo Credentials

After running the seeder, use these credentials to explore the app:

| Role | Email | Password |
|---|---|---|
| Tutor | tutor@tuitionledger.com | Tutor@123 |
| Student | kamal@student.com | Student@123 |

---

## Deployment

Deploy in this order: **Supabase → Vercel → Netlify**

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full step-by-step guide.

### Environment variables summary

**Vercel (backend)**

| Variable | Value |
|---|---|
| `SUPABASE_DB_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Strong random secret (32+ characters) |
| `FRONTEND_URL` | Your Netlify deployment URL |
| `FLASK_ENV` | `production` |

**Netlify (frontend)**

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Vercel backend URL + `/api` |

### Verify the deployment

```bash
curl https://your-backend.vercel.app/api/health
# Expected: {"success": true, "message": "TuitionLedger API is running"}
```

---

## API Reference

Base URL: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate a user, returns JWT |
| `GET` | `/dashboard/summary` | Tutor dashboard stats |
| `GET` | `/students` | List all students |
| `POST` | `/students` | Create a student |
| `GET` | `/classes` | List all classes |
| `POST` | `/attendance-sessions` | Generate a QR attendance session |
| `POST` | `/attendance/mark` | Student marks attendance via QR |
| `GET` | `/fees/unpaid` | List unpaid fees |
| `POST` | `/reminders/whatsapp/prepare` | Prepare a WhatsApp reminder link |

Full contract with request/response schemas: [`Vibe-Coding/07_API_Contract.md`](Vibe-Coding/07_API_Contract.md)

---

## Database Schema

Core tables:

| Table | Purpose |
|---|---|
| `app_users` | Tutor and student user accounts |
| `students` | Student profiles linked to a tutor |
| `classes` | Class definitions |
| `class_enrollments` | Student–class relationships |
| `devices` | Registered student devices (UUID-based) |
| `attendance_sessions` | QR session tokens with expiry |
| `attendance_records` | Per-session attendance entries |
| `fee_payments` | Monthly fee records per student per class |
| `reminders` | Reminder log with status tracking |
| `tutor_settings` | Per-tutor configuration (QR expiry, templates) |

Full schema: [`backend/database/schema.sql`](backend/database/schema.sql)

---

## Design System

The UI follows a clean, mobile-first SaaS design direction:

| Token | Value |
|---|---|
| Primary colour | `#0D9488` (teal) |
| Success colour | `#16A34A` (green) |
| Background | `#F8FAFC` |
| Card style | White, `16px` border radius, soft shadow |
| Typography | Inter |
| Desktop nav | 240px fixed sidebar |
| Mobile nav | 64px bottom navigation bar |
| Badges | Pill shape |

---

## Contributing

This is an educational project. Pull requests are welcome for bug fixes and improvements.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push -u origin feature/your-feature`
5. Open a pull request against `main`

---

## License

Educational project — TuitionLedger MVP. All rights reserved.
