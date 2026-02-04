-- =====================================================
-- 27 ESTATES MIGRATION TO V2 SCHEMA
-- Run this if you already have the base schema
-- =====================================================

-- =====================================================
-- ADD NEW TABLES (Projects & Developers)
-- =====================================================

-- DEVELOPERS TABLE (for Real Estate Developers)
CREATE TABLE IF NOT EXISTS developers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    logo TEXT,
    description TEXT,
    website TEXT,
    projects_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS TABLE (Developer Projects like Prestige City, Godrej, etc.)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id TEXT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    specifications TEXT,
    rera_number TEXT,
    developer_id UUID REFERENCES developers(id),
    developer_name TEXT,
    
    -- Location
    address TEXT,
    location TEXT,
    city TEXT,
    landmark TEXT,
    pincode TEXT,
    
    -- Pricing
    min_price TEXT,
    max_price TEXT,
    min_price_numeric NUMERIC,
    max_price_numeric NUMERIC,
    
    -- Areas
    min_area NUMERIC,
    max_area NUMERIC,
    
    -- Project Details
    property_type TEXT,
    bhk_options TEXT[],
    transaction_type TEXT,
    status TEXT DEFAULT 'Available',
    
    -- Dates
    launch_date DATE,
    possession_date TEXT,
    
    -- Media
    images TEXT[] DEFAULT '{}',
    brochure_url TEXT,
    video_url TEXT,
    
    -- Flags
    is_featured BOOLEAN DEFAULT FALSE,
    is_rera_approved BOOLEAN DEFAULT FALSE,
    
    -- Contact
    employee_name TEXT,
    employee_phone TEXT,
    employee_email TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD NEW COLUMNS TO PROPERTIES TABLE
-- =====================================================

-- Add missing columns (use DO block to handle if column exists)
DO $$ 
BEGIN
    -- Price and Area columns
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_text TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_amount TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS maintenance_charges TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS carpet_area INTEGER;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS built_up_area INTEGER;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS plot_size INTEGER;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_rooms NUMERIC;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS balconies INTEGER;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_count INTEGER;
    
    -- Location columns
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS street TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS landmark TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS flat_no TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_name TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_number TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors TEXT;
    
    -- Type columns
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS sub_category TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnishing TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS facing TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS possession_status TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_age TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS flooring TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS transaction_type TEXT;
    
    -- Project link
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS project_name TEXT;
    
    -- Owner info
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_name TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_email TEXT;
    
    -- Status
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available';
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS ref_number TEXT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS source TEXT;
    
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- =====================================================
-- UPDATE CATEGORY CONSTRAINT (allow more categories)
-- =====================================================
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_category_check;
ALTER TABLE properties ADD CONSTRAINT properties_category_check 
    CHECK (category IN ('Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Plot', 'Commercial', 'Farmhouse', 'Penthouse', 'Studio'));

-- Update property_type constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
    CHECK (property_type IN ('Sale', 'Rent'));

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP AND RECREATE POLICIES FOR NEW TABLES
-- =====================================================

-- DEVELOPERS policies
DROP POLICY IF EXISTS "Anyone can view developers" ON developers;
CREATE POLICY "Anyone can view developers" ON developers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage developers" ON developers;
CREATE POLICY "Admins can manage developers" ON developers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PROJECTS policies
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- ADD BOOKMARKS SUPPORT FOR PROJECTS
-- =====================================================
ALTER TABLE user_bookmarks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- =====================================================
-- ADD INQUIRIES SUPPORT FOR PROJECTS
-- =====================================================
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- =====================================================
-- NEW INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_name);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- =====================================================
-- UPDATED_AT TRIGGER FOR PROJECTS
-- =====================================================
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Migration to V2 completed successfully!' as message;
