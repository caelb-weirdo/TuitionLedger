# Push the TuitionLedger Cleanup Branch

## Recommended: apply the commit-preserving patch

Place `TuitionLedger-cleanup-commits.patch` beside your normal GitHub clone, then run:

```bash
cd TuitionLedger
git checkout main
git pull origin main
git checkout -b cleanup/code-reduction-audit
git am ../TuitionLedger-cleanup-commits.patch
git push -u origin cleanup/code-reduction-audit
```

Then open GitHub and create a Pull Request:

```text
base: main
compare: cleanup/code-reduction-audit
```

Suggested PR title:

```text
Refactor TuitionLedger to reduce code and use two deployments
```

## If `git am` reports a mismatch

The uploaded ZIP may differ from the current remote `main`. Abort the partial apply:

```bash
git am --abort
```

Then use the ready project ZIP instead:

1. Extract `TuitionLedger-cleanup-branch.zip`.
2. Copy its project files over a fresh clone, excluding the clone's `.git` folder.
3. Run:

```bash
git checkout -b cleanup/code-reduction-audit
git add -A
git commit -m "refactor: reduce TuitionLedger complexity and merge frontend deployments"
git push -u origin cleanup/code-reduction-audit
```

## Before production deployment

1. Apply `supabase/migrations/20260718080000_allow_fifteen_minute_sessions.sql` in Supabase.
2. Deploy the `backend` Vercel project.
3. Deploy the `tutor-frontend` Vercel project.
4. Test Registration QR, browser replacement, and 5/10/15-minute attendance QR links.
5. Delete the old Student Vercel project only after those checks pass.
