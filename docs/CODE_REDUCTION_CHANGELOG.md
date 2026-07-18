# TuitionLedger Code Reduction Changelog

**Branch:** `cleanup/code-reduction-audit`
**Date:** 2026-07-18

## Result

TuitionLedger now uses two deployable applications instead of three:

```text
Vercel Frontend
├── Tutor SPA/PWA hash routes
└── Student registration, browser connection and attendance query flows

Vercel Backend
└── Flask API

Supabase
├── Authentication
└── PostgreSQL
```

No core Tutor or Student workflow was intentionally removed.

## Frontend reductions

- Removed five global DOM workaround scripts: request loading, global skeleton replacement, sidebar icon replacement, text sanitising and the runtime error suppressor.
- Consolidated the Tutor design cascade into `src/app.css` without changing its production CSS output.
- Rendered sidebar icons directly so the Students pending badge is preserved.
- Fixed Landing page section links.
- Added explicit QR expiry state and action-button loading protection.
- Added replacement-browser QR and copyable connection link after Browser Reset.
- Changed registration, attendance and connection links to the current frontend origin.
- Moved all Student Website workflows into `tutor-frontend/src/student/`.
- Removed the separate `student-mobile` package and deployment.
- Preserved the previous Student production stylesheet as a dynamically loaded Student-only CSS chunk.
- Removed broad Student service-worker and cache deletion.
- Added approval polling backoff: 5 seconds, then 15 seconds, then 30 seconds, plus manual approval checking.

## Backend reductions and fixes

- Removed Tutor profile upserts from every protected request.
- Tutor profiles are now created only during Auth/profile workflows.
- Added a single Dashboard summary endpoint.
- Added class student counts and lazy roster loading.
- Added single-class and single-registration-request endpoints.
- Combined monthly fee generation with ledger retrieval.
- Removed duplicate and unused legacy fee endpoints.
- Preserved HTTP 404/405 responses instead of converting them to 500 errors.
- Added Unicode-friendly Sinhala and Tamil person-name validation.
- Added cleanup for registration tokens expired for more than seven days.
- Aligned frontend, backend and database constraints for 5, 10 and 15 minute attendance sessions.

## Database changes

Apply this migration to the existing Supabase project:

```text
supabase/migrations/20260718080000_allow_fifteen_minute_sessions.sql
```

It updates the attendance-session duration check to allow `5`, `10`, and `15` minutes.

## Deployment changes

Frontend environment:

```env
VITE_API_BASE_URL=https://tuitionledger-backend.vercel.app
```

Backend environment:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
DATABASE_URL=your-session-pooler-connection-string
ALLOWED_ORIGINS=https://tuitionledger-frontend.vercel.app
AUTH_REDIRECT_URL=https://tuitionledger-frontend.vercel.app/#login
```

`VITE_STUDENT_APP_URL` is no longer used.

## Verification completed

- Backend: 52 tests passed.
- Tutor/combined frontend: 28 tests passed.
- Vite production build passed.
- Python compilation passed.
- Prettier formatting check passed.
- Git whitespace check passed.
- The Student CSS production chunk remains 8.30 kB and keeps the previous build hash, confirming the migrated visual cascade is unchanged.

## Required live checks before deleting the old Student deployment

1. Apply the Supabase migration.
2. Deploy the updated backend.
3. Deploy `tutor-frontend` with the new backend URL.
4. Generate and scan a Registration QR.
5. Approve the registration and confirm the Student ID appears.
6. Reset a browser and test the replacement-browser QR.
7. Start 5, 10 and 15 minute attendance sessions.
8. Confirm attendance scanning works from the combined frontend domain.
9. Confirm the Tutor PWA remains installed and registered.
10. Delete the old Student Vercel project only after these checks pass.
