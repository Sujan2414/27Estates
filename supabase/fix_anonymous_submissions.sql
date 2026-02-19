-- =====================================================
-- FIX: Allow anonymous/public inserts to property_submissions
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing insert policy (for authenticated only)
DROP POLICY IF EXISTS "Authenticated users can insert submissions" ON public.property_submissions;

-- Allow ANYONE (public/anon) to insert submissions
-- This is needed because guests (not signed in) should also be able to post properties
CREATE POLICY "Anyone can insert submissions"
ON public.property_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also allow public to upload submission images
DROP POLICY IF EXISTS "Authenticated users can upload submission images" ON storage.objects;

CREATE POLICY "Anyone can upload submission images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'submission-images');

SELECT 'Anonymous submission access granted' as message;
