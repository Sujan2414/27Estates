-- HRM geofencing for attendance check-in / check-out
--
-- Adds the office location + radius config to hrm_work_settings and stores
-- per-check-in/out distance + within-geofence flags on hrm_attendance so the
-- super-admin team-attendance view can flag outliers.

-- 1. Work-settings columns — office location + enforcement toggle
ALTER TABLE hrm_work_settings
  ADD COLUMN IF NOT EXISTS office_lat          double precision,
  ADD COLUMN IF NOT EXISTS office_lng          double precision,
  ADD COLUMN IF NOT EXISTS geofence_radius_m   integer NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS enforce_geofence    boolean NOT NULL DEFAULT true;

-- Seed the office at UK&Co HQ (Bangalore) unless already set.
UPDATE hrm_work_settings
   SET office_lat        = COALESCE(office_lat, 12.980124),
       office_lng        = COALESCE(office_lng, 77.606619),
       geofence_radius_m = COALESCE(geofence_radius_m, 150),
       enforce_geofence  = COALESCE(enforce_geofence, true)
 WHERE office_lat IS NULL
    OR office_lng IS NULL;

-- If the settings table is empty (fresh installs), seed a row with sensible
-- defaults plus the office location.
INSERT INTO hrm_work_settings
  (work_start_time, work_end_time, full_day_hours, half_day_hours,
   office_lat, office_lng, geofence_radius_m, enforce_geofence)
SELECT '09:00', '18:00', 8.0, 4.0,
       12.980124, 77.606619, 150, true
 WHERE NOT EXISTS (SELECT 1 FROM hrm_work_settings);

-- 2. Attendance columns — per-event distance + inside-geofence flag
ALTER TABLE hrm_attendance
  ADD COLUMN IF NOT EXISTS check_in_within_geofence   boolean,
  ADD COLUMN IF NOT EXISTS check_in_distance_m        integer,
  ADD COLUMN IF NOT EXISTS check_out_within_geofence  boolean,
  ADD COLUMN IF NOT EXISTS check_out_distance_m       integer;
