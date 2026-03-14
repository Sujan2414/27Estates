-- Migration: Pre-Launch status + default listing_type to 'For Rent' for commercial/warehouse
-- Run this in Supabase SQL Editor

-- 1. Update status constraint on projects to include 'Pre-Launch'
--    (Only run if a check constraint exists; safe to run regardless)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects
    ADD CONSTRAINT projects_status_check
    CHECK (status IN ('Pre-Launch', 'Upcoming', 'New Launch', 'Under Construction', 'Ready to Move'));

-- 2. Change the default listing_type for new commercial/warehouse inserts to 'For Rent'
--    (The column default stays 'For Sale' globally; individual defaults are set in the UI)

-- 3. Update ALL existing commercial and warehouse projects that currently
--    have listing_type = 'For Sale' (the old default) to 'For Rent'
UPDATE projects
SET listing_type = 'For Rent'
WHERE section IN ('commercial', 'warehouse')
  AND (listing_type IS NULL OR listing_type = 'For Sale');

-- Verify
SELECT section, listing_type, COUNT(*)
FROM projects
WHERE section IN ('commercial', 'warehouse')
GROUP BY section, listing_type
ORDER BY section, listing_type;
