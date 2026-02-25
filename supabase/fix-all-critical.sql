-- =============================================================
-- FIX-ALL-CRITICAL.SQL  (based on live inspection 2026-02-25)
-- Project: ulgashwdsaxaiebtqrvf
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Add missing `connectivity` column to properties
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS connectivity JSONB;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS helper functions (SECURITY DEFINER avoids recursion)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'agent')
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. PROPERTIES — public read, staff write
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Public can read properties" ON public.properties;
DROP POLICY IF EXISTS "Staff can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Admin full access properties" ON public.properties;

CREATE POLICY "Public read properties"
ON public.properties FOR SELECT USING (true);

CREATE POLICY "Staff manage properties"
ON public.properties FOR ALL
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- 4. OWNERS — only staff can read/write (block anon access)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and Super Admins can manage owners" ON public.owners;
DROP POLICY IF EXISTS "Admins can manage owners" ON public.owners;
DROP POLICY IF EXISTS "Anyone can read owners" ON public.owners;
DROP POLICY IF EXISTS "Staff can read owners" ON public.owners;
DROP POLICY IF EXISTS "Staff can manage owners" ON public.owners;

CREATE POLICY "Staff read owners"
ON public.owners FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff manage owners"
ON public.owners FOR ALL
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- 5. DEVELOPERS — public read is fine, staff write
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and Super Admins can manage developers" ON public.developers;
DROP POLICY IF EXISTS "Admins can manage developers" ON public.developers;
DROP POLICY IF EXISTS "Anyone can view developers" ON public.developers;
DROP POLICY IF EXISTS "Public can read developers" ON public.developers;
DROP POLICY IF EXISTS "Staff can manage developers" ON public.developers;

CREATE POLICY "Public read developers"
ON public.developers FOR SELECT USING (true);

CREATE POLICY "Staff manage developers"
ON public.developers FOR ALL
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- 6. AGENTS — public read, admin write
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view agents" ON public.agents;
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agents;
DROP POLICY IF EXISTS "Public can read agents" ON public.agents;

CREATE POLICY "Public read agents"
ON public.agents FOR SELECT USING (true);

CREATE POLICY "Admins manage agents"
ON public.agents FOR ALL
USING (public.is_admin_or_super_admin())
WITH CHECK (public.is_admin_or_super_admin());

-- ─────────────────────────────────────────────────────────────
-- 7. INQUIRIES — CRITICAL FIX
--    Anon INSERT is currently BROKEN (contact form fails)
--    Anon SELECT is currently EXPOSED (should be blocked)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.inquiries;
DROP POLICY IF EXISTS "Admins can view inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins can update inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Staff can read inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Staff can update inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins can delete inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Staff read inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Staff manage inquiries" ON public.inquiries;

-- Allow ANYONE (including anon / logged-out users) to submit
CREATE POLICY "Anyone submit inquiry"
ON public.inquiries FOR INSERT
TO public
WITH CHECK (true);

-- Only staff can read inquiries
CREATE POLICY "Staff read inquiries"
ON public.inquiries FOR SELECT
USING (public.is_staff());

-- Staff can update status
CREATE POLICY "Staff update inquiries"
ON public.inquiries FOR UPDATE
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Only admins can delete
CREATE POLICY "Admins delete inquiries"
ON public.inquiries FOR DELETE
USING (public.is_admin_or_super_admin());

-- ─────────────────────────────────────────────────────────────
-- 8. PROPERTY_SUBMISSIONS — CRITICAL FIX
--    Anon INSERT is currently BROKEN (user form fails)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Anyone can submit property" ON public.property_submissions;
DROP POLICY IF EXISTS "Users view own submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Staff can manage submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Staff manage submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Admins delete submissions" ON public.property_submissions;

-- Allow everyone (including anon) to submit
CREATE POLICY "Anyone submit property"
ON public.property_submissions FOR INSERT
TO public
WITH CHECK (true);

-- Authenticated users see their own, staff see all
CREATE POLICY "Users or staff read submissions"
ON public.property_submissions FOR SELECT
USING (
    auth.uid() = user_id
    OR public.is_staff()
);

-- Staff can update status
CREATE POLICY "Staff update submissions"
ON public.property_submissions FOR UPDATE
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Only admins can delete
CREATE POLICY "Admins delete submissions"
ON public.property_submissions FOR DELETE
USING (public.is_admin_or_super_admin());

-- ─────────────────────────────────────────────────────────────
-- 9. PROJECTS — public read, staff write
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Public can read projects" ON public.projects;
DROP POLICY IF EXISTS "Staff can manage projects" ON public.projects;

CREATE POLICY "Public read projects"
ON public.projects FOR SELECT USING (true);

CREATE POLICY "Staff manage projects"
ON public.projects FOR ALL
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- 10. PROFILES — each user reads own; admins read all
--     Drop recursive policies first
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins use SECURITY DEFINER fn to avoid infinite recursion
CREATE POLICY "Admins read all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin_or_super_admin());

-- ─────────────────────────────────────────────────────────────
-- DONE — verify with SELECT tablename,policyname,cmd
--        FROM pg_policies WHERE schemaname='public' ORDER BY 1,2;
-- ─────────────────────────────────────────────────────────────
