-- Migration: Add B2B Bricks CRM fields to Properties Table

-- 1. Location & Coords
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS survey_number TEXT,
ADD COLUMN IF NOT EXISTS survey_name TEXT;

-- 2. CRM & Internal Management
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS request_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'Public' CHECK (visibility IN ('Public', 'Private', 'Branch', 'Protected')),
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS folder TEXT,

ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS key_holder TEXT,
ADD COLUMN IF NOT EXISTS channel TEXT,
ADD COLUMN IF NOT EXISTS refer_by TEXT;

-- 3. Enhanced Property Details
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS suitable_for TEXT[], -- Array for multi-select
ADD COLUMN IF NOT EXISTS available_from DATE,
ADD COLUMN IF NOT EXISTS unique_feature TEXT,
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 4. JSONB Columns for Specific Property Type Details
-- Instead of separate columns for every possible commercial/industrial feature, we bundle them.
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS commercial_details JSONB DEFAULT '{}', 
-- Structure: { "workstations": 10, "cabins": 2, "conference_rooms": 1, "power_kva": 100, "backup": true }

ADD COLUMN IF NOT EXISTS warehouse_details JSONB DEFAULT '{}', 
-- Structure: { "pollution_zone": "Green", "racking_capacity": "10 tons", "dock_levellers": true }

ADD COLUMN IF NOT EXISTS pricing_details JSONB DEFAULT '{}'; 
-- Structure: { "is_negotiable": true, "maintenance_paid_by": "Landlord", "deposit_negotiable": true, "jv_ratio": 50 }

-- 5. Indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_properties_visibility ON properties(visibility);
CREATE INDEX IF NOT EXISTS idx_properties_branch ON properties(branch);
