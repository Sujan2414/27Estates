-- ==============================================================
-- SYNC ALL USER PROFILES FROM AUTH.USERS
-- Run this to force all accounts to have a profile entry
-- ==============================================================

-- 1. Insert any missing profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', ''),
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    COALESCE(raw_user_meta_data->>'phone', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Update existing profiles where first_name is missing but exists in metadata
UPDATE public.profiles p
SET 
  first_name = u.raw_user_meta_data->>'first_name',
  last_name = u.raw_user_meta_data->>'last_name',
  full_name = u.raw_user_meta_data->>'full_name',
  phone = u.raw_user_meta_data->>'phone'
FROM auth.users u
WHERE p.id = u.id
AND (p.first_name IS NULL OR p.first_name = '');

-- 3. Verify specifically for your user
-- (Check the most recent users)
SELECT email, first_name, last_name, phone 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;
