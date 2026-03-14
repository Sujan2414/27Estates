-- Migration: Add 'Lease' to properties.property_type
-- Currently: CHECK (property_type IN ('Sale', 'Rent'))
-- Updated to: CHECK (property_type IN ('Sale', 'Rent', 'Lease'))

ALTER TABLE properties
    DROP CONSTRAINT IF EXISTS properties_property_type_check;

ALTER TABLE properties
    ADD CONSTRAINT properties_property_type_check
    CHECK (property_type IN ('Sale', 'Rent', 'Lease'));

-- Verify
SELECT DISTINCT property_type FROM properties ORDER BY property_type;
