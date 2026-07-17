# Attendance Correction Reliability Design

## Goal

Make manual attendance corrections complete reliably and give the tutor visible feedback inside the correction dialog when validation or the API fails.

## Confirmed Root Cause

The correction form sends the expected `session_id`, `class_id`, `student_id`, new `status`, and selected `reason`. After the asynchronous API call succeeds, the handler accesses `event.currentTarget` again. Browser event dispatch clears `currentTarget` after the synchronous handler phase, so `.reset()` throws, record reloading is skipped, and the successful correction appears to have failed.

The same handler writes validation and API failures to the page-level attendance notice. That notice sits behind the open modal and is not visible while the tutor is correcting a record.

## Interaction Design

- Capture the correction form and submit button in local variables before the first asynchronous operation.
- Keep the dialog open while the request is pending and disable its Save correction button.
- Add a dialog-local status element with `role="status"` and `aria-live="polite"`.
- Show required-reason validation and API failures in the dialog-local status element.
- On success, reset the captured form, restore the hidden Other reason state, close the dialog, reload attendance records, and show the success message in the page-level attendance notice.
- Preserve the selected record and change description if the API fails so the tutor can retry without reopening the dialog.
- Clear stale dialog errors whenever a new correction is opened.

## Data Contracts

- Keep `POST /api/attendance/manual` unchanged.
- Continue sending `session_id`, `class_id`, `student_id`, `status`, and `reason`.
- Preserve correction reason, manual method, status, and update-time behaviour.
- Do not add or change database columns.

## Verification

- Add a frontend test that prevents use of `event.currentTarget` after an awaited correction request.
- Add a lightweight DOM/browser test proving a successful correction closes the dialog and reloads records without a JavaScript error.
- Test that API failure leaves the dialog open and exposes the message inside the dialog.
- Run tutor frontend tests and the production build.
- Browser-test Absent to Present and Present to Absent using a suggested reason and an Other reason.
