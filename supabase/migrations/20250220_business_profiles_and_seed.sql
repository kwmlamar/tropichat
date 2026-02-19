-- ============================================================================
-- Migration: business_profiles table + seed data for Meta app review demos
-- ============================================================================

-- Business profiles for WhatsApp Business API
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  business_description TEXT DEFAULT '',
  business_category TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  business_address TEXT DEFAULT '',
  business_hours TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  profile_picture_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one profile per connected account
ALTER TABLE business_profiles
  ADD CONSTRAINT uq_business_profile_account UNIQUE (connected_account_id);

-- RLS
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own business profiles"
  ON business_profiles FOR ALL
  USING (
    connected_account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    connected_account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE TRIGGER trg_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE business_profiles;

-- ============================================================================
-- Add missing fields to connected_accounts if not present
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connected_accounts' AND column_name = 'channel_username'
  ) THEN
    ALTER TABLE connected_accounts ADD COLUMN channel_username TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connected_accounts' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE connected_accounts ADD COLUMN profile_picture_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connected_accounts' AND column_name = 'status'
  ) THEN
    ALTER TABLE connected_accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
END
$$;
