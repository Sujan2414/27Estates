-- supabase/migrations/20260430_site_visits_custom_location.sql
--
-- Allow scheduling a visit to a property/project that ISN'T in our DB yet.
-- Client wanted: when picking a listing, choose "Others" → enter the
-- listing name + lat/lng manually so the agent's GPS arrival tracking
-- still works without first creating the listing in admin.
--
-- Adds three optional columns. Visit rows can have EITHER a property_id /
-- project_id (existing flow) OR these custom_location_* fields. Map +
-- carousel + arrival tracking all read whichever is present.

ALTER TABLE public.site_visits
  ADD COLUMN IF NOT EXISTS custom_location_name text,
  ADD COLUMN IF NOT EXISTS custom_location_lat  double precision,
  ADD COLUMN IF NOT EXISTS custom_location_lng  double precision;

COMMENT ON COLUMN public.site_visits.custom_location_name IS
  'Free-text listing name when the visit is to an off-platform property '
  '(neither property_id nor project_id is set). Paired with custom_location_lat/lng.';
