# Document 05 — Design System

## Design System Summary

TuitionLedger uses a clean, modern, light-mode SaaS design system with a friendly tuition-class feel.

The system uses:

- Balanced teal as the main brand color
- Green for success and positive actions
- Red for danger/error states
- Soft slate-white background
- White cards
- Medium rounded corners
- Soft shadows
- Clean tables
- Pill-shaped status badges
- Responsive mobile-first behavior

## CSS Variables

```css
:root {
  --color-primary: #0D9488;
  --color-success: #16A34A;
  --color-danger: #DC2626;
  --color-warning: #F97316;
  --color-overdue: #991B1B;

  --color-bg-main: #F8FAFC;
  --color-bg-card: #FFFFFF;

  --color-text-main: #111827;
  --color-text-secondary: #64748B;

  --color-border: #E2E8F0;

  --radius-button: 12px;
  --radius-card: 16px;
  --radius-input: 12px;
  --radius-badge: 999px;

  --sidebar-width: 240px;
  --mobile-nav-height: 64px;

  --page-padding-desktop: 32px;
  --page-padding-mobile: 16px;

  --card-padding-large: 24px;
  --card-padding-small: 20px;

  --gap-card: 16px;

  --font-body: 14px;
  --font-student-mobile: 16px;

  --h1: 28px;
  --h2: 22px;
  --h3: 18px;
}
```

## Colors

### Primary Teal

`#0D9488`

Use for:

- Main buttons
- Active sidebar item
- Active mobile nav item
- Primary links
- Selected states

### Success Green

`#16A34A`

Use for:

- Approve Device
- Mark Paid
- Confirm Sent
- Present status
- Paid status
- Success messages

### Main Background

`#F8FAFC`

Use for main app background.

### Card Background

`#FFFFFF`

Use for cards, modals, forms, tables, and QR containers.

### Main Text

`#111827`

Use for headings, main table text, and labels.

### Secondary Text

`#64748B`

Use for descriptions, subtitles, and helper text.

### Border

`#E2E8F0`

Use for card borders, inputs, tables, and dividers.

### Danger

`#DC2626`

Use for errors, delete, reject, unpaid, absent.

### Warning

`#F97316`

Use for late, partial, pending.

### Overdue

`#991B1B`

Use for overdue payments.

## Typography

Use Inter-style font.

Scale:

- H1: 28px
- H2: 22px
- H3: 18px
- Body: 14px
- Student mobile body: 16px

## Layout

### Desktop Page Padding

`32px`

### Mobile Page Padding

`16px`

### Card Gap

`16px`

## Sidebar

### Width

`240px`

### Style

- Light background
- Logo/app name at top
- Icon + label items
- Teal active state
- Logout at bottom

## Mobile Bottom Navigation

### Height

`64px`

Tabs:

- Dashboard
- Students
- Attendance
- Fees
- More

Rules:

- Icon + short label
- Active item teal
- Large touch targets

## Dashboard Grid

### Desktop

Use 3 columns.

```css
grid-template-columns: repeat(3, 1fr);
```

For 6 cards:

- 3 columns × 2 rows

### Mobile

Use 1 column.

```css
grid-template-columns: 1fr;
```

## Cards

### Dashboard Cards

```css
border-radius: 16px;
padding: 24px;
background: #FFFFFF;
box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
```

Structure:

- Icon
- Label
- Large number
- Helper text
- Optional click action

### Small Cards

```css
border-radius: 16px;
padding: 20px;
background: #FFFFFF;
```

## Buttons

### Primary Button

```css
background: #0D9488;
color: #FFFFFF;
border-radius: 12px;
```

Use for:

- Login
- Save Student
- Generate QR
- Save Class
- Save Payment

### Success Button

```css
background: #16A34A;
color: #FFFFFF;
border-radius: 12px;
```

Use for:

- Approve Device
- Mark Paid
- Confirm Sent

### Danger Button

```css
background: #DC2626;
color: #FFFFFF;
border-radius: 12px;
```

Use for:

- Reject Device
- Delete
- Cancel Session

### Secondary Button

```css
background: #FFFFFF;
color: #111827;
border: 1px solid #E2E8F0;
border-radius: 12px;
```

Use for:

- Cancel
- Back
- View Details
- Print Report

## Inputs and Forms

Input radius: `12px`.

Rules:

- Clear labels
- Helpful placeholders
- Field validation messages
- Two-column desktop layout
- Single-column mobile layout

Desktop:

```css
grid-template-columns: repeat(2, 1fr);
```

Mobile:

```css
grid-template-columns: 1fr;
```

## Modals

Use medium modals.

Use for:

- Add Student
- Edit Student
- Add Class
- Update Fee
- Manual Attendance
- Device approval/rejection

Mobile modals should be near fullscreen.

## Tables

Use comfortable row spacing.

Rules:

- Rounded outer container
- White background
- Light border
- Clear header row
- Row hover
- Action buttons on right
- Status badges

## Mobile Table Behavior

Important pages should convert table rows into cards on mobile.

Use card rows for:

- Students
- Unpaid students
- Devices
- Fees

Reports can use horizontal scroll.

## Badges

Badge style:

```css
border-radius: 999px;
padding: 4px 10px;
font-size: 12px;
font-weight: 600;
```

### Attendance Badges

- Present: green
- Absent: red
- Late: orange

### Fee Badges

- Paid: green
- Unpaid: red
- Partial: yellow/orange
- Overdue: dark red

### Device Badges

- Pending: yellow/orange
- Approved: green
- Rejected: red

## Toast Messages

Desktop position: top-right.

Mobile position: bottom-center.

Toast types:

- Success
- Error
- Warning
- Info

## Loading States

- Dashboard/tables: skeleton loading
- Buttons: small spinner

## Empty States

Use simple line icon + message + action button.

Example:

> No students yet. Add your first student to start managing attendance and fees.

Button:

> Add Student

## QR Page Rules

QR must be the biggest visual element.

Layout:

1. Class/session details
2. Large QR code
3. Countdown timer
4. Present count
5. Download QR button
6. Expiry status

## Student Result Screen

Use full-screen status card.

States:

- Success: green check icon
- Duplicate: info/success-style message
- Expired/error: red/orange message

## Reminder Buttons

Use icon + text:

- WhatsApp Reminder
- Call Parent
- Confirm Sent

## Animations

Use subtle hover/fade only.

Avoid heavy or distracting animations.

## Google Stitch Add-On Prompt

```text
Use a light SaaS dashboard design system for TuitionLedger. Use #0D9488 as the primary teal, #16A34A as the green success color, #F8FAFC as the main dashboard background, and white cards with 16px rounded corners. Use soft shadows, 12px rounded buttons and inputs, Inter-style typography, pill-shaped status badges, comfortable tables, a 240px light sidebar on desktop, and a 64px bottom tab navigation on mobile. Dashboard cards should use a 3-column grid on desktop and 1-column layout on mobile. Use skeleton loading for tables and dashboard cards, and small spinners inside buttons. Keep animations subtle.
```

## Restrictions

Do not use:

- Heavy dark mode
- Random colors
- Too many gradients
- Too much glassmorphism
- Tiny text
- Raw spreadsheet tables
- Sharp old-school cards
- Too many animations
- Icons without labels
- Crowded mobile layouts
