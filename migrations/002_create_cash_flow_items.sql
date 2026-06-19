-- Migration 002: Create cash_flow_items table
-- Purpose: Store recurring monthly obligations (building rent, salaries, EMIs)
--          so the Finance → Cashflow tab can show upcoming payment duties
--          and net position vs pending rent collection.
-- Run in: Supabase SQL Editor (after 001)
-- Rollback: DROP TABLE IF EXISTS cash_flow_items;

CREATE TABLE IF NOT EXISTS cash_flow_items (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID         REFERENCES properties(id) ON DELETE CASCADE,
  type        TEXT         NOT NULL
                           CHECK (type IN ('building_rent', 'salary', 'emi', 'other')),
  label       TEXT         NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  due_day     INTEGER      NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active      BOOLEAN      DEFAULT true NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS cf_items_property
  ON cash_flow_items (property_id, active);

ALTER TABLE cash_flow_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cf_items_select" ON cash_flow_items
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "cf_items_insert" ON cash_flow_items
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "cf_items_update" ON cash_flow_items
  FOR UPDATE TO authenticated, anon USING (true);
