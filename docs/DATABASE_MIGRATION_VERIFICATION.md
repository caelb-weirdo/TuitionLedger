# Final Requirements Migration Verification

Migration: `20260716102500_final_requirements_foundation.sql`  
Applied: 2026-07-16  
Database engine inspected: PostgreSQL 17.6

## Safety evidence

- Live schema was inspected before authoring the migration.
- Backup export: `C:\Users\Caleb\Downloads\TuitionLedger-backups\20260716T101814Z`
- Export contains 21 JSON/manifest files, 50 public-table rows, and per-file SHA-256 hashes.
- A complete rollback-only execution of the migration passed before application.
- The migration contains no `DROP TABLE` operation.
- Legacy device/PWA subsystem tables and rows were deliberately preserved.
- `registration_requests.requested_classes` is temporarily retained for compatibility with the currently deployed backend. New code will stop using it; removal requires a later deployment-coordinated migration.

## Post-migration verification

- Public tables: 20 (19 preserved plus new `browser_requests`)
- Existing classes preserved: 10
- Existing device registration sessions preserved: 9
- Existing device requests preserved: 1
- Existing student devices preserved: 2
- Existing student registration requests preserved: 2
- Added `students.status` and `students.updated_at`
- Added `classes.status` and `classes.updated_at`
- Added `attendance_records.manual_reason` and `attendance_records.updated_at`
- Added required pending-request, browser, class, session, and lookup indexes
- Replaced approved-table RLS policies with explicit `TO authenticated` ownership policies
- Added `browser_requests` RLS ownership policy

## Deferred checks

- Validate phone and WhatsApp constraints after the application normalization code has been deployed and any future legacy rows have been normalized.
- Validate manual-reason and fee-month constraints after application integration.
- Remove `requested_classes` only after production no longer reads or writes it.
- Review the unrelated live `public.rls_auto_enable()` security-definer function and older device subsystem with their original owner before changing them.
