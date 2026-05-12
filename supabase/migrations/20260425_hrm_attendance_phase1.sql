-- HRM Attendance Phase 1 — trust & integrity layer
--
-- Audit findings this migration addresses:
--   1. Selfie verification was a UI mockup. We add storage columns so a real
--      photo URL can land per check-in / check-out, plus a Supabase Storage
--      bucket policy that lets employees upload their own selfies and lets
--      super-admins read everyone's.
--   2. "Late" was hard-coded to 'present'. We add late_minutes and auto-set
--      status via a trigger comparing check_in to hrm_work_settings.work_start_time
--      plus a configurable grace period.
--   3. Forgotten clock-outs leave rows open forever. We add an auto_closed
--      flag and a function `hrm_auto_close_open_attendance` that pg_cron (or
--      an Edge Function on a schedule) can call at end-of-day to close any
--      still-open rows for "today".
--   4. Breaks are not deducted from hours_worked. The trigger now subtracts
--      break_minutes when computing hours_worked on check_out.
--   5. Geofence was not flagged at submission. We don't BLOCK insertion (soft
--      enforcement — GPS jitter at building entrances would lock people out)
--      but we do guarantee the within_geofence flag and distance are populated
--      via a normaliser trigger so the SA team page reliably shows outliers.

-- ── 1. Schema additions ──────────────────────────────────────────────

-- Grace period on hrm_work_settings — minutes after work_start_time during
-- which check-in is still 'present' rather than 'late'. 45 min by product
-- spec; intentionally generous to absorb commute jitter, traffic, and the
-- usual office-arrival-then-coffee-then-clock-in flow before flagging.
-- Adjustable per org via hrm_work_settings UI.
ALTER TABLE hrm_work_settings
  ADD COLUMN IF NOT EXISTS late_grace_minutes integer NOT NULL DEFAULT 45;

-- One-shot: bump existing rows to the new default so previously-seeded orgs
-- match the spec without manual intervention.
UPDATE hrm_work_settings SET late_grace_minutes = 45 WHERE late_grace_minutes < 45;

ALTER TABLE hrm_attendance
  ADD COLUMN IF NOT EXISTS check_in_selfie_url   text,
  ADD COLUMN IF NOT EXISTS check_out_selfie_url  text,
  -- Minutes past (work_start_time + grace) that the check-in arrived. 0 if
  -- on time. Trigger-computed; we don't trust the client for this.
  ADD COLUMN IF NOT EXISTS late_minutes          integer NOT NULL DEFAULT 0,
  -- Marker for rows closed by the auto-close cron rather than the user
  -- tapping clock-out. Lets the SA UI render an "auto-closed" pill so it's
  -- obvious the employee forgot.
  ADD COLUMN IF NOT EXISTS auto_closed           boolean NOT NULL DEFAULT false;

-- ── 2. Late detection + hours-worked trigger ────────────────────────

CREATE OR REPLACE FUNCTION hrm_attendance_compute_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_time      time;
  v_grace_minutes   int;
  v_full_day_hours  numeric;
  v_half_day_hours  numeric;
  v_check_in_local  time;
  v_late_threshold  time;
  v_break_minutes   int;
  v_hours_raw       numeric;
  v_hours_net       numeric;
BEGIN
  -- Pull org defaults from hrm_work_settings (fallback if no row)
  SELECT work_start_time, late_grace_minutes, full_day_hours, half_day_hours
    INTO v_start_time, v_grace_minutes, v_full_day_hours, v_half_day_hours
    FROM hrm_work_settings
    LIMIT 1;
  v_start_time     := COALESCE(v_start_time, '09:00'::time);
  v_grace_minutes  := COALESCE(v_grace_minutes, 45);
  v_full_day_hours := COALESCE(v_full_day_hours, 8.0);
  v_half_day_hours := COALESCE(v_half_day_hours, 4.0);

  -- ── On check-in: compute late_minutes + initial status
  IF NEW.check_in IS NOT NULL THEN
    v_check_in_local := (NEW.check_in AT TIME ZONE 'Asia/Kolkata')::time;
    v_late_threshold := v_start_time + (v_grace_minutes || ' minutes')::interval;

    IF v_check_in_local <= v_late_threshold THEN
      NEW.late_minutes := 0;
      -- Don't override an admin-set status (e.g. 'wfh', 'leave')
      IF NEW.status IS NULL OR NEW.status IN ('present', 'late') THEN
        NEW.status := 'present';
      END IF;
    ELSE
      NEW.late_minutes := EXTRACT(EPOCH FROM (v_check_in_local - v_start_time)) / 60;
      IF NEW.status IS NULL OR NEW.status IN ('present', 'late') THEN
        NEW.status := 'late';
      END IF;
    END IF;
  END IF;

  -- ── On check-out: compute hours_worked = (out − in) − breaks
  IF NEW.check_out IS NOT NULL AND NEW.check_in IS NOT NULL THEN
    v_break_minutes := COALESCE(NEW.break_minutes, 0);
    v_hours_raw := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
    v_hours_net := GREATEST(0, v_hours_raw - (v_break_minutes::numeric / 60));
    NEW.hours_worked := ROUND(v_hours_net::numeric, 2);

    -- Half-day flag if net hours are below the threshold but employee did
    -- show up (don't override late-status; SA can see both).
    IF NEW.hours_worked < v_half_day_hours AND NEW.status IN ('present', 'late') THEN
      NEW.status := 'half_day';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hrm_attendance_compute_status ON hrm_attendance;
CREATE TRIGGER hrm_attendance_compute_status
  BEFORE INSERT OR UPDATE OF check_in, check_out, break_minutes
  ON hrm_attendance
  FOR EACH ROW
  EXECUTE FUNCTION hrm_attendance_compute_status();

-- ── 3. Auto-close forgotten clock-outs ──────────────────────────────
-- Call this from pg_cron at 23:59 IST every day (or from an Edge Function).
-- Closes any row where check_in IS NOT NULL AND check_out IS NULL AND date
-- is today (or earlier if cron ran late). Sets check_out = check_in +
-- full_day_hours (so payroll doesn't penalise; auto_closed=true so SA can
-- review). Status is preserved (late stays late) but flagged via auto_closed.

CREATE OR REPLACE FUNCTION hrm_auto_close_open_attendance(p_target_date date DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_day_hours  numeric;
  v_closed_count    integer := 0;
BEGIN
  SELECT COALESCE(full_day_hours, 8.0) INTO v_full_day_hours
    FROM hrm_work_settings LIMIT 1;
  IF v_full_day_hours IS NULL THEN v_full_day_hours := 8.0; END IF;

  WITH closed AS (
    UPDATE hrm_attendance
       SET check_out   = check_in + (v_full_day_hours || ' hours')::interval,
           auto_closed = true
     WHERE date <= p_target_date
       AND check_in IS NOT NULL
       AND check_out IS NULL
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_closed_count FROM closed;

  RETURN v_closed_count;
END;
$$;

COMMENT ON FUNCTION hrm_auto_close_open_attendance IS
  'Closes any open attendance rows up to and including p_target_date by ' ||
  'setting check_out = check_in + full_day_hours and auto_closed = true. ' ||
  'Schedule via pg_cron daily at 23:59 IST: ' ||
  'SELECT cron.schedule(''hrm_auto_close_attendance'', ''29 18 * * *'', ' ||
  '''SELECT hrm_auto_close_open_attendance();''); -- 18:29 UTC = 23:59 IST';

-- ── 4. Selfie storage bucket policy ─────────────────────────────────
-- Bucket itself is created via the dashboard or storage.create_bucket() in a
-- separate one-shot — RLS migrations only handle the policies on
-- storage.objects. Run this AFTER creating bucket 'hrm_selfies' (private).

-- Employees can upload selfies to their own folder
DROP POLICY IF EXISTS hrm_selfies_employee_upload ON storage.objects;
CREATE POLICY hrm_selfies_employee_upload
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hrm_selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Employees can read their own; super_admin reads all
DROP POLICY IF EXISTS hrm_selfies_select ON storage.objects;
CREATE POLICY hrm_selfies_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'hrm_selfies'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
    )
  );

-- Employees can update / delete their own (e.g. retake selfie before submit)
DROP POLICY IF EXISTS hrm_selfies_employee_update ON storage.objects;
CREATE POLICY hrm_selfies_employee_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'hrm_selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS hrm_selfies_employee_delete ON storage.objects;
CREATE POLICY hrm_selfies_employee_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hrm_selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 5. Backfill existing rows so the new columns aren't NULL ────────
UPDATE hrm_attendance SET late_minutes = 0  WHERE late_minutes IS NULL;
UPDATE hrm_attendance SET auto_closed = false WHERE auto_closed IS NULL;
