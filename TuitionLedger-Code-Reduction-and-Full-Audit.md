# TuitionLedger Code Reduction, Deployment, Frontend and Backend Audit

**Repository:** `https://github.com/caelb-weirdo/TuitionLedger.git`  
**Audited branch:** `main`  
**Audited commit:** `cc3798a2c7b8b8068facf8c3a1f15721f9d91389`  
**Project level:** HNDIT group project  
**Primary goal:** Reduce files, repeated code, deployment complexity and hidden problems **without removing any real feature**.

---

# 1. Executive Summary

TuitionLedger does not have too many files because of its main features.

The project feels large mainly because several redesigns, UI fixes and temporary workarounds were added on top of each other.

The most important causes of unnecessary complexity are:

1. Too many global frontend enhancement scripts.
2. Multiple overlapping CSS systems.
3. Repeated API calls.
4. Authentication middleware performing unnecessary database writes.
5. Duplicate backend endpoints.
6. Three deployments when two are enough.
7. Some frontend and database inconsistencies.
8. Tests that do not detect several real browser and database problems.

The project should **not** be rewritten from scratch.

The correct strategy is:

- Keep the important page files separate.
- Remove unnecessary global JavaScript scripts.
- Consolidate the CSS.
- Reduce repeated API calls.
- Simplify Supabase authentication handling.
- Remove duplicate backend endpoints.
- Merge the two frontend deployments.
- Keep the Flask backend separate.

## Recommended final architecture

```text
1 Vercel Frontend Project
├── Tutor website
├── Tutor PWA
└── Student QR pages

1 Vercel Backend Project
└── Flask API

1 Supabase Project
├── Supabase Authentication
└── PostgreSQL database
```

Therefore, the recommended final deployment model is:

> **Two Vercel projects plus one Supabase project.**

---

# 2. Important Principle: Lowering File Count vs Lowering Complexity

A project with fewer files is not automatically simpler.

For example, combining all frontend pages into one `main.js` would reduce file count, but it would make the code harder to:

- Read
- Debug
- Explain during a viva
- Divide among team members
- Update safely
- Test

The current frontend routing file is already reasonably small. It mainly imports page modules and sends the user to the correct page.

The following frontend pages should remain separate:

```text
pages/dashboard.js
pages/students.js
pages/student-detail.js
pages/registration-request.js
pages/classes.js
pages/qr-session.js
pages/attendance.js
pages/fees.js
```

The following backend route files should also remain separate:

```text
backend/routes/auth.py
backend/routes/students.py
backend/routes/classes.py
backend/routes/attendance.py
backend/routes/fees.py
```

The best reduction comes from removing:

- Duplicate logic
- Unused scripts
- Conflicting CSS
- Duplicate API endpoints
- Repeated network calls
- Temporary workarounds

---

# 3. Supabase Authentication: What Supabase Does and Does Not Do

It is understandable to think that Supabase automatically provides the full login and signup pages.

Supabase handles the real authentication process, including:

- Creating tutor accounts
- Checking tutor passwords
- Sending confirmation emails
- Issuing access tokens
- Issuing refresh tokens
- Refreshing sessions
- Identifying the logged-in tutor

Supabase does **not** automatically create your application's:

- Login page HTML
- Signup page HTML
- Required-field messages
- Password visibility button
- Loading state
- Error message area
- Redirect logic
- Protected-page routing
- Navigation
- UI session state

Therefore, some frontend JavaScript is still required.

## Current authentication flow

```text
Tutor Frontend
      |
      v
Flask /api/auth/login or /api/auth/signup
      |
      v
Supabase Authentication
      |
      v
Flask returns token
      |
      v
Frontend stores session
```

The current authentication page is not unusually large. Most of its JavaScript handles:

- Browser form validation
- Loading button text
- Calling the backend
- Showing errors
- Saving a session
- Redirecting to Dashboard

## Simpler authentication option

The frontend can communicate directly with Supabase Authentication:

```text
Tutor Frontend
      |
      v
Supabase Authentication

Tutor Frontend receives access token
      |
      v
Flask API receives Bearer token
```

This could allow the project to remove:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/refresh
```

It could also remove or reduce:

- Manual session storage code
- Manual refresh-session code
- Some authentication error translation
- Some backend authentication proxy logic

## Important warning

Frontend validation must not replace backend validation.

A user can bypass the browser interface and send an API request directly.

Therefore:

- HTML validation improves the user experience.
- Backend validation protects the system.
- Database constraints protect stored data.

All three levels have different purposes.

The `backend/validators.py` file should remain.

---

# 4. Deployment Audit

## Current deployment structure

The project currently uses three Vercel projects:

```text
tuitionledger-frontend
tuitionledger-student
tuitionledger-backend
```

They use one Supabase project.

## Option A: Keep three deployments

### Advantages

- Tutor and student interfaces are isolated.
- The student site cannot easily interfere with the tutor PWA.
- Each Vercel project has a simple root directory.
- Separate deployments are easy to understand individually.

### Disadvantages

- Three Vercel dashboards to maintain.
- Two frontend package files.
- Two Vite installations.
- Two frontend API configuration files.
- Two separate frontend environments.
- Two frontend production URLs.
- More CORS configuration.
- More duplicated frontend files.
- More chances of setting the wrong environment variable.

## Option B: Use two deployments — recommended

Use:

```text
tuitionledger-frontend
tuitionledger-backend
```

The frontend project can contain both tutor and student pages.

Example routes:

```text
/                                      Landing page
/#login                                Tutor login
/#signup                               Tutor signup
/#dashboard                            Tutor dashboard
/#students                             Students page
/#classes                              Classes page
/#attendance                           Attendance page
/#fees                                 Fees page

/student?registration_token=...        Student registration
/student?attendance_token=...          Student attendance
/student?connect=true&tutor=...         Browser connection
```

### Benefits

- Only one frontend deployment.
- One frontend package file.
- One Vite configuration.
- One API URL setting.
- Shared icons, helpers and styles.
- Easier deployment explanation during the viva.
- Easier environment-variable management.
- No cross-domain frontend CORS requirement.

## Option C: Use one deployment

A single Vercel project could technically contain:

- Tutor frontend
- Student frontend
- Python serverless API

However, this would need additional:

- Vercel routing rules
- Build configuration
- Python function configuration
- Static-output configuration
- Rewrite rules

For a beginner-level HNDIT group, this would increase deployment difficulty.

## Deployment recommendation

| Deployment choice | Recommendation |
|---|---|
| Three Vercel projects | Works, but unnecessarily repetitive |
| Two Vercel projects | **Recommended** |
| One Vercel project | Technically possible, but not recommended |

---

# 5. Recommended Combined Frontend Structure

A clean combined frontend could use:

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── icon.svg
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── offline.html
└── src/
    ├── main.js
    ├── style.css
    ├── responsive.css
    ├── shared/
    │   ├── api.js
    │   ├── config.js
    │   ├── auth.js
    │   ├── html.js
    │   └── ui.js
    ├── tutor/
    │   ├── layout.js
    │   ├── landing.js
    │   ├── auth-page.js
    │   ├── dashboard.js
    │   ├── students.js
    │   ├── student-detail.js
    │   ├── registration-request.js
    │   ├── classes.js
    │   ├── qr-session.js
    │   ├── attendance.js
    │   └── fees.js
    └── student/
        ├── student-router.js
        ├── registration.js
        ├── browser-connection.js
        ├── attendance-scan.js
        └── waiting-status.js
```

This structure does not remove functionality.

It removes duplication while keeping responsibilities clear.

---

# 6. Frontend Global Script Audit

The tutor frontend currently loads the main application plus several separate enhancement scripts.

The active scripts include:

```text
main.js
text-sanitizer.js
runtime-error-boundary.js
request-loading.js
shadcn-skeletons.js
sidebar-icons.js
```

This layering makes the interface harder to reason about.

Several scripts watch the DOM using `MutationObserver`, rewrite content after pages render, or attempt to correct earlier UI issues.

The page modules should directly render the correct interface instead.

---

# 7. `request-loading.js`

## Current purpose

This script watches for clicks on buttons containing:

```html
data-loading
```

It disables the button, changes its text to `Working…`, and restores it after 15 seconds.

## Problem

The current production pages already manage their own button loading states.

Examples include:

- Login button
- Signup button
- Student registration button
- Browser approval button
- Fee update actions

The project does not appear to rely meaningfully on `data-loading`.

## Recommendation

Delete:

```text
tutor-frontend/src/request-loading.js
```

Remove its `<script>` tag from `index.html`.

This is a safe reduction because the page-specific loading states remain.

---

# 8. `shadcn-skeletons.js`

## Current purpose

This script looks for loading placeholders after a page renders and replaces them with skeleton elements.

It also changes Dashboard totals from:

```text
—
```

into elements using:

```css
skeleton skeleton-stat
```

## Hidden bug

When Dashboard data arrives, the Dashboard code only changes the element's text.

It does not remove:

```css
skeleton
skeleton-stat
```

The CSS keeps the element as an animated skeleton block.

Possible results:

- Dashboard values appear blank.
- Dashboard values remain animated.
- The user thinks the Dashboard is still loading.
- The value occupies a fixed loading-block size.

## Recommendation

Delete:

```text
tutor-frontend/src/shadcn-skeletons.js
```

Remove its script tag.

The page modules already contain normal loading messages and skeleton helper functions where needed.

---

# 9. `sidebar-icons.js`

## Current purpose

This script finds navigation links after the page renders and rewrites their HTML to insert glass icons.

## Hidden bug: Students pending badge is removed

The Students navigation link originally contains a pending-registration badge:

```html
<b class="nav-badge" data-pending-badge hidden></b>
```

The icon script later performs an operation similar to:

```javascript
link.innerHTML = icon + label;
```

This replaces everything inside the link.

As a result, the pending-registration badge is deleted.

## Better implementation

Render icons directly from `layout.js`.

Example concept:

```javascript
const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: dashboardIcon,
  },
  {
    id: "students",
    label: "Students",
    icon: studentsIcon,
    badge: true,
  },
];
```

Then the Students link can correctly contain:

```html
<a href="#students">
  [icon]
  <span>Students</span>
  <b class="nav-badge" data-pending-badge hidden></b>
</a>
```

## Recommendation

1. Move the icon SVG constants into `layout.js` or a shared `icons.js`.
2. Render icons directly.
3. Delete `sidebar-icons.js`.
4. Remove its `MutationObserver`.
5. Verify that the pending badge remains visible.

---

# 10. `text-sanitizer.js`

## Current purpose

The script continuously scans page text and replaces corrupted characters such as:

```text
ā€“
ā€”
вњ“
```

with the correct symbols.

## Problem

This is a workaround for a previous file-encoding problem.

The application already declares UTF-8 in its HTML.

Continuously scanning every text node:

- Adds unnecessary work.
- Hides source-file encoding problems.
- Adds another global observer.
- Makes debugging harder.
- Can unexpectedly alter future text.

## Recommendation

1. Search all source files for corrupted characters.
2. Replace them directly in the files.
3. Confirm all files are saved as UTF-8.
4. Delete `text-sanitizer.js`.
5. Remove its script tag.

---

# 11. `runtime-error-boundary.js`

## Current purpose

This script catches a limited group of JavaScript errors involving:

- Missing DOM elements
- Null properties
- `insertAdjacentHTML`

It displays a generic error notice.

## Problems

- It only catches specific error-message patterns.
- It can hide the original browser error.
- It calls `preventDefault()`.
- It makes debugging the real cause harder.
- Page modules already contain API error handling.

## Recommendation

Either remove the file or replace it with a very small debugging handler:

```javascript
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

window.addEventListener("error", (event) => {
  console.error("Application error:", event.error);
});
```

A generic user-facing page error can remain, but the real error should still be logged.

---

# 12. Frontend JavaScript Files That Can Be Removed

## Safe to remove first

```text
tutor-frontend/src/request-loading.js
tutor-frontend/src/shadcn-skeletons.js
```

## Remove after confirming source encoding

```text
tutor-frontend/src/text-sanitizer.js
```

## Remove after moving required behaviour

```text
tutor-frontend/src/sidebar-icons.js
tutor-frontend/src/runtime-error-boundary.js
```

These removals reduce global behaviour without removing project features.

---

# 13. CSS Audit

The CSS is currently the largest source of frontend confusion.

The project contains:

```text
style.css
password.css
theme-overrides.css
styles/tokens.css
styles/frosted-surfaces.css
styles/bento-layout.css
styles/dashboard-cards.css
styles/palette.css
styles/reference-theme.css
styles/responsive.css
```

The main `style.css` still contains an older dark design.

Newer files override it with the Frosted Touch design.

## Problems caused by this

- Duplicate selectors
- Conflicting colours
- Conflicting spacing
- Repeated component definitions
- Excessive `!important`
- Difficult debugging
- Pages appearing slightly inconsistent
- Old styles remaining in production
- Harder viva explanation

The `password.css` file also contains styling unrelated to passwords, including:

- Authentication button styles
- Success and error alerts
- Runtime error styling
- Skeleton styling
- Sidebar icon styling

The sidebar icon selector is defined more than once.

## Recommended CSS structure

### Beginner-friendly option

```text
src/
├── style.css
└── responsive.css
```

### Slightly more organised option

```text
src/styles/
├── tokens.css
├── base.css
├── components.css
└── responsive.css
```

## Recommended rule ownership

### `tokens.css`

```css
:root {
  --background: ...;
  --surface: ...;
  --text: ...;
  --muted: ...;
  --primary: ...;
  --danger: ...;
  --success: ...;
  --radius-small: ...;
  --radius-medium: ...;
  --radius-large: ...;
}
```

### `base.css`

- Reset
- Body
- Typography
- Links
- Buttons
- Inputs
- Labels

### `components.css`

- Navigation
- Cards
- Dialogs
- Tables
- Status pills
- Notices
- QR cards
- Filters
- Forms
- Dashboard bento grid

### `responsive.css`

- Tablet rules
- Mobile navigation
- Mobile forms
- Mobile grids
- Small-screen dialog behaviour

## Safe consolidation method

Do not delete the CSS files immediately.

Use this process:

1. Identify which CSS rule is actually active.
2. Move that rule into the new final CSS file.
3. Remove the duplicate older rule.
4. Test the affected page.
5. Continue section by section.
6. Remove the old CSS import only after all required rules have been moved.

---

# 14. Landing Page Audit

## Current good points

- Clear project explanation
- Tutor call-to-action
- Phone and laptop mockups
- Feature section
- System workflow
- FAQ
- Login and signup links

## Serious route problem

The landing page includes section links such as:

```text
#features
#flow
#preview
#faq
```

The application router treats the URL hash as a page route.

The router recognises application pages such as:

```text
top
login
signup
dashboard
students
classes
attendance
fees
```

It does not treat `features`, `flow`, `preview` or `faq` as landing-section anchors.

Therefore, clicking a landing navigation link can:

- Send an unauthenticated visitor to Login.
- Send an authenticated visitor to Dashboard.
- Fail to scroll to the intended section.

## Required fix

The router should identify landing-section hashes.

Example:

```javascript
const landingSections = ["features", "flow", "preview", "faq"];

if (landingSections.includes(route)) {
  landing();

  requestAnimationFrame(() => {
    document.getElementById(route)?.scrollIntoView({
      behavior: "smooth",
    });
  });

  return;
}
```

Alternative:

Use normal page links and do not allow the SPA router to handle same-page landing anchors.

## Code-reduction opportunity

The landing page is one very large HTML template.

It can be simplified using small data arrays and render helpers:

```javascript
const features = [
  {
    title: "Reduce manual work",
    text: "Use browser-approved QR attendance.",
  },
];
```

Then:

```javascript
function featureCards() {
  return features
    .map((feature) => {
      return `
        <article class="feature-card">
          <h3>${feature.title}</h3>
          <p>${feature.text}</p>
        </article>
      `;
    })
    .join("");
}
```

This does not necessarily reduce total lines dramatically, but it improves readability.

---

# 15. Login and Signup Audit

## Current strengths

The authentication page correctly contains:

- Email field
- Password field
- Required validation
- Email-format validation
- Eight-character minimum password
- Password show/hide control
- Loading text
- Clear error display
- Signup confirmation guidance
- Login/signup switching

## Is it too large?

No.

The login/signup page is not the main cause of the project size.

## Possible simplification

The form uses `novalidate`, then manually checks the HTML input validity.

You could remove `novalidate` and let the browser handle:

- Required fields
- Email format
- Minimum password length

However, the current custom error messages provide a better user experience.

## Recommendation

Keep the current frontend validation until the main cleanup is completed.

Simplifying authentication should be a later task, not the first task.

---

# 16. Dashboard Audit

## Current behaviour

Dashboard loads:

```text
GET /api/students
GET /api/classes
GET /api/registration-requests
GET /api/fees
```

The global layout also loads registration requests to calculate the navigation badge.

This can result in five protected API calls when opening Dashboard.

## Why this matters

Every protected request currently performs:

1. A Supabase Auth request.
2. A tutor database upsert.
3. A database commit.
4. The actual endpoint query.

Therefore Dashboard can create a surprisingly large amount of work.

## Better backend design

Create:

```text
GET /api/dashboard
```

Return only the information Dashboard needs:

```json
{
  "total_students": 150,
  "total_classes": 8,
  "pending_registrations": 3,
  "unpaid_fees": 42,
  "today_classes": [
    {
      "id": "...",
      "class_name": "Grade 11 Maths",
      "start_time": "17:00",
      "end_time": "19:00"
    }
  ],
  "recent_activity": []
}
```

## Result

Current:

```text
4–5 frontend requests
4–5 Supabase auth checks
4–5 tutor upserts
multiple database queries
```

Improved:

```text
1 frontend request
1 auth check
1 database connection
a small set of summary queries
```

## Required UI fix

Remove `shadcn-skeletons.js` so Dashboard totals correctly leave the loading state.

---

# 17. Students Page Audit

## Current strengths

The Students page already uses a combined endpoint:

```text
GET /api/students/overview
```

It returns:

- Approved students
- Registration requests
- Browser requests

This is a good design choice.

The page is also divided into small helper functions for:

- Rendering approved students
- Rendering approvals
- Searching students
- Refreshing students
- Refreshing approvals
- Approving browser requests
- Rejecting browser requests

## Problems

### 1. Navigation badge deletion

The icon enhancement script removes the pending badge.

### 2. No bulk browser approval

The current interface approves browser requests individually.

The planned flow mentioned bulk approval, but the current frontend code uses one button per request.

### 3. Repeated error messages

The manual Add Student form inserts an error message into the form card.

If a user submits multiple invalid requests, old messages may remain unless they are explicitly cleared.

Use one permanent notice element:

```html
<p id="student-form-notice" class="form-notice"></p>
```

### 4. Browser reconnection is unclear

The Student Mobile website supports a browser-connection mode:

```text
?connect=true&tutor=<tutor-id>
```

However, the tutor interface does not clearly generate this URL after a browser reset.

The student needs an obvious way to request a replacement browser.

## Recommended addition

After Browser Reset, display:

```text
Connect New Browser
[QR code]
[Copy connection link]
```

The link should contain:

```text
/student?connect=true&tutor=<current-tutor-id>
```

### 5. Registration detail loads every request

The registration review page currently loads the full registration-request list and finds one item in JavaScript.

Add:

```text
GET /api/registration-requests/:request_id
```

This makes the detail page smaller and faster.

---

# 18. Student Detail Page Audit

## Current strengths

The page combines:

- Student profile
- Guardian contact details
- Browser status
- Monthly attendance
- Edit student
- Reset browser
- Archive student

The page uses one monthly summary endpoint, which is good.

## Improvement opportunities

### 1. Loading and error states for actions

Edit, reset and archive actions should disable their buttons while running.

### 2. Success notice after edit

The page currently reloads itself after an edit.

A visible success notice would make the action clearer.

### 3. Browser reset follow-up

After reset, immediately show a replacement-browser QR or connection link.

### 4. Archive exception handling

Archive and browser-reset operations should have explicit `try/catch` error notices so failures do not become silent unhandled promise rejections.

---

# 19. Classes Page Audit

## Largest frontend performance problem

The Classes page loads:

```text
GET /api/classes
GET /api/students
GET /api/classes/:id/students  for every class
```

This creates an N+1 request problem.

## Example

With 20 classes:

```text
1 request for classes
1 request for students
20 requests for class rosters
1 possible registration-badge request

Total: approximately 23 requests
```

This is unnecessary.

## Best backend improvement

Change:

```text
GET /api/classes
```

to include a student count:

```json
[
  {
    "id": "...",
    "class_name": "Grade 11 Maths",
    "grade": "Grade 11",
    "subject": "Maths",
    "student_count": 24
  }
]
```

The initial page only needs the count.

Fetch the full roster only when the tutor clicks Manage:

```text
GET /api/classes/:class_id/students
```

## Improved request flow

```text
Page opens:
GET /api/classes

Tutor clicks Manage:
GET /api/classes/:class_id/students
GET /api/students
```

The student list can also be cached after the first Manage action.

## Repeated error message problem

Class-form errors are inserted before the form each time.

Use:

```html
<p id="class-form-notice" class="form-notice"></p>
```

Update its text instead of inserting additional elements.

## Additional recommendation

Add:

```text
GET /api/classes/:class_id
```

The QR session page should not load every class just to find one.

---

# 20. QR Session Page Audit

## Current strengths

- Tutor can choose date.
- Tutor can choose 5, 10 or 15 minutes.
- QR code is generated.
- Countdown is shown.
- Tutor can manually end a session.
- Backend expiry still protects the session.

## Problem 1: Loads every class

The page calls:

```text
GET /api/classes
```

then finds the selected class.

Use:

```text
GET /api/classes/:class_id
```

## Problem 2: Expired UI remains active

When the timer reaches zero, the script clears the interval.

However, the UI can continue showing:

```text
Session active
End session
```

The backend correctly rejects expired scans, but the tutor sees an incorrect state.

## Required behaviour at zero

When the countdown reaches zero:

1. Change status to `Expired`.
2. Replace the countdown with `Session expired`.
3. Disable or remove the End Session button.
4. Show `Start a new session`.
5. Stop the timer.

## Additional safety

Disable the Start Attendance button while the creation request is running.

This prevents accidental double creation.

---

# 21. Attendance Page Audit

## Current strengths

The Attendance page is appropriate for the project level.

It contains:

- Class filter
- Date filter
- Status filter
- Clear filters
- Summary totals
- Attendance list
- Present/Absent correction
- Required correction reason
- Other reason field

## Scalability concern

The page downloads all attendance records for a class and filters them in JavaScript.

For an HNDIT MVP, this is acceptable.

For a larger real system, use backend filters:

```text
GET /api/attendance/classes/:id?month=2026-07
GET /api/attendance/classes/:id?date=2026-07-18
GET /api/attendance/classes/:id?status=Present
```

## Recommendation

Do not complicate this page unless the dataset becomes large.

The current page structure is good enough after the shared frontend cleanup.

---

# 22. Fees Page Audit

## Current strengths

The Fees page contains:

- Month selector
- Class filter
- Status filter
- Student search
- Expected total
- Collected total
- Outstanding total
- Combined student amount
- Paid/unpaid switch
- Fee breakdown
- WhatsApp reminder

This is a strong MVP page.

## Current request flow

When the page opens for a month:

```text
POST /api/fees/ensure
GET  /api/fees/ledger?month=...
```

## Possible simplification

The ledger endpoint can ensure missing records before returning data:

```text
GET /api/fees/ledger?month=2026-07
```

Backend process:

```text
1. Insert missing fee rows using ON CONFLICT DO NOTHING.
2. Select the combined ledger.
3. Return the result.
```

This removes one frontend request and one backend endpoint.

## Important design decision

The page marks the full combined monthly amount for a student as Paid or Unpaid.

This is simpler for the tutor but means all the student's class-fee records for that month change together.

That is acceptable if it matches the intended project workflow.

---

# 23. Student Mobile Website Audit

## Current size

The Student Mobile Website has one main file of approximately 255 lines.

It contains three main flows:

1. Registration
2. Browser connection
3. Attendance scan

This is not excessively large.

It could be split for readability, but deployment consolidation is more important.

## Problem 1: Removes all service workers on the origin

The Student Mobile Website unregisters every service worker and deletes matching caches.

This is currently less dangerous because the tutor and student applications use different domains.

After combining the two frontends under one domain, the student page could unregister the Tutor PWA service worker.

## Required action before merging deployments

Delete the legacy PWA cleanup function from the student website.

If a one-time migration cleanup is needed, use a narrowly scoped temporary deployment and remove it afterward.

## Problem 2: Endless four-second polling

The waiting screen checks approval every four seconds.

It can continue indefinitely.

This creates unnecessary:

- API requests
- Database queries
- Serverless invocations
- Supabase usage

## Better polling schedule

```text
First minute: every 5 seconds
Next four minutes: every 15 seconds
After five minutes: every 30 seconds
```

Also add:

```text
Check Approval Now
```

The waiting state should remain saved in localStorage.

## Problem 3: Browser connection link not clearly exposed

The Student Mobile Website supports:

```text
connect=true
tutor=<tutor-id>
```

The tutor interface needs to generate that link after Browser Reset.

Without this, the backend capability exists but the normal user flow is incomplete.

---

# 24. Backend Structure Audit

## Current structure

```text
backend/
├── app.py
├── core.py
├── validators.py
├── api/
│   └── index.py
├── routes/
│   ├── auth.py
│   ├── students.py
│   ├── classes.py
│   ├── attendance.py
│   └── fees.py
└── tests/
```

This is a sensible backend structure.

## Do not merge all backend code

`app.py` currently handles:

- Flask application creation
- CORS
- Route registration
- Health route
- Global error handling

This is the correct responsibility for `app.py`.

The route modules should remain separate.

---

# 25. Major Authentication Middleware Inefficiency

Every protected request currently performs:

1. Read the Bearer token.
2. Call Supabase Auth's user endpoint.
3. Load the Supabase user.
4. Open a PostgreSQL connection.
5. Insert or update the tutor row.
6. Commit.
7. Run the real API route.

## Why this is expensive

Opening Dashboard can trigger several protected requests.

Each request repeats the same tutor upsert.

This adds:

- Extra database writes
- Extra commits
- More serverless execution time
- More cold-start work
- More chances of transient failure

## Recommended fix

The authentication decorator should only:

```text
Validate token
Set g.user
Set tutor identity
Run the requested route
```

Remove the tutor-table upsert from every request.

## Better tutor-profile creation options

### Option A: Create profile once after signup

After successful signup/login, call:

```text
PUT /api/tutor
```

only if a profile does not exist.

### Option B: Supabase database trigger

Create a tutor row automatically when an Auth user is created.

### Option C: Lazy creation

Only create the tutor profile the first time `/api/tutor` is requested.

## Recommended beginner option

Use lazy creation or create the tutor row after successful login.

Do not write the tutor row during every API request.

---

# 26. Authentication Verification Simplification

The backend currently sends the access token to Supabase Auth for every protected API request.

This is secure, but it adds one external network request to every protected operation.

## Beginner-friendly choice

Keep Supabase user verification for now, but:

1. Remove the repeated tutor database upsert.
2. Reduce frontend API request counts.
3. Add Dashboard and class-summary endpoints.

These changes deliver most of the benefit without introducing complicated JWT verification.

## Advanced optional improvement

The backend could later verify Supabase JWTs locally using the project's signing keys.

This removes the Auth network call from every request.

However, this is more advanced and not necessary for the HNDIT MVP.

---

# 27. Critical Database Bug: 15-Minute QR

The frontend offers:

```text
5 minutes
10 minutes
15 minutes
```

The backend validator accepts:

```text
5
10
15
```

However, the reference database schema only allows:

```sql
duration_minutes in (5, 10)
```

This can make a 15-minute session fail at the database level.

## Required migration

```sql
alter table public.attendance_sessions
drop constraint if exists attendance_sessions_duration_minutes_check;

alter table public.attendance_sessions
add constraint attendance_sessions_duration_minutes_check
check (duration_minutes in (5, 10, 15));
```

The exact existing constraint name should be checked in Supabase before running the migration.

## Validator-message correction

The current validator contains an outdated message mentioning only 5 or 10 minutes in one branch.

Use:

```python
raise ValidationError(
    "Choose a 5, 10, or 15 minute attendance session."
)
```

---

# 28. Schema and Migration Drift

The project contains:

```text
supabase/schema.sql
supabase/migrations/
```

The API uses a daily attendance conflict target:

```sql
on conflict(class_id, student_id, attendance_date)
```

A later migration creates the required unique index.

However, the reference `schema.sql` still declares a different uniqueness rule:

```text
unique(session_id, student_id)
```

## Problem

A fresh database created only from `schema.sql` may not match the live migrated database.

This can create different behaviour between:

- Local development
- Live Supabase
- Team-member setup
- Lecturer setup
- Future restoration

## Recommendation

Choose one source of truth.

### Recommended

Use migrations as the official source:

```text
supabase/migrations/
```

Then either:

- Remove the manually maintained reference schema, or
- Regenerate `schema.sql` from the final live database after all migrations

Do not allow `schema.sql` and migrations to describe different systems.

---

# 29. Duplicate Fee Endpoints

The backend has:

```text
POST /api/fees/ensure
POST /api/fees/generate
```

Both call the same monthly fee generation function.

The current frontend uses:

```text
POST /api/fees/ensure
```

Therefore `/api/fees/generate` is probably no longer needed.

## Duplicate update/reminder styles

The backend also supports:

```text
PUT /api/fees/:fee_id
GET /api/fees/:fee_id/whatsapp
```

and:

```text
PUT /api/students/:student_id/fees/:month
GET /api/students/:student_id/fees/:month/whatsapp
```

The current Fees page uses the student/month style.

## Recommended final API

Keep:

```text
GET /api/fees/ledger?month=YYYY-MM
PUT /api/students/:student_id/fees/:month
GET /api/students/:student_id/fees/:month/whatsapp
```

Remove old individual-fee endpoints after confirming that no current page or test still depends on them.

---

# 30. Student and Class Endpoint Improvements

## Add single-resource endpoints

Create:

```text
GET /api/classes/:class_id
GET /api/registration-requests/:request_id
GET /api/students/:student_id
```

These prevent detail pages from loading full collections.

## Add class summary

`GET /api/classes` should return `student_count`.

Example SQL concept:

```sql
select
  c.*,
  count(cs.student_id)::int as student_count
from classes c
left join class_students cs
  on cs.class_id = c.id
 and cs.status = 'Active'
where c.tutor_id = %s
  and c.status = 'Active'
group by c.id
order by c.day, c.start_time;
```

## Add Dashboard summary

Create one endpoint for all Dashboard totals.

---

# 31. Name Validation Problem

The current name validator only supports English letters and a small set of punctuation.

This rejects names written in:

- Tamil
- Sinhala
- Other Unicode scripts

For a Sri Lankan application, this is an unnecessary limitation.

## Recommended Unicode-friendly validation

```python
def person_name(value, label="Name"):
    text = required_text(value, label, 2, 160)

    if any(character.isdigit() for character in text):
        raise ValidationError(f"{label} cannot contain numbers.")

    if not any(character.isalpha() for character in text):
        raise ValidationError(f"Enter a valid {label.lower()}.")

    return text
```

Additional punctuation restrictions can be added if genuinely required.

---

# 32. Phone Validation

The backend currently accepts Sri Lankan numbers in:

```text
07XXXXXXXX
+947XXXXXXXX
```

and stores them in international format.

This is good.

The frontend should use matching attributes:

```html
<input
  type="tel"
  inputmode="tel"
  maxlength="12"
  pattern="(?:0[0-9]{9}|\+94[0-9]{9})"
>
```

Backend validation must remain the final authority.

---

# 33. Public Endpoint Protection

The following endpoints are public by design:

```text
POST /api/register-student
POST /api/browser-requests
GET  /api/registration-requests/:id/status
GET  /api/browser-requests/:id/status
POST /api/attendance/scan
```

These endpoints do not require a tutor login because students must access them.

## Existing protections

The project already uses:

- Expiring registration tokens
- Expiring attendance tokens
- Browser IDs
- Student enrollment checks
- Unique pending-request indexes
- Input length validation
- Tutor ownership checks
- Duplicate attendance handling

## Missing protection

There is no visible request rate limiting.

## Appropriate HNDIT-level protection

Do not introduce an expensive Redis architecture.

Use:

1. Slower polling.
2. Database unique indexes.
3. Expiring tokens.
4. Maximum input sizes.
5. Basic Vercel protection or rate rules if available.
6. Optional lightweight Flask rate limiting later.

---

# 34. Registration Token Cleanup

Registration QR tokens remain in the database after they expire.

They are small, but the table will continuously grow.

## Simple cleanup

When creating a new registration token:

```python
db.execute(
    """
    delete from registration_tokens
    where expires_at < now() - interval '7 days'
    """
)
```

Then insert the new token.

This avoids needing a background job.

---

# 35. Attendance Session Cleanup

Attendance sessions should not be deleted if they are required for historical attendance records.

However, old Active sessions should not remain logically active forever.

Before creating or reading sessions, the backend can mark expired sessions:

```sql
update attendance_sessions
set status = 'Expired'
where status = 'Active'
  and expires_at <= now();
```

The status constraint must include:

```text
Active
Ended
Expired
```

---

# 36. RLS and Direct PostgreSQL Connection

The database enables Row Level Security policies.

The Flask backend connects directly using a PostgreSQL connection string.

Whether RLS applies depends on the database role used by that connection.

If the backend connection uses a privileged role, RLS may be bypassed.

## Current positive protection

The backend routes generally include explicit ownership conditions:

```sql
where tutor_id = %s
```

That is good.

## Required verification

Check the role used in the Supabase connection string.

Do not assume that RLS automatically protects every direct Flask SQL query.

The backend ownership filters should remain even when RLS is enabled.

---

# 37. Backend Error Handling

## Current strengths

The Flask application has central handling for:

- Validation errors
- Database operational errors
- Unknown exceptions

It avoids returning raw database and Python errors to users.

## Improvement

Some route functions can raise database exceptions that are not `OperationalError`, such as:

- Unique violations
- Check violations
- Foreign-key violations

Several important unique violations are handled directly, which is good.

A clear handler could be added for general integrity errors:

```python
@application.errorhandler(psycopg.IntegrityError)
def integrity_error(error):
    application.logger.exception(
        "Database integrity error: %s",
        type(error).__name__,
    )

    return response(
        message="The submitted data conflicts with an existing record.",
        status=409,
    )
```

Specific route handling should remain where a more useful message is available.

---

# 38. Frontend API Cache Audit

The tutor frontend caches GET responses.

Current behaviour:

```text
Fresh for 60 seconds
Stale cache kept for 5 minutes
Background refresh after 60 seconds
All cache cleared after non-GET requests
```

This can reduce requests, but it may also show stale information.

## Possible issues

- Pending registration count can remain stale.
- Dashboard totals can remain stale.
- Recent fee changes may not immediately appear.
- Background requests can still run after leaving a page.
- `force: true` does not clearly bypass every cache condition unless explicitly handled.

## Recommended simplification

For this HND project:

- Cache only stable lists such as Classes and Students.
- Do not cache pending approvals.
- Do not cache attendance scan results.
- Do not cache fee ledger results for long.
- Use a simple `force` option that actually skips the cache.

A small cache is useful, but it should not become a second state-management system.

---

# 39. Frontend Session Storage

The tutor session is currently stored in localStorage.

This is easy to implement and acceptable for the project level.

## Security consideration

JavaScript can access localStorage.

Therefore a successful cross-site scripting attack could steal the token.

## Existing mitigation

The frontend escapes database values before inserting them into HTML.

This is good and should remain.

## More advanced option

HttpOnly secure cookies are safer for production authentication, but they would require a more complicated backend session architecture.

Do not introduce that complexity solely for the HNDIT MVP.

---

# 40. Testing Audit

## Current backend tests

The backend tests use a Fake Database object.

This is useful for:

- Checking response structure
- Checking validation
- Checking endpoint logic
- Checking which SQL statement is attempted

## Limitation

The fake database does not enforce real PostgreSQL constraints.

Therefore tests may pass even when the live database rejects the query.

The 15-minute attendance mismatch is an example.

## Current frontend tests

Many frontend tests read source files and check for strings or CSS patterns.

This can confirm that code exists.

It does not confirm that the browser behaves correctly.

## Missing real browser checks

Add a small browser smoke-test set:

1. Landing-page navigation scrolls.
2. Login required validation appears.
3. Dashboard numbers stop showing skeletons.
4. Students pending badge remains visible.
5. Registration QR link opens the student page.
6. Fifteen-minute attendance session succeeds.
7. QR session changes to Expired.
8. Browser reset displays a connection QR.
9. Fee status changes and refreshes.
10. Mobile navigation contains all five items.

Playwright would be useful, but manual acceptance testing is acceptable if the team cannot manage automated browser testing.

---

# 41. CI/CD Gap

The latest commit has successful Vercel deployments.

However, deployment success only proves that the projects built and deployed.

It does not prove that:

- Tests passed
- Database migrations are aligned
- Login works
- Attendance works
- Dashboard data renders
- Student registration works

## Recommended GitHub Actions check

Before deployment or merge:

```text
Tutor frontend:
npm install
npm test
npm run build

Student frontend:
npm install
npm run build

Backend:
pip install -r requirements.txt
pytest
python -m compileall backend
```

Also run:

```text
git diff --check
```

---

# 42. Recommended Final API Surface

A simpler final API could be:

## Authentication

If frontend uses Supabase Auth directly:

```text
GET  /api/tutor
PUT  /api/tutor
```

If keeping backend-proxied Auth temporarily:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/refresh
GET  /api/tutor
PUT  /api/tutor
```

## Dashboard

```text
GET /api/dashboard
```

## Students

```text
GET    /api/students
GET    /api/students/overview
GET    /api/students/:student_id
POST   /api/students
PUT    /api/students/:student_id
DELETE /api/students/:student_id
POST   /api/students/:student_id/reset-browser
GET    /api/students/:student_id/monthly-summary
```

## Registration

```text
POST /api/registration-qr
POST /api/register-student
GET  /api/registration-requests
GET  /api/registration-requests/:request_id
GET  /api/registration-requests/:request_id/status
POST /api/registration-requests/:request_id/approve
POST /api/registration-requests/:request_id/reject
```

## Browser requests

```text
POST /api/browser-requests
GET  /api/browser-requests
GET  /api/browser-requests/:request_id/status
POST /api/browser-requests/:request_id/approve
POST /api/browser-requests/:request_id/reject
```

Optional bulk endpoint:

```text
POST /api/browser-requests/bulk-review
```

## Classes

```text
GET    /api/classes
GET    /api/classes/:class_id
POST   /api/classes
PUT    /api/classes/:class_id
DELETE /api/classes/:class_id
GET    /api/classes/:class_id/students
POST   /api/classes/:class_id/students/bulk
DELETE /api/classes/:class_id/students/:student_id
```

The old single-student enrollment endpoint can remain if needed, but the current interface primarily uses bulk enrollment.

## Attendance

```text
POST /api/attendance-sessions
POST /api/attendance-sessions/:session_id/end
GET  /api/attendance/classes/:class_id
POST /api/attendance/scan
POST /api/attendance/manual
```

## Fees

```text
GET /api/fees/ledger?month=YYYY-MM
PUT /api/students/:student_id/fees/:month
GET /api/students/:student_id/fees/:month/whatsapp
```

This removes several duplicate fee endpoints.

---

# 43. Safe File Reduction List

## Delete early

```text
tutor-frontend/src/request-loading.js
tutor-frontend/src/shadcn-skeletons.js
```

## Delete after source cleanup

```text
tutor-frontend/src/text-sanitizer.js
```

## Delete after moving logic

```text
tutor-frontend/src/sidebar-icons.js
tutor-frontend/src/runtime-error-boundary.js
tutor-frontend/src/password.css
```

## Consolidate

```text
tutor-frontend/src/theme-overrides.css
tutor-frontend/src/styles/tokens.css
tutor-frontend/src/styles/frosted-surfaces.css
tutor-frontend/src/styles/bento-layout.css
tutor-frontend/src/styles/dashboard-cards.css
tutor-frontend/src/styles/palette.css
tutor-frontend/src/styles/reference-theme.css
tutor-frontend/src/styles/responsive.css
```

## Deployment merge removals

After combining the frontends:

```text
student-mobile/package.json
student-mobile/src/core/api.js
student-mobile/src/core/config.js
student-mobile/src/logo.css
```

Their required logic should move into shared frontend files.

Do not simply delete the whole student application before migrating its workflows.

---

# 44. Files That Should Remain

Keep:

```text
backend/app.py
backend/core.py
backend/validators.py
backend/routes/auth.py
backend/routes/students.py
backend/routes/classes.py
backend/routes/attendance.py
backend/routes/fees.py
backend/tests/
supabase/migrations/
```

Keep page modules separate:

```text
dashboard.js
students.js
student-detail.js
registration-request.js
classes.js
qr-session.js
attendance.js
fees.js
```

These files represent real responsibilities and make the project easier to maintain.

---

# 45. Final Implementation Order

Changes should be made in this order to reduce risk.

## Phase 1: Fix confirmed bugs

1. Update the database constraint to allow 15-minute QR sessions.
2. Correct the QR-duration validator message.
3. Remove `shadcn-skeletons.js`.
4. Confirm Dashboard totals render correctly.
5. Move navigation icons into `layout.js`.
6. Remove `sidebar-icons.js`.
7. Confirm the Students pending badge works.
8. Fix landing-page section navigation.
9. Add Unicode-friendly name validation.
10. Add browser-reconnection QR or link after reset.

## Phase 2: Remove unnecessary frontend scripts

11. Remove `request-loading.js`.
12. Correct corrupted source characters.
13. Remove `text-sanitizer.js`.
14. Replace or remove `runtime-error-boundary.js`.
15. Confirm browser console errors remain visible.

## Phase 3: Consolidate CSS

16. Define the final design tokens.
17. Move active base rules.
18. Move active component rules.
19. Move responsive rules.
20. Remove duplicates.
21. Remove unnecessary `!important`.
22. Test every page at desktop and mobile widths.
23. Remove old CSS imports.

## Phase 4: Improve backend request efficiency

24. Remove the tutor upsert from every authenticated request.
25. Add `GET /api/dashboard`.
26. Add class student counts.
27. Load class roster only on Manage.
28. Add `GET /api/classes/:id`.
29. Add `GET /api/registration-requests/:id`.
30. Combine fee ensuring with ledger loading.
31. Slow student approval polling.

## Phase 5: Remove duplicate backend endpoints

32. Confirm which fee endpoints the current frontend uses.
33. Remove unused `/api/fees/generate`.
34. Remove unused individual fee update endpoint.
35. Remove unused individual WhatsApp fee endpoint.
36. Update tests.
37. Update README and API documentation.

## Phase 6: Merge frontend deployments

38. Create one frontend project.
39. Move tutor pages into the new frontend.
40. Move student workflows into `/student`.
41. Share `api.js` and `config.js`.
42. Remove the student legacy service-worker cleanup.
43. Update registration QR URLs.
44. Update attendance QR URLs.
45. Update browser-connection URLs.
46. Update Vercel environment variables.
47. Update backend CORS.
48. Test Tutor PWA installation.
49. Test student pages without installing the PWA.
50. Remove the old student Vercel project only after production verification.

---

# 46. Final Environment Variables After Two-Deployment Merge

## Frontend Vercel project

```env
VITE_API_BASE_URL=https://tuitionledger-backend.vercel.app
```

The student page is hosted in the same frontend project, so a separate student-domain environment variable is no longer required.

A local frontend URL can be generated using:

```javascript
const studentBaseUrl = `${location.origin}/student`;
```

## Backend Vercel project

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
DATABASE_URL=your-supabase-session-pooler-url
ALLOWED_ORIGINS=https://tuitionledger-frontend.vercel.app
AUTH_REDIRECT_URL=https://tuitionledger-frontend.vercel.app/#login
```

If the frontend communicates directly with Supabase Auth, the frontend also needs:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The Supabase publishable key is designed for browser use.

Never expose:

- Database password
- Service role key
- Direct PostgreSQL URL
- Secret signing keys

---

# 47. Verification Checklist

## Authentication

- [ ] Tutor can create an account.
- [ ] Email validation works.
- [ ] Password validation works.
- [ ] Confirmation email redirects correctly.
- [ ] Tutor can log in.
- [ ] Tutor can log out.
- [ ] Session refresh works.
- [ ] Protected pages redirect unauthenticated users.

## Landing page

- [ ] Features link scrolls to Features.
- [ ] Flow link scrolls to Flow.
- [ ] Preview link scrolls to Preview.
- [ ] FAQ link scrolls to FAQ.
- [ ] Landing links do not accidentally open Dashboard or Login.

## Dashboard

- [ ] Totals display numbers.
- [ ] Totals do not remain skeletons.
- [ ] Today's classes are correct.
- [ ] Pending registration count is correct.
- [ ] Unpaid fee count is correct.
- [ ] Dashboard loads through one summary endpoint.

## Students

- [ ] Registration QR is generated.
- [ ] Student registration appears in approvals.
- [ ] Registration detail opens directly.
- [ ] Tutor can approve registration.
- [ ] Tutor can reject registration.
- [ ] Approved student receives a Student ID.
- [ ] Pending badge remains visible.
- [ ] Add Student form shows one error at a time.
- [ ] Browser approval works.
- [ ] Browser rejection works.
- [ ] Browser reset works.
- [ ] Browser reset shows a reconnection QR/link.

## Classes

- [ ] Class list loads without one request per class.
- [ ] Student counts are correct.
- [ ] Manage loads the class roster only when opened.
- [ ] Bulk enrollment works.
- [ ] Student removal works.
- [ ] Class editing works.
- [ ] Class archiving works.
- [ ] Error messages do not stack.

## Attendance QR

- [ ] Five-minute session works.
- [ ] Ten-minute session works.
- [ ] Fifteen-minute session works.
- [ ] Countdown is correct.
- [ ] UI changes to Expired at zero.
- [ ] End Session works.
- [ ] Expired QR is rejected.
- [ ] Ended QR is rejected.
- [ ] Wrong browser is rejected.
- [ ] Non-enrolled student is rejected.
- [ ] Duplicate attendance does not create a second record.

## Attendance records

- [ ] Class filter works.
- [ ] Date filter works.
- [ ] Status filter works.
- [ ] Present/Absent totals are correct.
- [ ] Manual correction requires a reason.
- [ ] Manual correction updates the correct record.

## Fees

- [ ] Monthly records are generated.
- [ ] Each student appears once in the combined ledger.
- [ ] Combined amount is correct.
- [ ] Paid/unpaid toggle updates all expected rows.
- [ ] WhatsApp reminder contains the correct name.
- [ ] WhatsApp reminder contains the correct classes.
- [ ] WhatsApp reminder contains the correct amount.
- [ ] Old duplicate fee endpoints are no longer called.

## PWA and student site

- [ ] Tutor PWA installs.
- [ ] Tutor service worker remains registered.
- [ ] Student page does not unregister the tutor service worker.
- [ ] Student page is not offered as a separate PWA.
- [ ] Student registration URL works.
- [ ] Student attendance URL works.
- [ ] Browser connection URL works.
- [ ] Pending approval polling slows over time.

## Deployment

- [ ] Frontend Vercel project builds.
- [ ] Backend Vercel project builds.
- [ ] Backend health endpoint returns JSON.
- [ ] CORS allows the frontend.
- [ ] Old student Vercel project is removed only after verification.
- [ ] README shows the final two-deployment architecture.

---

# 48. Expected Result After Cleanup

After completing the audit recommendations, the system should have:

- One fewer Vercel deployment.
- One frontend package setup instead of two.
- Fewer global JavaScript files.
- Fewer CSS files.
- No unnecessary DOM observers.
- No Dashboard skeleton bug.
- A working Students pending badge.
- Correct landing navigation.
- Fewer backend endpoints.
- Fewer authenticated requests.
- Fewer database writes.
- Correct 15-minute attendance support.
- Better Sri Lankan name support.
- A complete browser-reset workflow.
- Easier code explanation during the viva.
- No loss of core project functionality.

---

# 49. Final Recommendation

The final TuitionLedger should use:

```text
Frontend:
Vite + Vanilla JavaScript
Tutor SPA/PWA and Student QR pages in one project

Backend:
Flask API in a separate Vercel project

Database and Auth:
One Supabase project
```

Do not reduce files by merging all pages and routes into huge files.

Reduce the project by removing:

- Temporary UI scripts
- Duplicate CSS
- Duplicate endpoints
- Repeated network requests
- Repeated database operations
- Separate frontend deployment infrastructure

The project is already close to a good HNDIT-level full-stack system.

It needs a controlled cleanup, not a complete rebuild.
