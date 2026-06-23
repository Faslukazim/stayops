ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
-- All existing orgs (StayB + demo) are approved
UPDATE organizations SET approved = true;
