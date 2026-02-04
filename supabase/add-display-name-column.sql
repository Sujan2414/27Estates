-- Add display_name column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'display_name';
