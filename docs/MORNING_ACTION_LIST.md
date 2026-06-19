# Morning Action List — StayOps

Everything you need to do tomorrow morning to activate the Finance module in production.

---

## Step 1 — Run SQL migrations (Supabase)

Open your Supabase project → SQL Editor → New query

**Run first:**
```sql
-- Paste contents of migrations/001_create_expenses.sql
```

**Run second:**
```sql
-- Paste contents of migrations/002_create_cash_flow_items.sql
```

Both are idempotent (safe to run twice). Each takes < 1 second.

---

## Step 2 — Verify tables exist

In Supabase Table Editor, confirm you can see:
- `expenses`
- `cash_flow_items`

---

## Step 3 — Add your first real expense

Open StayOps → Finance → Expenses tab

Add June expenses:
- Building Rent (your actual rent amount, due date of payment)
- Electricity bill
- Food (if applicable)
- Salary (if paid this month)

Once added, go to Finance → P&L to see your June profitability.

---

## Step 4 — Set up recurring obligations

Open StayOps → Finance → Cashflow tab → Add

Add each monthly obligation:
- Building Rent: amount + due day (e.g. 1st of month)
- Salary: amount + due day (e.g. 5th)
- EMIs: each loan separately

The Cashflow tab will then show how many days until each obligation is due,
and whether your pending rent collection covers them.

---

## What's already live (no SQL needed)

All of these work now using localStorage as fallback:
- ✅ Finance page with 4 sub-tabs (Rent / Expenses / P&L / Cashflow)
- ✅ Expense recording with category chips
- ✅ Monthly P&L statement (rent income + admissions - expenses = profit)
- ✅ Cashflow obligations tracker with due-day urgency
- ✅ Net position: pending rent vs total obligations
- ✅ Dashboard Revenue Health card now shows Expenses + Net Profit rows
- ✅ MoneyInput (−/+) on all money fields
- ✅ Phone normalization to +91XXXXXXXXXX

Data entered before running SQL migrations is stored in localStorage only.
After running migrations, new entries will save to Supabase.
Existing localStorage data will NOT auto-migrate (re-enter the expenses).

---

## Optional improvements for later

These are good but not urgent:
- Add "Other Income" category to expenses (parking, laundry, etc.)
- Export P&L to PDF / CSV
- Set monthly expense budget per category with warnings
- Multi-property P&L comparison
- Payment reminders via SMS / automated WhatsApp template
