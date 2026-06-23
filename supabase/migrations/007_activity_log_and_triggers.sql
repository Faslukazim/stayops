-- Migration 007: Activity log table + payment_records trigger

-- P2: Supabase-backed activity log
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  type text not null,
  description text not null,
  at timestamptz default now()
);

alter table public.activity_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='activity_log' and policyname='org members can read activity_log') then
    create policy "org members can read activity_log" on public.activity_log for select using (public.is_org_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where tablename='activity_log' and policyname='org members can insert activity_log') then
    create policy "org members can insert activity_log" on public.activity_log for insert with check (public.is_org_member(organization_id));
  end if;
end $$;

create index if not exists activity_log_property_at on public.activity_log(property_id, at desc);

-- P3: Auto-create payment_record when occupancy is inserted (removes race condition)
create or replace function public.create_payment_record_on_occupancy()
returns trigger language plpgsql security definer as $$
begin
  insert into public.payment_records (property_id, tenant_id, occupancy_id, month, amount, due_day, status)
  values (
    NEW.property_id,
    NEW.tenant_id,
    NEW.id,
    to_char(current_date, 'YYYY-MM'),
    NEW.monthly_rent,
    coalesce(NEW.rent_due_day, 1),
    'unpaid'
  )
  on conflict (occupancy_id, month) do nothing;
  return NEW;
end;
$$;

drop trigger if exists on_occupancy_created on public.occupancies;
create trigger on_occupancy_created
  after insert on public.occupancies
  for each row
  when (NEW.status = 'active')
  execute function public.create_payment_record_on_occupancy();
