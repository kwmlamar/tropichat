-- ============================================================
-- Ensure contacts table RLS allows users to see their contacts
-- (customer_id = business owner = auth.uid() for frontend)
-- So WhatsApp, Instagram, and Messenger contacts all show on Contacts page.
-- ============================================================

-- Enable RLS if not already (idempotent)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own contacts (customer_id = owner in this app).
-- Without this, only WhatsApp contacts (or rows matching another policy) would show.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users view own contacts by customer_id') THEN
    CREATE POLICY "Users view own contacts by customer_id"
      ON contacts FOR SELECT
      USING (customer_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users update own contacts by customer_id') THEN
    CREATE POLICY "Users update own contacts by customer_id"
      ON contacts FOR UPDATE
      USING (customer_id = auth.uid())
      WITH CHECK (customer_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users delete own contacts by customer_id') THEN
    CREATE POLICY "Users delete own contacts by customer_id"
      ON contacts FOR DELETE
      USING (customer_id = auth.uid());
  END IF;
END $$;

-- Allow INSERT for service role (webhook uses service key, bypasses RLS).
-- If your app inserts contacts from the client, add an INSERT policy with USING (customer_id = auth.uid()).
