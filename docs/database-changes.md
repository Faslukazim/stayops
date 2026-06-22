# Database Changes

## 001 — `expenses` table

**Why:** The Finance module needs to track operational expenses per property per month.
Without this, P&L is impossible — you can see rent collected but not whether the business is profitable.

**SQL file:** `migrations/001_create_expenses.sql`

**Columns:**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, auto-generated |
| property_id | UUID | FK → properties. NULL = all properties |
| category | TEXT | Enum: building_rent, food, salary, electricity, internet, maintenance, misc |
| amount | NUMERIC(12,2) | Must be ≥ 0 |
| description | TEXT | Optional free-text note |
| expense_date | DATE | Date the expense occurred |
| created_at | TIMESTAMPTZ | Auto-set to NOW() |

**Rollback:** `DROP TABLE IF EXISTS expenses;`

---

## 002 — `cash_flow_items` table

**Why:** Operators need to see upcoming monthly obligations (building rent due on 1st,
salary on 5th, EMI on 10th) alongside pending rent collection — so they know if
they'll have a cash shortfall before it happens.

**SQL file:** `migrations/002_create_cash_flow_items.sql`

**Columns:**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, auto-generated |
| property_id | UUID | FK → properties |
| type | TEXT | Enum: building_rent, salary, emi, other |
| label | TEXT | Display name (e.g. "Building Rent – Main St") |
| amount | NUMERIC(12,2) | Monthly obligation amount |
| due_day | INTEGER | Day of month (1–31) |
| active | BOOLEAN | false = soft-deleted |
| created_at | TIMESTAMPTZ | Auto-set |

**Rollback:** `DROP TABLE IF EXISTS cash_flow_items;`

---

## Execution order

Run in this exact order:
1. `001_create_expenses.sql`
2. `002_create_cash_flow_items.sql`

Both are safe to run multiple times (`CREATE TABLE IF NOT EXISTS`).

---

## 003 — Authentication + org-scoped RLS

**Why:** Every table previously used open `mvp_public` policies (`using (true)`),
so the anon key shipped in the client could read and write all data across all
properties. That blocks onboarding a second customer. This migration adds real
authentication and scopes every table to the signed-in user's organization.

**SQL file:** `supabase/migrations/003_auth_and_rls.sql`
**Run order:** AFTER every other migration (core schema, payment_records,
expenses, cash_flow_items, rent_due_day).

**Adds:**

- `memberships` table — links `auth.users` → `organizations` with a role
  (`owner` / `manager` / `staff`).
- Access helper functions (SECURITY DEFINER): `is_org_member`, `is_org_owner`,
  `is_property_member`, `is_room_member`, `is_bed_member`.
- `create_organization(org_name, property_name, total_beds)` RPC for self-serve
  onboarding (creates org + owner membership + first property atomically).
- `organization_id` column on `expenses` and `cash_flow_items`, backfilled from
  the property and kept filled on insert by the `set_finance_org` trigger.
- Org-scoped RLS policies on organizations, memberships, properties, rooms,
  beds, tenants, occupancies, payment_records, expenses, cash_flow_items.

**Drops:** all `mvp_public_*` policies and the open expenses / cash_flow_items
policies.

**Cutover:** this locks the live app to logged-in users — follow
`docs/AUTH_CUTOVER_PLAN.md` exactly (apply SQL → deploy frontend → create
account → link existing org → verify isolation).

**Rollback:** commented block at the bottom of the migration file restores open
access (emergency use only).
