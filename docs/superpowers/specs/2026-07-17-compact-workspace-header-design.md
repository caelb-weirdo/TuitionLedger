# Compact Workspace Header Design

## Goal

Give every tutor management page more usable vertical space by reducing the shared workspace header from its current oversized presentation to a compact-medium size.

## Scope

- Apply the change only to the authenticated tutor workspace header rendered by `layout.js`.
- Keep the breadcrumb and page title on every page.
- Preserve the existing Frosted Touch background, rounded corners, colours, and typography family.
- Do not alter landing-page, authentication-page, section, dialog, or record headings.

## Visual Design

- Set the page title to 30px with a 1.15 line height on desktop and 26px on screens up to 700px.
- Set the header padding to 14px 20px on desktop and 12px 16px on screens up to 700px.
- Set the breadcrumb margin to 0 0 6px.
- Retain enough internal spacing for the header to remain clearly separate from page content.
- Preserve responsive wrapping and prevent horizontal overflow at 360px and wider.

## Implementation

Use narrowly scoped `.workspace-header` rules in the shared tutor stylesheet. Avoid changing the global `h1` or `.kicker` rules because those are reused outside the management header.

## Verification

- Add a lightweight CSS contract test for the compact shared header values.
- Run tutor frontend tests and its production build.
- Check the dashboard and another management page at desktop and mobile widths.
- Confirm the header consumes less height and introduces no horizontal overflow.
