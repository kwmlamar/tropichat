-- ============================================================
-- Allow contacts from unified inbox channels (Messenger, Instagram)
-- that don't have a phone number.
-- Adds channel_type and channel_id fields so we can upsert
-- by platform identity, and makes phone_number nullable.
-- ============================================================

-- Make phone_number nullable (Messenger/Instagram contacts have no phone)
ALTER TABLE contacts ALTER COLUMN phone_number DROP NOT NULL;

-- Add channel tracking fields
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS channel_type TEXT CHECK (channel_type IN ('whatsapp', 'instagram', 'messenger')),
  ADD COLUMN IF NOT EXISTS channel_id TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Unique index so we can upsert by (user_id, channel_type, channel_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_channel
  ON contacts (customer_id, channel_type, channel_id)
  WHERE channel_type IS NOT NULL AND channel_id IS NOT NULL;

-- Index for fast channel lookup
CREATE INDEX IF NOT EXISTS idx_contacts_channel
  ON contacts (channel_type, channel_id)
  WHERE channel_type IS NOT NULL;
