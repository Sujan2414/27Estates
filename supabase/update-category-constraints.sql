-- =====================================================
-- 27 ESTATES - UPDATE CATEGORY CONSTRAINT
-- Run this in Supabase SQL Editor to fix property creation
-- =====================================================

-- First drop the old constraint
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_category_check;

-- Add the new constraint with all possible frontend options
ALTER TABLE properties 
ADD CONSTRAINT properties_category_check 
CHECK (category IN (
    'Apartment', 
    'House', 
    'Villa', 
    'Bungalow', 
    'Row Villa', 
    'Plot', 
    'Commercial', 
    'Farmhouse', 
    'Penthouse', 
    'Studio', 
    'Duplex', 
    'Office', 
    'Offices', 
    'Warehouse', 
    'Other'
));
