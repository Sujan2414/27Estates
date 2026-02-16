-- =====================================================
-- POST YOUR PROPERTY FEATURE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create property_submissions table
CREATE TABLE IF NOT EXISTS public.property_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional link to user
    name TEXT,
    email TEXT,
    phone TEXT,
    property_type TEXT CHECK (property_type IN ('Sale', 'Rent')),
    deal_type TEXT, -- e.g., 'Residential', 'Commercial' or specific deal type
    property_details TEXT,
    expected_price NUMERIC,
    city TEXT,
    images TEXT[] DEFAULT '{}', -- Array of image URLs
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.property_submissions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Allow anyone to INSERT (since guest posting might be allowed, or at least authenticated users)
-- For now, let's allow authenticated users. If guests need access, change to 'true'.
-- Based on "in our dashboard", user is likely logged in.
CREATE POLICY "Authenticated users can insert submissions" 
ON public.property_submissions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to view their own submissions
CREATE POLICY "Users can view own submissions" 
ON public.property_submissions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow Admins to View/Update ALL submissions
-- Using the security definer function we created earlier is safer
CREATE POLICY "Admins can manage submissions" 
ON public.property_submissions FOR ALL 
USING (public.is_admin_or_super_admin());

-- 4. Create Storage Bucket for Submission Images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submission-images', 'submission-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload submission images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submission-images');

-- Policy to allow public to view images (so admins can see them easily)
CREATE POLICY "Public can view submission images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submission-images');

SELECT 'Property Submissions table and storage configured successfully' as message;
