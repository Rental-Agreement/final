-- ============================================================
-- FIX PROPERTY SCHEMA - Run this in Supabase SQL Editor
-- Fixes the "null value in column address" error
-- ============================================================

-- Ensure both address and address_line_1 columns exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT;

-- Create trigger to keep address and address_line_1 in sync
CREATE OR REPLACE FUNCTION public.properties_sync_aliases()
RETURNS trigger AS $$
BEGIN
  -- Sync address <-> address_line_1
  IF (NEW.address IS NULL OR NEW.address = '') AND NEW.address_line_1 IS NOT NULL THEN
    NEW.address := NEW.address_line_1;
  END IF;

  IF (NEW.address_line_1 IS NULL OR NEW.address_line_1 = '') AND NEW.address IS NOT NULL THEN
    NEW.address_line_1 := NEW.address;
  END IF;

  -- Sync property_type <-> type
  IF (NEW.property_type IS NULL OR NEW.property_type = '') AND NEW.type IS NOT NULL THEN
    NEW.property_type := NEW.type;
  END IF;

  IF (NEW.type IS NULL OR NEW.type = '') AND NEW.property_type IS NOT NULL THEN
    NEW.type := NEW.property_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS trg_properties_sync_aliases ON properties;
CREATE TRIGGER trg_properties_sync_aliases
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION public.properties_sync_aliases();

-- Backfill existing data (sync address_line_1 to address)
UPDATE properties
SET address = address_line_1
WHERE address IS NULL AND address_line_1 IS NOT NULL;

UPDATE properties
SET address_line_1 = address
WHERE address_line_1 IS NULL AND address IS NOT NULL;

-- Backfill property types
UPDATE properties
SET property_type = type
WHERE property_type IS NULL AND type IS NOT NULL;

UPDATE properties
SET type = property_type
WHERE type IS NULL AND property_type IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Property schema fixed! You can now add properties without errors.';
END $$;
