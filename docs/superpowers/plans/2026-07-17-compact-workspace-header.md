# Compact Workspace Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the height of the shared authenticated tutor page header so every management page exposes more working content.

**Architecture:** Keep the existing header markup and Frosted Touch surface unchanged. Add narrowly scoped responsive rules in the shared tutor stylesheet and protect them with a lightweight CSS contract test.

**Tech Stack:** Vanilla JavaScript, CSS, Node test runner, Vite, Playwright.

## Global Constraints

- Apply only to `.workspace-header` inside the authenticated tutor workspace.
- Desktop title: 30px with 1.15 line height; mobile title: 26px.
- Desktop padding: 14px 20px; mobile padding: 12px 16px.
- Breadcrumb margin: 0 0 6px.
- Preserve existing colours, rounded corners, Frosted Touch surface, and responsive behaviour.

---

### Task 1: Compact the shared tutor workspace header

**Files:**
- Modify: `tutor-frontend/tests/ui.test.js`
- Modify: `tutor-frontend/src/style.css`

**Interfaces:**
- Consumes: Existing `.workspace-header`, `.workspace-header h1`, and `.workspace-header .kicker` markup from `tutor-frontend/src/pages/layout.js`.
- Produces: A compact shared page header on every authenticated tutor route.

- [x] **Step 1: Write the failing CSS contract test**

Add a test that reads `src/style.css` and asserts the shared header contains `padding: 14px 20px`, the title contains `font-size: 30px` and `line-height: 1.15`, the breadcrumb contains `margin: 0 0 6px`, and the max-700px rule contains `padding: 12px 16px` and a 26px title.

- [x] **Step 2: Run the focused frontend tests and verify the new test fails**

Run: `npm --prefix tutor-frontend test`

Expected: Existing tests pass and the new compact-header contract test fails because the exact rules are absent.

- [x] **Step 3: Add the minimal shared CSS rules**

Add narrowly scoped desktop rules and a max-700px responsive override in `tutor-frontend/src/style.css`. Do not change global `h1` or `.kicker` styles.

- [x] **Step 4: Format and verify the implementation**

Run: `npm exec --prefix tutor-frontend -- prettier --write src/style.css tests/ui.test.js`

Run: `npm --prefix tutor-frontend test`

Run: `npm --prefix tutor-frontend run build`

Expected: Formatting succeeds, all tests pass, and the Vite production build exits successfully.

- [x] **Step 5: Verify responsive geometry in a browser**

Check the dashboard and students page at 1440x900 and 390x844. Confirm the header is shorter than before, its computed title and padding match the contract, and `document.documentElement.scrollWidth` does not exceed the viewport width.

- [x] **Step 6: Commit and publish**

Stage only the plan, CSS, and UI test. Commit with `fix: compact workspace headers`, push `main`, wait for the tutor Vercel production deployment to become Ready, and repeat the geometry check against the live alias.
