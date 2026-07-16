# PWA Review

## Tutor frontend

- Manifest, SVG icons, standalone display metadata, and install-prompt handling are present.
- The tutor service worker caches only the application shell and static assets.
- Navigation falls back to a read-only offline page.
- `/api/` requests are never intercepted or cached, so offline mode cannot pretend a database write succeeded.
- Old tutor cache versions are removed on activation.
- A newly installed worker emits an update-ready event for future UI handling.

## Student website

- No manifest, service-worker file, registration, or install prompt exists.
- Startup explicitly unregisters old same-origin service workers and removes old student/mobile cache names.
- The site remains a focused responsive website for registration, connection, and attendance only.

## Deployment checks still required

- Verify tutor installation and offline fallback on the production origin.
- Verify the student origin has no active worker in normal browsing and Incognito.
- Verify both origins load the newest asset hashes after deployment.
