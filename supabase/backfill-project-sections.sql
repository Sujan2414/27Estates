-- ============================================================
-- Backfill section column for projects with NULL section
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. DIAGNOSTIC: see what's currently unclassified
SELECT id, project_name, section, listing_type, category, created_at
FROM projects
WHERE section IS NULL
ORDER BY created_at DESC;

-- 2. Assign commercial records (identified by category or listing_type)
--    to section = 'commercial'
UPDATE projects
SET section = 'commercial'
WHERE section IS NULL
  AND (
      category = 'Commercial'
      OR listing_type IN ('For Rent', 'For Sale', 'For Lease')
      AND (
          sub_category IN ('Office Space','Retail Shops','Co-Working Space','Showroom','Mixed Use','Business Park','Mall')
          OR bhk_options::text ILIKE '%Office%'
          OR bhk_options::text ILIKE '%Retail%'
          OR bhk_options::text ILIKE '%Co-Working%'
      )
  );

-- 3. Assign warehouse records to section = 'warehouse'
UPDATE projects
SET section = 'warehouse'
WHERE section IS NULL
  AND (
      category = 'Warehouse'
      OR sub_category IN ('Cold Storage','Distribution Center','Industrial','Self Storage','Fulfillment Center','Logistics Park')
  );

-- 4. Everything else with NULL section is residential
UPDATE projects
SET section = 'residential'
WHERE section IS NULL;

-- 5. Verify — should show no NULLs and correct counts
SELECT
    section,
    COUNT(*) AS count
FROM projects
GROUP BY section
ORDER BY section;

-- 6. Also verify commercial/warehouse are NOT duplicated in residential
SELECT section, listing_type, COUNT(*)
FROM projects
WHERE section IN ('commercial', 'warehouse', 'residential')
GROUP BY section, listing_type
ORDER BY section, listing_type;
