-- =============================================================
-- FIX BROKEN INSERT RLS POLICIES  (2026-02-25)
-- inquiries + property_submissions INSERT was blocked for anon
-- =============================================================

-- INQUIRIES
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.inquiries;
DROP POLICY IF EXISTS "Anyone submit inquiry"     ON public.inquiries;
DROP POLICY IF EXISTS "Staff read inquiries"      ON public.inquiries;
DROP POLICY IF EXISTS "Staff update inquiries"    ON public.inquiries;
DROP POLICY IF EXISTS "Admins delete inquiries"   ON public.inquiries;

CREATE POLICY "Anyone submit inquiry"
ON public.inquiries FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Staff read inquiries"
ON public.inquiries FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff update inquiries"
ON public.inquiries FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "Admins delete inquiries"
ON public.inquiries FOR DELETE USING (public.is_admin_or_super_admin());

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- PROPERTY_SUBMISSIONS
DROP POLICY IF EXISTS "Authenticated users can insert submissions" ON public.property_submissions;
DROP POLICY IF EXISTS "Anyone can submit property"                 ON public.property_submissions;
DROP POLICY IF EXISTS "Anyone submit property"                     ON public.property_submissions;
DROP POLICY IF EXISTS "Users or staff read submissions"            ON public.property_submissions;
DROP POLICY IF EXISTS "Staff update submissions"                   ON public.property_submissions;
DROP POLICY IF EXISTS "Admins delete submissions"                  ON public.property_submissions;

CREATE POLICY "Anyone submit property"
ON public.property_submissions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users or staff read submissions"
ON public.property_submissions FOR SELECT
USING (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Staff update submissions"
ON public.property_submissions FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "Admins delete submissions"
ON public.property_submissions FOR DELETE USING (public.is_admin_or_super_admin());

ALTER TABLE public.property_submissions ENABLE ROW LEVEL SECURITY;
