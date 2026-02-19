-- Manually confirm the user's email
-- Usage: Run this in Supabase SQL Editor
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'dandgulkarsujan@gmail.com';

-- Verify properties
SELECT id, email, email_confirmed_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'dandgulkarsujan@gmail.com';
