# UX and Attendance Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce Colombo-time class schedules for attendance while simplifying the five existing tutor workspaces and preserving every current workflow.

**Architecture:** A pure backend scheduling module owns timetable calculation and override validation. The attendance route remains authoritative, persists schedule/audit fields, and returns structured errors; small frontend helpers render advisory availability while the API remains the final authority. Existing Vanilla JS pages receive progressive-disclosure, responsive, and accessibility improvements without new routes or frameworks.

**Tech Stack:** Flask, psycopg/PostgreSQL, Supabase migrations/RLS, Vanilla JavaScript, CSS, Vite, Node test runner, pytest.

## Global Constraints

- Use `Asia/Colombo` for schedule decisions and server-generated UTC timestamps for storage.
- Preserve Dashboard, Students, Classes, Attendance and Fees, the response envelope, authentication, ownership, QR scanning, browser approval, fee reminders, PWA support and RLS.
- Normal sessions open 30 minutes before class start and close inclusively at class end; duration is 5, 10 or 15 minutes and normal expiry is capped at class end.
- Extra sessions require an explicit audited reason; `Other` accepts 3 to 300 trimmed characters.
- Keep Vanilla JavaScript/CSS and accessible 44 px controls, keyboard focus, status announcements and reduced-motion support.

---

### Task 1: Scheduling domain and migration

**Files:** Create `backend/scheduling.py`, `backend/tests/test_scheduling.py`, and `supabase/migrations/20260719090000_attendance_session_scheduling.sql`; modify `supabase/schema.sql`.

**Interfaces:** `schedule_window(class_row, now=None)` returns Colombo schedule boundaries and availability; `validate_override(is_extra, reason, choice)` returns normalized audit text or raises `ValueError`.

- [ ] Write deterministic boundary, timezone, duration-cap and override-validation tests.
- [ ] Run `python -m pytest backend/tests/test_scheduling.py -q` and confirm missing-module failure.
- [ ] Implement the pure helpers and rerun until green.
- [ ] Add non-destructive columns, audit constraint, active lookup index, and database-safe active-session uniqueness.

### Task 2: Authoritative attendance API

**Files:** Modify `backend/routes/attendance.py`, `backend/core.py`, and `backend/tests/test_api.py`.

**Interfaces:** `POST /api/attendance-sessions` accepts class/duration and optional explicit override fields; schedule failures include `code` and safe schedule data in the existing envelope.

- [ ] Add failing API tests for ownership, arbitrary dates, unsupported duration, schedule boundary, extra-session reasons, active duplicates and expiry capping.
- [ ] Extend `response` with optional top-level fields and implement the validation sequence before insertion.
- [ ] Lock the owned class row and rely on the partial unique index to prevent concurrent active sessions.
- [ ] Return scan success metadata and attendance history audit fields without exposing override reasons publicly.

### Task 3: Attendance session and class UX

**Files:** Create `tutor-frontend/src/core/schedule.js`; modify `tutor-frontend/src/core/api.js`, `tutor-frontend/src/pages/qr-session.js`, `classes.js`, `dashboard.js`, and `tests/ui.test.js`.

**Interfaces:** `classAvailability(classItem, now)` provides advisory display state; API errors preserve `code` and `data` for the controlled override dialog.

- [ ] Add failing frontend tests for availability, structured schedule errors, explicit labels, server expiry countdown, full screen and end-state actions.
- [ ] Remove the editable attendance date and show the server-aligned date read-only.
- [ ] Add normal/extra launch states, reason validation, active-session recovery, session type, fullscreen QR, counters and `View Attendance` ending.
- [ ] Add availability badges and `Start Attendance`/`Open Active Session` labels to Classes and Dashboard.

### Task 4: Workspace UX and responsive design

**Files:** Modify `students.js`, `attendance.js`, `fees.js`, `student/main.js`, `app.css`, `student/student.css`, and `tests/ui.test.js`.

- [ ] Add failing source/behavior tests for Students tabs, mobile Fees cards, explicit correction labels, saved filters, phone normalization and completed student state.
- [ ] Implement Students/Approvals/Registration QR tabs with pending badge and modal Add Student.
- [ ] Make attendance searchable, auditable, explicit, and locally highlighted after correction.
- [ ] Make Fees a responsive card ledger, label mobile actions, show sort direction, and remember session filters.
- [ ] Consolidate Frosted Touch tokens/variants and preserve focus, touch, safe-area and reduced-motion behavior.

### Task 5: Documentation and verification

**Files:** Modify `README.md`, `docs/FINAL_API_SPECIFICATION.md`, and `docs/DATABASE_MIGRATION_VERIFICATION.md`.

- [ ] Document migration application, schedule boundaries, overrides, API errors and verification checklist.
- [ ] Run backend tests, frontend tests, production build, format check, Python compilation and `git diff --check`.
- [ ] Inspect the final diff against every definition-of-done item, record any explicit gap, commit as `Final`, push `main`, and verify `HEAD` equals `origin/main`.
