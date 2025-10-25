-- Migration: Add slug to properties and full-text search index

-- 1) Add slug column (unique)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_properties_slug ON properties(slug);

-- 2) Helper function to generate a slug from address and city
CREATE OR REPLACE FUNCTION public.generate_property_slug(addr TEXT, city TEXT, pid UUID)
RETURNS TEXT AS $$
DECLARE
  base TEXT;
  short_id TEXT;
BEGIN
  base := lower(regexp_replace(coalesce(addr,'') || '-' || coalesce(city,''), '[^a-z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  short_id := substr(replace(pid::text, '-', ''), 1, 6);
  RETURN base || '-' || short_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3) Trigger to set slug on insert if null
CREATE OR REPLACE FUNCTION public.properties_set_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_property_slug(NEW.address, NEW.city, NEW.property_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_set_slug ON properties;
CREATE TRIGGER trg_properties_set_slug
BEFORE INSERT ON properties
FOR EACH ROW EXECUTE FUNCTION public.properties_set_slug();

-- 4) Full-text search: tsvector column + trigger
ALTER TABLE properties ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.properties_update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.address, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.city, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.state, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.property_type, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_search_vector_insupd ON properties;
CREATE TRIGGER trg_properties_search_vector_insupd
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION public.properties_update_search_vector();

-- 5) Index
CREATE INDEX IF NOT EXISTS idx_properties_search_vector ON properties USING GIN (search_vector);
