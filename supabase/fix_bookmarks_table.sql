-- ==============================================================
-- FIX USER BOOKMARKS TABLE
-- Run this in Supabase SQL Editor to ensure bookmarks work
-- ==============================================================

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to cleanly recreate them
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.user_bookmarks;

-- 4. Create correct policies
CREATE POLICY "Users can view own bookmarks" 
    ON public.user_bookmarks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" 
    ON public.user_bookmarks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" 
    ON public.user_bookmarks FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_property_id ON public.user_bookmarks(property_id);

-- 6. Verify table exists
SELECT count(*) FROM public.user_bookmarks;
