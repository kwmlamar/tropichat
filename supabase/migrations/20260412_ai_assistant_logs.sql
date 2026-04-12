-- ============================================================
-- AI Sales Assistant Infrastructure
-- Stores logs and message history for business owners chatting with Tropi AI
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_assistant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- The query asked by the business owner
  query TEXT NOT NULL,
  -- The response from the AI
  response TEXT NOT NULL,
  
  -- Metadata for categorization (e.g. 'analyze', 'summarize', 'search')
  category TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast retrieval of recent queries for a owner
CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_user_id ON ai_assistant_logs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE ai_assistant_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_assistant_logs' AND policyname = 'Owners manage their assistant logs'
  ) THEN
    CREATE POLICY "Owners manage their assistant logs"
      ON ai_assistant_logs
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
