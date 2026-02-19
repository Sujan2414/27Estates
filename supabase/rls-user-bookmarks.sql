-- ============================================
-- Row Level Security for user_bookmarks table
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on user_bookmarks (safe to run even if already enabled)
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can update own bookmarks" ON user_bookmarks;

-- Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view own bookmarks"
    ON user_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks"
    ON user_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
    ON user_bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can only update their own bookmarks
CREATE POLICY "Users can update own bookmarks"
    ON user_bookmarks FOR UPDATE
    USING (auth.uid() = user_id);
