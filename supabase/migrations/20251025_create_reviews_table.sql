-- Migration: Create reviews table and triggers to maintain property aggregates

CREATE TABLE IF NOT EXISTS reviews (
  review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated can insert reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Aggregate updater
CREATE OR REPLACE FUNCTION public.refresh_property_rating(p_id UUID)
RETURNS VOID AS $$
DECLARE
  agg RECORD;
BEGIN
  SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS cnt
  INTO agg
  FROM reviews WHERE property_id = p_id;

  UPDATE properties
  SET rating = ROUND(COALESCE(agg.avg_rating, 0)::numeric, 1),
      rating_count = COALESCE(agg.cnt, 0)
  WHERE property_id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE FUNCTION public.reviews_after_change()
RETURNS trigger AS $$
BEGIN
  PERFORM public.refresh_property_rating(COALESCE(NEW.property_id, OLD.property_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_after_change ON reviews;
CREATE TRIGGER trg_reviews_after_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_after_change();
