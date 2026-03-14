-- Migration: Add listing_type column to projects table
-- Supports: 'For Sale', 'For Rent', 'For Lease'
-- Applies primarily to commercial and warehouse sections

ALTER TABLE projects ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'For Sale';

ALTER TABLE projects
    DROP CONSTRAINT IF EXISTS projects_listing_type_check;

ALTER TABLE projects
    ADD CONSTRAINT projects_listing_type_check
    CHECK (listing_type IN ('For Sale', 'For Rent', 'For Lease'));

CREATE INDEX IF NOT EXISTS projects_listing_type_idx ON projects(listing_type);

-- Backfill: existing residential projects stay as 'For Sale' (default)
-- Commercial/warehouse that had no listing_type also default to 'For Sale'
UPDATE projects SET listing_type = 'For Sale' WHERE listing_type IS NULL;
