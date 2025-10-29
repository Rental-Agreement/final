-- ============================================================
-- 🚀 DATABASE SETUP - COPY THIS ENTIRE FILE
-- Paste into Supabase SQL Editor and click RUN
-- Safe to run multiple times (idempotent)
-- Aligns with your existing schema (address_line_1, type, method_id, statuses)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1) ENHANCE PROPERTIES WITH PREMIUM FIELDS (aligned to existing columns)
-- ============================================================

ALTER TABLE properties
  -- Virtual Tour
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
  ADD COLUMN IF NOT EXISTS images_360 TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Transportation Scores
  ADD COLUMN IF NOT EXISTS walk_score INTEGER CHECK (walk_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS transit_score INTEGER CHECK (transit_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS bike_score INTEGER CHECK (bike_score BETWEEN 0 AND 100),

  -- Metrics & Flags
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_owner BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_properties_city_type ON properties(city, type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_per_room);
CREATE INDEX IF NOT EXISTS idx_properties_rating ON properties(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_properties_views ON properties(view_count DESC);

-- ============================================================
-- 2) PROPERTY Q&A TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_questions (
  question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  likes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS property_answers (
  answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES property_questions(question_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_property ON property_questions(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question ON property_answers(question_id);

-- RLS Policies
ALTER TABLE property_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view questions" ON property_questions;
CREATE POLICY "Anyone view questions" ON property_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users ask questions" ON property_questions;
CREATE POLICY "Users ask questions" ON property_questions FOR INSERT
  WITH CHECK (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone view answers" ON property_answers;
CREATE POLICY "Anyone view answers" ON property_answers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users answer" ON property_answers;
CREATE POLICY "Users answer" ON property_answers FOR INSERT
  WITH CHECK (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 3) NEARBY PLACES (Neighborhood Guide)
-- ============================================================

CREATE TABLE IF NOT EXISTS nearby_places (
  place_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_type TEXT NOT NULL CHECK (place_type IN ('restaurant', 'cafe', 'hospital', 'school', 'shopping', 'gym', 'park')),
  distance_km NUMERIC(5,2) NOT NULL,
  rating NUMERIC(2,1) CHECK (rating BETWEEN 0 AND 5),
  review_count INTEGER DEFAULT 0,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nearby_property ON nearby_places(property_id);

ALTER TABLE nearby_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view places" ON nearby_places;
CREATE POLICY "Anyone view places" ON nearby_places FOR SELECT USING (true);

-- ============================================================
-- 4) PROPERTY VIEWS (Recently Viewed Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS property_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_views_property ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_views_user ON property_views(user_id, viewed_at DESC);

ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone track views" ON property_views;
CREATE POLICY "Anyone track views" ON property_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users see views" ON property_views;
CREATE POLICY "Users see views" ON property_views FOR SELECT
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()) OR user_id IS NULL);

-- Auto-increment view count
CREATE OR REPLACE FUNCTION increment_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties SET view_count = view_count + 1 WHERE property_id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_views ON property_views;
CREATE TRIGGER trg_increment_views AFTER INSERT ON property_views
  FOR EACH ROW EXECUTE FUNCTION increment_views();

-- ============================================================
-- 5) SAVED SEARCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  email_alerts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_searches_user ON saved_searches(user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage searches" ON saved_searches;
CREATE POLICY "Users manage searches" ON saved_searches FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 6) PRICE ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS price_alerts (
  alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  original_price NUMERIC(10,2) NOT NULL,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage alerts" ON price_alerts;
CREATE POLICY "Users manage alerts" ON price_alerts FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 7) NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'lease', 'payment')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, read) WHERE read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view notifications" ON notifications;
CREATE POLICY "Users view notifications" ON notifications FOR SELECT
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update notifications" ON notifications;
CREATE POLICY "Users update notifications" ON notifications FOR UPDATE
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 8) MESSAGES (Support Tickets)
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  is_support_ticket BOOLEAN DEFAULT FALSE,
  ticket_status VARCHAR(50) DEFAULT 'open' CHECK (ticket_status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_msg_support ON messages(is_support_ticket) WHERE is_support_ticket = TRUE;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view messages" ON messages;
CREATE POLICY "Users view messages" ON messages FOR SELECT
  USING (
    sender_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    OR recipient_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users send messages" ON messages FOR INSERT
  WITH CHECK (sender_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- Optional policy for payment_methods (align with existing method_id)
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage payment methods" ON payment_methods;
CREATE POLICY "Users manage payment methods" ON payment_methods FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 9) UTILITY: Get Similar Properties (uses address_line_1, type)
-- ============================================================

-- Drop existing variant to allow return type changes safely
DROP FUNCTION IF EXISTS public.get_similar_properties(uuid, integer);

CREATE OR REPLACE FUNCTION get_similar_properties(
  p_property_id UUID,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  property_id UUID,
  title TEXT,
  city TEXT,
  price_per_room NUMERIC,
  rating NUMERIC,
  type TEXT,
  main_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.property_id,
    p.address_line_1 AS title,
    p.city,
    p.price_per_room,
    p.rating,
    p.type,
    (CASE WHEN array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END) AS main_image
  FROM properties p
  JOIN properties ref ON ref.property_id = p_property_id
  WHERE p.property_id <> p_property_id
    AND COALESCE(p.is_approved, true) = true
    AND p.city = ref.city
    AND COALESCE(p.type, '') = COALESCE(ref.type, '')
    AND p.price_per_room IS NOT NULL
  ORDER BY 
    ABS(COALESCE(p.price_per_room, 0) - COALESCE(ref.price_per_room, 0)),
    COALESCE(p.rating, 0) DESC,
    COALESCE(p.view_count, 0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10) AUTOMATIC NOTIFICATION TRIGGERS (aligned to existing tables/statuses)
-- ============================================================

-- Notify on payment success (transactions.status = 'Success')
CREATE OR REPLACE FUNCTION notify_payment_success()
RETURNS TRIGGER AS $$
DECLARE v_tenant_id UUID;
BEGIN
  IF NEW.status = 'Success' THEN
    SELECT tenant_id INTO v_tenant_id FROM leases WHERE lease_id = NEW.lease_id;
    IF v_tenant_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        v_tenant_id,
        'Payment Successful! 💰',
        format('Your payment of ₹%s has been processed successfully.', NEW.amount),
        'success',
        '/tenant?tab=payments'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_success ON transactions;
CREATE TRIGGER trg_payment_success AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW WHEN (NEW.status = 'Success')
  EXECUTE FUNCTION notify_payment_success();

-- Notify on dispute resolution (disputes.status = 'Resolved')
CREATE OR REPLACE FUNCTION notify_dispute_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Resolved' AND (OLD.status IS DISTINCT FROM 'Resolved') THEN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.raised_by_user_id,
      'Dispute Resolved ✅',
      'Your dispute has been resolved. Check the resolution notes.',
      'success',
      '/tenant?tab=disputes'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dispute_resolved ON disputes;
CREATE TRIGGER trg_dispute_resolved AFTER UPDATE ON disputes
  FOR EACH ROW WHEN (NEW.status = 'Resolved')
  EXECUTE FUNCTION notify_dispute_resolved();

-- ============================================================
-- 11) OPTIONAL: Seed transport scores where null (safe)
-- ============================================================

UPDATE properties
SET 
  walk_score = COALESCE(walk_score, 70 + (random() * 30)::INTEGER),
  transit_score = COALESCE(transit_score, 60 + (random() * 40)::INTEGER),
  bike_score = COALESCE(bike_score, 65 + (random() * 35)::INTEGER),
  verified_owner = COALESCE(verified_owner, (random() > 0.5)),
  instant_booking = COALESCE(instant_booking, (random() > 0.7))
WHERE walk_score IS NULL OR transit_score IS NULL OR bike_score IS NULL;

-- ============================================================
-- ✅ DONE. Paste this entire file into Supabase SQL Editor and RUN.
-- ============================================================
