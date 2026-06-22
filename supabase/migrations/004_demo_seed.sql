-- Migration 004: Demo seed data
-- ============================================================================
-- Adds an is_demo flag to properties plus two SECURITY DEFINER RPCs so a
-- signed-in user can one-click seed / clear a labelled "Sample Hostel" demo
-- workspace into their own (empty) organization. Additive only — touches no
-- existing rows.
--   seed_sample_workspace()  -> 1 property, 3 rooms, 9 beds, 6 tenants with
--                               active occupancies + current-month payments.
--   clear_sample_workspace() -> removes all is_demo properties (and their data)
--                               for orgs the caller belongs to.
-- ============================================================================

alter table public.properties
  add column if not exists is_demo boolean not null default false;

-- Seed a realistic sample workspace into the caller's org.
create or replace function public.seed_sample_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org   uuid;
  v_prop  uuid;
  v_room  uuid;
  v_bed   uuid;
  v_ten   uuid;
  v_occ   uuid;
  v_join  date;
  v_ym    text := to_char(current_date, 'YYYY-MM');
  rec     record;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  -- Prefer an org the caller belongs to that has no properties yet.
  select m.organization_id into v_org
  from public.memberships m
  where m.user_id = auth.uid()
    and not exists (select 1 from public.properties p where p.organization_id = m.organization_id)
  order by m.created_at
  limit 1;

  if v_org is null then
    select organization_id into v_org from public.memberships
    where user_id = auth.uid() order by created_at limit 1;
  end if;
  if v_org is null then raise exception 'no organization for current user'; end if;

  insert into public.properties (organization_id, name, total_beds, status, is_demo)
  values (v_org, 'Sample Hostel', 9, 'active', true)
  returning id into v_prop;

  insert into public.rooms (property_id, room_number, capacity, status)
  values (v_prop, 'G1', 3, 'active'), (v_prop, 'G2', 3, 'active'), (v_prop, 'G3', 3, 'active');

  insert into public.beds (room_id, bed_number, status)
  select r.id, b.n::text, 'available'
  from public.rooms r
  cross join (values (1),(2),(3)) as b(n)
  where r.property_id = v_prop;

  for rec in
    select * from (values
      ('Aarav Sharma',  '+919800000001', 'G1', '1', 7000, 5,  'Paid'),
      ('Vivaan Patel',  '+919800000002', 'G1', '2', 6500, 3,  'Unpaid'),
      ('Diya Nair',     '+919800000003', 'G1', '3', 7500, 10, 'Unpaid'),
      ('Ananya Rao',    '+919800000004', 'G2', '1', 7000, 15, 'Paid'),
      ('Kabir Singh',   '+919800000005', 'G2', '2', 6000, 22, 'Unpaid'),
      ('Ishaan Gupta',  '+919800000006', 'G3', '1', 7200, 25, 'Unpaid')
    ) as t(name, phone, room_number, bed_number, rent, due_day, pay_status)
  loop
    select b.id into v_bed
    from public.beds b
    join public.rooms r on r.id = b.room_id
    where r.property_id = v_prop and r.room_number = rec.room_number and b.bed_number = rec.bed_number;

    select r.id into v_room from public.rooms r
    where r.property_id = v_prop and r.room_number = rec.room_number;

    v_join := (date_trunc('month', current_date) - interval '2 months')::date + (rec.due_day - 1);

    insert into public.tenants (organization_id, property_id, name, phone, join_date, status)
    values (v_org, v_prop, rec.name, rec.phone, v_join, 'active')
    returning id into v_ten;

    insert into public.occupancies (
      tenant_id, property_id, room_id, bed_id, monthly_rent,
      payment_status, payment_date, start_date, rent_due_day, status,
      deposit_amount, deposit_status, admission_fee, move_in_collection
    )
    values (
      v_ten, v_prop, v_room, v_bed, rec.rent,
      rec.pay_status,
      case when rec.pay_status = 'Paid' then current_date else null end,
      v_join, rec.due_day, 'active',
      rec.rent, 'held', 500, rec.rent * 2 + 500
    )
    returning id into v_occ;

    update public.beds set status = 'occupied' where id = v_bed;

    insert into public.payment_records (property_id, tenant_id, occupancy_id, month, amount, due_day, status, paid_at)
    values (
      v_prop, v_ten, v_occ, v_ym, rec.rent, rec.due_day,
      case when rec.pay_status = 'Paid' then 'paid' else 'unpaid' end,
      case when rec.pay_status = 'Paid' then now() else null end
    )
    on conflict (occupancy_id, month) do nothing;
  end loop;

  return v_prop;
end;
$$;

create or replace function public.clear_sample_workspace()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  delete from public.payment_records pr using public.properties p
   where pr.property_id = p.id and p.is_demo and public.is_org_member(p.organization_id);
  delete from public.occupancies o using public.properties p
   where o.property_id = p.id and p.is_demo and public.is_org_member(p.organization_id);
  delete from public.tenants t using public.properties p
   where t.property_id = p.id and p.is_demo and public.is_org_member(p.organization_id);
  delete from public.beds b using public.rooms r join public.properties p on p.id = r.property_id
   where b.room_id = r.id and p.is_demo and public.is_org_member(p.organization_id);
  delete from public.rooms r using public.properties p
   where r.property_id = p.id and p.is_demo and public.is_org_member(p.organization_id);
  delete from public.properties p
   where p.is_demo and public.is_org_member(p.organization_id);
end;
$$;

grant execute on function public.seed_sample_workspace() to authenticated;
grant execute on function public.clear_sample_workspace() to authenticated;
