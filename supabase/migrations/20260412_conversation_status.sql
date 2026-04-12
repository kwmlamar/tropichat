-- Add status column to unified_conversations
-- Tracks conversation lifecycle: open → pending → resolved

ALTER TABLE unified_conversations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'pending', 'resolved'));

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_unified_conversations_status
  ON unified_conversations (status);

COMMENT ON COLUMN unified_conversations.status IS
  'Conversation lifecycle status: open (active), pending (waiting on customer), resolved (closed)';
