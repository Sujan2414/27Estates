-- =====================================================
-- MIGRATION: Create Owners Table + Agent Assignment
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. OWNERS TABLE (Property Owners / Landlords)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Add owner_id FK to properties
-- =====================================================
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL;

-- =====================================================
-- 3. Add assigned_agent_id FK to projects
-- =====================================================
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- =====================================================
-- 4. RLS Policies for owners
-- =====================================================
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- Anyone can view owners (needed for admin panel dropdowns)
CREATE POLICY "Anyone can view owners" ON public.owners
    FOR SELECT USING (true);

-- Only admins can insert/update/delete owners
CREATE POLICY "Admins can manage owners" ON public.owners
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- 5. Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_agent ON public.projects(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_owners_name ON public.owners(name);

-- =====================================================
-- 6. Updated_at trigger for owners
-- =====================================================
CREATE TRIGGER update_owners_updated_at
    BEFORE UPDATE ON public.owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
SELECT 'Owners table and agent assignment columns created successfully!' as message;
