-- Migration: Add amenities and ratings to properties table
ALTER TABLE properties
  ADD COLUMN rating NUMERIC(2,1) DEFAULT 4.5,
  ADD COLUMN rating_count INTEGER DEFAULT 0,
  ADD COLUMN price_per_room NUMERIC(10,2),
  ADD COLUMN amenities JSONB DEFAULT '{}'::jsonb;

-- Example amenities JSONB: {"wifi":true, "elevator":true, "geyser":true, "ac":true, "parking":true}

-- You can update amenities for a property like:
-- UPDATE properties SET amenities = '{"wifi":true, "elevator":true, "geyser":true, "ac":true, "parking":true}' WHERE property_id = '...';

-- If you want to remove custom_specs and use amenities instead, you can drop the column:
-- ALTER TABLE properties DROP COLUMN custom_specs;
