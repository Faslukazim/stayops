# Auth + Multi-Tenancy Cutover Plan

This change adds Supabase Auth and rewrites every table's Row Level Security
(RLS) so data is scoped to the organization a signed-in user belongs to. It is
the unlock for onboarding a second paying customer without exposing StayB's data.

**Read this whole file before running anything.** The migration intentionally
locks the live app to logged-in users only. If you run the SQL without doing the
frontend deploy and the one-time org link, the live StayB app will show empty
screens until you finish the steps below.

---

## What changed in the code

New files
- `supabase/migrations/003_auth_and_rls.sql` — memberships table, access helper
  functions, `create_organization` RPC, org column + backfill trigger on
  expenses / cash_flow_items, and org-scoped RLS policies on every table.
- `src/services/authService.js` — sign in / up / out, session, memberships,
  create-organization RPC wrapper.
- `src/AuthPage.jsx` — email/password login + signup screen.
- `src/OnboardingPage.jsx` — first-run "create your organization" screen.
- `src/Root.jsx` — gates the app: shows AuthPage → OnboardingPage → App.

Changed files
- `src/main.jsx` — renders `<Root />` instead of `<App />`.
- `src/App.jsx` — accepts `session` / `organizationName` / `onSignOut`; adds a
  sign-out button to the header. (Runs unchanged in local/no-Supabase mode.)

No changes were needed to the data-access services: under the new RLS, all
existing queries are filtered automatically by the signed-in user's org.

---

## Pre-flight

1. **Confirm Supabase Auth is enabled** (it is by default).
   Dashboard → Authentication → Providers → Email = enabled.
2. **Decide on email confirmation.** For a fast MVP you can turn it OFF so new
   signups get a session immediately:
   Dashboard → Authentication → Providers → Email → "Confirm email" = off.
   If you leave it ON, new users must click the email link before they can sign
   in (the signup screen handles this and tells them to check their email).
3. **Back up** (optional but smart): Dashboard → Database → Backups, or just note
   that the migration is wrapped in a transaction and ships with a rollback block.

---

## Cutover steps (do them in this order)

### 1. Apply the migration

Supabase Dashboard → SQL Editor → New query → paste the full contents of
`supabase/migrations/003_auth_and_rls.sql` → Run.

It must run **after** all earlier migrations (the core schema, payment_records,
expenses, cash_flow_items, rent_due_day). It is idempotent and guards every
optional table with `IF EXISTS`, so re-running is safe.

> At this moment the live app (anon, no login) will return empty data. That is
> expected. Finish the next steps.

### 2. Deploy the auth-enabled frontend

Push to the branch Vercel deploys (your normal flow). Verify the build first:

```bash
npm run build
```

Once deployed, opening the app now shows the **Sign in** screen.

### 3. Create your account

On the deployed site, click **Create an account** and sign up with your email.
(If email confirmation is ON, confirm via the email link, then sign in.)

After signing in you'll land on the **Create your organization** screen —
**do not complete it yet** if you want to attach the EXISTING StayB data.
Leave it, and do step 4 first.

### 4. Link your account to the existing StayB organization (one-time)

Your live data already belongs to an organization row created by the original
schema migration. Link your new user to it so you see it. In SQL Editor:

```sql
-- 1) find your user id and the org name
select id, email from auth.users;
select id, name  from public.organizations;

-- 2) insert the owner membership (edit email + org name to match)
insert into public.memberships (organization_id, user_id, role)
select o.id, u.id, 'owner'
from public.organizations o
cross join auth.users u
where u.email = 'you@example.com'
  and o.name  = 'StayB'
on conflict (organization_id, user_id) do nothing;
```

Refresh the app. You should now see StayB's properties, rooms, tenants and
finance exactly as before — now behind a login.

> If your live org is named something else (e.g. "Default Organization"),
> use that name. If you have two orgs and want both, run the insert for each,
> or consolidate first.

### 5. Verify isolation (the whole point)

1. Open an incognito window, sign up as a **second** test user.
2. It should land on the onboarding screen and, after creating a throwaway org,
   see an empty workspace — **none** of StayB's data.
3. Back in your main session, confirm you still see only StayB.
4. Delete the test user later if you want: Dashboard → Authentication → Users.

If the second user can see StayB data, **stop** and re-check that the migration
ran fully (every `create policy` succeeded) before letting anyone else in.

---

## Rollback

If something is wrong and you need the app working immediately, the migration
file ends with a commented rollback block that drops the new policies and
restores open `using (true)` access. Uncomment, fill in every table, and run.
This reopens the database to the anon key — use only as an emergency measure.

---

## Known follow-ups (not in this change)

- **No in-app room/bed creation yet.** A brand-new org gets a property but no
  rooms, and the app can't add them from the UI — rooms/beds are still seeded
  via SQL. This is the next piece needed for true self-serve onboarding of a
  second customer.
- **Activity feed is still localStorage-only** (`activityService.js`) — per
  device, not shared, and not org-scoped server-side.
- **Team invites:** the schema supports `manager` / `staff` roles and an
  owner-only membership insert policy, but there's no invite UI yet.
- **P&L is recomputed from current state**, not an immutable ledger (admission
  income derives from current tenant rows). Worth hardening before customers
  rely on historical month figures.

---

## Note on local verification

The app's `node_modules` holds Windows-native binaries, so the production build
could not be run inside the Linux assistant sandbox. Syntax was validated per
file, but **run `npm run build` locally as the final gate before deploying.**
