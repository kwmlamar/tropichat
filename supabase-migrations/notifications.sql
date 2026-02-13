-- ============================================================
-- TropiChat Notifications System
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_message', 'mention', 'assignment', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast queries
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_customer_unread ON notifications(customer_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: customers can only see/modify their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = customer_id);

-- 5. Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 6. Auto-cleanup: delete notifications older than 30 days (optional cron job)
-- You can schedule this via Supabase Dashboard > Database > Extensions > pg_cron
-- SELECT cron.schedule('cleanup-old-notifications', '0 3 * * *', $$
--   DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';
-- $$);

-- 7. Function to create a notification when a new inbound message arrives
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  conv_record RECORD;
  contact_name TEXT;
BEGIN
  -- Only trigger for inbound messages
  IF NEW.direction != 'inbound' THEN
    RETURN NEW;
  END IF;

  -- Get conversation and contact info
  SELECT c.customer_id, ct.name, ct.phone_number
  INTO conv_record
  FROM conversations c
  JOIN contacts ct ON ct.id = c.contact_id
  WHERE c.id = NEW.conversation_id;

  -- Build contact display name
  contact_name := COALESCE(conv_record.name, conv_record.phone_number, 'Unknown');

  -- Insert notification
  INSERT INTO notifications (customer_id, type, title, message, link, metadata)
  VALUES (
    conv_record.customer_id,
    'new_message',
    'New message from ' || contact_name,
    COALESCE(LEFT(NEW.body, 100), 'Media message'),
    '/dashboard',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'contact_name', contact_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: fire on new inbound message
DROP TRIGGER IF EXISTS on_new_inbound_message ON messages;
CREATE TRIGGER on_new_inbound_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- 9. Function to create notification on conversation assignment
CREATE OR REPLACE FUNCTION create_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
  contact_name TEXT;
BEGIN
  -- Only trigger when assigned_to changes and is not null
  IF NEW.assigned_to IS NULL OR NEW.assigned_to = OLD.assigned_to THEN
    RETURN NEW;
  END IF;

  -- Get contact name
  SELECT COALESCE(ct.name, ct.phone_number, 'Unknown')
  INTO contact_name
  FROM contacts ct
  WHERE ct.id = NEW.contact_id;

  -- Notify the assigned user
  INSERT INTO notifications (customer_id, type, title, message, link, metadata)
  VALUES (
    NEW.assigned_to,
    'assignment',
    'Conversation assigned to you',
    'You have been assigned the conversation with ' || contact_name,
    '/dashboard',
    jsonb_build_object(
      'conversation_id', NEW.id,
      'contact_name', contact_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Trigger: fire on conversation assignment
DROP TRIGGER IF EXISTS on_conversation_assigned ON conversations;
CREATE TRIGGER on_conversation_assigned
  AFTER UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION create_assignment_notification();
