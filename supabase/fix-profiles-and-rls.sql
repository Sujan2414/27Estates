-- ==============================================================
-- FIX PROFILES TABLE: Schema, RLS, Trigger, and Sync
-- Run this ONCE in Supabase SQL Editor to fix all profile issues.
-- ==============================================================

-- 1. ADD MISSING COLUMNS (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. DROP OLD POLICIES (clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for users" ON public.profiles;

-- 4. CREATE CORRECT RLS POLICIES
-- Users can only see their OWN profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their OWN profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can only insert their OWN profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. FIX THE TRIGGER FUNCTION (handles new signups automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
        last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RE-CREATE THE TRIGGER (ensure it fires on new auth signups)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. BACKFILL: Sync all existing auth.users into profiles
-- Creates missing profiles AND updates existing ones with auth metadata
INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', ''),
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    COALESCE(raw_user_meta_data->>'phone', '')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    updated_at = NOW();

-- 8. ALSO FIX BOOKMARKS RLS (ensure bookmarks are user-scoped)
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

-- 9. VERIFY
SELECT id, email, first_name, last_name, full_name FROM public.profiles ORDER BY created_at DESC LIMIT 20;
