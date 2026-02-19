-- Promote user to admin by email
-- Usage: Run this in Supabase SQL Editor
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'dandgulkarsujan@gmail.com';

-- Verify
SELECT * FROM public.profiles WHERE email = 'dandgulkarsujan@gmail.com';
