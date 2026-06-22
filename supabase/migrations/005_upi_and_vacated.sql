-- Migration 005: UPI ID per property + end_date on occupancies
alter table public.properties
  add column if not exists upi_id text;

alter table public.occupancies
  add column if not exists end_date date;

-- Allow authenticated users to update upi_id on their own properties
-- (already covered by existing RLS update policy on properties)
