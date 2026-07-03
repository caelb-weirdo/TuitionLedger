# Document 04 — UI/UX Design Brief

## UI/UX Summary

TuitionLedger should look like a clean, modern, mobile-friendly SaaS dashboard while still feeling friendly and suitable for local tuition tutors.

The design should be professional enough for viva presentation and simple enough for real tutors and students to use without training.

Primary UI direction:

> Clean modern SaaS dashboard + friendly local tuition app

The system should feel:

- Professional
- Friendly
- Trustworthy
- Smart
- Modern
- Easy to use

## Main Design Goals

### 1. Professional Viva Presentation

The UI should look polished and serious.

### 2. Tutor Usability

Tutors should manage students, attendance, fees, reports, reminders, and devices without confusion.

### 3. Mobile-Friendly Student Attendance

Students should scan QR, open attendance page, and mark attendance quickly from a mobile browser.

## Primary Theme

Light mode.

Light mode is clearer for dashboards, tables, forms, and reports.

Dark mode is not required in version 1.

## Color Direction

### Primary Color

Teal.

Use for:

- Main buttons
- Active navigation
- Important highlights
- Selected states

### Secondary Color

Green.

Use for:

- Paid status
- Success messages
- Approve actions
- Positive dashboard cards

### CTA Color

Green for important positive actions:

- Generate QR
- Mark Paid
- Confirm Reminder Sent
- Save Attendance
- Approve Device

### Danger/Error Color

Red for:

- Reject device
- Delete actions
- Expired QR
- Overdue payment
- Error messages

## Background Style

Use a light gray dashboard background with a subtle soft gradient.

Avoid:

- Heavy glassmorphism
- Busy patterns
- Overuse of gradients

## Card Style

Use soft shadow cards.

Rules:

- White or near-white background
- Soft shadow
- 12px–16px rounded corners
- Clear spacing
- Icon, label, number, description
- Clickable when useful

## Border Radius

Use medium rounded corners: 12px–16px.

Apply to:

- Cards
- Buttons
- Inputs
- Tables
- Modals
- Alerts
- QR containers

## Navigation

### Desktop

Use a light sidebar with:

- Logo/app name
- Icons
- Labels
- Active state
- Logout at bottom

### Mobile

Use bottom tab bar with:

- Dashboard
- Students
- Attendance
- Fees
- More

## Dashboard Layout

Structure:

1. Welcome header
2. Top summary cards
3. Recent activity
4. Tables/lists
5. Reminder shortcuts

Use 6 top summary cards on desktop:

- Total Students
- Present Today
- Absent Today
- Paid This Month
- Unpaid This Month
- Pending Devices

## Tables

Use rounded table containers with status badges.

Rules:

- White background
- Light borders
- Clear headers
- Comfortable row height
- Search/filter section
- Action buttons inside rows
- Status badges

Avoid raw spreadsheet look.

## Status Badges

Use colored badges:

- Paid: green
- Unpaid: red
- Partial: orange/yellow
- Overdue: dark red
- Present: green
- Absent: red
- Late: orange
- Pending: yellow/orange
- Approved: green
- Rejected: red

## Forms

Use two-column layout on desktop and single-column on mobile.

Rules:

- Clear labels
- Rounded inputs
- Helpful placeholders
- Required indicators
- Validation messages under fields
- Primary action button at bottom
- Cancel/back button

## Add/Edit Forms

Use modal popups.

On mobile, modals can become near fullscreen.

## QR Generation Page

Layout:

- Class/session details
- Large centered QR code
- Countdown timer
- Present count
- Expiry status
- Download QR image button

QR must be easy to scan from laptop/projector.

## Student Attendance Page

Use a big attendance status card.

Show:

- Student name
- Class name
- Attendance status
- Device approval status
- Clear success/error message

Students should not see a complicated dashboard during attendance.

## Success Message

Show green success card with check icon.

Example:

> Attendance marked successfully.

Duplicate scan message:

> Attendance already marked.

## Error Message

Show red/orange alert card.

Examples:

- QR code has expired. Please contact your tutor.
- This device is not approved yet.
- Your device request was rejected. Please contact your tutor.

Avoid browser alerts for main flows.

## Typography

Use an Inter-style clean modern font.

Rules:

- Clear headings
- Medium-weight section titles
- Readable body text
- No decorative fonts

## Icon Usage

Use Font Awesome icons in:

- Sidebar
- Dashboard cards
- Buttons
- Status messages
- Empty states

Use icons with text, not icons alone.

## Empty States

Use simple icon + message + action button.

Example:

> No students yet. Add your first student to get started.

Button:

> Add Student

## Reminder Buttons

Use icon + text buttons:

- WhatsApp Reminder
- Call Parent
- Confirm Sent

## Login Page

Use split-screen design:

### Left Side

- TuitionLedger branding
- Short value statement
- Simple illustration

### Right Side

- Login card
- Email/username field
- Password field
- Login button

On mobile, stack vertically.

## Landing Page

Use:

- Hero section
- Feature highlights
- How it works
- Login CTA

Do not create a long marketing website.

## Google Stitch Usage Plan

Generate first:

1. Landing page
2. Login page
3. Tutor dashboard

After style is approved, generate:

- Students page
- Classes page
- Attendance QR page
- Student attendance page
- Fees page
- Unpaid students page
- Reports page
- Devices page
- Settings page

## Google Stitch Prompt Direction

Use this when prompting Stitch:

```text
Create a clean, modern, mobile-friendly SaaS dashboard for a tuition class management system called TuitionLedger. The app helps tutors manage QR attendance, student devices, monthly fee tracking, and parent reminders. Use a light theme with teal as the primary color, green accents for success actions, soft shadow cards, rounded corners, clean tables with badges, a light sidebar on desktop, and bottom navigation on mobile. The design should feel professional, friendly, trustworthy, and easy for Sri Lankan private tuition tutors to use.
```

## Accessibility Requirements

- Good contrast
- Clear font sizes
- Large enough mobile buttons
- Labels for all inputs
- Clear error messages
- Icons should not replace text completely
- Tables must remain readable on small screens

## Mobile Requirements

- Sidebar becomes bottom nav
- Tables become scrollable or card-based
- Forms become single column
- QR attendance page stays simple
- Buttons are easy to tap
- Student flow is fast

## Design Restrictions

Avoid:

- Heavy dark mode
- Too much glassmorphism
- Too many gradients
- Tiny text
- Crowded tables
- Random colors
- Complex animations
- Childish graphics
- Copying Stitch code blindly
