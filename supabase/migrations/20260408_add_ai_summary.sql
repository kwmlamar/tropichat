-- Migration: Add AI Summary memory to Unified Conversations
-- This enables the "Smart Cache" strategy for the AI Intelligence Sidebar,
-- preventing redundant API calls to Gemini and saving costs.

ALTER TABLE unified_conversations
ADD COLUMN IF NOT EXISTS ai_summary JSONB,
ADD COLUMN IF NOT EXISTS ai_summary_updated_at TIMESTAMPTZ;
