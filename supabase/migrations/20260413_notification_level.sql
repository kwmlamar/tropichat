-- Add notification_level preference to customers table
-- Controls push notification verbosity when Tropi AI Auto-Pilot is active
-- Values:
--   'all'        — default, existing behavior (push on every inbound message)
--   'milestones' — push only for: new conversations and AI hand-off requests

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS notification_level TEXT NOT NULL DEFAULT 'all'
  CHECK (notification_level IN ('all', 'milestones'));

COMMENT ON COLUMN customers.notification_level IS
  'Controls push notification verbosity when Tropi AI Auto-Pilot is active.
   all = every inbound message; milestones = new conversations + AI needs human only';
