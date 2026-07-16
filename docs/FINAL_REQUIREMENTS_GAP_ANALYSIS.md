# TuitionLedger Final Requirements Gap Analysis

Date: 2026-07-16  
Baseline: `ef665d4` on `main` (clean and equal to `origin/main`)  
Implementation branch: `refactor/final-requirements`

## Evidence reviewed

- All eight final requirements documents supplied on 2026-07-16
- Repository source, tests, environment-variable names, migrations, and README
- Baseline checks: 8 backend tests passed; both Vite production builds passed
- Read-only inspection of the live PostgreSQL 17.6 schema, constraints, indexes, RLS policies, functions, foreign keys, and row counts

The live database differs materially from `supabase/schema.sql`. The repository defines 10 application tables, while production has 19 public tables. Production contains an older `device_*`, `student_devices`, `student_registration_*`, scan-request, audit, notes, and fee-batch subsystem. These unexpected tables and their data must be preserved. The approved implementation will migrate the current 10-table application path to the required 11-table design without dropping the older subsystem.

## Requirements already implemented and preserved

- Supabase tutor signup/login and bearer-token verification exist.
- Tutor-owned SQL filters exist on most protected reads and writes.
- Tutor Students, Classes, Attendance, Fees, and Dashboard are separate pages.
- Attendance QR controls are in Classes; Attendance is history/correction only.
- Dashboard alone uses the explicit `dashboard-bento` layout.
- Frosted Touch visual styles and responsive builds exist.
- Secure random registration and attendance tokens exist.
- QR duration is restricted to 5 or 10 minutes in backend and UI.
- Enrollment, attendance, and monthly fee uniqueness constraints exist.
- Paid/Unpaid updates and manual WhatsApp click-to-chat exist.
- Student website has no manifest or service-worker registration in the repository.
- Both frontends build and the current eight backend tests pass.

## Detailed gaps

| Area / source | Current file or component and behavior | Required behavior | Recommended change | Risk | Dependencies | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| Live schema alignment — Database Changes §§3–27 | Live database has 19 tables; `supabase/schema.sql` has destructive `DROP TABLE`; repo migrations do not represent live state. | Incremental, data-preserving 11-table target with verified RLS and history protection. | Export important rows and schema evidence; add one idempotent incremental migration; never run `schema.sql`; preserve unexpected tables. | Critical | Live backup, compatibility queries | Re-query columns, constraints, indexes, policies, and preserved row counts after migration. |
| Browser requests — Database §5; Backend §13; Student Mobile §11 | No approved `browser_requests` table or Flask endpoints. Production has incompatible lowercase/hash-based `device_requests`. | Public Student-ID request plus tutor list/approve/reject using the approved browser ID contract. | Add `browser_requests`; transactional endpoints; pending/approved/rejected constraints and uniqueness. | High | Student Active status and validators | API tests for request, safe unknown ID, duplicates, approval, rejection, reset, and ownership. |
| Student lifecycle — Database §§6,16; Backend §11 | `students` lacks `status` and `updated_at`; manual creation uses `Pending`; reset uses `Reset Needed`; DELETE physically deletes and cascades history. | `Active`/`Archived`; browser `Not Connected`/`Pending`/`Approved`; archive and immediate reset. | Migrate statuses, add columns/indexes, make DELETE archive, filter active lists, keep history. | Critical | Migration before backend | Migration compatibility checks and CRUD/history tests. |
| Registration contract — Database §§8–9; Backend §12; Student Mobile §§5–10 | `requested_classes` is stored and rendered; no pending partial unique index; approval is not concurrency-safe; waiting state is not restored after refresh. | No student class choice; one pending request; transactional one-time review; permanent success/failure and secure status restore. | Remove UI/payload use; migrate column away; add indexes/review timestamp; lock approval; persist request reference and browser match locally. | High | Validators and migration | Duplicate-click, refresh, approval/rejection, expired token, privacy, and rollback tests. |
| Shared validation — Backend §§5–7 | Routes mostly check only non-empty values. Phone numbers are not normalized; UUID/date/time/name/amount/reason limits are missing. | Reusable strict Flask validators and normalized `+94XXXXXXXXX` storage. | Add `validators.py` with controlled `ValidationError`; use it in every route. | High | None after migration | Unit tests for valid/invalid boundary values and safe 422 JSON. |
| Backend structure — Backend §4 | `backend/app.py` is 713 lines with nearly every route. | App factory/bootstrap plus `core.py`, validators, and feature Blueprints. | Move routes by feature without changing endpoint URLs or envelope. | Medium | Baseline contract tests | Compile, route-map parity, and all API tests. |
| Class validation/history — Classes §§4–14; Backend §§14–15 | No end-after-start database constraint, duplicate check, update timestamp, class status, or archive behavior. Delete is physical. Forms are permanently inline. | Strict schedule/fee validation, duplicate rejection, ownership, Active/Archived history safety, modal/side-panel form. | Add constraints/status/timestamps; archive class; strengthen ownership joins; update UI. | High | Migration and validators | Duplicate, overlap warning, ownership, archive, enrollment/reactivation tests. |
| Enrollment ownership — Backend §15 | Enroll/remove queries do not consistently prove both class and student belong to the authenticated tutor. | Same-tutor Active class and student; Removed status preserves history and blocks attendance. | Use ownership joins/transactions and reactivate prior Removed row safely. | High | Student/class status | Cross-tutor and removed-enrollment tests. |
| Default Absent — Attendance Flow §1; Database §12; Backend §16 | Session creation inserts only the session; non-scanners have no record. | Create one Absent record for every Active enrollment in the same transaction. | End old active session, insert session and Absent rows atomically. | Critical | Migration and enrollment status | Session test checks roster-sized Absent set and rollback. |
| Automatic scan — Backend §17; Student Mobile §§12–13 | Scan inserts Present; duplicate is a 409; student must press “Mark me present”; Ended and Expired share one message. | Automatic load-time scan updates Absent to Present; friendly Already Marked; distinct result states. | Lock/update existing record; return result code; auto-submit once with retry-safe UI. | Critical | Default Absent | Valid, duplicate, expired, ended, wrong-browser, non-enrolled, concurrent tests. |
| Manual attendance reason — Database §13; Backend §18 | No `manual_reason`/`updated_at`; UI toggles without requesting a reason; ownership/enrollment check is incomplete. | Required trimmed reason for every manual Present/Absent correction. | Add columns; validate reason; update only an owned enrolled record; add reason dialog/input. | High | Attendance migration | Missing/valid reason and cross-tutor tests. |
| Fees — Final Fee Flow; Backend §§19–20 | Generation accepts an unvalidated month; may generate for archived entities; WhatsApp URL currently includes `+`; status UI lacks rollback state. | First-day month, Active enrollment only, transaction, digits-only `wa.me`, encoded DB-derived message, safe toggle. | Validate month, use owned Active joins, normalize phone, return generated records, optimistic rollback UI. | High | Status migration and validators | Invalid/duplicate month, paid/unpaid, digits-only URL, ownership tests. |
| Tutor auth/session — Remaining Work §4 | Login stores tokens only in `sessionStorage`; refresh token is never used; expired 401 does not consistently sign out; no explicit logout endpoint is needed but UI logout only clears local state. | Session persistence, refresh handling, protected routes, logout, expired-session behavior. | Persist the minimum Supabase session, add refresh endpoint/client refresh flow, central 401 handling, clear session on logout. | High | Auth API contract | Reload persistence, refresh, expired token, logout, and secret-log checks. |
| Tutor PWA — Remaining Work §5 | Manifest/icons exist, but `pwa.js` unregisters all tutor workers and `sw.js` unregisters itself. README incorrectly claims offline shell support. | Installable tutor PWA with safe shell caching and read-only offline fallback. | Replace cleanup worker with versioned app-shell worker, registration/update handling, and explicit online-only data messaging. | High | Stable frontend build | Manifest audit, worker registration, offline fallback, update test, no API/token caching. |
| Student non-PWA cleanup — Student Mobile §21 | No current student manifest/SW, but no explicit legacy unregister/cache cleanup exists; old deployment may retain a worker. Tutor landing copy still says “Student PWA”. | Normal responsive site; explicitly unregister old student workers and clear old student caches; no install language. | Add one-time legacy cleanup in normal JS and correct copy/docs. | Medium | Student frontend integration | Browser inspection in normal and Incognito modes on deployed origin. |
| Student browser connection UI — Student Mobile §11 | `?connect=true` is unsupported. Missing/malformed modes fall into registration guidance. | Focused Student ID connection form with Pending and result states. | Add route-mode parser, validation, persistence, polling, retry, and approval/rejection result. | High | Browser-request API | Mobile UI/API tests for valid, invalid, unknown, duplicate, approved, reset. |
| Student reliability — Student Mobile §§7–10,14,17 | Fetch has no timeout; failure loses entered form values; polling timer is not visibility-aware; approved state is not restored; attendance is manual. | Permanent explicit states, timeout, retry, form preservation, one poll timer, hidden-page pause, automatic attendance. | Add request controller/timeout and small state helpers in readable modules. | High | API response/result codes | Network/invalid JSON/timeout/double-tap/refresh/visibility tests. |
| Management layouts — Student Page; Classes Page; Final Flows shared rule | Students uses `list-grid` cards; Classes embeds create form and many nested workspace cards; Fees uses record cards. | Spacious full-width records, compact toolbar, modal/side-panel forms; no management-page bento/card grid. | Convert to structured full-width rows/tables while preserving Frosted Touch; preserve Dashboard unchanged. | Medium | Frontend API integration | Responsive browser screenshots and interaction tests at desktop/mobile widths. |
| Test coverage — Remaining Work §10; Backend §29 | Eight mock-heavy tests cover only health, basic auth validation, three scan cases, approval code, fee update. | Full ownership, validation, duplicate, transaction, frontend-state, and acceptance coverage. | Split tests by feature; add validator/database-contract tests and browser smoke tests where practical. | High | All implementation stages | `pytest`, `compileall`, both builds, and documented acceptance checklist. |
| Environment and deployment — Remaining Work §§11–13 | Backend local env uses legacy `CORS_ORIGINS`; examples are missing; hard-coded fallback domains include old student PWA names. | Documented `ALLOWED_ORIGINS`, app URLs, redirect URL, and frontend base URLs for local/preview/prod. | Add `.env.example` files; remove obsolete production fallbacks; validate configured origins. | Medium | Stable endpoints | Config tests and deployment environment review without exposing values. |
| Documentation — Remaining Work §§6,8,14 | README describes several unimplemented features as complete; no final API spec, auth review, PWA review, migration checklist, or master plan. | Documentation describes tested reality and known limitations. | Add required documents and update README only after code/test stages. | Medium | Final implementation | Cross-check docs against route map, env examples, schema, and test results. |

## Existing conflicts and security observations

1. The reference `schema.sql` is destructive and must remain reference-only or be replaced with a clearly non-production reference schema.
2. Live production contains active data in the older device/registration subsystem (including two device rows and one device request). It must not be dropped or silently repurposed.
3. The live `public.rls_auto_enable()` function is `SECURITY DEFINER` and executable by `PUBLIC`. It is unrelated to the approved application path and is a security-review item; changing or removing it is outside this migration unless its provenance and dependents are confirmed.
4. Existing live RLS policies target `PUBLIC` rather than explicitly `authenticated`, though ownership predicates exist. Policies will be replaced for approved tables with explicit role targets.
5. Direct Flask connections use the `postgres` role and therefore bypass RLS. Backend ownership predicates remain mandatory.
6. Current class/student/attendance foreign keys cascade-delete historical data, conflicting with archive requirements.
7. Current WhatsApp URLs include the stored leading `+`, violating the digits-only destination rule.

## Safe implementation order and rollback checkpoints

1. Export live schema evidence and all important application rows outside Git; record counts and hashes.
2. Create an idempotent incremental migration. Test it in a rollback-only transaction against live-compatible state, then apply it once and re-inspect. Do not drop unexpected tables.
3. Add shared validators and tests.
4. Split Flask routes into Blueprints with endpoint-contract parity.
5. Implement student/archive/registration, then browser requests.
6. Implement class/archive/enrollment ownership.
7. Implement transactional session/default-Absent, scan update, and manual reason.
8. Implement normalized fee and WhatsApp behavior.
9. Integrate tutor management pages without changing Dashboard design.
10. Integrate student registration, connection, automatic attendance, and legacy worker cleanup.
11. Restore tutor-only PWA behavior.
12. Run the expanded automated suite, builds, and local browser checks.
13. Update environment examples and final technical documentation.

Each numbered implementation stage receives its own verified commit. No push, merge, production deployment, or PR is authorized by the supplied instructions.
