-- ============================================================
-- Phase 2: Appointment Management & Notifications
-- 1. Add merchant_note to bookings (merchant response on accept/decline)
-- 2. Add 'completed' status to bookings
-- 3. Add availability_blocks table (simple blocked dates/times)
-- ============================================================

-- ============================================================
-- 1. bookings: add merchant_note for merchant response
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'merchant_note'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN merchant_note TEXT;
  END IF;
END $$;

-- ============================================================
-- 2. bookings: extend status to include 'completed'
-- ============================================================
DO $$
BEGIN
  -- Add 'completed' to the booking_status enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'completed'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'booking_status'
      )
  ) THEN
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';
  END IF;
END $$;

-- ============================================================
-- 3. availability_blocks: simple blocked dates/times
--    Merchants can mark specific dates or date+time windows
--    as unavailable (overrides availability slots)
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_date      DATE NOT NULL,
  start_time      TIME,       -- null = full day block
  end_time        TIME,       -- null = full day block
  reason          TEXT,       -- optional internal note
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by user and date
CREATE INDEX IF NOT EXISTS idx_availability_blocks_user_date
  ON availability_blocks (user_id, block_date);

-- RLS: only the owning merchant can read/write their blocks
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'availability_blocks'
      AND policyname = 'Merchant own blocks'
  ) THEN
    CREATE POLICY "Merchant own blocks"
      ON availability_blocks
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow public read for availability checking on booking page
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'availability_blocks'
      AND policyname = 'Public read blocks'
  ) THEN
    CREATE POLICY "Public read blocks"
      ON availability_blocks FOR SELECT
      USING (true);
  END IF;
END $$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_availability_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_availability_blocks_updated_at ON availability_blocks;
CREATE TRIGGER trg_availability_blocks_updated_at
  BEFORE UPDATE ON availability_blocks
  FOR EACH ROW EXECUTE FUNCTION update_availability_blocks_updated_at();
