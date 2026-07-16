# Authentication Review

## Implemented contract

- Tutor signup and login are handled by Supabase Auth through Flask.
- Protected endpoints require a Bearer access token and derive tutor identity from the verified Supabase user response.
- Client-provided tutor IDs are not used by protected routes.
- The tutor client stores the Supabase access/refresh session in local browser storage, refreshes once after a `401`, and clears the session when refresh fails or the tutor signs out.
- Students have no accounts, passwords, or Supabase Auth users.
- Auth calls use a 10-second server timeout; frontend API calls use a 12-second timeout.
- Tokens, passwords, database URLs, and keys are not deliberately logged.

## Deployment checks still required

- Confirm email confirmation settings and the production redirect allow-list in Supabase Auth.
- Confirm `AUTH_REDIRECT_URL` is the tutor production `/#login` URL.
- Run login, refresh-after-expiry, reload persistence, logout, invalid-password, and expired-session checks on the deployed tutor origin.

## Boundary

The current browser session is persistent on that browser. It is not a server-managed application session and does not turn students into authenticated users.
