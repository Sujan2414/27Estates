-- =============================================================
-- CLEAN RLS RESET: drop ALL existing policies, recreate correct ones
-- =============================================================

-- 1. Drop EVERY policy on affected tables (dynamic SQL)
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'properties','owners','developers','agents',
              'inquiries','property_submissions','projects','profiles'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END;
$$;

-- 2. Ensure RLS enabled
ALTER TABLE public.properties           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;

-- 3. Helper functions
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'));
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','agent'));
END;
$$;

-- 4. PROPERTIES
CREATE POLICY "Public read properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Staff manage properties" ON public.properties FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 5. OWNERS (staff only)
CREATE POLICY "Staff read owners" ON public.owners FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff manage owners" ON public.owners FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 6. DEVELOPERS
CREATE POLICY "Public read developers" ON public.developers FOR SELECT USING (true);
CREATE POLICY "Staff manage developers" ON public.developers FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 7. AGENTS
CREATE POLICY "Public read agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Admins manage agents" ON public.agents FOR ALL USING (public.is_admin_or_super_admin()) WITH CHECK (public.is_admin_or_super_admin());

-- 8. INQUIRIES (anon INSERT, staff read/update, admin delete)
CREATE POLICY "Anyone submit inquiry" ON public.inquiries FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Staff read inquiries" ON public.inquiries FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff update inquiries" ON public.inquiries FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "Admins delete inquiries" ON public.inquiries FOR DELETE USING (public.is_admin_or_super_admin());

-- 9. PROPERTY_SUBMISSIONS (anon INSERT, users see own, staff sees all)
CREATE POLICY "Anyone submit property" ON public.property_submissions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users or staff read submissions" ON public.property_submissions FOR SELECT USING (auth.uid() = user_id OR public.is_staff());
CREATE POLICY "Staff update submissions" ON public.property_submissions FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "Admins delete submissions" ON public.property_submissions FOR DELETE USING (public.is_admin_or_super_admin());

-- 10. PROJECTS
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Staff manage projects" ON public.projects FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 11. PROFILES
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_super_admin());
