-- =====================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create SECURITY DEFINER function to check admin role
-- This bypasses RLS on the profiles table purely for this check
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search_path
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- 2. Update Profiles Policy to use function
DROP POLICY IF EXISTS "Admins and Super Admins can view all profiles" ON profiles;
CREATE POLICY "Admins and Super Admins can view all profiles" ON profiles FOR SELECT USING (
  public.is_admin_or_super_admin()
);

-- 3. Update Agents Policy
DROP POLICY IF EXISTS "Admins and Super Admins can manage agents" ON agents;
CREATE POLICY "Admins and Super Admins can manage agents" ON agents FOR ALL USING (
  public.is_admin_or_super_admin()
);

-- 4. Update Properties Policy
DROP POLICY IF EXISTS "Admins and Super Admins can manage properties" ON properties;
CREATE POLICY "Admins and Super Admins can manage properties" ON properties FOR ALL USING (
  public.is_admin_or_super_admin()
);

-- 5. Update Blogs Policy
DROP POLICY IF EXISTS "Admins and Super Admins can manage blogs" ON blogs;
CREATE POLICY "Admins and Super Admins can manage blogs" ON blogs FOR ALL USING (
  public.is_admin_or_super_admin()
);

-- 6. Update Inquiries Policy
DROP POLICY IF EXISTS "Admins and Super Admins can view inquiries" ON inquiries;
CREATE POLICY "Admins and Super Admins can view inquiries" ON inquiries FOR SELECT USING (
  public.is_admin_or_super_admin()
);

DROP POLICY IF EXISTS "Admins and Super Admins can update inquiries" ON inquiries;
CREATE POLICY "Admins and Super Admins can update inquiries" ON inquiries FOR UPDATE USING (
  public.is_admin_or_super_admin()
);

SELECT 'Recursion fixed via SECURITY DEFINER function' as message;
