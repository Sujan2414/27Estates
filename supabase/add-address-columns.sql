-- =====================================================
-- ADD MISSING ADDRESS COLUMNS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add missing address columns to PROPERTIES table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add missing columns to PROJECTS table (some may already exist)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('properties', 'projects') 
    AND column_name IN ('pincode', 'state', 'area', 'country', 'latitude', 'longitude', 'city', 'street', 'landmark')
ORDER BY table_name, column_name;

SELECT 'Address columns added successfully!' as message;
