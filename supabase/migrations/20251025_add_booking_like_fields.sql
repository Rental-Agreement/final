-- Migration: Add Booking.com-like fields to properties

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_stars INTEGER CHECK (property_stars BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS free_cancellation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pay_at_property BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS breakfast_included BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS refundable BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS cancellation_policy JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS distance_to_center_km NUMERIC(6,2);

-- Optional: basic sanity index for geo fields
CREATE INDEX IF NOT EXISTS idx_properties_lat_lon ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_stars ON properties(property_stars);
CREATE INDEX IF NOT EXISTS idx_properties_free_cancel ON properties(free_cancellation);
CREATE INDEX IF NOT EXISTS idx_properties_pay_at ON properties(pay_at_property);
CREATE INDEX IF NOT EXISTS idx_properties_breakfast ON properties(breakfast_included);
