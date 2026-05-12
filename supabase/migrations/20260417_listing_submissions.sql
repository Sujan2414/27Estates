-- =====================================================
-- LISTING SUBMISSIONS (mobile app "List a property" flow)
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. Create listing_submissions table — richer than the legacy property_submissions:
--    captures map coordinates, address, photo URLs, per-type pricing, features,
--    amenities, and a review-state workflow that the mobile app displays back
--    to the user under "My Listings".
CREATE TABLE IF NOT EXISTS public.listing_submissions (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Basics (Step 1)
    name            TEXT NOT NULL,
    listing_type    TEXT CHECK (listing_type IN ('Sell', 'Rent', 'Lease')),
    category        TEXT,

    -- Location (Step 2)
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    city            TEXT,
    address         TEXT,

    -- Photos (Step 3) — may be local URIs at submit time; backend uploads to
    -- storage and replaces with public URLs before approval.
    photo_urls      TEXT[] DEFAULT '{}',
    video_url       TEXT,

    -- Pricing (Step 4)
    sell_price      NUMERIC,
    rent_price      NUMERIC,
    rent_period     TEXT CHECK (rent_period IN ('Monthly', 'Yearly')),

    -- Property features (Step 4)
    bedrooms        INTEGER DEFAULT 0,
    bathrooms       INTEGER DEFAULT 0,
    balconies       INTEGER DEFAULT 0,
    total_rooms     TEXT,
    amenities       TEXT[] DEFAULT '{}',

    -- Review workflow — the mobile app reads this to show the badge on
    -- "My Listings". 'published' means the team has pushed it to the main
    -- properties / projects tables (the public listing is live).
    status          TEXT DEFAULT 'pending_review'
                    CHECK (status IN (
                        'pending_review',
                        'under_review',
                        'scheduled_visit',
                        'approved',
                        'published',
                        'rejected',
                        'needs_changes'
                    )),
    reviewer_notes  TEXT,
    rejection_reason TEXT,

    -- Link to the final published listing once approved
    published_property_id UUID,
    published_project_id  UUID,

    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_submissions_user_id_idx
  ON public.listing_submissions (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS listing_submissions_status_idx
  ON public.listing_submissions (status, submitted_at DESC);

-- 2. Auto-touch updated_at on every update
CREATE OR REPLACE FUNCTION public.listing_submissions_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listing_submissions_updated_at ON public.listing_submissions;
CREATE TRIGGER trg_listing_submissions_updated_at
BEFORE UPDATE ON public.listing_submissions
FOR EACH ROW EXECUTE FUNCTION public.listing_submissions_touch_updated_at();

-- 3. Enable RLS
ALTER TABLE public.listing_submissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
--    a) Authenticated users can insert their own submission
CREATE POLICY "users_insert_own_listing_submissions"
  ON public.listing_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

--    b) Users can read their own submissions (for My Listings)
CREATE POLICY "users_select_own_listing_submissions"
  ON public.listing_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

--    c) Users can edit their own submissions while still pending/needs-changes
CREATE POLICY "users_update_own_pending_submissions"
  ON public.listing_submissions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('pending_review', 'needs_changes')
  )
  WITH CHECK (auth.uid() = user_id);

--    d) Admins / super admins manage everything
CREATE POLICY "admins_manage_listing_submissions"
  ON public.listing_submissions FOR ALL
  USING (public.is_admin_or_super_admin());

-- 5. Storage bucket for listing submission photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-submissions', 'listing-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users upload
CREATE POLICY "authenticated_upload_listing_submission_photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-submissions');

-- Public read (so the user can see their own photos back on My Listings)
CREATE POLICY "public_read_listing_submission_photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listing-submissions');

-- Users can delete their own uploads (path prefix convention: {user_id}/...)
CREATE POLICY "users_delete_own_listing_submission_photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

SELECT 'listing_submissions table + storage bucket configured successfully' AS message;
