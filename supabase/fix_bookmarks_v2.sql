-- ==============================================================
-- FIX USER_BOOKMARKS TABLE FOR BOTH PROPERTIES AND PROJECTS
-- Run this in Supabase SQL Editor to ensure bookmarks work
-- ==============================================================

-- 1. Make property_id nullable (it was NOT NULL in older schema)
--    This allows bookmarking projects without a property_id
ALTER TABLE public.user_bookmarks ALTER COLUMN property_id DROP NOT NULL;

-- 2. Add project_id column if it doesn't exist
ALTER TABLE public.user_bookmarks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- 3. Add unique constraint for project bookmarks if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_project'
    ) THEN
        ALTER TABLE public.user_bookmarks ADD CONSTRAINT unique_user_project UNIQUE(user_id, project_id);
    END IF;
END $$;

-- 4. Verify RLS policies exist
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.user_bookmarks;

CREATE POLICY "Users can view own bookmarks"
    ON public.user_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
    ON public.user_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON public.user_bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_bookmarks'
ORDER BY ordinal_position;
