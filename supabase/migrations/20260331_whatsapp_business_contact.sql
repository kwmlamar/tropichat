-- ============================================================
-- Migration: Add whatsapp_number to business_profiles
-- Supports click-to-chat WhatsApp integration (TROA-24)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE business_profiles
      ADD COLUMN whatsapp_number TEXT DEFAULT NULL;
    COMMENT ON COLUMN business_profiles.whatsapp_number IS 'E.164 or local phone number used for wa.me click-to-chat links';
  END IF;
END $$;
