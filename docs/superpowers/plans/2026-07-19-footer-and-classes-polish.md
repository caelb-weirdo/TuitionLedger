# Footer and Classes Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessible footer-link icons, simplify the fixed Classes catalogue, improve class-card spacing, and set the ten approved live class fees to LKR 1,200.

**Architecture:** Keep changes within the existing vanilla-JavaScript page modules and shared stylesheet. Preserve the class edit dialog but remove its create entry point. Apply fees through one narrow imperative Supabase migration, then verify local behavior, responsive rendering, Git parity, and both Vercel projects.

**Tech Stack:** Vanilla JavaScript, CSS, Node test runner, Vite, Flask/Pytest, PostgreSQL/Supabase, Playwright, GitHub, Vercel.

## Global Constraints

- Do not recreate class rows or run `supabase/schema.sql` against live Supabase.
- Preserve class editing, enrolment, attendance, archive, and roster behavior.
- Keep the availability wording and scheduling rules unchanged.
- Set exactly the approved active Grade 10 and Grade 11 Maths, Science, English, Tamil, and History classes to LKR 1,200 per month.
- Preserve responsive behavior and 44-pixel minimum interactive targets.

---

### Task 1: Footer icons

**Files:**
- Modify: `tutor-frontend/src/pages/landing.js`
- Modify: `tutor-frontend/src/app.css`
- Test: `tutor-frontend/tests/ui.test.js`

**Interfaces:**
- Consumes: Existing landing-page footer navigation anchors.
- Produces: Four `.footer-link` anchors containing decorative inline SVGs and unchanged visible labels.

- [ ] **Step 1: Write the failing footer test**

Add assertions that the landing source contains four `footer-link` anchors, four `aria-hidden="true"` SVG icons, and the existing destinations `#features`, `#flow`, `#login`, and `#faq`.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- --test-name-pattern="footer links"`
Expected: FAIL because `.footer-link` and its icons do not exist.

- [ ] **Step 3: Add the icons and shared styling**

Define the four small outline SVG strings in `landing.js`, place one before each existing label, and add CSS using `display: inline-flex`, `align-items: center`, `gap: 0.45rem`, `min-height: 44px`, and an icon size of `1rem`.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --test-name-pattern="footer links"`
Expected: PASS.

### Task 2: Fixed class catalogue and spacing

**Files:**
- Modify: `tutor-frontend/src/pages/classes.js`
- Modify: `tutor-frontend/src/app.css`
- Test: `tutor-frontend/tests/ui.test.js`

**Interfaces:**
- Consumes: Existing `/api/classes` response and Manage dialog edit flow.
- Produces: A Classes page with no create entry point, a retained edit form, and a `.class-mini-details` spacing wrapper.

- [ ] **Step 1: Write failing class-page tests**

Assert that `classes.js` does not contain `open-class-form` or `+ Add class`, still contains `data-edit` and `Update class`, uses `.class-mini-details`, and no longer tells the tutor to create a first class.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- --test-name-pattern="fixed class catalogue|class card spacing"`
Expected: FAIL on the current create control and missing details wrapper.

- [ ] **Step 3: Remove creation and improve spacing**

Remove the Add Class button and its event handler. Keep the dialog form available only through Manage > Edit details, make submission always call `PUT /api/classes/:id`, revise the empty state to explain that no active classes are available, wrap time/name/availability in `.class-mini-details`, and add deliberate block gaps without changing availability data.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --test-name-pattern="fixed class catalogue|class card spacing"`
Expected: PASS.

### Task 3: Evidence-based live fees

**Files:**
- Create: `supabase/migrations/20260719163000_set_catalogue_class_fees.sql`
- Modify: `docs/DATABASE_MIGRATION_VERIFICATION.md`

**Interfaces:**
- Consumes: Ten existing active class rows for Grade 10/11 and the five approved subjects.
- Produces: Idempotent updates setting `monthly_fee = 1200.00`, plus live verification evidence.

- [ ] **Step 1: Generate the migration using the repository workflow**

Run `supabase migration new set_catalogue_class_fees`, then write a guarded `UPDATE public.classes SET monthly_fee = 1200.00 WHERE status = 'Active' AND grade IN ('Grade 10','Grade 11') AND subject IN ('Maths','Science','English','Tamil','History')`.

- [ ] **Step 2: Validate targeting before mutation**

Run a read-only grouped query returning total targeted rows and distinct current fees. Expected: exactly 10 rows.

- [ ] **Step 3: Apply and verify the migration live**

Apply the migration through the Supabase migration tool. Query the same predicate and require `count(*) = 10`, `count(*) filter (where monthly_fee = 1200) = 10`, and no other fee value.

- [ ] **Step 4: Record verification**

Append the migration name, affected row count, and final fee value to `docs/DATABASE_MIGRATION_VERIFICATION.md`.

### Task 4: Full verification, publish, and deploy proof

**Files:**
- Modify: `docs/superpowers/plans/2026-07-19-footer-and-classes-polish.md` (checkbox completion only)

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: Tested local build, responsive browser evidence, clean pushed `main`, and READY production deployments matching the pushed hash.

- [ ] **Step 1: Run automated checks**

Run frontend tests, `npm run format:check`, `npm run build`, backend Pytest, Python compileall, and `git diff --check`. Expected: all pass.

- [ ] **Step 2: Inspect responsive UI**

Use Playwright at 390 and 1440 pixels for the landing footer and Classes page. Require no horizontal overflow, visible footer icons, readable card spacing, absent Add Class control, and controls at least 40 rendered pixels with CSS minimums of 44 pixels.

- [ ] **Step 3: Commit and push**

Stage only scoped files, commit, push `main`, fetch `origin/main`, and require local `HEAD` to equal `origin/main` with a clean worktree.

- [ ] **Step 4: Verify production**

Require both Vercel projects to report `READY`, `target = production`, and metadata `githubCommitSha` equal to the pushed hash. Probe the frontend alias and backend `/health` for HTTP 200, and confirm the deployed frontend asset contains the new footer-link and fixed-catalogue markers.
