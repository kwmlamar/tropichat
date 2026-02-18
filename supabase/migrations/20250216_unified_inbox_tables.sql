-- ============================================================
-- TropiChat Unified Inbox: Multi-Channel Messaging Infrastructure
-- Supports: WhatsApp Cloud API, Instagram DMs, Facebook Messenger
-- ============================================================

-- Channel type enum for connected accounts and messages
CREATE TYPE channel_type AS ENUM ('whatsapp', 'instagram', 'messenger');

-- Sender type enum for messages
CREATE TYPE sender_type AS ENUM ('customer', 'business');

-- Message content type enum
CREATE TYPE message_content_type AS ENUM ('text', 'image', 'video', 'audio', 'file', 'location', 'sticker', 'template', 'interactive');

-- Message delivery status enum
CREATE TYPE message_delivery_status AS ENUM ('sending', 'sent', 'delivered', 'read', 'failed');


-- ============================================================
-- 1. CONNECTED ACCOUNTS
-- Stores OAuth tokens and metadata for each channel connection.
-- A user can connect multiple accounts across channels.
-- ============================================================
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which platform this account is for
  channel_type channel_type NOT NULL,

  -- OAuth credentials (access_token encrypted at application layer before storage)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Platform-specific account identifiers
  -- WhatsApp: phone_number_id | Instagram: ig_user_id | Messenger: page_id
  channel_account_id TEXT NOT NULL,
  -- Human-readable name (business name, page name, IG handle)
  channel_account_name TEXT,

  -- Platform-specific extras (e.g. waba_id, page_access_token, ig_username)
  metadata JSONB DEFAULT '{}'::jsonb,

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate connections for the same platform account
  CONSTRAINT uq_channel_account UNIQUE (channel_type, channel_account_id)
);

-- Fast lookups by user
CREATE INDEX idx_connected_accounts_user_id ON connected_accounts (user_id);
-- Find active accounts for webhook routing
CREATE INDEX idx_connected_accounts_channel_lookup
  ON connected_accounts (channel_type, channel_account_id)
  WHERE is_active = true;


-- ============================================================
-- 2. UNIFIED CONVERSATIONS
-- One table for all channels. Each conversation ties to one
-- connected account and one external customer.
-- ============================================================
CREATE TABLE unified_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,

  -- Denormalized for fast filtering without joining connected_accounts
  channel_type channel_type NOT NULL,

  -- Platform's conversation/thread identifier
  -- WhatsApp: customer phone number | Instagram: ig_scoped_id | Messenger: psid
  channel_conversation_id TEXT NOT NULL,

  -- Customer info (populated from profile data or first message)
  customer_name TEXT,
  customer_avatar_url TEXT,
  -- Platform-specific customer ID (phone for WA, IGSID for IG, PSID for Messenger)
  customer_id TEXT NOT NULL,

  -- Conversation state
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,

  -- Flexible storage for channel-specific conversation data
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One conversation per customer per connected account
  CONSTRAINT uq_conversation_per_account UNIQUE (connected_account_id, channel_conversation_id)
);

-- Inbox list: most recent conversations first, filtered by user's accounts
CREATE INDEX idx_unified_conversations_account
  ON unified_conversations (connected_account_id, last_message_at DESC NULLS LAST);
-- Cross-channel inbox: all conversations for a channel type
CREATE INDEX idx_unified_conversations_channel
  ON unified_conversations (channel_type, last_message_at DESC NULLS LAST);
-- Unread badge: quickly count unread conversations
CREATE INDEX idx_unified_conversations_unread
  ON unified_conversations (connected_account_id)
  WHERE unread_count > 0 AND is_archived = false;
-- Webhook routing: find conversation by platform's ID
CREATE INDEX idx_unified_conversations_channel_id
  ON unified_conversations (channel_conversation_id, connected_account_id);


-- ============================================================
-- 3. UNIFIED MESSAGES
-- All messages across channels in a single table.
-- ============================================================
CREATE TABLE unified_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES unified_conversations(id) ON DELETE CASCADE,

  -- Platform's message ID for dedup and status updates
  channel_message_id TEXT,

  -- Who sent it
  sender_type sender_type NOT NULL,

  -- Message content
  content TEXT,
  message_type message_content_type NOT NULL DEFAULT 'text',

  -- Delivery tracking timestamps
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Current delivery status
  status message_delivery_status NOT NULL DEFAULT 'sending',

  -- Error details when status = 'failed'
  error_message TEXT,

  -- Media, template params, interactive elements, reactions, etc.
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Message list for a conversation (chronological)
CREATE INDEX idx_unified_messages_conversation
  ON unified_messages (conversation_id, sent_at ASC);
-- Dedup and status updates from webhooks: find message by platform ID
CREATE INDEX idx_unified_messages_channel_id
  ON unified_messages (channel_message_id)
  WHERE channel_message_id IS NOT NULL;
-- Status filtering (e.g. find all failed messages)
CREATE INDEX idx_unified_messages_status
  ON unified_messages (status)
  WHERE status = 'failed';


-- ============================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- Users can only access their own data via connected_accounts ownership.
-- ============================================================

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_messages ENABLE ROW LEVEL SECURITY;

-- connected_accounts: user owns their own accounts
CREATE POLICY "Users manage own connected accounts"
  ON connected_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- unified_conversations: user owns conversations through their connected accounts
CREATE POLICY "Users view own conversations"
  ON unified_conversations
  FOR SELECT
  USING (
    connected_account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own conversations"
  ON unified_conversations
  FOR INSERT
  WITH CHECK (
    connected_account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own conversations"
  ON unified_conversations
  FOR UPDATE
  USING (
    connected_account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own conversations"
  ON unified_conversations
  FOR DELETE
  USING (
    connected_account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

-- unified_messages: user owns messages through conversation -> connected_account chain
CREATE POLICY "Users view own messages"
  ON unified_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT uc.id FROM unified_conversations uc
      JOIN connected_accounts ca ON ca.id = uc.connected_account_id
      WHERE ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own messages"
  ON unified_messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT uc.id FROM unified_conversations uc
      JOIN connected_accounts ca ON ca.id = uc.connected_account_id
      WHERE ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own messages"
  ON unified_messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT uc.id FROM unified_conversations uc
      JOIN connected_accounts ca ON ca.id = uc.connected_account_id
      WHERE ca.user_id = auth.uid()
    )
  );


-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_unified_conversations_updated_at
  BEFORE UPDATE ON unified_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- When a new message is inserted, update the parent conversation's
-- last_message_at, last_message_preview, and unread_count.
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE unified_conversations
  SET
    last_message_at = NEW.sent_at,
    last_message_preview = LEFT(NEW.content, 100),
    unread_count = CASE
      WHEN NEW.sender_type = 'customer' THEN unread_count + 1
      ELSE unread_count
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON unified_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_new_message();


-- ============================================================
-- 6. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE unified_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE unified_messages;
