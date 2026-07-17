# Student Registration Workspace Design

## Goal

Separate registration, approvals, and approved-student management so refreshing the student directory never removes a generated registration QR or rebuilds unrelated page sections.

## Page Structure

The authenticated Students page will contain three ordered regions:

1. **Registration and approvals**
   - The Generate registration QR action and its generated QR card live in a dedicated registration workspace.
   - Pending student registrations appear directly below the QR workspace as compact linked rows.
   - Pending browser approvals appear beneath registration requests as compact action rows.
2. **Approved students**
   - Approved students remain in the existing compact directory-row layout.
   - Search, Add student, and Refresh approved students controls belong to this section.
3. **Registration request detail**
   - Selecting a pending student registration opens `#registration-request?request=<id>`.
   - The page shows full name, grade, student phone, guardian name, guardian WhatsApp, submission status, and submitted time.
   - Approve and Reject actions remain backed by the existing registration-request endpoints.
   - Browser approvals do not use a detail page because their available information is limited; they stay as compact rows.

## Refresh Behaviour

- Generating a QR inserts content only into the registration workspace.
- Refresh approved students calls the existing `/api/students` endpoint and rerenders only the approved-student directory.
- It must not call `studentsPage()`, replace the shell, clear the QR workspace, or rerender pending approvals.
- Search filters approved-student rows only.
- Browser approve/reject actions refresh the approval rows and approved directory without replacing the QR workspace.
- The QR may be cleared when the tutor navigates away from the Students page or generates a replacement QR.

## Routing and Data Contracts

- Add a frontend-only registration-request route and page module.
- The detail page reads the existing `/api/registration-requests` response and selects the requested record by ID.
- Keep all endpoint URLs and backend response envelopes unchanged.
- Keep existing approval, rejection, Student ID generation, one-approved-browser, and archive contracts unchanged.

## States and Accessibility

- Each region has its own loading, empty, success, and error state.
- Refresh has an accessible name of `Refresh approved students` and a loading-disabled state.
- Pending registration rows are keyboard-focusable links with a clear `Review` label.
- Approval and rejection failures remain on the detail page and preserve the submitted information.
- Focus moves to the page heading after entering a request detail page and returns naturally through browser history.

## Responsive Design

- Registration and approvals stack above the approved directory at mobile widths.
- Approved students remain compact rows and collapse using the existing directory breakpoints.
- Actions wrap without horizontal overflow at 360px and wider.

## Verification

- Add frontend tests proving directory refresh does not call `studentsPage()` or target the QR container.
- Add routing and rendering tests for registration-request detail data and actions.
- Run the tutor frontend tests and production build.
- Browser-test QR generation followed by approved-directory refresh, registration-detail navigation, browser approval, search, and mobile layout.
