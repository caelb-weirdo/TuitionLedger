import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testsDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testsDirectory, "..");
const tutorCss = readFileSync(resolve(frontendRoot, "src/app.css"), "utf8");
const studentCss = readFileSync(
  resolve(frontendRoot, "src/student/student.css"),
  "utf8",
);

test("tutor dropdowns use high-contrast controls and option lists", () => {
  assert.match(tutorCss, /select\s*\{[^}]*color-scheme:\s*dark;/s);
  assert.match(
    tutorCss,
    /select option,\s*select optgroup\s*\{[^}]*background-color:\s*#f7f8f6\s*!important;[^}]*color:\s*#07110f\s*!important;/s,
  );
  assert.match(
    tutorCss,
    /select:focus,\s*select:focus-visible\s*\{[^}]*border-color:\s*#d6bc7a\s*!important;/s,
  );
});

test("student registration dropdowns use high-contrast option lists", () => {
  assert.match(studentCss, /select\s*\{[^}]*color-scheme:\s*dark;/s);
  assert.match(
    studentCss,
    /select option,\s*select optgroup\s*\{[^}]*background-color:\s*#ffffff\s*!important;[^}]*color:\s*#111827\s*!important;/s,
  );
  assert.match(
    studentCss,
    /select:focus,\s*select:focus-visible\s*\{[^}]*border-color:\s*var\(--gold\)\s*!important;/s,
  );
});
