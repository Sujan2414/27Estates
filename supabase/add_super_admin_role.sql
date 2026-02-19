-- =====================================================
-- ADD SUPER ADMIN ROLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Update Check Constraint on profiles.role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'agent', 'super_admin'));

-- 2. Update RLS Policies to include super_admin
-- We will drop and recreate to ensure they are updated

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins and Super Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Agents
DROP POLICY IF EXISTS "Admins can manage agents" ON agents;
CREATE POLICY "Admins and Super Admins can manage agents" ON agents FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Properties
DROP POLICY IF EXISTS "Admins can manage properties" ON properties;
CREATE POLICY "Admins and Super Admins can manage properties" ON properties FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Blogs
DROP POLICY IF EXISTS "Admins can manage blogs" ON blogs;
CREATE POLICY "Admins and Super Admins can manage blogs" ON blogs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Inquiries
DROP POLICY IF EXISTS "Admins can view inquiries" ON inquiries;
CREATE POLICY "Admins and Super Admins can view inquiries" ON inquiries FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Admins can update inquiries" ON inquiries;
CREATE POLICY "Admins and Super Admins can update inquiries" ON inquiries FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 3. Confirm
SELECT 'Super Admin role added and policies updated successfully!' as message;
