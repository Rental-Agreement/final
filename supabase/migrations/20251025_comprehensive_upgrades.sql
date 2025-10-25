-- ============================================================
-- COMPREHENSIVE DATABASE UPGRADES - All 21+ Features
-- Safe to run multiple times (idempotent)
-- ============================================================

-- ============================================================
-- 1) CORE ENHANCEMENTS TO PROPERTIES TABLE
-- ============================================================

-- Add advanced property attributes
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_owner BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
  ADD COLUMN IF NOT EXISTS floor_plan_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS available_from DATE,
  ADD COLUMN IF NOT EXISTS min_stay_months INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_stay_months INTEGER,
  ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS maintenance_charges NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS occupancy_rate NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_booked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS popular_rank INTEGER,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Neighborhood insights
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS safety_score INTEGER CHECK (safety_score BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS noise_level VARCHAR(20) CHECK (noise_level IN ('Quiet', 'Moderate', 'Noisy')),
  ADD COLUMN IF NOT EXISTS walkability_score INTEGER CHECK (walkability_score BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS public_transport_access VARCHAR(20) CHECK (public_transport_access IN ('Excellent', 'Good', 'Fair', 'Poor'));

-- SEO and marketing
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_view_count ON properties(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_properties_popular_rank ON properties(popular_rank ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_properties_available_from ON properties(available_from);
CREATE INDEX IF NOT EXISTS idx_properties_verified ON properties(verified_owner);
CREATE INDEX IF NOT EXISTS idx_properties_instant_booking ON properties(instant_booking);

-- ============================================================
-- 2) PROPERTY PHOTOS TABLE (for gallery with captions)
-- ============================================================

CREATE TABLE IF NOT EXISTS property_photos (
  photo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_photos_property ON property_photos(property_id, display_order);

ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view property photos" ON property_photos;
CREATE POLICY "Anyone can view property photos"
  ON property_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage their property photos" ON property_photos;
CREATE POLICY "Owners can manage their property photos"
  ON property_photos FOR ALL
  USING (
    property_id IN (
      SELECT p.property_id FROM properties p
      WHERE p.owner_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- ============================================================
-- 3) REVIEW ENHANCEMENTS (add photo reviews, helpful votes)
-- ============================================================

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_booking BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stay_date DATE,
  ADD COLUMN IF NOT EXISTS response TEXT,
  ADD COLUMN IF NOT EXISTS response_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified_booking);

-- Review helpful votes tracking
CREATE TABLE IF NOT EXISTS review_votes (
  vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_votes;
CREATE POLICY "Users can vote on reviews"
  ON review_votes FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Trigger to update helpful_count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = (
    SELECT COUNT(*) FROM review_votes
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
    AND is_helpful = true
  )
  WHERE review_id = COALESCE(NEW.review_id, OLD.review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_votes_update_count ON review_votes;
CREATE TRIGGER trg_review_votes_update_count
  AFTER INSERT OR UPDATE OR DELETE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- ============================================================
-- 4) SAVED SEARCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  email_alerts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their saved searches" ON saved_searches;
CREATE POLICY "Users manage their saved searches"
  ON saved_searches FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 5) RECENTLY VIEWED PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user ON property_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_session ON property_views(session_id, viewed_at DESC);

ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track property views" ON property_views;
CREATE POLICY "Anyone can track property views"
  ON property_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can see their own views" ON property_views;
CREATE POLICY "Users can see their own views"
  ON property_views FOR SELECT
  USING (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    OR session_id IS NOT NULL
  );

-- Trigger to increment property view_count
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
-- 6) PROPERTY COMPARISONS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_comparisons (
  comparison_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_id TEXT,
  property_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparisons_user ON property_comparisons(user_id);

ALTER TABLE property_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their comparisons" ON property_comparisons;
CREATE POLICY "Users manage their comparisons"
  ON property_comparisons FOR ALL
  USING (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    OR session_id IS NOT NULL
  );

-- ============================================================
-- 7) PRICE ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS price_alerts (
  alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  original_price NUMERIC(10,2) NOT NULL,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_property ON price_alerts(property_id, alert_sent);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their price alerts" ON price_alerts;
CREATE POLICY "Users manage their price alerts"
  ON price_alerts FOR ALL
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 8) AVAILABILITY CALENDAR
-- ============================================================

CREATE TABLE IF NOT EXISTS property_availability (
  availability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  price_override NUMERIC(10,2),
  notes TEXT,
  UNIQUE(property_id, room_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_property_date ON property_availability(property_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_room_date ON property_availability(room_id, date);

ALTER TABLE property_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view availability" ON property_availability;
CREATE POLICY "Anyone can view availability"
  ON property_availability FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners manage availability" ON property_availability;
CREATE POLICY "Owners manage availability"
  ON property_availability FOR ALL
  USING (
    property_id IN (
      SELECT p.property_id FROM properties p
      WHERE p.owner_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- ============================================================
-- 9) NEIGHBORHOOD DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS neighborhoods (
  neighborhood_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  description TEXT,
  safety_score INTEGER CHECK (safety_score BETWEEN 1 AND 10),
  walkability_score INTEGER CHECK (walkability_score BETWEEN 1 AND 10),
  avg_rent NUMERIC(10,2),
  popular_amenities TEXT[],
  guide_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city, state);

ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view neighborhoods" ON neighborhoods;
CREATE POLICY "Anyone can view neighborhoods"
  ON neighborhoods FOR SELECT USING (true);

-- ============================================================
-- 10) USER BADGES & GAMIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS user_badges (
  badge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their badges" ON user_badges;
CREATE POLICY "Users can view their badges"
  ON user_badges FOR SELECT
  USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 11) FUNCTIONS & HELPERS
-- ============================================================

-- Function to calculate popular rank based on views, bookings, rating
CREATE OR REPLACE FUNCTION calculate_popular_rank()
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT 
      property_id,
      ROW_NUMBER() OVER (
        ORDER BY 
          (view_count * 0.3 + booking_count * 5 + rating * rating_count * 0.5) DESC
      ) as rank
    FROM properties
    WHERE is_approved = true
  )
  UPDATE properties p
  SET popular_rank = r.rank
  FROM ranked r
  WHERE p.property_id = r.property_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get similar properties (same type, similar price)
CREATE OR REPLACE FUNCTION get_similar_properties(p_id UUID, limit_count INTEGER DEFAULT 6)
RETURNS TABLE (
  property_id UUID,
  address TEXT,
  city TEXT,
  price_per_room NUMERIC,
  rating NUMERIC,
  images TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.property_id,
    p.address,
    p.city,
    p.price_per_room,
    p.rating,
    p.images
  FROM properties p
  INNER JOIN properties ref ON ref.property_id = p_id
  WHERE p.property_id != p_id
    AND p.is_approved = true
    AND p.property_type = ref.property_type
    AND p.city = ref.city
    AND ABS(p.price_per_room - ref.price_per_room) < (ref.price_per_room * 0.3)
  ORDER BY 
    ABS(p.price_per_room - ref.price_per_room),
    p.rating DESC,
    p.view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to award badges automatically
CREATE OR REPLACE FUNCTION award_user_badges()
RETURNS VOID AS $$
BEGIN
  -- Early Bird badge (first 100 users)
  INSERT INTO user_badges (user_id, badge_type, badge_name, description)
  SELECT 
    user_id,
    'early_bird',
    'Early Bird',
    'Among the first 100 users'
  FROM users
  WHERE created_at < (SELECT created_at FROM users ORDER BY created_at LIMIT 1 OFFSET 99)
  ON CONFLICT (user_id, badge_type) DO NOTHING;

  -- Verified Reviewer (5+ reviews)
  INSERT INTO user_badges (user_id, badge_type, badge_name, description)
  SELECT 
    user_id,
    'verified_reviewer',
    'Verified Reviewer',
    'Submitted 5+ reviews'
  FROM (
    SELECT user_id, COUNT(*) as review_count
    FROM reviews
    GROUP BY user_id
    HAVING COUNT(*) >= 5
  ) r
  ON CONFLICT (user_id, badge_type) DO NOTHING;

  -- Explorer (viewed 50+ properties)
  INSERT INTO user_badges (user_id, badge_type, badge_name, description)
  SELECT 
    user_id,
    'explorer',
    'Explorer',
    'Viewed 50+ properties'
  FROM (
    SELECT user_id, COUNT(DISTINCT property_id) as view_count
    FROM property_views
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(DISTINCT property_id) >= 50
  ) v
  ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 12) DATA BACKFILL & MAINTENANCE
-- ============================================================

-- Backfill slugs
UPDATE properties
SET slug = public.generate_property_slug(address, city, property_id)
WHERE (slug IS NULL OR slug = '');

-- Backfill search vectors
UPDATE properties
SET address = address
WHERE search_vector IS NULL;

-- Calculate initial popular ranks
SELECT calculate_popular_rank();

-- ============================================================
-- COMPLETE! All schema changes applied.
-- Next: Run `SELECT award_user_badges();` periodically (cron job)
-- Next: Run `SELECT calculate_popular_rank();` daily
-- ============================================================
