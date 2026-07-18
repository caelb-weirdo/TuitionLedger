# Final API Specification

All JSON responses use `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`. Tutor-protected endpoints require `Authorization: Bearer <access-token>`. Public endpoints expose only request state needed by the matching browser.

| Method | Endpoint | Access | Purpose and important validation |
| --- | --- | --- | --- |
| GET | `/health` | Public | Service health JSON. |
| POST | `/api/auth/signup` | Public | Tutor email/password signup; password minimum 8. |
| POST | `/api/auth/login` | Public | Tutor login and access/refresh session. |
| POST | `/api/auth/refresh` | Public | Exchange a refresh token for a renewed session. |
| GET/PUT | `/api/tutor` | Tutor | Read/update the authenticated tutor profile. |
| GET/POST | `/api/students` | Tutor | List Active students or create a validated student with server Student ID. |
| GET | `/api/dashboard` | Tutor | Aggregated student, class, registration and fee totals plus today’s classes and recent activity. |
| GET | `/api/students/overview` | Tutor | One Students-page payload containing approved students, registration requests and browser requests. |
| PUT/DELETE | `/api/students/:id` | Tutor | Edit owned student or archive it without deleting history. |
| POST | `/api/students/:id/reset-browser` | Tutor | Revoke the approved browser and reject pending replacements. |
| POST | `/api/registration-qr` | Tutor | Create a secure 24-hour registration token and clean tokens expired for more than seven days. |
| POST | `/api/register-student` | Public | Valid token, names, Grade, normalized phones, and browser UUID; creates one Pending request. |
| GET | `/api/registration-requests/:id/status` | Matching browser | Minimal Pending/Approved/Rejected state and Student ID after approval. |
| GET | `/api/registration-requests` | Tutor | List owned requests. |
| GET | `/api/registration-requests/:id` | Tutor | Load one owned request for the review screen. |
| POST | `/api/registration-requests/:id/approve|reject` | Tutor | Transactional one-time review; approval creates one Active student and approved browser. |
| POST | `/api/browser-requests` | Public | Student ID, browser UUID, and tutor context; creates one Pending connection request. |
| GET | `/api/browser-requests/:id/status` | Matching browser | Minimal request state and Student ID. |
| GET | `/api/browser-requests` | Tutor | List owned browser requests. |
| POST | `/api/browser-requests/:id/approve|reject` | Tutor | Transactional browser review and student browser-state update. |
| GET/POST | `/api/classes` | Tutor | List Active classes with `student_count`, or create a validated weekly class. |
| GET | `/api/classes/:id` | Tutor | Load one owned Active class for the attendance-session screen. |
| PUT/DELETE | `/api/classes/:id` | Tutor | Edit or archive an owned class. |
| GET/POST | `/api/classes/:id/students` | Tutor | List or enroll owned Active students. |
| POST | `/api/classes/:id/students/bulk` | Tutor | Replace the Active roster with a validated list of owned Active students. |
| DELETE | `/api/classes/:id/students/:student_id` | Tutor | Mark enrollment Removed. |
| POST | `/api/attendance-sessions` | Tutor | Owned class, date, exactly 5/10/15 minutes; ends old session and creates default Absent rows atomically. |
| POST | `/api/attendance-sessions/:id/end` | Tutor | End an owned Active session immediately. |
| POST | `/api/attendance/scan` | Public | Valid token plus approved browser; updates existing Absent row to Present and returns stable result code. |
| GET | `/api/attendance/classes/:class_id` | Tutor | Owned class history, optionally filtered by `?date=YYYY-MM-DD`. |
| POST | `/api/attendance/manual` | Tutor | Owned session/class/student, Present/Absent, and required 3–300 character reason. |
| GET | `/api/fees/ledger?month=YYYY-MM` | Tutor | Ensure missing monthly rows and return one combined ledger row per student. |
| PUT | `/api/students/:id/fees/:month` | Tutor | Update all owned fee rows for one student and month to Paid or Unpaid. |
| GET | `/api/students/:id/fees/:month/whatsapp` | Tutor | Generate a DB-derived, URL-encoded WhatsApp reminder for unpaid class fees. |

Expected status families are `200/201`, `401`, `403`, `404`, `409`, `410`, `422`, `500`, and `503`. Known database conflicts are translated to readable messages rather than returning SQL details.
