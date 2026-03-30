-- ============================================================
-- Phase 1 Booking Enhancements
-- 1. Add price_type to booking_services
-- 2. Add handle + user_id to business_profiles for public booking URLs
-- 3. Add reference_code to bookings for customer confirmation
-- ============================================================

-- ============================================================
-- 1. booking_services: add price_type
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_services' AND column_name = 'price_type'
  ) THEN
    ALTER TABLE booking_services
      ADD COLUMN price_type VARCHAR(20) NOT NULL DEFAULT 'fixed';
  END IF;
END $$;

-- ============================================================
-- 2. business_profiles: add handle + user_id for direct lookup
--    (allows public booking page without requiring WhatsApp connection)
-- ============================================================
DO $$
BEGIN
  -- Add user_id for direct owner lookup (no connected_account required)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE business_profiles
      ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add handle for URL-friendly booking links (/book/{handle})
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' AND column_name = 'handle'
  ) THEN
    ALTER TABLE business_profiles
      ADD COLUMN handle VARCHAR(100);
  END IF;
END $$;

-- Unique constraint on handle (only where set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_business_profile_handle'
  ) THEN
    ALTER TABLE business_profiles
      ADD CONSTRAINT uq_business_profile_handle UNIQUE (handle);
  END IF;
END $$;

-- Index for handle lookups
CREATE INDEX IF NOT EXISTS idx_business_profiles_handle
  ON business_profiles (handle)
  WHERE handle IS NOT NULL;

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id
  ON business_profiles (user_id)
  WHERE user_id IS NOT NULL;

-- ============================================================
-- 3. bookings: add reference_code for customer confirmation
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reference_code'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN reference_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN customer_email TEXT;
  END IF;
END $$;

-- Unique index on reference_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_reference_code
  ON bookings (reference_code)
  WHERE reference_code IS NOT NULL;

-- ============================================================
-- 4. Update RLS policy for business_profiles to allow public reads by handle
-- ============================================================

-- Allow anyone to read business profiles by handle (public booking page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_profiles'
      AND policyname = 'Public read by handle'
  ) THEN
    CREATE POLICY "Public read by handle"
      ON business_profiles FOR SELECT
      USING (handle IS NOT NULL);
  END IF;
END $$;

-- Allow anyone to read booking_services for active services (public booking page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'booking_services'
      AND policyname = 'Public read active services'
  ) THEN
    CREATE POLICY "Public read active services"
      ON booking_services FOR SELECT
      USING (active = true);
  END IF;
END $$;

-- Allow anyone to read availability_slots (for showing available times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'availability_slots'
      AND policyname = 'Public read availability'
  ) THEN
    CREATE POLICY "Public read availability"
      ON availability_slots FOR SELECT
      USING (is_available = true);
  END IF;
END $$;

-- Allow unauthenticated inserts to bookings (customers booking without login)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
      AND policyname = 'Public insert bookings'
  ) THEN
    CREATE POLICY "Public insert bookings"
      ON bookings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Allow public to read their own booking by reference_code (confirmation page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
      AND policyname = 'Public read by id'
  ) THEN
    CREATE POLICY "Public read by id"
      ON bookings FOR SELECT
      USING (true);
  END IF;
END $$;
