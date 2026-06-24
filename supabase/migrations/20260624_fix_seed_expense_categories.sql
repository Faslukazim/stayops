-- Migration 20260624: Fix seed_sample_workspace expense categories
-- The previous version used invalid category values ('Electricity', 'Water', etc.)
-- that violate expenses_category_check. This replaces the function with valid
-- lowercase category ids matching the constraint.
-- Also ensures demo P&L is clearly profitable.

create or replace function public.seed_sample_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org         uuid;
  v_prop        uuid;
  v_room        uuid;
  v_bed         uuid;
  v_ten         uuid;
  v_occ         uuid;
  v_join        date;
  v_ym          text := to_char(current_date, 'YYYY-MM');
  v_ym_prev     text := to_char(current_date - interval '1 month', 'YYYY-MM');
  v_month_start date := date_trunc('month', current_date)::date;
  v_ex_room1    uuid;
  v_ex_bed1     uuid;
  v_ex_bed2     uuid;
  rec           record;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select m.organization_id into v_org
  from public.memberships m
  where m.user_id = auth.uid()
    and not exists (select 1 from public.properties p where p.organization_id = m.organization_id)
  order by m.created_at limit 1;

  if v_org is null then
    select organization_id into v_org from public.memberships
    where user_id = auth.uid() order by created_at limit 1;
  end if;
  if v_org is null then raise exception 'no organization for current user'; end if;

  -- Property
  insert into public.properties (organization_id, name, total_beds, status, is_demo)
  values (v_org, 'StayB PG Hostel', 12, 'active', true)
  returning id into v_prop;

  -- Rooms
  insert into public.rooms (property_id, room_number, capacity, status)
  values
    (v_prop, 'G1', 3, 'active'),
    (v_prop, 'G2', 3, 'active'),
    (v_prop, 'F1', 3, 'active'),
    (v_prop, 'F2', 3, 'active');

  insert into public.beds (room_id, bed_number, status)
  select r.id, b.n::text, 'available'
  from public.rooms r
  cross join (values (1),(2),(3)) as b(n)
  where r.property_id = v_prop;

  -- Active tenants (8 paid, 2 unpaid for clear profit in demo)
  for rec in
    select * from (values
      ('Bimal Nair',     '+919800000001', 'G1', '1', 7500,  3, 'Paid'),
      ('Krishna Prasad', '+919800000002', 'G1', '2', 7000,  5, 'Unpaid'),
      ('Prithwi Das',    '+919800000003', 'G1', '3', 7500,  1, 'Paid'),
      ('Akshay Kumar',   '+919800000004', 'G2', '1', 8000,  7, 'Paid'),
      ('Shabeeb Ali',    '+919800000005', 'G2', '2', 7500, 10, 'Paid'),
      ('Madhav Menon',   '+919800000006', 'G2', '3', 7000, 15, 'Paid'),
      ('Rahul Sharma',   '+919800000007', 'F1', '1', 8500,  2, 'Paid'),
      ('Ankit Verma',    '+919800000008', 'F1', '2', 8500, 20, 'Unpaid'),
      ('Suresh Pillai',  '+919800000009', 'F1', '3', 8000,  8, 'Paid'),
      ('Deepak Nambiar', '+919800000010', 'F2', '1', 9000, 12, 'Paid')
    ) as t(name, phone, room_number, bed_number, rent, due_day, pay_status)
  loop
    select b.id into v_bed
    from public.beds b
    join public.rooms r on r.id = b.room_id
    where r.property_id = v_prop
      and r.room_number = rec.room_number
      and b.bed_number  = rec.bed_number;

    select r.id into v_room
    from public.rooms r
    where r.property_id = v_prop and r.room_number = rec.room_number;

    v_join := (v_month_start - interval '3 months')::date + (rec.due_day - 1);

    insert into public.tenants (organization_id, property_id, name, phone, join_date, status)
    values (v_org, v_prop, rec.name, rec.phone, v_join, 'active')
    returning id into v_ten;

    insert into public.occupancies (
      tenant_id, property_id, room_id, bed_id, monthly_rent,
      payment_status, payment_date, start_date, rent_due_day, status,
      deposit_amount, deposit_status, admission_fee, move_in_collection
    ) values (
      v_ten, v_prop, v_room, v_bed, rec.rent,
      rec.pay_status,
      case when rec.pay_status = 'Paid' then current_date - 2 else null end,
      v_join, rec.due_day, 'active',
      rec.rent, 'held', 500, rec.rent + 500
    ) returning id into v_occ;

    update public.beds set status = 'occupied' where id = v_bed;

    -- Current month payment record
    insert into public.payment_records (
      property_id, tenant_id, occupancy_id, month, amount, due_day, status, paid_at
    ) values (
      v_prop, v_ten, v_occ, v_ym, rec.rent, rec.due_day,
      case when rec.pay_status = 'Paid' then 'paid' else 'unpaid' end,
      case when rec.pay_status = 'Paid' then now() - interval '2 days' else null end
    ) on conflict (occupancy_id, month) do nothing;

    -- Previous month — all paid
    insert into public.payment_records (
      property_id, tenant_id, occupancy_id, month, amount, due_day, status, paid_at
    ) values (
      v_prop, v_ten, v_occ, v_ym_prev, rec.rent, rec.due_day, 'paid',
      (v_month_start - interval '5 days')::timestamptz
    ) on conflict (occupancy_id, month) do nothing;

  end loop;

  -- 2 vacated ex-tenants (F2 beds 2 & 3)
  select r.id into v_ex_room1 from public.rooms r
  where r.property_id = v_prop and r.room_number = 'F2';

  select b.id into v_ex_bed1 from public.beds b
  join public.rooms r on r.id = b.room_id
  where r.property_id = v_prop and r.room_number = 'F2' and b.bed_number = '2';

  insert into public.tenants (organization_id, property_id, name, phone, join_date, status)
  values (v_org, v_prop, 'Sanjay Reddy', '+919800000011',
          v_month_start - interval '5 months', 'archived')
  returning id into v_ten;
  insert into public.occupancies (
    tenant_id, property_id, room_id, bed_id, monthly_rent,
    payment_status, payment_date, start_date, rent_due_day, status,
    end_date, deposit_amount, deposit_status, admission_fee, move_in_collection
  ) values (
    v_ten, v_prop, v_ex_room1, v_ex_bed1, 9000,
    'Paid', v_month_start - interval '8 days',
    v_month_start - interval '5 months', 10, 'ended',
    v_month_start - interval '3 days', 9000, 'held', 500, 9500
  );

  select b.id into v_ex_bed2 from public.beds b
  join public.rooms r on r.id = b.room_id
  where r.property_id = v_prop and r.room_number = 'F2' and b.bed_number = '3';

  insert into public.tenants (organization_id, property_id, name, phone, join_date, status)
  values (v_org, v_prop, 'Meera Krishnan', '+919800000012',
          v_month_start - interval '4 months', 'archived')
  returning id into v_ten;
  insert into public.occupancies (
    tenant_id, property_id, room_id, bed_id, monthly_rent,
    payment_status, payment_date, start_date, rent_due_day, status,
    end_date, deposit_amount, deposit_status, admission_fee, move_in_collection
  ) values (
    v_ten, v_prop, v_ex_room1, v_ex_bed2, 9000,
    'Paid', v_month_start - interval '15 days',
    v_month_start - interval '4 months', 5, 'ended',
    v_month_start - interval '10 days', 9000, 'returned', 500, 9500
  );

  -- Expenses: current month — valid lowercase categories only
  -- Total: 8,550 vs income ~71,000 → clear profit
  insert into public.expenses (property_id, organization_id, category, description, amount, expense_date)
  values
    (v_prop, v_org, 'electricity', 'EB bill – current month',  4200, v_month_start + 3),
    (v_prop, v_org, 'maintenance', 'Plumbing repair',            900, v_month_start + 4),
    (v_prop, v_org, 'food',        'Kitchen provisions',        1500, v_month_start + 5),
    (v_prop, v_org, 'misc',        'Cleaning supplies',          650, v_month_start + 2),
    (v_prop, v_org, 'misc',        'Water tanker',               800, v_month_start + 1),
    (v_prop, v_org, 'internet',    'WiFi bill',                  499, v_month_start + 1);

  -- Expenses: previous month
  insert into public.expenses (property_id, organization_id, category, description, amount, expense_date)
  values
    (v_prop, v_org, 'electricity', 'EB bill – prev month',     3900, v_month_start - 25),
    (v_prop, v_org, 'maintenance', 'AC servicing',              1200, v_month_start - 18),
    (v_prop, v_org, 'food',        'Kitchen provisions',        1400, v_month_start - 15),
    (v_prop, v_org, 'misc',        'Cleaning supplies',          600, v_month_start - 20),
    (v_prop, v_org, 'misc',        'Water tanker',               800, v_month_start - 28),
    (v_prop, v_org, 'internet',    'WiFi bill',                  499, v_month_start - 29);

  -- Cash flow (recurring obligations — shown in Cashflow tab, not P&L)
  -- Valid types: building_rent | salary | emi | other
  insert into public.cash_flow_items (property_id, organization_id, label, amount, type, due_day)
  values
    (v_prop, v_org, 'Building Rent',   25000, 'building_rent', 1),
    (v_prop, v_org, 'Internet Bill',    1499, 'other',         5),
    (v_prop, v_org, 'Caretaker Wages',  8000, 'salary',        1);

  -- Extra income records
  insert into public.income_records (property_id, organization_id, type, category, amount, date, name, phone)
  values
    (v_prop, v_org, 'extra_charge', 'AC Charge', 500, current_date - 4, 'Rahul Sharma',  '+919800000007'),
    (v_prop, v_org, 'extra_charge', 'Laundry',   200, current_date - 2, 'Akshay Kumar',  '+919800000004'),
    (v_prop, v_org, 'day_guest',    'Day Stay',  400, current_date - 1, 'Vikram Shetty', '+919811000001');

  return v_prop;
end;
$$;
