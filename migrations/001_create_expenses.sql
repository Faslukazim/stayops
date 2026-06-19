-- Migration 001: Create expenses table
-- Purpose: Track operational expenses (building rent, food, salary, etc.)
--          so the Finance → P&L tab can show real profitability.
-- Run in: Supabase SQL Editor
-- Rollback: DROP TABLE IF EXISTS expenses;

CREATE TABLE IF NOT EXISTS expenses (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id   UUID         REFERENCES properties(id) ON DELETE CASCADE,
  category      TEXT         NOT NULL
                             CHECK (category IN (
                               'building_rent', 'food', 'salary',
                               'electricity', 'internet', 'maintenance', 'misc'
                             )),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description   TEXT,
  expense_date  DATE         NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

-- Indexes for typical query patterns
CREATE INDEX IF NOT EXISTS expenses_property_date
  ON expenses (property_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS expenses_date
  ON expenses (expense_date DESC);

-- RLS: allow authenticated and anon (matching your existing policy style)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE TO authenticated, anon USING (true);
