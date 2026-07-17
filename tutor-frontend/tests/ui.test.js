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
});
