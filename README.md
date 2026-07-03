# TuitionLedger

A mobile-friendly tuition class management system for QR attendance, fee tracking, and parent reminders.

Built for individual tutors and small tuition class owners in Sri Lanka.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Plain CSS |
| Backend | Python Flask (Vercel-compatible) |
| Database | Supabase PostgreSQL |
| Frontend Hosting | Netlify |
| Backend Hosting | Vercel |
| Auth | JWT + hashed passwords |

## Features (MVP)

- Tutor & student login with role-based redirect
- Student and class management
- Device registration and tutor approval
- QR-code attendance with expiry and duplicate prevention
- Manual attendance correction with required reason
- Monthly fee tracking (paid/unpaid/partial/overdue)
- WhatsApp click-to-chat and phone reminders (manual send + confirm)
- Reports with print support
- Tutor settings (QR time, reminder templates)
- Responsive UI (sidebar desktop, bottom nav mobile)

## Project Structure

```
TuitionLedger/
  frontend/          React app
  backend/           Flask API
  Vibe-Coding/       Project specification documents
```

## Quick Start (Local)

### 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Open SQL Editor and run `backend/database/schema.sql`
3. Copy your database connection string

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your SUPABASE_DB_URL and JWT_SECRET
python run.py
```

Seed demo data:

```bash
cd backend
python -m database.seed
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
```

Open http://localhost:5173

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Tutor | tutor@tuitionledger.com | Tutor@123 |
| Student | kamal@student.com | Student@123 |

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment guide.

### Order

1. Supabase (database + schema + seed)
2. Vercel (backend)
3. Netlify (frontend)

## Google Stitch UI

The UI follows the Google Stitch design direction specified in the project docs:

- Light mode with teal (#0D9488) primary
- Green (#16A34A) success actions
- Soft shadow white cards (16px radius)
- 240px sidebar (desktop) / 64px bottom nav (mobile)
- Inter typography, pill badges, clean tables

Use this Stitch prompt for further design iterations:

```
Create a clean, modern, mobile-friendly SaaS dashboard for TuitionLedger.
Use #0D9488 teal, #16A34A green, #F8FAFC background, white 16px cards,
soft shadows, 12px buttons, Inter font, pill badges, light sidebar desktop,
bottom nav mobile.
```

## Architecture

```
Frontend: Page → Service → Axios → Flask API
Backend:  Route → Controller → Service → Repository → PostgreSQL
```

### Design Patterns

- **Repository Pattern** — database access
- **Service Layer** — business rules
- **Strategy Pattern** — QR vs manual attendance
- **Factory Pattern** — WhatsApp/phone reminder creation

## API

Base URL: `/api`

Key endpoints:
- `POST /api/auth/login`
- `GET /api/dashboard/summary`
- `POST /api/attendance-sessions`
- `POST /api/attendance/mark`
- `GET /api/fees/unpaid`
- `POST /api/reminders/whatsapp/prepare`

Full API contract: `Vibe-Coding/07_API_Contract.md`

## Testing Checklist

See `docs/TESTING.md`

## Viva Explanation

TuitionLedger uses a layered backend architecture. Routes connect URLs to controllers. Controllers handle requests and responses. Services contain business rules such as QR expiry checking, device approval checking, and duplicate attendance prevention. Repositories handle Supabase database queries. The frontend uses React with role-based routing, and WhatsApp reminders use click-to-chat links only — the tutor manually sends messages and confirms in the app.

## License

Educational project — TuitionLedger MVP
