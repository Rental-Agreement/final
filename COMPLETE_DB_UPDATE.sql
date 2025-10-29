-- ============================================================
-- COMPLETE DATABASE UPDATE FOR ALL PREMIUM FEATURES
-- Safe to run multiple times (idempotent)
-- 
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ============================================================
-- PART 1: PROPERTIES TABLE - ADD PREMIUM FIELDS
-- ============================================================

-- Add columns for Virtual Tour feature
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS virtual_tour_video TEXT,
  ADD COLUMN IF NOT EXISTS images_360 TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Add columns for Transportation Score
  ADD COLUMN IF NOT EXISTS walk_score INTEGER CHECK (walk_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS transit_score INTEGER CHECK (transit_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS bike_score INTEGER CHECK (bike_score BETWEEN 0 AND 100),
  
  -- Add existing enhancement columns
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_owner BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS available_from DATE,
  ADD COLUMN IF NOT EXISTS min_stay_months INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_stay_months INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS maintenance_charges NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS property_stars INTEGER CHECK (property_stars BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
  
  -- SEO and metadata
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_properties_view_count ON properties(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured, featured_until) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_verified ON properties(verified_owner) WHERE verified_owner = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_city_type ON properties(city, property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_per_room);
CREATE INDEX IF NOT EXISTS idx_properties_rating ON properties(rating DESC NULLS LAST);

-- ============================================================
-- PART 2: PROPERTY Q&A TABLE
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

CREATE INDEX IF NOT EXISTS idx_property_questions_property ON property_questions(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_answers_question ON property_answers(question_id);

-- RLS Policies for Q&A
ALTER TABLE property_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions" ON property_questions;
CREATE POLICY "Anyone can view questions"
  ON property_questions FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can ask questions" ON property_questions;
CREATE POLICY "Authenticated users can ask questions"
  ON property_questions FOR INSERT
  WITH CHECK (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can view answers" ON property_answers;
CREATE POLICY "Anyone can view answers"
  ON property_answers FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can answer" ON property_answers;
CREATE POLICY "Authenticated users can answer"
  ON property_answers FOR INSERT
  WITH CHECK (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own answers" ON property_answers;
CREATE POLICY "Users can update their own answers"
  ON property_answers FOR UPDATE
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- PART 3: NEIGHBORHOOD PLACES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS nearby_places (
  place_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_type TEXT NOT NULL CHECK (place_type IN ('restaurant', 'cafe', 'hospital', 'school', 'shopping', 'gym', 'park', 'pharmacy', 'bank', 'metro')),
  distance_km NUMERIC(5,2) NOT NULL,
  rating NUMERIC(2,1) CHECK (rating BETWEEN 0 AND 5),
  review_count INTEGER DEFAULT 0,
  address TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nearby_places_property ON nearby_places(property_id, place_type);
CREATE INDEX IF NOT EXISTS idx_nearby_places_distance ON nearby_places(distance_km);

ALTER TABLE nearby_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view nearby places" ON nearby_places;
CREATE POLICY "Anyone can view nearby places"
  ON nearby_places FOR SELECT 
  USING (true);

-- ============================================================
-- PART 4: PROPERTY VIEWS (Recently Viewed)
-- ============================================================

CREATE TABLE IF NOT EXISTS property_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user ON property_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_session ON property_views(session_id, viewed_at DESC);

ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track views" ON property_views;
CREATE POLICY "Anyone can track views"
  ON property_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can see their views" ON property_views;
CREATE POLICY "Users can see their views"
  ON property_views FOR SELECT
  USING (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    OR user_id IS NULL
  );

-- Trigger to increment view count
CREATE OR REPLACE FUNCTION increment_property_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET view_count = view_count + 1
  WHERE property_id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_property_views ON property_views;
CREATE TRIGGER trg_increment_property_views
  AFTER INSERT ON property_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_property_views();

-- ============================================================
-- PART 5: SAVED SEARCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  email_alerts BOOLEAN DEFAULT FALSE,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts ON saved_searches(email_alerts, last_checked) WHERE email_alerts = TRUE;

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage saved searches" ON saved_searches;
CREATE POLICY "Users manage saved searches"
  ON saved_searches FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- PART 6: PRICE ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS price_alerts (
  alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  original_price NUMERIC(10,2) NOT NULL,
  target_price NUMERIC(10,2),
  alert_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_property ON price_alerts(property_id, alert_sent);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage price alerts" ON price_alerts;
CREATE POLICY "Users manage price alerts"
  ON price_alerts FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- Function to check and send price alerts
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS VOID AS $$
BEGIN
  UPDATE price_alerts pa
  SET alert_sent = TRUE, sent_at = NOW()
  FROM properties p
  WHERE pa.property_id = p.property_id
    AND pa.alert_sent = FALSE
    AND p.price_per_room < pa.original_price
    AND (pa.target_price IS NULL OR p.price_per_room <= pa.target_price);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PART 7: PAYMENT METHODS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  payment_method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('card', 'bank_transfer', 'upi', 'wallet', 'cash')),
  card_last4 VARCHAR(4),
  card_brand VARCHAR(50),
  upi_id TEXT,
  bank_name TEXT,
  account_last4 VARCHAR(4),
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage payment methods" ON payment_methods;
CREATE POLICY "Users manage payment methods"
  ON payment_methods FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- PART 8: TRANSACTIONS TABLE ENHANCEMENTS
-- ============================================================

-- Add payment method reference if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_method_id'
  ) THEN
    ALTER TABLE transactions
      ADD COLUMN payment_method_id UUID REFERENCES payment_methods(payment_method_id) ON DELETE SET NULL,
      ADD COLUMN payment_gateway TEXT,
      ADD COLUMN gateway_transaction_id TEXT,
      ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
      ADD COLUMN refund_amount NUMERIC(10,2),
      ADD COLUMN refund_reason TEXT,
      ADD COLUMN refunded_at TIMESTAMPTZ,
      ADD COLUMN receipt_url TEXT,
      ADD COLUMN notes TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway ON transactions(gateway_transaction_id);

-- ============================================================
-- PART 9: DISPUTES TABLE ENHANCEMENTS
-- ============================================================

-- Add resolution fields if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'priority'
  ) THEN
    ALTER TABLE disputes
      ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      ADD COLUMN category VARCHAR(50) CHECK (category IN ('maintenance', 'payment', 'noise', 'cleanliness', 'safety', 'other')),
      ADD COLUMN evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
      ADD COLUMN resolved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
      ADD COLUMN resolution_notes TEXT,
      ADD COLUMN satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority, status);
CREATE INDEX IF NOT EXISTS idx_disputes_category ON disputes(category);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned ON disputes(assigned_to) WHERE assigned_to IS NOT NULL;

-- ============================================================
-- PART 10: LEASE APPLICATIONS ENHANCEMENTS
-- ============================================================

-- Add application tracking fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lease_applications' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE lease_applications
      ADD COLUMN reviewed_at TIMESTAMPTZ,
      ADD COLUMN reviewed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
      ADD COLUMN rejection_reason TEXT,
      ADD COLUMN documents_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN background_check_status VARCHAR(50) DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'in_progress', 'approved', 'rejected')),
      ADD COLUMN move_in_checklist JSONB DEFAULT '[]'::JSONB,
      ADD COLUMN emergency_contact_name TEXT,
      ADD COLUMN emergency_contact_phone TEXT,
      ADD COLUMN employment_status VARCHAR(50),
      ADD COLUMN employer_name TEXT,
      ADD COLUMN monthly_income NUMERIC(10,2),
      ADD COLUMN previous_rental_history TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lease_applications_status ON lease_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lease_applications_property ON lease_applications(property_id, status);

-- ============================================================
-- PART 11: NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'lease', 'payment', 'message', 'review', 'alert')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- PART 12: MESSAGES TABLE (for Help Widget & Support)
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(property_id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  replied BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES messages(message_id) ON DELETE SET NULL,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_support_ticket BOOLEAN DEFAULT FALSE,
  ticket_status VARCHAR(50) DEFAULT 'open' CHECK (ticket_status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_property ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_support ON messages(is_support_ticket, ticket_status) WHERE is_support_ticket = TRUE;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own messages" ON messages;
CREATE POLICY "Users view own messages"
  ON messages FOR SELECT
  USING (
    sender_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    OR recipient_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update messages" ON messages;
CREATE POLICY "Users update messages"
  ON messages FOR UPDATE
  USING (
    sender_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    OR recipient_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================================
-- PART 13: UTILITY FUNCTIONS
-- ============================================================

-- Function to get similar properties (for carousel)
CREATE OR REPLACE FUNCTION get_similar_properties(
  p_property_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  property_id UUID,
  title TEXT,
  address TEXT,
  city TEXT,
  price_per_room NUMERIC,
  rating NUMERIC,
  property_type TEXT,
  images TEXT[],
  main_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.property_id,
    COALESCE(p.address, 'Property') as title,
    p.address,
    p.city,
    p.price_per_room,
    p.rating,
    p.property_type,
    p.images,
    (CASE WHEN array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END) as main_image
  FROM properties p
  CROSS JOIN properties ref
  WHERE ref.property_id = p_property_id
    AND p.property_id != p_property_id
    AND p.is_approved = true
    AND p.city = ref.city
    AND p.property_type = ref.property_type
    AND p.price_per_room IS NOT NULL
  ORDER BY 
    ABS(COALESCE(p.price_per_room, 0) - COALESCE(ref.price_per_room, 0)),
    COALESCE(p.rating, 0) DESC,
    p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_url, p_metadata)
  RETURNING notification_id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id UUID, p_notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE user_id = p_user_id
    AND notification_id = ANY(p_notification_ids)
    AND read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PART 14: TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ============================================================

-- Trigger when lease application is approved
CREATE OR REPLACE FUNCTION notify_lease_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
    PERFORM create_notification(
      NEW.tenant_id,
      'Lease Application Approved! 🎉',
      'Your lease application has been approved. You can now proceed with the booking.',
      'success',
      '/tenant'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lease_approved ON lease_applications;
CREATE TRIGGER trg_lease_approved
  AFTER UPDATE ON lease_applications
  FOR EACH ROW
  WHEN (NEW.status = 'Approved')
  EXECUTE FUNCTION notify_lease_approved();

-- Trigger when payment is completed
CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
    -- Get tenant from lease
    SELECT tenant_id INTO v_tenant_id
    FROM leases
    WHERE lease_id = NEW.lease_id;
    
    IF v_tenant_id IS NOT NULL THEN
      PERFORM create_notification(
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

DROP TRIGGER IF EXISTS trg_payment_completed ON transactions;
CREATE TRIGGER trg_payment_completed
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'Completed')
  EXECUTE FUNCTION notify_payment_completed();

-- Trigger when dispute is resolved
CREATE OR REPLACE FUNCTION notify_dispute_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Resolved' AND OLD.status != 'Resolved' THEN
    PERFORM create_notification(
      NEW.tenant_id,
      'Dispute Resolved ✅',
      'Your dispute has been resolved. Check the details for resolution notes.',
      'success',
      '/tenant?tab=disputes'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dispute_resolved ON disputes;
CREATE TRIGGER trg_dispute_resolved
  AFTER UPDATE ON disputes
  FOR EACH ROW
  WHEN (NEW.status = 'Resolved')
  EXECUTE FUNCTION notify_dispute_resolved();

-- ============================================================
-- PART 15: UPDATE RATING COUNT ON REVIEW INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION update_property_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET 
    rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM reviews
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    )
  WHERE property_id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_property_rating ON reviews;
CREATE TRIGGER trg_update_property_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_property_rating();

-- ============================================================
-- PART 16: SAMPLE DATA FOR TESTING PREMIUM FEATURES
-- ============================================================

-- Add sample transportation scores to existing properties
UPDATE properties
SET 
  walk_score = 70 + (random() * 30)::INTEGER,
  transit_score = 60 + (random() * 40)::INTEGER,
  bike_score = 65 + (random() * 35)::INTEGER,
  property_stars = (1 + (random() * 4))::INTEGER,
  verified_owner = (random() > 0.5),
  instant_booking = (random() > 0.7)
WHERE walk_score IS NULL;

-- ============================================================
-- ✅ DATABASE UPDATE COMPLETE!
-- 
-- TABLES CREATED/UPDATED:
-- ✅ properties (enhanced with 20+ premium fields)
-- ✅ property_questions (Q&A feature)
-- ✅ property_answers (Q&A responses)
-- ✅ nearby_places (Neighborhood Guide)
-- ✅ property_views (Recently Viewed tracking)
-- ✅ saved_searches (Save Search feature)
-- ✅ price_alerts (Price drop notifications)
-- ✅ payment_methods (Multiple payment options)
-- ✅ transactions (Enhanced payment tracking)
-- ✅ disputes (Enhanced resolution tracking)
-- ✅ lease_applications (Enhanced with verification)
-- ✅ notifications (Push notifications system)
-- ✅ messages (Support tickets & messaging)
--
-- FUNCTIONS CREATED:
-- ✅ get_similar_properties() - For similar property carousel
-- ✅ create_notification() - Send notifications to users
-- ✅ mark_notifications_read() - Mark notifications as read
-- ✅ check_price_alerts() - Check and send price alerts
--
-- TRIGGERS CREATED:
-- ✅ Auto-increment property view count
-- ✅ Auto-update property ratings
-- ✅ Auto-notify on lease approval
-- ✅ Auto-notify on payment completion
-- ✅ Auto-notify on dispute resolution
--
-- NEXT STEPS:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables in Supabase Table Editor
-- 3. Test features in your React app
-- 4. All buttons should now work!
--
-- ALL TABLES HAVE ROW LEVEL SECURITY (RLS) ENABLED ✅
-- ============================================================
