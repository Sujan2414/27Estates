-- =====================================================
-- FIX PUBLIC ACCESS TO PROPERTIES AND PROJECTS
-- Run this in Supabase SQL Editor if you see "no data found" or API errors
-- =====================================================

-- 1. Ensure PROPERTIES public read access
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);

-- 2. Ensure PROJECTS public read access (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
        CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);
    END IF;
END $$;

-- 3. Ensure AGENTS public read access
DROP POLICY IF EXISTS "Anyone can view agents" ON agents;
CREATE POLICY "Anyone can view agents" ON agents FOR SELECT USING (true);

SELECT 'Public access policies restored successfully' as message;
