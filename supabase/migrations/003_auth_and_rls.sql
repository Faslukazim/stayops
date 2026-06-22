-- Migration 003: Authentication + org-scoped multi-tenancy
-- ============================================================================
-- Purpose
--   Replace the open "mvp_public" RLS policies (using true) with policies that
--   only expose rows belonging to organizations the signed-in user is a member
--   of. This is the change that lets a SECOND customer use the app without
--   seeing the first customer's data.
--
-- What it does
--   1. Creates a `memberships` table linking auth.users -> organizations.
--   2. Adds SECURITY DEFINER helper functions for fast membership checks.
--   3. Adds a `create_organization` RPC for safe self-serve onboarding.
--   4. Adds organization_id to expenses / cash_flow_items (+ backfill trigger)
--      so those tables can be org-scoped (they only had property_id before).
--   5. Drops every mvp_public_* policy and replaces it with an org-scoped one.
--
-- Run order
--   Apply AFTER all existing migrations:
--     supabase/migrations/001_phase1_multi_property_schema.sql
--     supabase/migrations/002_payment_records.sql
--     migrations/001_create_expenses.sql
--     migrations/002_create_cash_flow_items.sql
--     migrations/003_add_rent_due_day.sql
--   This script is idempotent and guards every table with IF EXISTS, so it is
--   safe to run even if the expenses / cash_flow_items tables don't exist yet.
--
-- IMPORTANT — this locks the live app
--   Once these policies are active, requests made with the anon key and NO
--   logged-in user return zero rows. Deploy the auth-enabled frontend and link
--   your existing org to a user account as part of the same cutover. See
--   docs/AUTH_CUTOVER_PLAN.md.
--
-- Rollback: see the bottom of this file.
-- ============================================================================

begin;

-- ─── 1. Memberships ─────────────────────────────────────────────────────────

create table if not exists public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at      timestamptz not null default now(),
  constraint memberships_org_user_key unique (organization_id, user_id)
);

create index if not exists memberships_user_id_idx on public.memberships (user_id);
create index if not exists memberships_organization_id_idx on public.memberships (organization_id);

-- ─── 2. Access helper functions (SECURITY DEFINER) ──────────────────────────
-- SECURITY DEFINER + a locked search_path lets these read `memberships`
-- without being blocked by RLS, and avoids recursive policy evaluation.

create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_owner(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

create or replace function public.is_property_member(prop uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    join public.memberships m on m.organization_id = p.organization_id
    where p.id = prop
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_room_member(rm uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    join public.memberships m on m.organization_id = p.organization_id
    where r.id = rm
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_bed_member(bd uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.beds b
    join public.rooms r on r.id = b.room_id
    join public.properties p on p.id = r.property_id
    join public.memberships m on m.organization_id = p.organization_id
    where b.id = bd
      and m.user_id = auth.uid()
  );
$$;

-- ─── 3. Onboarding RPC: create org + owner membership + first property ───────
-- Runs as definer so the brand-new user can bootstrap their first org even
-- though the memberships INSERT policy only allows existing owners.

create or replace function public.create_organization(
  org_name      text,
  property_name text default null,
  total_beds    integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(org_name), '') = '' then
    raise exception 'organization name is required';
  end if;

  insert into public.organizations (name)
  values (trim(org_name))
  returning id into new_org;

  insert into public.memberships (organization_id, user_id, role)
  values (new_org, auth.uid(), 'owner');

  if coalesce(trim(property_name), '') <> '' then
    insert into public.properties (organization_id, name, total_beds)
    values (new_org, trim(property_name), greatest(coalesce(total_beds, 0), 0));
  end if;

  return new_org;
end;
$$;

grant execute on function public.create_organization(text, text, integer) to authenticated;

-- ─── 4. Org column on expenses / cash_flow_items + backfill ─────────────────
-- These tables only had property_id (nullable). Add organization_id so they
-- can be org-scoped, backfill from the property, and keep it filled on insert
-- via a BEFORE trigger (so the client doesn't have to send it).

alter table if exists public.expenses
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table if exists public.cash_flow_items
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

update public.expenses e
  set organization_id = p.organization_id
  from public.properties p
  where e.property_id = p.id
    and e.organization_id is null;

update public.cash_flow_items c
  set organization_id = p.organization_id
  from public.properties p
  where c.property_id = p.id
    and c.organization_id is null;

create or replace function public.set_finance_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is null and new.property_id is not null then
    select organization_id into new.organization_id
    from public.properties where id = new.property_id;
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.expenses') is not null then
    drop trigger if exists set_expenses_org on public.expenses;
    create trigger set_expenses_org
      before insert on public.expenses
      for each row execute function public.set_finance_org();
  end if;

  if to_regclass('public.cash_flow_items') is not null then
    drop trigger if exists set_cash_flow_items_org on public.cash_flow_items;
    create trigger set_cash_flow_items_org
      before insert on public.cash_flow_items
      for each row execute function public.set_finance_org();
  end if;
end $$;

-- ─── 5. Replace mvp_public policies with org-scoped policies ─────────────────

alter table public.memberships enable row level security;

-- Helper: drop the four old public policies on a table, if present.
do $$
declare
  t text;
  tables text[] := array[
    'organizations', 'properties', 'rooms', 'beds',
    'tenants', 'occupancies'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists mvp_public_select on public.%I', t);
    execute format('drop policy if exists mvp_public_insert on public.%I', t);
    execute format('drop policy if exists mvp_public_update on public.%I', t);
    execute format('drop policy if exists mvp_public_delete on public.%I', t);
  end loop;
end $$;

-- Drop the open policies created by the expenses / cash_flow_items migrations.
do $$
begin
  if to_regclass('public.expenses') is not null then
    drop policy if exists expenses_select on public.expenses;
    drop policy if exists expenses_insert on public.expenses;
    drop policy if exists expenses_delete on public.expenses;
  end if;
  if to_regclass('public.cash_flow_items') is not null then
    drop policy if exists cf_items_select on public.cash_flow_items;
    drop policy if exists cf_items_insert on public.cash_flow_items;
    drop policy if exists cf_items_update on public.cash_flow_items;
  end if;
  if to_regclass('public.payment_records') is not null then
    drop policy if exists mvp_public_select on public.payment_records;
    drop policy if exists mvp_public_insert on public.payment_records;
    drop policy if exists mvp_public_update on public.payment_records;
    drop policy if exists mvp_public_delete on public.payment_records;
    -- legacy permissive policy that bypassed org isolation (anon+authenticated, USING true)
    drop policy if exists "staff full access" on public.payment_records;
  end if;
end $$;

-- organizations ─ members see/manage their own orgs
create policy org_select on public.organizations
  for select using (public.is_org_member(id));
create policy org_update on public.organizations
  for update using (public.is_org_owner(id)) with check (public.is_org_owner(id));
create policy org_delete on public.organizations
  for delete using (public.is_org_owner(id));
-- (no INSERT policy: orgs are created via create_organization RPC)

-- memberships ─ see co-members of your orgs; only owners can write
create policy membership_select on public.memberships
  for select using (public.is_org_member(organization_id));
create policy membership_insert on public.memberships
  for insert with check (public.is_org_owner(organization_id));
create policy membership_update on public.memberships
  for update using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy membership_delete on public.memberships
  for delete using (public.is_org_owner(organization_id));

-- properties
create policy property_select on public.properties
  for select using (public.is_org_member(organization_id));
create policy property_insert on public.properties
  for insert with check (public.is_org_member(organization_id));
create policy property_update on public.properties
  for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy property_delete on public.properties
  for delete using (public.is_org_owner(organization_id));

-- rooms
create policy room_select on public.rooms
  for select using (public.is_property_member(property_id));
create policy room_insert on public.rooms
  for insert with check (public.is_property_member(property_id));
create policy room_update on public.rooms
  for update using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));
create policy room_delete on public.rooms
  for delete using (public.is_property_member(property_id));

-- beds
create policy bed_select on public.beds
  for select using (public.is_room_member(room_id));
create policy bed_insert on public.beds
  for insert with check (public.is_room_member(room_id));
create policy bed_update on public.beds
  for update using (public.is_room_member(room_id)) with check (public.is_room_member(room_id));
create policy bed_delete on public.beds
  for delete using (public.is_room_member(room_id));

-- tenants (carries organization_id directly)
create policy tenant_select on public.tenants
  for select using (public.is_org_member(organization_id));
create policy tenant_insert on public.tenants
  for insert with check (public.is_org_member(organization_id));
create policy tenant_update on public.tenants
  for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy tenant_delete on public.tenants
  for delete using (public.is_org_member(organization_id));

-- occupancies (carries property_id)
create policy occupancy_select on public.occupancies
  for select using (public.is_property_member(property_id));
create policy occupancy_insert on public.occupancies
  for insert with check (public.is_property_member(property_id));
create policy occupancy_update on public.occupancies
  for update using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));
create policy occupancy_delete on public.occupancies
  for delete using (public.is_property_member(property_id));

-- payment_records (carries property_id) — guarded in case table exists
do $$
begin
  if to_regclass('public.payment_records') is not null then
    execute 'alter table public.payment_records enable row level security';
    execute $p$create policy payment_record_select on public.payment_records
      for select using (public.is_property_member(property_id))$p$;
    execute $p$create policy payment_record_insert on public.payment_records
      for insert with check (public.is_property_member(property_id))$p$;
    execute $p$create policy payment_record_update on public.payment_records
      for update using (public.is_property_member(property_id)) with check (public.is_property_member(property_id))$p$;
    execute $p$create policy payment_record_delete on public.payment_records
      for delete using (public.is_property_member(property_id))$p$;
  end if;
end $$;

-- expenses (org-scoped via organization_id, filled by trigger)
do $$
begin
  if to_regclass('public.expenses') is not null then
    execute 'alter table public.expenses enable row level security';
    execute $p$create policy expense_select on public.expenses
      for select using (public.is_org_member(organization_id))$p$;
    execute $p$create policy expense_insert on public.expenses
      for insert with check (public.is_org_member(organization_id))$p$;
    execute $p$create policy expense_update on public.expenses
      for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))$p$;
    execute $p$create policy expense_delete on public.expenses
      for delete using (public.is_org_member(organization_id))$p$;
  end if;
end $$;

-- cash_flow_items (org-scoped via organization_id, filled by trigger)
do $$
begin
  if to_regclass('public.cash_flow_items') is not null then
    execute 'alter table public.cash_flow_items enable row level security';
    execute $p$create policy cf_item_select on public.cash_flow_items
      for select using (public.is_org_member(organization_id))$p$;
    execute $p$create policy cf_item_insert on public.cash_flow_items
      for insert with check (public.is_org_member(organization_id))$p$;
    execute $p$create policy cf_item_update on public.cash_flow_items
      for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))$p$;
    execute $p$create policy cf_item_delete on public.cash_flow_items
      for delete using (public.is_org_member(organization_id))$p$;
  end if;
end $$;

commit;

-- ============================================================================
-- BOOTSTRAP (run once, after a user has signed up) — see cutover plan.
-- Links an existing organization to a user account so the live data is visible.
--
--   insert into public.memberships (organization_id, user_id, role)
--   select o.id, u.id, 'owner'
--   from public.organizations o
--   cross join auth.users u
--   where u.email = 'you@example.com'         -- the account you signed up with
--     and o.name  = 'StayB'                   -- your existing org name
--   on conflict (organization_id, user_id) do nothing;
--
-- Find the values first if unsure:
--   select id, email from auth.users;
--   select id, name from public.organizations;
-- ============================================================================

-- ============================================================================
-- ROLLBACK (re-opens the app to the anon key — use only to recover)
-- ----------------------------------------------------------------------------
-- begin;
--   -- drop new policies
--   drop policy if exists org_select on public.organizations;
--   drop policy if exists org_update on public.organizations;
--   drop policy if exists org_delete on public.organizations;
--   -- ... (repeat for every policy created above) ...
--   -- restore open access
--   create policy mvp_public_select on public.organizations for select using (true);
--   create policy mvp_public_insert on public.organizations for insert with check (true);
--   create policy mvp_public_update on public.organizations for update using (true) with check (true);
--   create policy mvp_public_delete on public.organizations for delete using (true);
--   -- ... (repeat for properties, rooms, beds, tenants, occupancies, etc.) ...
-- commit;
-- ============================================================================
