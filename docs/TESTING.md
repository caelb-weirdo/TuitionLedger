# Testing Checklist — TuitionLedger

## Authentication
- [ ] Tutor login with valid credentials
- [ ] Student login with valid credentials
- [ ] Invalid password shows error
- [ ] Role redirect: tutor → dashboard, student → student dashboard
- [ ] Protected routes block unauthenticated users
- [ ] Student cannot access tutor pages

## Students & Classes
- [ ] Add/edit/delete student
- [ ] Search students
- [ ] Add/edit/delete class
- [ ] Enroll student in class
- [ ] Duplicate enrollment blocked

## Devices
- [ ] Student device request created on login
- [ ] Tutor approves device
- [ ] Tutor rejects device with reason
- [ ] Unapproved device cannot mark attendance

## QR Attendance
- [ ] Generate QR for class
- [ ] Countdown timer works
- [ ] Student scans and marks attendance
- [ ] Expired QR blocked
- [ ] Duplicate scan shows "already marked"
- [ ] Close session creates absent records

## Manual Attendance
- [ ] Manual update with reason
- [ ] Reason required validation
- [ ] Student cannot manual update

## Fees
- [ ] Add paid/unpaid/partial/overdue records
- [ ] Duplicate monthly fee blocked
- [ ] Filter and view unpaid students

## Reminders
- [ ] WhatsApp link opens with message
- [ ] Phone link opens dialer
- [ ] Confirm reminder sent saves history
- [ ] Missing parent phone blocked

## Reports & Settings
- [ ] Attendance report loads
- [ ] Fee report loads
- [ ] Print button works
- [ ] Settings save (QR time, templates)

## Mobile
- [ ] Bottom nav works on mobile
- [ ] Student attendance flow on phone browser
- [ ] Tables show card layout on mobile

## Deployment
- [ ] Vercel health endpoint works
- [ ] Netlify frontend calls Vercel API
- [ ] Production login works
- [ ] QR links use production Netlify URL
