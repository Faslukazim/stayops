# StayOps — Project Context

PG (paying guest) management SaaS for Indian operators. Built for StayB as the primary real-world user.

## Stack

- **React 18 + Vite** — no router. Page switching via CSS `hidden` + a `mountedPages` Set (keeps pages mounted after first visit)
- **Tailwind CSS** — utility classes only, no component library
- **Supabase** — PostgreSQL + Auth + Storage (project ID: `drlkmfhpthhkvnljuprm`)
- **Deployed on Vercel** — auto-deploys from `main` branch

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `ink` | `#0F1117` | Primary text |
| `slate2` | `#64748B` | Secondary text, labels |
| `mist` | `#F7F7F5` | Page background, cards |
| `border` | `#E2E8F0` | All borders |
| `leaf` | `#16A34A` | Success, paid, income |
| `coral` | `#E5484D` | Error, overdue, expenses |
| `amber` | `#D97706` | Warning, due soon, pending |

Z-index layers: bottom nav `z-50` → overlays/drawers `z-[60]` → modals `z-[70]`

## File Map

```
src/
  App.jsx              — root state, all page components (TenantsPage, DashboardPage, etc.)
  FinancePage.jsx      — Finance tab: Rent | Income | Expenses | P&L | Cashflow sub-tabs
  RoomsPage.jsx        — Rooms tab with bed-level detail
  TenantProfile.jsx    — Slide-up tenant detail drawer
  AuthPage.jsx         — Login / signup
  OnboardingPage.jsx   — First-run property setup
  Root.jsx             — Auth gate, session management
  components/ui.jsx    — Shared UI primitives (Card, Btn, Label, WhatsAppLink, etc.)
  services/
    tenantService.js   — CRUD for tenants + occupancies, fetchVacatedTenants
    propertyService.js — fetchProperties (includes organization_id, upi_id), updatePropertyUpiId
    paymentService.js  — payment records, mark paid/unpaid
    financeService.js  — expenses, cashflow items
    incomeService.js   — income_records (extra charges + day guests), ID photo upload/signed URL
    activityService.js — activity log (localStorage-backed)
    authService.js     — Supabase auth helpers
    seedService.js     — demo seed / clear workspace
  lib/supabase.js      — Supabase client + hasSupabaseConfig flag
  utils/paymentStatus.js — STATUS enum, computeTenantStatus, tenantDaysOverdue
```

## Database Schema (key tables)

- `organizations` — multi-tenant root
- `memberships` — user ↔ org link
- `properties` — has `organization_id`, `upi_id`, `status`
- `rooms` — belongs to property
- `beds` — belongs to room
- `tenants` — has `id_photo_url`
- `occupancies` — links tenant+bed, holds `monthly_rent`, `deposit_amount`, `deposit_status`, `status` ('active'|'ended'), `end_date`
- `payment_records` — monthly rent tracking per occupancy
- `expenses` — property-scoped expenses
- `income_records` — type: `'extra_charge'` | `'day_guest'`, holds `category`, `amount`, `daily_rate`, `days`, `name`, `phone`, `id_photo_url`
- `cash_flow_items` — recurring obligations (building rent, EMIs)

RLS: all tables use `is_org_member(organization_id)` helper function.

## Supabase Storage

Bucket: `tenant-photos` (private). Path pattern: `{org_id}/{entity_id}.{ext}`  
Access via signed URLs (1-year TTL for tenants, 1-hour for profiles).

## Key Patterns

**Page switching** — `mountedPages` Set keeps pages alive. `hidden` class hides inactive pages. Never unmount a page after first visit.

**Property scoping** — `selectedPropertyId` is the root filter. All queries filter by it. `organizationId` is derived from `properties.find(p => p.id === selectedPropertyId)?.organization_id`.

**UPI ID** — stored per-property in `properties.upi_id`. Synced to App state as `upiId` on property change. Prop-drilled to every `WhatsAppLink`.

**Tenant UI object** — `toUiTenant(occupancy)` in tenantService maps DB snake_case → camelCase for the UI. Key fields: `id`, `occupancyId`, `propertyId`, `roomId`, `bedId`, `name`, `phone`, `roomNumber`, `bedNumber`, `monthlyRent`, `joinDate`, `rentDueDay`, `paymentStatus`, `depositAmount`, `depositStatus`, `admissionFee`, `id_photo_url`.

**Floor sort** — G→F→S→T using `FLOOR_ORDER` map in propertyService.js.

**WhatsApp reminders** — `WhatsAppLink` in `components/ui.jsx` builds the message with name, room, rent amount, and GPay/UPI ID.

## Demo Account

- Email: `demo@stayops.com` / Password: `demo2026`
- Seeded via `seedSampleWorkspace()` in seedService — real StayB tenant names
- Seed/clear buttons visible on Dashboard for demo org

## What NOT to build

Do not add: authentication changes, org/user management, pricing pages, marketing pages, reports/analytics, accounting/invoices, RBAC, CSV export, PDF generation, push notifications, dark mode, multi-currency, tenant portal, maintenance tracking.

## Git / Deploy

- Always use local `git` commands — GitHub MCP `push_files` returns 403
- `main` branch auto-deploys to Vercel
- Force pushes need explicit user confirmation
- Migrations go in `supabase/migrations/` and must also be applied via Supabase MCP `apply_migration`
