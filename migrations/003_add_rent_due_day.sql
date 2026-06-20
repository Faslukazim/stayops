-- Migration 003: Add rent_due_day to occupancies
-- Purpose: Separate move-in date (start_date) from billing day (rent_due_day).
--          Deriving due_day from join_date breaks for migrated tenants and
--          hostels with a fixed billing date different from the tenant's join day.
-- Run in: Supabase SQL Editor (after 001 and 002)
-- Rollback: ALTER TABLE occupancies DROP COLUMN IF EXISTS rent_due_day;

ALTER TABLE occupancies
  ADD COLUMN IF NOT EXISTS rent_due_day INTEGER
    CHECK (rent_due_day BETWEEN 1 AND 28);

-- Backfill from start_date — preserves exact current behavior for all existing tenants
UPDATE occupancies
  SET rent_due_day = EXTRACT(DAY FROM start_date)::INTEGER
  WHERE rent_due_day IS NULL AND start_date IS NOT NULL;

-- Default for any occupancy with no start_date
UPDATE occupancies
  SET rent_due_day = 1
  WHERE rent_due_day IS NULL;

ALTER TABLE occupancies
  ALTER COLUMN rent_due_day SET NOT NULL,
  ALTER COLUMN rent_due_day SET DEFAULT 1;
