-- =====================================================
-- ADD: property_category column to property_submissions
-- Run this in Supabase SQL Editor
-- =====================================================

-- The "Post Your Property" form sends a property_category value
-- (Apartment, Villa, Plot, etc.) but the column was missing from the table.
ALTER TABLE public.property_submissions
ADD COLUMN IF NOT EXISTS property_category TEXT;

SELECT 'property_category column added to property_submissions' as message;
