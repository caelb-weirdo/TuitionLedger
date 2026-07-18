# HND UI/UX Implementation Record

## Implemented

- Shared readable date, month, and Sri Lankan currency formatting.
- Reusable skeleton, empty, success, error, confirmation, and summary patterns.
- Visible keyboard focus, reduced-motion support, and responsive five-item mobile navigation.
- Tutor workspace terminology, pending-registration navigation badge, and accessible authentication validation.
- Attendance date/status filters, displayed-record summaries, semantic Present/Absent states, and a required-reason correction dialog.
- Fee month/class/status/student filters, monthly totals, consistent currency, paid/unpaid confirmations, and honest WhatsApp wording.
- Confirmation dialogs for student/class archive, browser replacement, registration/browser rejection, class removal, and early session ending.
- Five, ten, and fifteen-minute attendance sessions.
- Expanded landing-page benefits, previews, seven-step workflow, FAQ, footer, and no-student-account explanation.

## Preserved contracts

- Existing Flask endpoint URLs and response envelopes.
- One approved browser per active student.
- Archive-based student/class history retention.
- Server-validated attendance expiry, enrolment, and duplicate-scan rules.
- One fee record per student, class, and month.
- Tutor installable PWA and non-installable responsive student query pages in one frontend deployment.

## Verification

- Backend: `python -m pytest backend/tests -q`
- Tutor UI unit tests: `npm --prefix tutor-frontend test`
- Tutor build: `npm --prefix tutor-frontend run build`
- Combined Tutor + Student build: `npm --prefix tutor-frontend run build`
- Browser smoke checks: 360px and 390px landing/auth/attendance/fees routes with mocked authenticated API responses.

Production deployment, remote database changes, and live two-browser acceptance testing are intentionally excluded until separately authorized.
