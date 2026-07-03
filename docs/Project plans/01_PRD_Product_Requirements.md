# Document 01 — Product Requirements Document

## Project Name

**TuitionLedger**

## Tagline

A mobile-friendly tuition class management system for QR attendance, fee tracking, and parent reminders.

## Product Summary

TuitionLedger is a mobile-friendly web-based system designed for individual tuition tutors and small tuition class owners. It helps tutors manage student attendance, monthly fee payments, and parent communication from one central dashboard.

The system uses QR-code attendance for each class session. Students must log in and scan the active QR code using their registered device. This helps reduce proxy attendance and cheating. Tutors can also manually update attendance when needed, but they must provide a reason for manual changes.

TuitionLedger also helps tutors track monthly fee payments, identify unpaid students, and send reminders to parents through WhatsApp click-to-chat and phone contact. Email reminders are not part of the MVP.

## Problem

Many tuition tutors still manage attendance, monthly fees, and parent communication manually using notebooks, spreadsheets, or memory. This creates problems:

- Students can mark attendance for friends.
- Tutors may forget who paid and who did not.
- Parents may not be informed early about unpaid fees or poor attendance.
- Manual records are difficult to search, update, and report.
- Small tutors cannot always afford complex institute management software.

## Target Users

### Primary Users

- Individual tuition tutors
- Small tuition class owners

### Future Users

- Small tuition institutes with multiple tutors

The MVP focuses mainly on individual tutors and small tuition class owners.

## User Roles

### Tutor

The tutor can:

- Log in to the system
- Add and manage students
- Manage classes
- Generate QR codes for attendance
- View attendance records
- Manually correct attendance with a reason
- Track monthly fee payments
- View paid, unpaid, partial, and overdue students
- Send parent reminders through WhatsApp click-to-chat
- Open parent phone call links
- View reports and dashboard summaries
- Approve/reject registered devices
- Manage settings

### Student

The student can:

- Log in to the system
- Register a browser/device token
- Scan QR codes for attendance
- Mark attendance only from their approved device
- See attendance confirmation after scanning

### Parent

Parents do not log in for version 1. Parents receive communication through:

- WhatsApp click-to-chat reminder messages
- Phone calls made manually by tutor

## Core Value Proposition

TuitionLedger helps tutors save time, reduce attendance cheating, track monthly fees clearly, and communicate with parents faster.

The main value comes from combining:

- QR-code attendance
- Registered device verification
- Monthly fee tracking
- Parent reminders
- Reports and dashboard summaries

## Must-Have Features

### 1. Tutor Login

Tutors must log in securely before accessing the dashboard.

### 2. Student Login

Students must log in before marking QR attendance.

### 3. Student Management

Tutors can:

- Add students
- Edit student details
- View student profiles
- Store parent contact details
- Assign students to classes

### 4. Class Management

Tutors can:

- Create tuition classes
- Set class name, subject, day, and time
- Set monthly fee amount
- Assign students to classes

### 5. Device Registration

Each student can register only one approved device. The tutor must approve or reject device registration requests.

### 6. QR Attendance

Tutors generate a QR code for each class session. Each QR code must:

- Belong to a specific class session
- Have a time limit selected by tutor
- Expire after the selected time
- Prevent reuse after expiry

### 7. Duplicate Attendance Prevention

If a student scans the same QR code more than once, the system shows:

> Attendance already marked.

No duplicate attendance record should be created.

### 8. Attendance Statuses

The system supports:

- Present
- Absent
- Late

### 9. Manual Attendance Correction

The tutor can manually update attendance, but must enter a reason.

Example reasons:

- Student forgot device
- Network issue
- QR expired before student scanned
- Tutor correction

### 10. Monthly Fee Tracking

The tutor can record:

- Month
- Year
- Amount due
- Amount paid
- Payment date
- Payment status
- Notes

### 11. Payment Statuses

The system supports:

- Paid
- Unpaid
- Partial
- Overdue

### 12. Reminder System

The tutor can contact parents using:

- WhatsApp click-to-chat
- Phone click-to-call

### 13. WhatsApp Click-to-Chat Reminder

When tutor clicks the WhatsApp reminder button:

1. WhatsApp opens.
2. Parent’s chat opens.
3. A prepared reminder message appears.
4. Tutor manually sends the message.
5. Tutor confirms inside TuitionLedger that the reminder was sent.

The system must not claim that WhatsApp messages are sent automatically.

### 14. Reports

The system includes:

- Monthly attendance report
- Monthly fee report
- Unpaid students report
- Student-wise full history report

### 15. Dashboard

The dashboard shows:

- Total students
- Today’s present count
- Today’s absent count
- Late students
- Paid students this month
- Unpaid students this month
- Partial payment students
- Overdue students
- Pending device approvals
- Recent attendance records
- Recent fee updates
- Reminder shortcuts

## Nice-to-Have Features

Future version features:

- Parent login
- Online payment gateway
- Full WhatsApp Business API integration
- SMS reminder integration
- Student attendance history view
- Advanced analytics
- Multi-tutor institute support
- Printable receipts
- Excel/PDF exports

## Out of Scope for Version 1

The MVP will not include:

- Online card payments
- Full WhatsApp Business API
- Parent login
- Face recognition
- GPS tracking
- AI chatbot
- Student mobile app
- Multi-branch institute system
- Automatic WhatsApp message sending
- Automatic email sending

## User Stories

### Tutor Stories

- As a tutor, I want to add students so I can manage my class records digitally.
- As a tutor, I want to generate a QR code for each session so students can mark attendance quickly.
- As a tutor, I want students to scan QR codes only from registered devices so proxy attendance is reduced.
- As a tutor, I want to manually correct attendance with a reason so special cases can be handled.
- As a tutor, I want to track monthly fee payments so I can identify paid and unpaid students.
- As a tutor, I want to send WhatsApp reminders to parents so unpaid fees can be followed up quickly.
- As a tutor, I want reports so I can understand attendance and payment status clearly.

### Student Stories

- As a student, I want to log in and scan a QR code so my attendance is marked.
- As a student, I want confirmation after scanning so I know attendance worked.
- As a student, I want to use my registered device so my attendance is secure.

## Success Metrics

The project is successful if:

- Tutor can manage students and classes.
- Student can log in and scan a valid QR code.
- Expired QR codes are blocked.
- Duplicate attendance is blocked.
- Unapproved devices are blocked.
- Tutor can manually update attendance with a reason.
- Tutor can record monthly fee payments.
- Tutor can view paid, unpaid, partial, and overdue students.
- Tutor can open WhatsApp reminders.
- Tutor can open phone reminders.
- Tutor can view reports.
- Dashboard shows useful summaries clearly.
- Core flows work on desktop and mobile.

## Business Model

TuitionLedger can use a freemium subscription model.

### Free Plan

- Limited number of students
- Basic attendance
- Basic fee tracking
- WhatsApp click-to-chat reminders

### Paid Plan

- More students
- Advanced reports
- Multiple classes
- Reminder history
- Exportable reports
- Future integrations

## First Target Market

The first target market is **Sri Lankan private tuition tutors**.
