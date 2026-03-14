-- ============================================================
-- Ensure commercial & warehouse listing_type is properly set
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Confirm constraint includes all three types (safe re-run)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_listing_type_check;
ALTER TABLE projects
    ADD CONSTRAINT projects_listing_type_check
    CHECK (listing_type IN ('For Sale', 'For Rent', 'For Lease'));

-- 2. Ensure column has a sensible default for new inserts
ALTER TABLE projects ALTER COLUMN listing_type SET DEFAULT 'For Rent';

-- 3. Backfill any remaining NULLs in commercial/warehouse
UPDATE projects
SET listing_type = 'For Rent'
WHERE section IN ('commercial', 'warehouse')
  AND listing_type IS NULL;

-- 4. Backfill any remaining NULLs in residential (keep as For Sale)
UPDATE projects
SET listing_type = 'For Sale'
WHERE (section = 'residential' OR section IS NULL)
  AND listing_type IS NULL;

-- ============================================================
-- DIAGNOSTIC: current distribution
-- Run this SELECT to see what exists in each section/type
-- ============================================================
SELECT
    section,
    listing_type,
    COUNT(*) AS count
FROM projects
WHERE section IN ('commercial', 'warehouse')
GROUP BY section, listing_type
ORDER BY section, listing_type;

-- ============================================================
-- HOW TO ADD For Sale / For Lease commercial records
-- ============================================================
-- Option A: Use the Admin Panel → Commercial → New Commercial
--           and select "For Sale" or "For Lease" as Listing Type.
--
-- Option B: Duplicate an existing commercial record with a
--           different listing_type (quick test data):
--
-- INSERT INTO projects (
--     project_name, description, images, location, city, state,
--     status, section, listing_type, sub_category, bhk_options,
--     min_price, max_price, min_area, developer_name,
--     is_rera_approved, is_featured, possession_date, created_at
-- )
-- SELECT
--     project_name || ' (For Sale)',
--     description, images, location, city, state,
--     status, section,
--     'For Sale',   -- <-- change to 'For Lease' for lease records
--     sub_category, bhk_options,
--     min_price, max_price, min_area, developer_name,
--     is_rera_approved, false, possession_date, now()
-- FROM projects
-- WHERE section = 'commercial'
-- LIMIT 3;   -- duplicates 3 existing records as For Sale
--
-- Uncomment and run the INSERT above to create test data,
-- or add real listings via the Admin Panel.
