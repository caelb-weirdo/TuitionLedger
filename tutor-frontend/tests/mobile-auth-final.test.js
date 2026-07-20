import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("loads final responsive overrides after the legacy stylesheet", () => {
  const main = source("../src/main.js");
  assert.match(main, /import "\.\/responsive\.css";/);
  assert.equal(existsSync(new URL("../src/responsive.css", import.meta.url)), true);
});

test("keeps tutor navigation and account actions available through tablet widths", () => {
  const css = source("../src/responsive.css");
  const layout = source("../src/pages/layout.js");
  const pwa = source("../src/pwa.js");
  assert.match(css, /@media\s*\(max-width:\s*850px\)/);
  assert.match(css, /\.app-shell\s*>\s*\.mobile-navigation[\s\S]*?display:\s*grid/);
  assert.match(layout, /mobile-account-menu/);
  assert.match(layout, /data-sign-out/);
  assert.match(layout, /data-install-app/);
  assert.match(pwa, /querySelectorAll\("\[data-install-app\]"\)/);
});

test("removes narrow-screen overflow from auth, fees, classes, QR, and student rows", () => {
  const css = source("../src/responsive.css");
  assert.match(css, /\.auth-shell[\s\S]*?overflow-y:\s*auto/);
  assert.match(css, /\.fee-breakdown\s*>\s*div[\s\S]*?min-width:\s*0/);
  assert.match(css, /\.qr-session-heading[\s\S]*?flex-direction:\s*column/);
  assert.match(css, /\.class-mini-actions[\s\S]*?flex-direction:\s*column/);
  assert.match(css, /\.student-directory-row\s*>\s*span:nth-child\(2\)[\s\S]*?display:\s*inline-flex\s*!important/);
});

test("auth pages support safe signup, recovery, reset, and mobile autofill", () => {
  const auth = source("../src/pages/auth.js");
  const main = source("../src/main.js");
  assert.match(auth, /confirm_password/);
  assert.match(auth, /"new-password"/);
  assert.match(auth, /"current-password"/);
  assert.match(auth, /#forgot-password/);
  assert.match(auth, /\/api\/auth\/request-password-reset/);
  assert.match(auth, /\/api\/auth\/reset-password/);
  assert.match(auth, /form-notice success/);
  assert.match(main, /forgot-password/);
  assert.match(main, /reset-password/);
  assert.match(main, /params\.get\("type"\) !== "recovery"/);
});

test("backend exposes Supabase password recovery without changing existing auth calls", () => {
  const core = source("../../backend/core.py");
  const auth = source("../../backend/routes/auth.py");
  assert.match(core, /def auth_call\(path, payload, method="POST", token=None\):/);
  assert.match(auth, /@auth_routes\.post\("\/api\/auth\/request-password-reset"\)/);
  assert.match(auth, /@auth_routes\.post\("\/api\/auth\/reset-password"\)/);
  assert.match(auth, /auth_call\("\/auth\/v1\/user", \{"password": password\}, method="PUT", token=token\)/);
});


test("uses unique SVG gradient ids for desktop and mobile navigation", () => {
  const layout = source("../src/pages/layout.js");

  assert.match(
    layout,
    /const gradientId = `\$\{scope\}-\$\{key\}-glass`;/,
  );
  assert.match(layout, /navigation\(page, "sidebar"\)/);
  assert.match(layout, /navigation\(page, "mobile"\)/);
  assert.doesNotMatch(layout, /id="\$\{key\}-glass"/);
});
