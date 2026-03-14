-- Migration: Add section column to projects table
-- This differentiates Residential, Commercial, and Warehouse projects

-- Step 1: Add the section column with a default of 'residential'
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'residential';

-- Step 2: Migrate existing Commercial category projects to section='commercial'
UPDATE projects
SET section = 'commercial'
WHERE category = 'Commercial';

-- Step 3: Add an index for efficient filtering by section
CREATE INDEX IF NOT EXISTS idx_projects_section ON projects(section);

-- Step 4: Add check constraint for valid section values
ALTER TABLE projects
ADD CONSTRAINT chk_projects_section
CHECK (section IN ('residential', 'commercial', 'warehouse'));

-- Verify the migration
SELECT section, COUNT(*) FROM projects GROUP BY section ORDER BY section;
