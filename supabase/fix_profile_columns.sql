-- ==============================================================
-- FIX USER PROFILES - Add Columns & Backfill Data
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================

-- 1. Add missing columns to 'profiles' table locally
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update the 'handle_new_user' trigger to save these fields automatically for NEW users
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
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill MISSING data for EXISTING users from auth.users metadata
-- This fixes accounts that were created but have empty profile fields
UPDATE public.profiles p
SET 
  first_name = COALESCE(p.first_name, u.raw_user_meta_data->>'first_name'),
  last_name = COALESCE(p.last_name, u.raw_user_meta_data->>'last_name'),
  phone = COALESCE(p.phone, u.raw_user_meta_data->>'phone'),
  full_name = COALESCE(p.full_name, u.raw_user_meta_data->>'full_name')
FROM auth.users u
WHERE p.id = u.id;

-- 4. Verify the update
SELECT email, first_name, last_name FROM public.profiles LIMIT 10;
