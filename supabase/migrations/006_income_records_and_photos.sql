-- Migration 006: Income records (extra charges + day guests) + ID photos

create table if not exists public.income_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  type text not null check (type in ('extra_charge', 'day_guest')),
  category text,
  amount numeric not null default 0,
  date date not null default current_date,
  days integer default 1,
  daily_rate numeric,
  name text,
  phone text,
  id_photo_url text,
  note text,
  tenant_id uuid references public.tenants(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.tenants
  add column if not exists id_photo_url text;

alter table public.income_records enable row level security;

create policy "org members can read income_records"
  on public.income_records for select
  using (public.is_org_member(organization_id));

create policy "org members can insert income_records"
  on public.income_records for insert
  with check (public.is_org_member(organization_id));

create policy "org members can delete income_records"
  on public.income_records for delete
  using (public.is_org_member(organization_id));
