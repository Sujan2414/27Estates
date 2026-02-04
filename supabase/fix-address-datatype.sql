-- =====================================================
-- FIX ADDRESS DATATYPE
-- Change address from JSONB to TEXT
-- Run this in Supabase SQL Editor
-- =====================================================

-- Fix PROPERTIES table address column
ALTER TABLE properties 
ALTER COLUMN address TYPE TEXT USING address::text;

-- Fix PROJECTS table address column (if it exists)
ALTER TABLE projects 
ALTER COLUMN address TYPE TEXT USING address::text;

-- Verify the change
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('properties', 'projects') 
    AND column_name = 'address';

SELECT 'Address datatype fixed successfully! Changed from JSONB to TEXT.' as message;
