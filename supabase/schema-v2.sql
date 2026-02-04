-- =====================================================
-- 27 ESTATES SUPABASE DATABASE SCHEMA V2
-- Includes Projects table for developer projects
-- Run this in Supabase SQL Editor (supabase.com/dashboard)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- AGENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    image TEXT,
    role TEXT DEFAULT 'Agent',
    bio TEXT,
    properties_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DEVELOPERS TABLE (for Real Estate Developers)
-- =====================================================
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

-- =====================================================
-- PROJECTS TABLE (Developer Projects like Prestige City, Godrej, etc.)
-- =====================================================
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
    property_type TEXT, -- Apartment, Villa, Plot, etc.
    bhk_options TEXT[], -- ['2 BHK', '3 BHK', '4 BHK']
    transaction_type TEXT, -- New, Pre Launch, Resale
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
-- PROPERTIES TABLE (Individual Units - Sale/Rent)
-- =====================================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Pricing
    price NUMERIC NOT NULL,
    price_text TEXT,
    price_per_sqft NUMERIC,
    deposit_amount TEXT,
    maintenance_charges TEXT,
    
    -- Location
    location TEXT NOT NULL,
    address TEXT,
    city TEXT,
    street TEXT,
    landmark TEXT,
    flat_no TEXT,
    building_name TEXT,
    floor_number TEXT,
    total_floors TEXT,
    
    -- Property Details
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms INTEGER NOT NULL DEFAULT 0,
    sqft INTEGER NOT NULL DEFAULT 0,
    carpet_area INTEGER,
    built_up_area INTEGER,
    plot_size INTEGER,
    total_rooms NUMERIC,
    balconies INTEGER,
    parking_count INTEGER,
    
    -- Type & Category
    property_type TEXT NOT NULL CHECK (property_type IN ('Sale', 'Rent')),
    category TEXT NOT NULL CHECK (category IN ('Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Plot', 'Commercial', 'Farmhouse', 'Penthouse', 'Studio')),
    sub_category TEXT, -- Residential Apartment, Commercial Office/Space, etc.
    
    -- Additional Details
    furnishing TEXT, -- Furnished, Semi Furnished, UnFurnished
    facing TEXT,
    ownership TEXT,
    possession_status TEXT,
    property_age TEXT,
    flooring TEXT,
    transaction_type TEXT, -- New, Resale, Pre Launch
    
    -- Project Link
    project_id UUID REFERENCES projects(id),
    project_name TEXT,
    
    -- Agent
    agent_id UUID REFERENCES agents(id),
    
    -- Owner/Customer Info
    owner_name TEXT,
    owner_phone TEXT,
    owner_email TEXT,
    
    -- Status & Flags
    status TEXT DEFAULT 'Available',
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Media
    images TEXT[] DEFAULT '{}',
    video_url TEXT,
    
    -- Amenities
    amenities JSONB,
    
    -- Reference
    ref_number TEXT,
    source TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BLOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blogs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    author_image TEXT,
    cover_image TEXT,
    tags TEXT[] DEFAULT '{}',
    reading_time TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER BOOKMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_property UNIQUE(user_id, property_id),
    CONSTRAINT unique_user_project UNIQUE(user_id, project_id)
);

-- =====================================================
-- INQUIRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- AGENTS policies (public read, admin write)
CREATE POLICY "Anyone can view agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Admins can manage agents" ON agents FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- DEVELOPERS policies (public read, admin write)
CREATE POLICY "Anyone can view developers" ON developers FOR SELECT USING (true);
CREATE POLICY "Admins can manage developers" ON developers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PROJECTS policies (public read, admin write)
CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PROPERTIES policies (public read, admin write)
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Admins can manage properties" ON properties FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- BLOGS policies (public read, admin write)
CREATE POLICY "Anyone can view published blogs" ON blogs FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Admins can manage blogs" ON blogs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- USER_BOOKMARKS policies
CREATE POLICY "Users can view own bookmarks" ON user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON user_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- INQUIRIES policies
CREATE POLICY "Anyone can submit inquiry" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view inquiries" ON inquiries FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update inquiries" ON inquiries FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_name);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Database schema V2 created successfully!' as message;
