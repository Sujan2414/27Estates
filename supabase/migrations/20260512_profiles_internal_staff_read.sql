-- Profiles SELECT policy for internal staff.
--
-- Before this migration, only admin / super_admin could read all rows in
-- public.profiles. Managers and agents could only read their own row,
-- which broke every screen that needs a list of teammates:
--   - Workmate "Assign to" picker on add-task / add-site-visit was empty
--     for managers (they only saw themselves)
--   - Team map on the web CRM didn't load colleagues for managers
--   - Chat list, leave-approver dropdowns, etc.
--
-- profiles is internal to 27 Estates — there's no privacy concern between
-- employees of the same org seeing each other's names + roles. We add a
-- new helper that includes manager + agent so the existing is_admin /
-- is_staff helpers stay untouched (they govern things like project edits
-- where the broader audience would be wrong).

CREATE OR REPLACE FUNCTION public.is_internal_staff()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'manager', 'agent')
    );
END;
$$;

DROP POLICY IF EXISTS "Internal staff read all profiles" ON public.profiles;
CREATE POLICY "Internal staff read all profiles"
ON public.profiles FOR SELECT
USING (public.is_internal_staff());
