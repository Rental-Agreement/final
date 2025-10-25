-- Migration: Add images and custom specs to properties

ALTER TABLE properties
  ADD COLUMN images TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN wifi_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN timings VARCHAR(100),
  ADD COLUMN custom_specs JSONB DEFAULT '[]';

-- Usage:
-- images: array of image URLs
-- wifi_available: true/false
-- timings: freeform string (e.g. "9am-9pm")
-- custom_specs: JSON array of objects, e.g. [{"label": "Port", "value": "HDMI"}, {"label": "Parking", "value": "Available"}]
