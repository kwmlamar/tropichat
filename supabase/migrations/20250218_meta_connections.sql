-- ============================================================
-- TropiChat: Meta Platform Connections
-- Stores OAuth access tokens for WhatsApp, Instagram, Messenger
-- from the unified Meta Facebook Login flow.
-- ============================================================

CREATE TABLE meta_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which channel this token is for
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'messenger')),

  -- The long-lived user access token from Meta OAuth
  access_token TEXT NOT NULL,

  -- Page-level access token (for Messenger/Instagram via a Facebook Page)
  page_access_token TEXT,

  -- Token expiry (long-lived tokens last ~60 days)
  token_expires_at TIMESTAMPTZ,

  -- Platform-specific identifiers
  -- WhatsApp: waba_id | Instagram: ig_user_id | Messenger: page_id
  account_id TEXT,
  account_name TEXT,

  -- Extra channel-specific metadata (phone_number_id, ig_username, page_name, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Granted OAuth scopes for this connection
  scopes TEXT[] DEFAULT '{}',

  -- Connection status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One connection per channel per user
  CONSTRAINT uq_meta_connection UNIQUE (user_id, channel)
);

-- Fast lookup by user
CREATE INDEX idx_meta_connections_user ON meta_connections (user_id);

-- Lookup active connections
CREATE INDEX idx_meta_connections_active ON meta_connections (user_id)
  WHERE is_active = true;

-- Auto-update updated_at
CREATE TRIGGER trg_meta_connections_updated_at
  BEFORE UPDATE ON meta_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meta connections"
  ON meta_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Enable Realtime (for live status updates on settings page)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE meta_connections;
