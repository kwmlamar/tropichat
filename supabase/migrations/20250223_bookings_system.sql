-- ============================================================
-- TropiChat Bookings System
-- Phase 1: Calendar, availability, and booking management
-- For tour operators (e.g., Simply Dave Nassau Tours)
-- ============================================================

-- ============================================================
-- 1. SERVICES
-- Tour/activity services offered by the business
-- ============================================================
CREATE TABLE booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  price NUMERIC(10, 2),          -- display only, no payment processing
  color TEXT DEFAULT '#3A9B9F',  -- hex color for calendar display
  active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_services_user ON booking_services (user_id) WHERE active = true;

-- ============================================================
-- 2. AVAILABILITY SLOTS
-- Recurring (weekly) or one-time availability windows
-- ============================================================
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,

  -- For recurring slots: day_of_week (0=Sunday … 6=Saturday)
  -- For one-time slots: specific_date
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  day_of_week  SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),   -- nullable when is_recurring=false
  specific_date DATE,                                           -- nullable when is_recurring=true

  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,

  -- How many simultaneous bookings this slot allows
  max_bookings INTEGER NOT NULL DEFAULT 1,

  -- False = slot is blocked (holiday/maintenance)
  is_available BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_slot_type CHECK (
    (is_recurring = true  AND day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (is_recurring = false AND specific_date IS NOT NULL AND day_of_week IS NULL)
  )
);

CREATE INDEX idx_availability_slots_service ON availability_slots (service_id);
CREATE INDEX idx_availability_slots_recurring ON availability_slots (day_of_week) WHERE is_recurring = true;
CREATE INDEX idx_availability_slots_oneoff ON availability_slots (specific_date) WHERE is_recurring = false;

-- ============================================================
-- 3. BOOKINGS
-- ============================================================
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id     UUID NOT NULL REFERENCES booking_services(id) ON DELETE RESTRICT,

  -- Link to the messaging conversation that originated this booking (optional)
  conversation_id UUID REFERENCES unified_conversations(id) ON DELETE SET NULL,

  -- Customer info (denormalized for quick access; may come from contact)
  customer_name  TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,

  -- When
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,

  number_of_people INTEGER NOT NULL DEFAULT 1 CHECK (number_of_people >= 1),

  status booking_status NOT NULL DEFAULT 'pending',
  notes  TEXT,

  -- Soft-delete timestamp
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user       ON bookings (user_id, booking_date DESC);
CREATE INDEX idx_bookings_service    ON bookings (service_id, booking_date);
CREATE INDEX idx_bookings_date       ON bookings (booking_date, booking_time) WHERE status != 'cancelled';
CREATE INDEX idx_bookings_conversation ON bookings (conversation_id) WHERE conversation_id IS NOT NULL;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE booking_services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;

-- booking_services
CREATE POLICY "Users manage own services"
  ON booking_services FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- availability_slots: owned through service
CREATE POLICY "Users manage own availability"
  ON availability_slots FOR ALL
  USING (
    service_id IN (SELECT id FROM booking_services WHERE user_id = auth.uid())
  )
  WITH CHECK (
    service_id IN (SELECT id FROM booking_services WHERE user_id = auth.uid())
  );

-- bookings
CREATE POLICY "Users manage own bookings"
  ON bookings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. AUTO-UPDATE TRIGGERS
-- ============================================================
CREATE TRIGGER trg_booking_services_updated_at
  BEFORE UPDATE ON booking_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_availability_slots_updated_at
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE booking_services;
