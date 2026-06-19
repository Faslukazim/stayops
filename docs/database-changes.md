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
