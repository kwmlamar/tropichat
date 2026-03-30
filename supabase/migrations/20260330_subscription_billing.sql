-- ============================================================
-- Subscription Billing — 3-Tier Pricing (TROA-16)
-- Tiers: coconut (free), tropic ($29/mo), island_pro ($59/mo)
-- ============================================================

-- 1. Add/rename plan values to match TropiChat tier names
--    Existing plan column is TEXT (no enum constraint observed in migrations).
--    Ensure the customers table has all required Stripe billing columns.

DO $$
BEGIN
  -- stripe_customer_id (may already exist from earlier work)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN stripe_price_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'stripe_current_period_end'
  ) THEN
    ALTER TABLE customers ADD COLUMN stripe_current_period_end TIMESTAMPTZ;
  END IF;

  -- billing_period: 'monthly' | 'annual'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE customers ADD COLUMN billing_period TEXT NOT NULL DEFAULT 'monthly';
  END IF;
END $$;

-- 2. Migrate legacy plan values to TropiChat tier names
--    free/trial -> coconut
--    starter    -> coconut
--    professional -> tropic
--    enterprise -> island_pro

UPDATE customers SET plan = 'coconut'    WHERE plan IN ('free', 'trial', 'starter');
UPDATE customers SET plan = 'tropic'     WHERE plan = 'professional';
UPDATE customers SET plan = 'island_pro' WHERE plan = 'enterprise';

-- 3. Index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id
  ON customers (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_stripe_subscription_id
  ON customers (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- 4. Monthly booking count helper view (for Coconut tier enforcement)
--    Returns how many non-cancelled bookings a user has in the current calendar month.
CREATE OR REPLACE VIEW booking_monthly_counts AS
SELECT
  user_id,
  date_trunc('month', NOW()) AS month_start,
  COUNT(*) AS booking_count
FROM bookings
WHERE
  status != 'cancelled'
  AND booking_date >= date_trunc('month', NOW())::DATE
  AND booking_date <  (date_trunc('month', NOW()) + INTERVAL '1 month')::DATE
GROUP BY user_id;
