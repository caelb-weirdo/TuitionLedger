# TuitionLedger Code Reduction and Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Reduce unnecessary files, duplicate logic, API traffic, and deployment projects while preserving all TuitionLedger features.

**Architecture:** Keep focused tutor page modules and Flask route modules. Remove global DOM-rewriting workarounds, consolidate tutor CSS, simplify authenticated request handling, aggregate summary endpoints, and move student QR workflows into the tutor Vite project as a query-driven student view. Keep Flask as a separate Vercel project and Supabase as the database/auth service.

**Tech Stack:** Vite 7, Vanilla JavaScript, Node test runner, Flask 3, psycopg 3, pytest, Supabase PostgreSQL/Auth, Vercel.

## Global Constraints

- Work only on `cleanup/code-reduction-audit`; do not modify `main`.
- Preserve tutor landing, authentication, dashboard, students, classes, QR attendance, attendance correction, fees, WhatsApp reminders, registration, browser approval, and student attendance scanning.
- Keep backend and page modules separated by responsibility.
- Use test-first changes for behavior fixes and API changes.
- Do not expose database credentials or Supabase secret keys to the frontend.
- Final deployment target is one frontend Vercel project, one backend Vercel project, and one Supabase project.

---

### Task 1: Establish a Reliable Baseline

**Files:**
- Modify: `backend/tests/test_api.py`
- Modify: `backend/tests/test_final_contracts.py` only if fixtures are duplicated

**Interfaces:**
- Consumes: Flask app test injection hooks `app.urlopen` and `app.database`.
- Produces: Tests that reach mocked Supabase Auth without real environment variables.

- [x] Add `SUPABASE_URL=https://example.supabase.co` and `SUPABASE_PUBLISHABLE_KEY=test-key` to the shared pytest fixture.
- [x] Run `pytest backend/tests -q` and record remaining failures.
- [x] Commit the baseline test-harness repair.

### Task 2: Fix Confirmed Attendance and Validation Defects

**Files:**
- Modify: `backend/validators.py`
- Modify: `supabase/schema.sql`
- Create: `supabase/migrations/20260718080000_allow_fifteen_minute_sessions.sql`
- Modify: `backend/tests/test_validators.py`
- Modify: `backend/tests/test_final_contracts.py`

**Interfaces:**
- Consumes: `session_duration(value)`.
- Produces: Accepted durations exactly `5`, `10`, and `15` in validation and PostgreSQL.

- [x] Write tests proving `15` is accepted and `0`, `6`, `16`, and non-numeric input are rejected with the final message.
- [x] Update the validator message to mention 5, 10, and 15.
- [x] Add the database migration and align `schema.sql`.
- [x] Run backend tests and commit.

### Task 3: Remove Global Frontend Workarounds and Fix Navigation

**Files:**
- Modify: `tutor-frontend/index.html`
- Modify: `tutor-frontend/src/main.js`
- Modify: `tutor-frontend/src/pages/layout.js`
- Modify: `tutor-frontend/src/pages/landing.js`
- Modify: `tutor-frontend/tests/ui.test.js`
- Delete: `tutor-frontend/src/request-loading.js`
- Delete: `tutor-frontend/src/shadcn-skeletons.js`
- Delete: `tutor-frontend/src/sidebar-icons.js`
- Delete: `tutor-frontend/src/text-sanitizer.js`
- Delete: `tutor-frontend/src/runtime-error-boundary.js`

**Interfaces:**
- Consumes: Hash routes and layout navigation rendering.
- Produces: Directly rendered icons and badge, working landing anchors, normal browser error logging, no global DOM observers.

- [x] Add failing source/behavior tests for landing sections, pending badge preservation, and absence of workaround scripts.
- [x] Render navigation icons inside `layout.js` without replacing child nodes.
- [x] Route `features`, `flow`, `preview`, and `faq` to landing and scroll after render.
- [x] Add minimal `error` and `unhandledrejection` console handlers in `main.js`.
- [x] Remove script tags and delete the five workaround files.
- [x] Run tutor tests/build and commit.

### Task 4: Consolidate Tutor Styling Without Visual Loss

**Files:**
- Create: `tutor-frontend/src/app.css`
- Modify: `tutor-frontend/src/main.js`
- Modify: `tutor-frontend/index.html`
- Delete: `tutor-frontend/src/style.css`
- Delete: `tutor-frontend/src/logo.css`
- Delete: `tutor-frontend/src/password.css`
- Delete: `tutor-frontend/src/theme-overrides.css`
- Delete: `tutor-frontend/src/styles/*.css`

**Interfaces:**
- Consumes: Existing CSS cascade in its current effective order.
- Produces: One tutor stylesheet with the same selector order and responsive behavior.

- [x] Generate `app.css` by preserving the effective cascade order and stripping only `@import` statements.
- [x] Import only `app.css` from `main.js` and remove stylesheet links from HTML.
- [x] Run formatting checks, tests, and production build.
- [x] Compare CSS build output and commit.

### Task 5: Simplify Authentication Middleware and Tutor Profile Creation

**Files:**
- Modify: `backend/core.py`
- Modify: `backend/routes/auth.py`
- Modify: `backend/tests/test_api.py`
- Modify: `backend/tests/test_final_contracts.py`

**Interfaces:**
- Consumes: Supabase access token and `/auth/v1/user` response.
- Produces: `g.user`, `g.token`, and a tutor profile created lazily by `/api/tutor`, without an upsert on every protected API request.

- [x] Add a failing test proving a protected non-profile endpoint does not write to `tutors`.
- [x] Remove the tutor upsert and commit from `auth_required`.
- [x] Change `GET /api/tutor` to insert a missing tutor profile once and return it.
- [x] Add configuration-error handling for missing Supabase URL/key.
- [x] Run all backend tests and commit.

### Task 6: Reduce Dashboard, Class, Registration, and Fee Requests

**Files:**
- Modify: `backend/routes/classes.py`
- Modify: `backend/routes/students.py`
- Modify: `backend/routes/fees.py`
- Create: `backend/routes/dashboard.py`
- Modify: `backend/app.py`
- Modify: `tutor-frontend/src/pages/dashboard.js`
- Modify: `tutor-frontend/src/pages/classes.js`
- Modify: `tutor-frontend/src/pages/qr-session.js`
- Modify: `tutor-frontend/src/pages/registration-request.js`
- Modify: `tutor-frontend/src/pages/fees.js`
- Modify: backend and frontend tests

**Interfaces:**
- Produces: `GET /api/dashboard`, class rows containing `student_count`, `GET /api/classes/:id`, `GET /api/registration-requests/:id`, and an idempotent ledger GET that ensures rows.

- [x] Add contract tests for each new endpoint and response shape.
- [x] Add and register the dashboard blueprint.
- [x] Return student counts from class listing and fetch rosters only when Manage opens.
- [x] Add single-class and single-registration-request endpoints.
- [x] Ensure missing fee rows inside ledger loading and remove the separate frontend ensure call.
- [x] Remove duplicate unused fee routes after source-search verification.
- [x] Run tests/builds and commit.

### Task 7: Complete Browser Reconnection and QR Expiry UI

**Files:**
- Modify: `tutor-frontend/src/pages/student-detail.js`
- Modify: `tutor-frontend/src/pages/qr-session.js`
- Modify: `tutor-frontend/tests/ui.test.js`

**Interfaces:**
- Consumes: Current tutor ID/profile and student reset endpoint.
- Produces: A copyable browser-connection URL/QR after reset and an explicit Expired QR session state.

- [x] Add failing tests for reset connection URL and expired state copy.
- [x] Render a connection link and QR after browser reset.
- [x] Change active QR UI to Expired at zero, remove End action, and offer a new session.
- [x] Run tutor tests/build and commit.

### Task 8: Improve Sri Lankan Input Support and Public Polling

**Files:**
- Modify: `backend/validators.py`
- Modify: `backend/tests/test_validators.py`
- Modify: student frontend module after Task 9 integration

**Interfaces:**
- Produces: Unicode-friendly person names and approval polling backoff of 5s, 15s, then 30s with manual refresh.

- [x] Add Tamil and Sinhala name tests plus numeric-name rejection tests.
- [x] Replace ASCII-only person-name validation with Unicode letter checks.
- [x] Add polling-delay tests or pure helper tests.
- [x] Implement backoff and `Check Approval Now`.
- [x] Run tests/builds and commit.

### Task 9: Merge Student QR Workflows Into the Tutor Vite Project

**Files:**
- Create: `tutor-frontend/src/student/main.js`
- Create: `tutor-frontend/src/student/student.css`
- Modify: `tutor-frontend/src/main.js`
- Modify: `tutor-frontend/src/core/config.js`
- Modify: QR/link generation in tutor pages and backend
- Delete: `student-mobile/`
- Modify: `.vercelignore`, README, environment examples, tests

**Interfaces:**
- Consumes query parameters `registration_token`, `attendance_token`, `connect`, and `tutor` at the frontend origin.
- Produces one frontend build serving tutor PWA pages and non-installable student QR views.

- [x] Add routing tests proving student query parameters bypass tutor authentication and landing routing.
- [x] Move student API and view logic under the tutor frontend, sharing `apiUrl` but not tutor session headers.
- [x] Remove broad service-worker unregistration.
- [x] Namespace student styles and set/clear a `student-view` body class.
- [x] Update registration, attendance, and browser connection URLs to use the current frontend origin.
- [x] Delete `student-mobile`, run the combined frontend build, and commit.

### Task 10: Documentation, Full Verification, and Delivery

**Files:**
- Modify: `README.md`
- Modify: `.env.example` files
- Modify: API and deployment docs where they describe three projects or removed endpoints
- Create: `docs/CODE_REDUCTION_CHANGELOG.md`

**Interfaces:**
- Produces a two-deployment setup guide and a complete change/verification record.

- [x] Update architecture, local setup, deployment, environment variables, and API documentation.
- [x] Run tutor tests, tutor build, backend tests, Python compile, and `git diff --check`.
- [x] Inspect `git diff --stat` and confirm no required workflow was deleted.
- [x] Package the cleanup branch without `.git`, `.venv`, `node_modules`, or build output.
- [x] Provide exact commands for the user to push the branch and open a PR.
