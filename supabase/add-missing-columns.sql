-- =====================================================
-- 27 ESTATES - SCHEMA MIGRATION
-- Run this in Supabase SQL Editor to add missing columns
-- =====================================================

-- Add video_url column
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add floor_plans column (JSONB array)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS floor_plans JSONB;

-- Update category constraint to include 'Offices'
-- First drop the old constraint, then add new one
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_category_check;

ALTER TABLE properties 
ADD CONSTRAINT properties_category_check 
CHECK (category IN ('Apartment', 'House', 'Duplex', 'Villa', 'Plot', 'Commercial', 'Farmhouse', 'Offices'));

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('video_url', 'floor_plans');
