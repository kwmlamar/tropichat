-- Add Human Agent fields to unified_conversations
-- Allows businesses to mark conversations for extended response (7-day window)
-- Required for Meta App Review: whatsapp_business_messaging permission

ALTER TABLE unified_conversations
  ADD COLUMN IF NOT EXISTS human_agent_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS human_agent_reason text,
  ADD COLUMN IF NOT EXISTS human_agent_marked_at timestamptz;

-- Add index for filtering human agent conversations
CREATE INDEX IF NOT EXISTS idx_unified_conversations_human_agent
  ON unified_conversations (human_agent_enabled)
  WHERE human_agent_enabled = true;

-- Add human_agent_tag field to unified_messages metadata
-- Messages sent with human_agent tag will have metadata.human_agent_tag = true
-- No schema change needed since metadata is JSONB
