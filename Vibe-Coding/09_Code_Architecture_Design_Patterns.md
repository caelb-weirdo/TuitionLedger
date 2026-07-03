# Document 09 — Code Architecture & Design Patterns

## Architecture Summary

TuitionLedger uses a clean full-stack architecture with separate frontend and backend folders in one repository.

Goal:

- Clean code
- Readable code
- Maintainable code
- Easy viva explanation
- Easy debugging
- Easy future extension

## Repository Structure

```text
tuitionledger/
  frontend/
  backend/
  README.md
```

## Frontend Stack

- React
- Plain CSS
- Font Awesome
- React Router
- Axios

## Frontend Structure

```text
frontend/
  src/
    assets/
    components/
    context/
    layouts/
    pages/
    services/
    styles/
    utils/
    App.jsx
    main.jsx
```

## Frontend Folder Responsibilities

### assets

Stores images, icons, logo files.

### components

Reusable UI components:

- Button
- Card
- Badge
- Modal
- Table
- Input
- Toast
- EmptyState
- Spinner
- Skeleton

### context

Global context:

- AuthContext

### layouts

Layout wrappers:

- TutorLayout
- StudentLayout
- AuthLayout

### pages

Full page components:

- LandingPage
- LoginPage
- TutorDashboard
- StudentsPage
- ClassesPage
- AttendancePage
- AttendanceQRPage
- StudentDashboard
- MarkAttendancePage
- FeesPage
- ReportsPage
- RemindersPage
- DevicesPage
- SettingsPage

### services

API services:

- api.js
- authService.js
- studentService.js
- classService.js
- attendanceService.js
- feeService.js
- reminderService.js
- reportService.js
- settingsService.js

### styles

CSS files:

- variables.css
- global.css
- layout.css
- components.css
- pages.css

### utils

Helpers:

- formatDate.js
- formatPhone.js
- deviceToken.js
- validators.js

## Frontend Routing

Use React Router.

Handles:

- Landing page
- Login page
- Tutor pages
- Student pages
- Mark attendance link
- Protected routes
- Role redirects

## Protected Routes

Use `ProtectedRoute` component.

Checks:

- Logged in
- Token exists
- User role matches page

Backend role checks are still required.

## Auth State

Use AuthContext.

Stores:

- Logged-in user
- JWT token
- Login function
- Logout function
- Role
- Loading state

## API Calling Pattern

Use one central Axios API service.

`api.js` handles:

- Base URL
- JWT token attachment
- Common errors

Avoid repeated fetch calls inside components.

## Frontend Services

Page → service file → Axios client → Flask API.

Example:

```text
StudentsPage → studentService → api.js → /api/students
```

## Frontend Validation

Use frontend + backend validation.

Frontend improves UX. Backend protects system.

## Frontend Error Display

Use:

- Toast messages
- Field validation errors

## Frontend Loading

Use:

- Skeleton loading for dashboards/tables
- Button spinner for actions

## Backend Stack

- Python Flask
- Supabase PostgreSQL
- JWT authentication
- Werkzeug password hashing

## Backend Structure

Recommended:

```text
backend/
  api/
    index.py
  app/
    __init__.py
    routes/
    controllers/
    services/
    repositories/
    middleware/
    utils/
    config/
  requirements.txt
  vercel.json
```

Alternative simpler:

```text
backend/
  app.py
  routes/
  controllers/
  services/
  repositories/
  middleware/
  utils/
  config/
  requirements.txt
  vercel.json
```

Must be compatible with Vercel.

## Flask App Setup

Use app factory:

```python
def create_app():
    app = Flask(__name__)
    return app
```

Responsibilities:

- Create Flask app
- Load env variables
- Configure CORS
- Register routes
- Register error handlers

## Vercel Backend Rule

Use Vercel-compatible API entry file.

Example:

```text
backend/api/index.py
```

Do not build only as a traditional local Flask server.

## Backend Layers

Backend flow:

```text
Route → Controller → Service → Repository → Supabase Database
```

## Routes Layer

Routes only connect URL to controller.

Routes should not contain:

- Database logic
- Long business rules
- Password hashing
- QR validation
- Fee validation

## Controllers Layer

Controllers:

- Read request body
- Read query params
- Call service functions
- Return success/error response

Controllers do not directly query database.

## Services Layer

Services contain business rules.

Examples:

- attendance_service.py
- fee_service.py
- reminder_service.py
- device_service.py

Service layer validates logic and calls repositories.

## Repositories Layer

Repositories handle database queries only.

Responsibilities:

- Insert
- Update
- Select
- Soft delete
- Existence checks

Repositories should not contain business rules.

## Middleware / Decorators

Used for:

- JWT authentication
- Role checking
- Current user extraction

Examples:

```python
@login_required
@role_required("tutor")
```

## Utils

Recommended files:

- password_utils.py
- token_utils.py
- qr_utils.py
- phone_utils.py
- response_utils.py
- validation_utils.py
- date_utils.py

## Config

Recommended files:

- settings.py
- database.py

### settings.py

Stores:

- JWT secret
- Frontend URL
- Supabase URL
- Allowed CORS origins

### database.py

Creates one Supabase client instance.

## MVC-Style Layered Architecture

In TuitionLedger:

- Model/Data = database tables + repositories
- View = React frontend
- Controller = Flask controllers

This separation makes code cleaner and easier to explain.

## Repository Pattern

Use repositories for database access.

Example:

```text
StudentService → StudentRepository → Supabase
```

Use for:

- Students
- Classes
- Devices
- Attendance
- Fees
- Reminders
- Settings

## Service Layer Pattern

Use services for business rules.

Examples:

- QR expiry check
- Device approval check
- Duplicate attendance prevention
- Fee validation
- Reminder preparation

## Middleware Pattern

Use decorators for:

- JWT auth
- Role permissions

Avoid repeating auth checks everywhere.

## Strategy Pattern

Use for attendance marking methods:

- QR attendance strategy
- Manual attendance strategy

QR strategy validates:

- Student login
- QR token
- Expiry
- Enrollment
- Approved device
- Duplicate status

Manual strategy validates:

- Tutor login
- Tutor permission
- Manual reason
- Status

## Factory Pattern

Use for reminder creation:

- WhatsApp reminder
- Phone reminder

Factory creates:

- Message
- Link
- Prepared reminder record

Future reminder types can be added:

- Email
- SMS
- WhatsApp Business API

## Validation Pattern

Use separate validators:

- validate_fee_payload
- validate_student_payload
- validate_manual_attendance_payload
- validate_phone_number

Avoid random validation in routes.

## Response Helper Pattern

Use central helpers:

- success_response()
- error_response()
- validation_error_response()

Keeps API responses consistent.

## Password Utility

File:

```text
utils/password_utils.py
```

Functions:

- hash_password()
- check_password()

## Token Utility

File:

```text
utils/token_utils.py
```

Functions:

- create_token()
- verify_token()
- decode_token()

## QR Utility

File:

```text
utils/qr_utils.py
```

Functions:

- generate_secure_session_token()
- generate_qr_link()
- calculate_expiry_time()

## Reminder Utility / Factory

Functions:

- create_whatsapp_reminder()
- create_phone_reminder()
- build_whatsapp_link()
- build_tel_link()
- apply_template_variables()

## Manual Testing Strategy

Use manual testing checklist for MVP.

Test:

- Login
- Role redirect
- Student creation
- Class creation
- Enrollment
- Device request
- Device approval
- QR generation
- Attendance marking
- Expired QR rejection
- Duplicate attendance rejection
- Manual attendance
- Fee update
- WhatsApp reminder
- Phone reminder
- Reports
- Logout

## Code Commenting Rule

Use comments only for complex logic.

Good comments explain why, not every single line.

Example:

```python
# Prevent proxy attendance by allowing only approved student devices
```

## Code Style Priority

Highest priority:

> Clear, readable, explainable code.

Avoid:

- Overly clever code
- Too many libraries
- Huge files
- Repeated logic
- Random naming
- Business logic inside route files
- Database queries inside React components

## Final Architecture Flow

Frontend:

```text
Page Component → Service File → Axios API Client → Flask Backend
```

Backend:

```text
Route → Controller → Service → Repository → Supabase Database
```

Example attendance flow:

```text
Student scans QR
→ MarkAttendancePage
→ attendanceService.markAttendance()
→ POST /api/attendance/mark
→ attendance_route
→ attendance_controller
→ attendance_service
→ attendance_repository
→ Supabase
```
