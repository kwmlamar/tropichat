-- Add Facebook login fields to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS facebook_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Index for looking up customers by their Facebook user ID
CREATE INDEX IF NOT EXISTS idx_customers_facebook_id ON customers (facebook_id)
  WHERE facebook_id IS NOT NULL;
