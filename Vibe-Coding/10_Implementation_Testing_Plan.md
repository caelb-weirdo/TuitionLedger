# Document 10 — Implementation & Testing Plan

## Implementation Summary

TuitionLedger must be built phase by phase. The AI coding agent must follow the approved documents and must not add random features outside the MVP scope.

Correct build order:

1. Project setup
2. Database schema and seed data
3. Authentication
4. Google Stitch UI direction and basic layout
5. Student and class management
6. Device registration and approval
7. QR attendance
8. Manual attendance correction
9. Fee tracking
10. Reminder system
11. Reports
12. Settings
13. UI polish
14. Testing and bug fixing
15. Deployment
16. Documentation
17. Viva preparation

## Main Build Approach

Use phase-by-phase development.

Each phase needs:

- Goal
- Tasks
- Done criteria
- Manual testing

Do not add:

- Online payments
- Parent login
- Face recognition
- GPS tracking
- Full WhatsApp API
- AI chatbot
- Student mobile app

## Phase 1 — Project Setup

### Goal

Create base project structure.

### Tasks

- Create repository
- Create frontend folder
- Create backend folder
- Set up React
- Set up Flask
- Install dependencies
- Create env files
- Configure Git
- Add README

### Done Criteria

- React runs locally
- Flask runs locally
- Folder structure exists
- Env variables prepared
- Frontend can call test backend endpoint

## Phase 2 — Database Schema and Seed Data

### Goal

Create Supabase PostgreSQL structure.

### Tasks

- Create all tables
- Add primary keys
- Add foreign keys
- Add unique constraints
- Add indexes
- Add soft delete fields
- Add timestamps
- Insert seed data

### Tables

- app_users
- students
- classes
- class_enrollments
- devices
- attendance_sessions
- attendance_records
- fee_payments
- reminders
- tutor_settings

### Seed Data

- 1 tutor
- 8–10 students
- 2–3 classes
- Enrollments
- Device statuses
- Attendance records
- Fee records
- Reminder records
- Tutor settings

### Done Criteria

- Tables exist
- Relationships work
- Sample data exists
- Backend connects to Supabase
- Basic select/insert works

## Phase 3 — Authentication and Role Redirect

### Goal

Implement login for tutors and students.

### Tasks

- Login API
- Password hashing
- Password verification
- JWT generation
- Current user endpoint
- Login page
- localStorage token
- AuthContext
- ProtectedRoute
- Role redirect

### Test Cases

- Valid tutor login
- Valid student login
- Invalid password
- Missing password
- Role redirect
- Protected route blocks unauthenticated user
- Student cannot open tutor dashboard

### Done Criteria

- Tutor login works
- Student login works
- Invalid login blocked
- JWT works
- Role redirect works
- Frontend and backend protections work

## Phase 4 — Google Stitch UI Direction and Basic Layout

### Goal

Create main visual style before all screens.

### Tasks

Use Google Stitch to generate:

- Landing page
- Login page
- Tutor dashboard

Then rebuild approved design in React.

### UI Rules

- Light mode
- Teal primary
- Green success
- Soft cards
- Rounded corners
- Clean tables
- Light sidebar desktop
- Bottom nav mobile

### Done Criteria

- Landing UI created
- Login UI created
- Dashboard layout created
- Sidebar works
- Mobile nav works
- Design matches system

## Phase 5 — Student and Class Management

### Student Tasks

- Student list
- Add student modal
- Edit student modal
- Soft delete student
- Search students
- Student profile
- Parent details
- Assign classes

### Class Tasks

- Class list
- Add class modal
- Edit class modal
- Soft delete class
- Enroll students

### Test Cases

- Add/edit/delete/search student
- Add/edit/delete class
- Enroll student
- Duplicate enrollment blocked

### Done Criteria

- Student management works
- Class management works
- Enrollment works
- Data saves to Supabase

## Phase 6 — Device Registration and Approval

### Goal

Protect attendance using registered devices.

### Tasks

- Generate device token
- Store token in localStorage
- Student submits device request
- Tutor views pending requests
- Tutor approves device
- Tutor rejects device
- Attendance blocks unapproved devices

### Test Cases

- New device creates pending request
- Tutor approves device
- Tutor rejects device
- Pending/rejected device cannot mark attendance
- Approved device can continue
- Deleted token requires new approval
- Second device blocked unless approved

### Done Criteria

- Device flow works
- Approval/rejection works
- One approved device rule works
- Attendance checks device

## Phase 7 — QR Attendance System

### Goal

Build main attendance feature.

### Tasks

- Tutor selects class
- Tutor chooses QR time limit
- Backend creates secure token
- Frontend displays QR
- QR contains attendance link
- Student scans with phone camera
- Student logs in if needed
- Backend validates session, expiry, enrollment, device, duplicate
- Attendance is marked
- Tutor closes session
- System creates absent records

### Test Cases

- Generate QR
- QR displays
- Countdown works
- Student scans link
- Attendance marked
- Expired QR blocked
- Duplicate scan blocked
- Unapproved device blocked
- Unenrolled student blocked
- Closing session creates absent records

### Done Criteria

- QR attendance works end-to-end
- All validation rules work
- Absent records can be created

## Phase 8 — Manual Attendance Correction

### Tasks

- Manual attendance form
- Select class/session
- Select student
- Select status
- Require reason
- Save update
- Store updated tutor and timestamp

### Test Cases

- Mark present manually
- Mark absent manually
- Mark late manually
- Reason required
- Student cannot manually update
- Manual update appears in reports

### Done Criteria

- Manual attendance works
- Reason required
- Student blocked

## Phase 9 — Fee Tracking

### Tasks

- Fee list page
- Add fee record
- Update fee record
- Filter by month/class/student/status
- Support paid/unpaid/partial/overdue
- Validate amounts
- Prevent duplicate monthly fee records

### Test Cases

- Add paid fee
- Add unpaid fee
- Add partial fee
- Mark overdue manually
- Invalid amount blocked
- Partial validation works
- Paid validation works
- Duplicate monthly fee blocked
- Student cannot update fee

### Done Criteria

- Fee records work
- Filters work
- Validation works
- Duplicates blocked

## Phase 10 — Reminder System

### Tasks

- Unpaid students page
- Show unpaid/partial/overdue students
- Prepare WhatsApp reminder
- Generate wa.me link
- Open WhatsApp chat
- Prepare phone reminder
- Generate tel link
- Tutor confirms sent
- Save reminder history

### Reminder Flow

1. Tutor clicks WhatsApp Reminder.
2. WhatsApp opens with prepared message.
3. Tutor manually sends.
4. Tutor returns.
5. Tutor clicks “I sent this reminder.”
6. System saves confirmation.

### Test Cases

- WhatsApp link works
- WhatsApp message pre-filled
- Phone link opens dialer
- Missing parent phone blocked
- Confirm reminder sent
- Reminder history updates

### Done Criteria

- WhatsApp link works
- Phone link works
- Confirmation works
- History is stored

## Phase 11 — Reports

### Tasks

- Reports page
- Report filters
- Attendance report
- Fee report
- Unpaid students report
- Student-wise history report
- Print button

### Filters

- Month
- Year
- Class
- Student

### Test Cases

- Attendance report loads
- Fee report loads
- Unpaid report loads
- Student history report loads
- Filters work
- Print works
- Student cannot access reports

### Done Criteria

- All reports work
- Reports are printable
- Tutor-owned data only

## Phase 12 — Settings

### Tasks

- Settings page
- Update default QR time
- Update WhatsApp template
- Update phone template
- Save to database

### Test Cases

- Update QR time
- Update WhatsApp template
- Update phone template
- Template appears in reminder
- Student cannot access settings

### Done Criteria

- Settings load and save
- Templates work

## Phase 13 — UI Polish and Responsiveness

### Tasks

- Polish cards
- Polish tables
- Polish modals
- Polish forms
- Add badges
- Add empty states
- Add skeleton loading
- Add toast messages
- Improve mobile layout
- Test student attendance on mobile
- Test tutor dashboard on mobile

### Done Criteria

- UI matches design system
- Dashboard looks professional
- Tables readable
- Forms clean
- Mobile layout works
- QR flow easy on phone

## Phase 14 — Testing and Bug Fixing

### Manual Testing Checklist

- Tutor login
- Student login
- Role redirect
- Student creation
- Class creation
- Enrollment
- Device request
- Device approval
- Device rejection
- QR generation
- Valid attendance scan
- Expired QR scan
- Duplicate QR scan
- Unapproved device scan
- Unenrolled student scan
- Manual attendance update
- Fee creation
- Fee update
- Fee filters
- WhatsApp reminder
- Phone reminder
- Reminder confirmation
- Attendance report
- Fee report
- Unpaid report
- Student history report
- Settings update
- Logout
- Mobile tutor flow
- Mobile student flow

### Bug Rule

Do not add new features during bug fixing.

### Done Criteria

- Core tests pass
- Major bugs fixed
- No broken login, attendance, fee, reminder, or navigation flow

## Phase 15 — Deployment

### Deployment Order

1. Supabase database
2. Vercel backend
3. Netlify frontend

### Database Tasks

- Create production tables
- Add indexes/constraints
- Add seed data
- Store connection values

### Backend Tasks

- Configure Flask for Vercel
- Add environment variables
- Add CORS frontend URL
- Test online API endpoints

### Frontend Tasks

- Add backend API URL
- Build React project
- Deploy to Netlify
- Test online frontend with backend

### Done Criteria

- Supabase works
- Vercel backend works
- Netlify frontend works
- Frontend calls backend
- Backend accesses database
- Main flows work online

## Phase 16 — Documentation

### Required Docs

- Setup guide
- Feature guide
- API summary
- Database summary
- Testing checklist
- Deployment guide
- Viva explanation notes

### Done Criteria

- Another student can run project from documentation.
- Each module is explained.
- API and database summaries exist.

## Phase 17 — Viva Preparation

Prepare explanation for:

- Problem solved
- Target users
- QR attendance
- Registered devices
- WhatsApp click-to-chat
- Database design
- User roles
- Authentication
- Attendance validation
- Fee tracking
- Reminder flow
- Reports
- Security rules
- Design patterns
- Deployment stack

Important explanation:

```text
TuitionLedger uses a layered backend architecture. Routes connect URLs to controllers. Controllers handle requests and responses. Services contain business rules such as QR expiry checking, device approval checking, and duplicate attendance prevention. Repositories handle Supabase database queries. This separation keeps the code clean and maintainable.
```

## Final Completion Criteria

Project is finished when:

- Tutor login works
- Student login works
- Student management works
- Class management works
- Device approval works
- QR attendance works
- Manual attendance works
- Fee tracking works
- WhatsApp/phone reminders work
- Reports work
- Settings work
- UI polished
- Mobile layout works
- Backend validation works
- Role checks work
- System deployed
- Documentation ready
- Viva explanation ready

## Final Priority

```text
Working features + clean code + polished UI + strong viva explanation
```

A smaller system that works perfectly is better than a huge broken system.

## AI Coding Agent Instruction

```text
Use these 10 documents as the source of truth for TuitionLedger. Do not add features outside the MVP scope. Build the project phase by phase. Follow the database schema, API contract, UI design system, security rules, and code architecture exactly. After each phase, provide the completed files and explain what was built.
```
