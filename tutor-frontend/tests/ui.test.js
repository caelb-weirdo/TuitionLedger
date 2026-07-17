import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  attendanceSummary,
  filterAttendance,
  filterFees,
  formatCurrency,
  formatDate,
  formatMonth,
} from "../src/ui.js";

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
  const css = readFileSync(
    new URL("../src/style.css", import.meta.url),
    "utf8",
  );
  assert.match(
    css,
    /\.app-shell\s*>\s*\.mobile-navigation\s*{\s*display:\s*none;/,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*700px\)[\s\S]*?\.app-shell\s*>\s*\.mobile-navigation\s*{[\s\S]*?display:\s*grid;/,
  );
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

test("places global runtime errors inside the visible workspace", () => {
  const source = readFileSync(
    new URL("../src/runtime-error-boundary.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /app\.querySelector\("\.workspace"\)/);
  assert.match(source, /workspaceHeader\.after\(notice\)/);
  assert.doesNotMatch(source, /app\.prepend\(notice\)/);
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
  const css = readFileSync(
    new URL("../src/style.css", import.meta.url),
    "utf8",
  );
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
  const css = readFileSync(
    new URL("../src/style.css", import.meta.url),
    "utf8",
  );
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
  const css = readFileSync(
    new URL("../src/style.css", import.meta.url),
    "utf8",
  );
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
