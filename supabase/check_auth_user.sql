-- ==============================================================
-- CHECK IF AUTH USER EXISTS
-- Run this to see if your account is actually deleted or just the profile
-- ==============================================================

SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'dandgulkarsujan@gmail.com';
