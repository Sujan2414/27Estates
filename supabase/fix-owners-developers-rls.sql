-- =====================================================
-- FIX RLS POLICIES FOR OWNERS AND DEVELOPERS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Owners Table Policy
DROP POLICY IF EXISTS "Admins can manage owners" ON public.owners;
DROP POLICY IF EXISTS "Admins and Super Admins can manage owners" ON public.owners;
CREATE POLICY "Admins and Super Admins can manage owners" ON public.owners
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'agent', 'user'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'agent', 'user'))
    );

-- 2. Developers Table Policy
DROP POLICY IF EXISTS "Admins can manage developers" ON public.developers;
DROP POLICY IF EXISTS "Admins and Super Admins can manage developers" ON public.developers;
CREATE POLICY "Admins and Super Admins can manage developers" ON public.developers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'agent', 'user'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'agent', 'user'))
    );

-- 3. Confirm
SELECT 'RLS policies for owners and developers updated successfully!' as message;
