CREATE TABLE IF NOT EXISTS payment_records (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid        NOT NULL REFERENCES properties(id)  ON DELETE CASCADE,
  tenant_id    uuid        NOT NULL REFERENCES tenants(id)     ON DELETE CASCADE,
  occupancy_id uuid        NOT NULL REFERENCES occupancies(id) ON DELETE CASCADE,
  month        text        NOT NULL,          -- YYYY-MM
  amount       numeric(10,2) NOT NULL DEFAULT 0,
  due_day      integer     NOT NULL DEFAULT 1,
  status       text        NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  paid_at      timestamptz,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (occupancy_id, month)
);

CREATE INDEX IF NOT EXISTS payment_records_property_month
  ON payment_records (property_id, month);
