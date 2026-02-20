-- ============================================================
-- Fix Realtime: Set REPLICA IDENTITY FULL on tables used with
-- filtered Supabase Realtime subscriptions.
--
-- Without REPLICA IDENTITY FULL, Supabase Realtime cannot evaluate
-- row-level filters (e.g. conversation_id=eq.{id}) on UPDATE/INSERT
-- events because the WAL record doesn't include non-PK columns.
-- This causes subscriptions with filters to silently miss events.
-- ============================================================

ALTER TABLE unified_messages REPLICA IDENTITY FULL;
ALTER TABLE unified_conversations REPLICA IDENTITY FULL;
