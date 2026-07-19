import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  attendanceSummary,
  filterAttendance,
  filterFees,
  formatCurrency,
  formatDate,
  formatMonth,
} from "../src/ui.js";
import { classAvailability, normalizeSriLankanPhone } from "../src/core/schedule.js";

test("calculates advisory class availability in Colombo time", () => {
  const classItem = { day: 1, start_time: "16:00", end_time: "18:00" };
  assert.equal(classAvailability(classItem, new Date("2026-07-20T10:00:00Z")).state, "available");
  assert.equal(classAvailability(classItem, new Date("2026-07-20T09:59:00Z")).state, "upcoming");
  assert.equal(classAvailability(classItem, new Date("2026-07-21T10:30:00Z")).state, "upcoming");
});

test("normalizes supported Sri Lankan phone formats", () => {
  for (const value of ["0771234567", "771234567", "+94771234567"]) {
    assert.equal(normalizeSriLankanPhone(value), "+94771234567");
  }
  assert.throws(() => normalizeSriLankanPhone("123"));
});

test("formats Sri Lankan dates, months, and currency consistently", () => {
  assert.equal(formatDate("2026-07-17"), "17 July 2026");
  assert.equal(formatMonth("2026-07"), "July 2026");
  assert.equal(formatCurrency(2500), "Rs. 2,500.00");
});

test("filters attendance and calculates displayed totals", () => {
  const rows = [
    { attendance_date: "2026-07-17", status: "Present" },
    { attendance_date: "2026-07-17", status: "Absent" },
    { attendance_date: "2026-07-16", status: "Present" },
  ];
  assert.equal(filterAttendance(rows, "2026-07-17", "Present").length, 1);
  assert.deepEqual(
    attendanceSummary(filterAttendance(rows, "2026-07-17", "")),
    { expected: 2, present: 1, absent: 1, percentage: 50 },
  );
});

test("filters fee rows by student, class, and payment status", () => {
  const rows = [
    {
      full_name: "Enus Caleb",
      student_code: "STU001",
      payment_status: "Unpaid",
      fees: [{ class_name: "Grade 10 Maths" }],
    },
    {
      full_name: "Nimal Silva",
      student_code: "STU002",
      payment_status: "Paid",
      fees: [{ class_name: "Grade 11 Science" }],
    },
  ];
  assert.deepEqual(
    filterFees(rows, {
      search: "caleb",
      status: "Unpaid",
      className: "Grade 10 Maths",
    }),
    [rows[0]],
  );
});

test("keeps mobile navigation out of desktop document flow", () => {
  const css = readFileSync(new URL("../src/app.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.app-shell\s*>\s*\.mobile-navigation\s*{\s*display:\s*none;/,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*700px\)[\s\S]*?\.app-shell\s*>\s*\.mobile-navigation\s*{[\s\S]*?display:\s*grid;/,
  );
});

test("uses one consolidated tutor stylesheet", () => {
  assert.equal(existsSync(new URL("../src/app.css", import.meta.url)), true);
  for (const file of [
    "style.css",
    "logo.css",
    "password.css",
    "theme-overrides.css",
  ]) {
    assert.equal(existsSync(new URL(`../src/${file}`, import.meta.url)), false);
  }
});

test("renders the fee reminder as an accessible WhatsApp icon", () => {
  const source = readFileSync(
    new URL("../src/pages/fees.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /const whatsappIcon\s*=\s*`<svg/);
  assert.match(source, /aria-label="Open prepared WhatsApp reminder"/);
  assert.doesNotMatch(source, /data-whatsapp>WhatsApp<\/button>/);
  assert.match(source, /window\.location\.assign\(result\.url\)/);
  assert.doesNotMatch(source, /window\.open\(result\.url/);
});

test("logs global runtime failures without hiding browser errors", () => {
  const source = readFileSync(
    new URL("../src/main.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /window\.addEventListener\("error"/);
  assert.match(source, /window\.addEventListener\("unhandledrejection"/);
  assert.match(source, /console\.error/);
  assert.doesNotMatch(source, /preventDefault\(\)/);
});

test("renders sidebar icons directly and preserves the students badge", () => {
  const layout = readFileSync(
    new URL("../src/pages/layout.js", import.meta.url),
    "utf8",
  );
  assert.match(layout, /function iconSvg\(/);
  assert.match(layout, /data-pending-badge/);
  assert.match(layout, /\$\{iconSvg\(id\)\}/);
  assert.equal(
    existsSync(new URL("../src/sidebar-icons.js", import.meta.url)),
    false,
  );
});

test("routes landing section hashes back to the landing page", () => {
  const source = readFileSync(
    new URL("../src/main.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /landingSections/);
  assert.match(source, /scrollIntoView/);
  for (const section of ["features", "flow", "preview", "faq"]) {
    assert.match(source, new RegExp(`"${section}"`));
  }
});

test("does not load removed DOM workaround scripts", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const file of [
    "text-sanitizer.js",
    "runtime-error-boundary.js",
    "request-loading.js",
    "shadcn-skeletons.js",
    "sidebar-icons.js",
  ]) {
    assert.doesNotMatch(html, new RegExp(file));
    assert.equal(existsSync(new URL(`../src/${file}`, import.meta.url)), false);
  }
});

test("renders attendance as compact student directory rows", () => {
  const source = readFileSync(
    new URL("../src/pages/attendance.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /attendance-directory-head/);
  assert.match(source, /attendance-directory-row record-card/);
});

test("uses the full desktop width without a sidebar divider", () => {
  const css = readFileSync(new URL("../src/app.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.app-shell\s*>\s*\.workspace\s*{[\s\S]*?max-width:\s*none;[\s\S]*?width:\s*calc\(100%\s*-\s*235px\);/,
  );
  assert.match(
    css,
    /\.app-shell\s*>\s*aside\s*{[\s\S]*?border-right:\s*0\s*!important;[\s\S]*?box-shadow:\s*none\s*!important;/,
  );
});

test("uses compact shared workspace headers", () => {
  const css = readFileSync(new URL("../src/app.css", import.meta.url), "utf8");
  assert.match(css, /\.workspace-header\s*{[\s\S]*?padding:\s*14px 20px;/);
  assert.match(
    css,
    /\.workspace-header h1\s*{[\s\S]*?font-size:\s*30px;[\s\S]*?line-height:\s*1\.15;/,
  );
  assert.match(
    css,
    /\.workspace-header \.kicker\s*{[\s\S]*?margin:\s*0 0 6px;/,
  );
  assert.match(
    css,
    /@media \(max-width:\s*700px\)\s*{[\s\S]*?\.workspace-header\s*{[\s\S]*?padding:\s*12px 16px;[\s\S]*?\.workspace-header h1\s*{[\s\S]*?font-size:\s*26px;/,
  );
});

test("keeps all five mobile navigation items inside narrow screens", () => {
  const css = readFileSync(new URL("../src/app.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.app-shell\s*>\s*\.mobile-navigation\s*{[\s\S]*?grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.match(css, /\.mobile-navigation a\s*{[\s\S]*?min-width:\s*0;/);
});

test("refreshes approved students without replacing QR or approvals", () => {
  const source = readFileSync(
    new URL("../src/pages/students.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /id="registration-qr-output"/);
  assert.match(source, /id="approval-content"/);
  assert.match(source, /id="approved-student-content"/);
  assert.match(source, /async function refreshApprovedStudents\(\)/);
  assert.match(
    source,
    /querySelector\("#refresh-approved-students"\)\.onclick\s*=\s*refreshApprovedStudents/,
  );
  assert.doesNotMatch(
    source,
    /querySelector\("#refresh-approved-students"\)\.onclick\s*=\s*\(\)\s*=>\s*{[\s\S]*?studentsPage\(\)/,
  );
});

test("routes pending registrations to a full review page", () => {
  const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  const students = readFileSync(
    new URL("../src/pages/students.js", import.meta.url),
    "utf8",
  );
  const detail = readFileSync(
    new URL("../src/pages/registration-request.js", import.meta.url),
    "utf8",
  );
  assert.match(main, /"registration-request":\s*registrationRequestPage/);
  assert.match(students, /#registration-request\?request=\$\{request\.id\}/);
  assert.match(detail, /export async function registrationRequestPage\(\)/);
  for (const field of [
    "Student phone",
    "Guardian name",
    "Guardian WhatsApp",
    "Grade",
    "Status",
    "Submitted",
  ]) {
    assert.match(detail, new RegExp(field));
  }
  assert.match(detail, /data-approve-request/);
  assert.match(detail, /data-reject-request/);
});

test("keeps attendance correction form state valid across async requests", () => {
  const source = readFileSync(
    new URL("../src/pages/attendance.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /id="correction-notice"/);
  assert.match(source, /const form = event\.currentTarget;/);
  assert.match(source, /dialogNotice\.textContent = error\.message;/);
  assert.doesNotMatch(
    source,
    /await api\("\/api\/attendance\/manual"[\s\S]*?event\.currentTarget\.reset\(\)/,
  );
});

test("loads the dashboard through one summary endpoint", () => {
  const source = readFileSync(
    new URL("../src/pages/dashboard.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /api\("\/api\/dashboard"/);
  for (const oldPath of [
    "/api/students",
    "/api/classes",
    "/api/registration-requests",
    "/api/fees",
  ]) {
    assert.doesNotMatch(source, new RegExp(`api\\(\\"${oldPath}`));
  }
});

test("loads class rosters only when Manage is opened", () => {
  const source = readFileSync(
    new URL("../src/pages/classes.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /classItem\.student_count/);
  assert.match(source, /async function openManager/);
  assert.match(source, /api\(`\/api\/classes\/\$\{classItem\.id\}\/students`/);
  assert.doesNotMatch(source, /classes\.map\(async/);
});

test("loads single resources for QR and registration details", () => {
  const qr = readFileSync(
    new URL("../src/pages/qr-session.js", import.meta.url),
    "utf8",
  );
  const registration = readFileSync(
    new URL("../src/pages/registration-request.js", import.meta.url),
    "utf8",
  );
  assert.match(qr, /api\(`\/api\/classes\/\$\{classId\}`/);
  assert.doesNotMatch(qr, /api\("\/api\/classes"\)/);
  assert.match(
    registration,
    /api\(\s*`\/api\/registration-requests\/\$\{requestId\}`/,
  );
  assert.doesNotMatch(registration, /api\("\/api\/registration-requests"/);
});

test("loads fee ledger without a separate ensure request", () => {
  const source = readFileSync(
    new URL("../src/pages/fees.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\/api\/fees\/ensure/);
  assert.doesNotMatch(source, /fees-ready/);
  assert.match(source, /\/api\/fees\/ledger\?month=/);
});

test("builds same-origin student flow links", async () => {
  const { buildStudentUrl } = await import("../src/core/student-links.js");
  assert.equal(
    buildStudentUrl("https://tuitionledger.example", {
      connect: "true",
      tutor: "tutor-123",
    }),
    "https://tuitionledger.example/?connect=true&tutor=tutor-123",
  );
  assert.equal(
    buildStudentUrl("https://tuitionledger.example/", {
      attendance_token: "a token",
    }),
    "https://tuitionledger.example/?attendance_token=a+token",
  );
});

test("shows a replacement-browser QR after browser reset", () => {
  const source = readFileSync(
    new URL("../src/pages/student-detail.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /import QRCode from "qrcode"/);
  assert.match(source, /buildStudentUrl/);
  assert.match(source, /connect:\s*"true"/);
  assert.match(source, /data-browser-connect/);
  assert.match(source, /Copy connection link/);
});

test("marks QR sessions expired and protects action buttons", () => {
  const source = readFileSync(
    new URL("../src/pages/qr-session.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /function expireSession/);
  assert.match(source, /Session expired/);
  assert.match(source, /status-pill[^`]*Expired/);
  assert.match(source, /button\.disabled = true/);
  assert.match(source, /button\.disabled = false/);
});

test("routes student query links into the combined frontend", () => {
  const source = readFileSync(
    new URL("../src/main.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /isStudentFlow/);
  assert.match(source, /registration_token/);
  assert.match(source, /attendance_token/);
  assert.match(source, /query\.get\("connect"\) === "true"/);
  assert.match(source, /import\("\.\/student\/main\.js"\)/);
  assert.match(source, /else \{[\s\S]*registerTutorPwa\(\)/);
});

test("uses progressively slower approval polling", async () => {
  const { approvalPollDelay } = await import("../src/student/polling.js");
  assert.equal(approvalPollDelay(0), 5_000);
  assert.equal(approvalPollDelay(59_999), 5_000);
  assert.equal(approvalPollDelay(60_000), 15_000);
  assert.equal(approvalPollDelay(299_999), 15_000);
  assert.equal(approvalPollDelay(300_000), 30_000);
});

test("merged student flow keeps the tutor service worker intact", () => {
  const source = readFileSync(
    new URL("../src/student/main.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /getRegistrations|unregister\(|caches\.keys/);
  assert.match(source, /Check Approval Now/);
  assert.match(source, /approvalPollDelay/);
});

test("uses one frontend project for tutor and student flows", () => {
  const config = readFileSync(
    new URL("../src/core/config.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(config, /VITE_STUDENT_APP_URL|studentUrl/);
  assert.equal(
    existsSync(new URL("../../student-mobile", import.meta.url)),
    false,
  );
});

test("classes page filters available students by grade", () => {
  const source = readFileSync(
    new URL("../src/pages/classes.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /student\.grade === classItem\.grade/);
  assert.match(source, /No available.*students for this class/);
});

test("attendance launch uses server authority and a controlled extra-session flow", () => {
  const source = readFileSync(new URL("../src/pages/qr-session.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /name="attendance_date"/);
  assert.match(source, /OUTSIDE_CLASS_SCHEDULE/);
  assert.match(source, /Start extra session/);
  assert.match(source, /override_reason/);
  assert.match(source, /requestFullscreen/);
  assert.match(source, /exitFullscreen/);
  assert.match(source, /fullscreenchange/);
  assert.match(source, /expires_at/);
  assert.match(source, /View Attendance/);
});

test("important tutor actions use explicit labels", () => {
  const classes = readFileSync(new URL("../src/pages/classes.js", import.meta.url), "utf8");
  const attendance = readFileSync(new URL("../src/pages/attendance.js", import.meta.url), "utf8");
  assert.doesNotMatch(classes, />Start QR</);
  assert.match(classes, /Start Attendance/);
  assert.doesNotMatch(attendance, />Change</);
  assert.match(attendance, /Mark \$\{record\.status === "Present" \? "Absent" : "Present"\}/);
  assert.match(attendance, /Reset date and status/);
});

test("mobile fees expose essential card data without an 850px table", () => {
  const fees = readFileSync(new URL("../src/pages/fees.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/app.css", import.meta.url), "utf8");
  assert.match(fees, /fee-mobile-label/);
  assert.match(fees, /WhatsApp reminder/);
  assert.match(fees, /sort-direction/);
  assert.doesNotMatch(css, /min-width:\s*850px/);
});

test("students page uses keyboard-accessible progressive disclosure", () => {
  const source = readFileSync(new URL("../src/pages/students.js", import.meta.url), "utf8");
  assert.match(source, /role="tablist"/);
  assert.match(source, /role="tab"/);
  assert.match(source, /aria-selected/);
  assert.match(source, /pending-count/);
});

test("browser approvals support explicit selection and bulk approval", () => {
  const source = readFileSync(new URL("../src/pages/students.js", import.meta.url), "utf8");
  assert.match(source, /data-browser-select/);
  assert.match(source, /Approve selected/);
  assert.match(source, /\/api\/browser-requests\/bulk-approve/);
});

test("active QR sessions securely poll progress and render recent scans", () => {
  const source = readFileSync(new URL("../src/pages/qr-session.js", import.meta.url), "utf8");
  assert.match(source, /attendance-sessions\/\$\{session\.id\}\/progress/);
  assert.match(source, /recent_scans/);
  assert.match(source, /data-present-count/);
  assert.match(source, /5000/);
});
