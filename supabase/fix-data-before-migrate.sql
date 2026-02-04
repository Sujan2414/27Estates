-- =====================================================
-- FIX: Drop constraints, update data, then recreate
-- Run this BEFORE migrate-to-v2.sql
-- =====================================================

-- Step 1: Drop the existing constraints
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_category_check;

-- Step 2: Update data to match new constraint values
UPDATE properties SET property_type = 'Sale' WHERE property_type = 'Sales';
UPDATE properties SET property_type = 'Rent' WHERE property_type NOT IN ('Sale', 'Rent') AND property_type IS NOT NULL;
UPDATE properties SET property_type = 'Sale' WHERE property_type IS NULL;

UPDATE properties SET category = 'Apartment' WHERE category IS NULL;
UPDATE properties SET category = 'Apartment' WHERE category NOT IN ('Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Plot', 'Commercial', 'Farmhouse', 'Penthouse', 'Studio');

-- Step 3: Recreate constraints with correct values
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
    CHECK (property_type IN ('Sale', 'Rent'));
    
ALTER TABLE properties ADD CONSTRAINT properties_category_check 
    CHECK (category IN ('Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Plot', 'Commercial', 'Farmhouse', 'Penthouse', 'Studio'));

SELECT 'Constraints fixed! Now run migrate-to-v2.sql' as message;
