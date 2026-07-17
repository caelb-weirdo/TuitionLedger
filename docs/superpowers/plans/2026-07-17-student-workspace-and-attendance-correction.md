# Student Workspace and Attendance Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate registration approvals from approved-student management, preserve generated QR content during directory refreshes, add a registration-request detail route, and make attendance corrections finish reliably with visible dialog errors.

**Architecture:** Refactor the Students page into independently rendered registration, approval, and approved-directory regions while retaining the current APIs. Add a frontend-only registration-request page that resolves a request from the existing list endpoint. Repair the attendance dialog by preserving form references across asynchronous work and separating dialog errors from page-level success messages.

**Tech Stack:** Vanilla JavaScript, CSS, Vite, Node test runner, Playwright, Flask API contracts.

## Global Constraints

- Keep all existing endpoint URLs and response envelopes unchanged.
- Preserve Student ID generation, one-approved-browser enforcement, registration/browser approval, attendance correction reason, and historical-record contracts.
- Refresh approved students without replacing the shell, QR workspace, or approval workspace.
- Keep browser approvals as compact inline rows; only new student registrations receive a detail route.
- Keep tutor pages responsive at 360px and wider and retain keyboard/focus support.
- Update README only after both behaviours pass tests and browser verification.

---

### Task 1: Split the Students page into independent regions

**Files:**
- Modify: `tutor-frontend/src/pages/students.js`
- Modify: `tutor-frontend/src/style.css`
- Test: `tutor-frontend/tests/ui.test.js`

**Interfaces:**
- Consumes: `GET /api/students/overview`, `GET /api/students`, `GET /api/registration-requests`, `GET /api/browser-requests`, and the existing approval/rejection endpoints.
- Produces: `#registration-qr-output`, `#approval-content`, and `#approved-student-content` regions whose render operations do not replace one another.

- [ ] **Step 1: Add a failing source-contract test**

Add assertions that `students.js` contains the three region IDs, that the approved refresh handler calls a dedicated `refreshApprovedStudents` function, and that the handler does not call `studentsPage()`.

- [ ] **Step 2: Run the frontend tests and confirm the new test fails**

Run: `npm --prefix tutor-frontend test`

Expected: The new student-workspace test fails because the regions and dedicated refresh function do not exist.

- [ ] **Step 3: Add the independent page regions**

Render the Students page in this order: registration QR workspace, pending approvals, approved-student directory. Move Generate QR into the registration region, move Refresh and Search into the approved section, and keep Add student with approved-student management.

- [ ] **Step 4: Implement scoped render and refresh functions**

Create local `renderApprovals(registrationRequests, browserRequests)`, `renderApprovedStudents(students)`, `refreshApprovals()`, and `refreshApprovedStudents()` functions. The approved refresh must fetch `/api/students` with `force: true` and replace only `#approved-student-content`. Browser approval/rejection must refresh approvals and approved students without touching `#registration-qr-output`.

- [ ] **Step 5: Keep QR and search state scoped correctly**

Generate the QR only into `#registration-qr-output`. Search only `.student-directory-row` elements inside `#approved-student-content`. On QR failure, render the error in the QR output instead of replacing another region.

- [ ] **Step 6: Add responsive region styling**

Add narrowly scoped spacing, headings, and compact approval-row rules. Reuse existing Frosted Touch surfaces and directory breakpoints; do not create a new colour system.

- [ ] **Step 7: Run the frontend tests**

Run: `npm --prefix tutor-frontend test`

Expected: The student-workspace contract and all existing tests pass.

### Task 2: Add the registration-request detail route

**Files:**
- Create: `tutor-frontend/src/pages/registration-request.js`
- Modify: `tutor-frontend/src/main.js`
- Modify: `tutor-frontend/src/pages/students.js`
- Modify: `tutor-frontend/src/style.css`
- Test: `tutor-frontend/tests/ui.test.js`

**Interfaces:**
- Consumes: `GET /api/registration-requests`, `POST /api/registration-requests/<id>/approve`, and `POST /api/registration-requests/<id>/reject`.
- Produces: `registrationRequestPage()` routed from `#registration-request?request=<id>`.

- [ ] **Step 1: Add a failing route and detail-page contract test**

Assert that `main.js` maps `registration-request` to `registrationRequestPage`, pending registration rows link to the route, and the detail module renders student phone, guardian name, guardian WhatsApp, grade, status, and submitted time with approval/rejection actions.

- [ ] **Step 2: Run the frontend tests and confirm failure**

Run: `npm --prefix tutor-frontend test`

Expected: The route/detail test fails because the module and route do not exist.

- [ ] **Step 3: Implement `registrationRequestPage()`**

Read the request ID from the hash, load `/api/registration-requests` with `force: true`, select the matching record, and render a loading state, full request details, or a not-found/error state. Include a Back to students link and focusable page heading.

- [ ] **Step 4: Implement approval and rejection actions**

Approve directly through the existing endpoint. Require the existing accessible confirmation dialog before rejection. Disable the selected action during its request, show failures on the detail page, and navigate to `#students` after success.

- [ ] **Step 5: Run the frontend tests**

Run: `npm --prefix tutor-frontend test`

Expected: Route/detail and existing tests pass.

### Task 3: Repair asynchronous attendance correction

**Files:**
- Modify: `tutor-frontend/src/pages/attendance.js`
- Test: `tutor-frontend/tests/ui.test.js`

**Interfaces:**
- Consumes: Existing `POST /api/attendance/manual` payload `{ session_id, class_id, student_id, status, reason }`.
- Produces: A correction dialog with `#correction-notice` for validation/API failures and page-level success feedback after record reload.

- [ ] **Step 1: Add failing correction reliability tests**

Assert that the dialog contains `#correction-notice`, the submit handler captures `const form = event.currentTarget` before awaiting, no post-await code calls `event.currentTarget.reset()`, and catch-path messages target the dialog notice.

- [ ] **Step 2: Run the frontend tests and confirm failure**

Run: `npm --prefix tutor-frontend test`

Expected: The correction reliability test fails against the current asynchronous handler.

- [ ] **Step 3: Implement safe form lifecycle handling**

Capture `form`, `submit`, and the current correction before `await api(...)`. Use the captured form for values and reset. On success, reset the form, hide Other reason, close the dialog, reload records, and then show the page success notice.

- [ ] **Step 4: Put failures inside the dialog**

Add `#correction-notice` with live-region semantics. Clear it when opening a correction, use it for required-reason validation and API failures, and keep the dialog open with entered values preserved after failure.

- [ ] **Step 5: Run the frontend tests**

Run: `npm --prefix tutor-frontend test`

Expected: Attendance correction and all existing tests pass.

### Task 4: Verify behaviour and update documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: Verified Students-page and attendance-correction behaviour from Tasks 1-3.
- Produces: Beginner-readable workflow and verification documentation matching the application.

- [ ] **Step 1: Run formatting, tests, and production builds**

Run from `tutor-frontend`: `npm exec -- prettier --write src/pages/students.js src/pages/registration-request.js src/pages/attendance.js src/main.js src/style.css tests/ui.test.js`

Run: `npm --prefix tutor-frontend test`

Run: `npm --prefix tutor-frontend run build`

Run: `python -m pytest backend/tests -q`

Expected: Formatting succeeds, frontend tests pass, the Vite build succeeds, and all backend tests pass.

- [ ] **Step 2: Browser-test the Students workflow**

At 1440x900, 390x844, and 360x800: generate a registration QR, refresh approved students, and confirm the QR remains. Verify pending registration detail navigation, browser approval placement, approved-directory search, and no horizontal overflow.

- [ ] **Step 3: Browser-test attendance corrections**

Verify Absent to Present and Present to Absent with a suggested reason, Other reason validation, a successful response that closes and reloads, and an API failure that remains visible inside the open dialog.

- [ ] **Step 4: Update README**

Document the three-region Students workflow, section-specific refresh semantics, registration-request review page, inline browser approvals, reliable attendance correction behaviour, and the relevant local verification commands.

- [ ] **Step 5: Commit and deploy**

Stage only the implementation, tests, plan, and README. Commit with `feat: separate student approvals and fix corrections`, push `main`, deploy only Vercel project `prj_uP6S9VvYuvuix0qx0RLs7VyZoNUK`, wait for Ready, and repeat the critical live browser checks.
