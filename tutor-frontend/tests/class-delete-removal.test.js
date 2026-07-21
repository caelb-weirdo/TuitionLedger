import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const classesSource = readFileSync(
  new URL("../src/pages/classes.js", import.meta.url),
  "utf8",
);

test("class manager allows editing without exposing class deletion", () => {
  assert.match(classesSource, /data-edit/);
  assert.doesNotMatch(classesSource, /data-delete/);
  assert.doesNotMatch(
    classesSource,
    /api\(`\/api\/classes\/\$\{classItem\.id\}`,\s*\{\s*method:\s*"DELETE"/,
  );
});
