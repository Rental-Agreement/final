-- =====================================================
-- ADD LOCATION AND DYNAMIC DATA TO PROPERTIES
-- Makes tenant dashboard show real location-based data
-- Paste this entire script into Supabase SQL Editor
-- =====================================================

-- Step 1: Add location and amenities columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS house_rules TEXT,
ADD COLUMN IF NOT EXISTS nearby_amenities JSONB,
ADD COLUMN IF NOT EXISTS amenities_last_updated TIMESTAMPTZ;

-- Step 2: Create index for geo queries
CREATE INDEX IF NOT EXISTS idx_properties_location 
ON public.properties(latitude, longitude);

-- Step 3: Add sample house rules for existing properties
UPDATE public.properties 
SET house_rules = 
'• Government ID required at check-in
• No smoking in rooms
• Pets not allowed  
• Quiet hours: 10 PM - 6 AM
• Parties and events prohibited
• Visitors allowed with prior notice'
WHERE house_rules IS NULL;

-- Step 4: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'properties'
    AND column_name IN ('latitude', 'longitude', 'house_rules', 'nearby_amenities', 'amenities_last_updated')
ORDER BY ordinal_position;

-- Step 5: Show sample data structure for nearby_amenities
COMMENT ON COLUMN public.properties.nearby_amenities IS 
'JSON structure: {
  "transportation": {
    "metro": {"name": "Station Name", "distance": 0.8, "address": "Full Address"},
    "bus_stop": {"name": "Stop Name", "distance": 0.3, "address": "Full Address"},
    "railway": {"name": "Railway Station", "distance": 4.2, "address": "Full Address"},
    "airport": {"name": "Airport Name", "distance": 32.5, "address": "Full Address"}
  },
  "essentials": {
    "hospital": {"name": "Hospital Name", "distance": 1.2, "address": "Full Address", "rating": 4.5},
    "police": {"name": "Police Station", "distance": 0.9, "address": "Full Address"},
    "mall": {"name": "Mall Name", "distance": 2.1, "address": "Full Address", "rating": 4.3},
    "school": {"name": "School Name", "distance": 1.5, "address": "Full Address", "rating": 4.7}
  },
  "updated_at": "2025-11-04T10:30:00Z"
}';

-- Success message
SELECT '✅ Properties table updated with location and amenity columns!' as status;
SELECT '🗺️ You can now store real location data for each property' as next_step;
