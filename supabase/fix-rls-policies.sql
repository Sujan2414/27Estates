-- Fix RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create simpler, non-recursive policies
CREATE POLICY "Enable read access for users based on user_id" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow authenticated users to read all profiles (needed for admin check)
CREATE POLICY "Enable read access for authenticated users" 
ON profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Success message
SELECT 'RLS policies fixed successfully!' as message;
