# Document 03 — App Flow

## App Flow Summary

TuitionLedger uses role-based navigation for tutors and students.

New visitors first see a landing page. Tutor and student users use the same login page. After login, the backend returns the user role and the frontend redirects the user to the correct dashboard.

The most important flow is QR attendance: tutor generates QR, student scans it using phone camera, the link opens in browser, and backend validates login, session expiry, class enrollment, approved device, and duplicate attendance before marking attendance.

## First Visitor Flow

### Landing Page

New visitors land on a landing page with:

- TuitionLedger name
- Tagline
- Benefits
- Feature highlights
- Login button

Main CTA:

> Login

## Authentication Flow

### Login Page

Tutor and student use the same login page.

Fields:

- Email or username
- Password

### Role-Based Redirect

After login:

- tutor → Tutor Dashboard
- student → Student Dashboard

### QR Link Login Case

If a student scans a QR before login:

1. QR opens attendance link.
2. System redirects student to login.
3. After login, student returns to attendance page.
4. Attendance validation continues.

## Tutor Navigation

### Desktop

Use left sidebar:

- Dashboard
- Students
- Classes
- Attendance
- Fees
- Reports
- Reminders
- Devices
- Settings
- Logout

### Mobile

Use bottom navigation:

- Dashboard
- Students
- Attendance
- Fees
- More

More menu contains:

- Reports
- Reminders
- Devices
- Settings
- Logout

## Tutor Pages

### Dashboard

Shows:

- Total students
- Today’s present count
- Today’s absent count
- Late students
- Paid this month
- Unpaid this month
- Partial payments
- Overdue payments
- Pending device approvals
- Recent attendance records
- Recent fee updates

Dashboard cards are clickable.

### Students Page

Tutor can:

- View student list
- Add student
- Edit student
- Soft delete student
- Search students
- View student profile
- Assign student to class

### Student Profile Page

Shows:

- Student name
- Login details
- Parent name
- Parent phone
- Parent WhatsApp number
- Parent email
- Assigned classes
- Device status
- Attendance summary
- Fee summary
- Reminder history

### Classes Page

Tutor can:

- Add class
- Edit class
- Soft delete class
- View class students
- Generate attendance QR

Class details:

- Subject
- Class name
- Schedule day
- Start time
- End time
- Fee amount

### Attendance Page

Tutor can:

- View attendance records
- Filter by class/session/month/status
- Generate QR
- Manually update attendance

### Attendance QR Page

Flow:

1. Tutor selects class.
2. Tutor chooses QR time limit.
3. Tutor clicks Generate QR.
4. System creates QR session.
5. Page displays QR code.

Page shows:

- QR code
- Countdown timer
- Class/session details
- Present count
- Expiry status
- Download QR image button

### Fees Page

Tutor can:

- Select student
- Select class
- Select month/year
- Enter amount due
- Enter amount paid
- Select payment status
- Save payment record

Statuses:

- Paid
- Unpaid
- Partial
- Overdue

### Unpaid Students Page

Shows students with:

- Unpaid fees
- Partial fees
- Overdue fees

Each row shows:

- Student name
- Class
- Parent phone
- Parent WhatsApp
- Amount
- Status
- WhatsApp reminder button
- Phone call button
- Confirm sent button

### Reminders Page

Shows reminder history:

- Student name
- Parent contact
- Reminder type
- Reminder status
- Confirmed date

Reminder types:

- WhatsApp
- Phone

### Devices Page

Tutor can:

- View pending device requests
- Approve device
- Reject device with reason

Device statuses:

- Pending
- Approved
- Rejected

### Reports Page

Reports support filters by:

- Month
- Year
- Class
- Student

Report types:

- Attendance report
- Fee report
- Unpaid students report
- Student-wise history report

Reports show as web tables with print button.

### Settings Page

Tutor can manage:

- Profile
- Class defaults
- Default QR time
- WhatsApp reminder template
- Phone reminder template

## Student Pages

### Student Dashboard

Shows:

- Student name
- Assigned classes
- Device approval status
- Attendance action
- Recent attendance confirmation

### Mark Attendance Page

Usually opened from QR link.

Flow:

1. Student scans QR.
2. QR link opens.
3. Student logs in if needed.
4. System validates session and device.
5. Attendance is marked if valid.
6. Student sees confirmation.

### Profile / Device Status Page

Shows:

- Student profile
- Registered device status
- Approval status
- Pending/rejected message if needed

## Core Journey 1 — Tutor Generates QR Attendance

1. Tutor logs in.
2. Opens Attendance page.
3. Selects class.
4. Chooses QR time limit.
5. Clicks Generate QR.
6. System creates secure QR session.
7. QR appears on screen.
8. Countdown starts.
9. Students scan QR.
10. Tutor sees present count.
11. QR expires after selected time.

## Core Journey 2 — Student Marks Attendance

1. Student scans QR using phone camera.
2. QR opens attendance link.
3. Student logs in if required.
4. Frontend sends session token and device token.
5. Backend validates QR, expiry, class enrollment, approved device, and duplicate status.
6. Attendance is marked.
7. Student sees success message.

## Core Journey 3 — Tutor Sends Fee Reminder

1. Tutor opens Fees or Unpaid Students page.
2. Filters unpaid/partial/overdue students.
3. Clicks WhatsApp Reminder.
4. WhatsApp opens with message.
5. Tutor manually sends message.
6. Tutor returns to TuitionLedger.
7. Clicks “I sent this reminder.”
8. Reminder history is saved.

## Core Journey 4 — Manual Attendance Correction

1. Tutor opens Attendance page.
2. Selects class/session.
3. Selects student.
4. Chooses status: present, absent, late.
5. Enters reason.
6. Saves update.
7. System stores tutor ID and timestamp.

## Edge Cases

### Student Not Logged In

Redirect to login, then return to attendance page.

### QR Expired

Show:

> QR code has expired. Please contact your tutor.

### Attendance Already Marked

Show:

> Attendance already marked.

### Unapproved Device

Show:

> This device is not approved. Please wait for tutor approval.

### No Students Yet

Show message and Add Student button.

### No Fee Records

Show message and Add Payment button.

### Network Error

Show toast:

> Something went wrong. Please try again.

## Loading States

Use spinner or skeleton loading for:

- Dashboard
- Students
- Attendance records
- QR generation
- Fees
- Reports

## Logout Flow

1. Clear token.
2. Clear stored user data.
3. Redirect to Login page.

## Version 1 Excluded Flows

- Parent login
- Online payment
- Automatic email sending
- WhatsApp Business API sending
- Face recognition
- GPS verification
- Student mobile app
- Multi-branch institute management
