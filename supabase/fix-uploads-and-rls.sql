-- ==========================================================
-- FIX PRODUCTION UPLOAD LIMITS & PROJECT/PROPERTY SAVING
-- Run this in the Supabase SQL Editor
-- ==========================================================

-- 1. FIX THE MEDIA BUCKET TO ALLOW PDF BROCHURES AND 50MB UPLOADS
UPDATE storage.buckets
SET 
    file_size_limit = 52428800, -- 50MB in bytes
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
WHERE id = 'media';

-- Ensure the public read policy exists
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Ensure authenticated users can upload directly to the bucket
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');


-- 2. FIX RLS POLICIES FOR PROJECTS AND PROPERTIES
-- The old policies only checked for role = 'admin'. We need to include 'super_admin' and 'agent'.

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;

-- Create new policies allowing admin, super_admin, and agent access
CREATE POLICY "Authorized users can manage properties" ON public.properties 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'agent')
    )
);

CREATE POLICY "Authorized users can manage projects" ON public.projects 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'agent')
    )
);

-- 3. ADD MISSING COLUMNS TO PROPERTIES TABLE
-- The admin property wizard sends these fields, but they were missing from the schema.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnished_status TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS commercial_details JSONB;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS warehouse_details JSONB;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pricing_details JSONB;

-- 4. ADD MISSING COLUMNS TO PROJECTS TABLE
-- The admin project wizard sends these fields, but they were missing from the schema.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES agents(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS amenities JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS floor_plans JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS connectivity JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS highlights JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS towers_data JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_plan JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS specifications_complex JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ad_card_image TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS show_ad_on_home BOOLEAN DEFAULT FALSE;

SELECT 'Storage limits increased, RLS policies updated, and schemas fixed successfully!' as result;
