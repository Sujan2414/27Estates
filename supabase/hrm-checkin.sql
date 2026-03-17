-- ============================================================
-- HRM Check-In / Check-Out Geo Columns + Work Settings
-- ============================================================

-- 1. Extend hrm_attendance with geo + timestamp columns
ALTER TABLE hrm_attendance
    ADD COLUMN IF NOT EXISTS check_in_time  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS check_in_lat   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_in_lng   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_out_lat  DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_out_lng  DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_in_address  TEXT,
    ADD COLUMN IF NOT EXISTS check_out_address TEXT,
    ADD COLUMN IF NOT EXISTS hours_worked   DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS work_mode      TEXT DEFAULT 'office'
        CHECK (work_mode IN ('office','remote','wfh'));

-- 2. Work Settings — one row, managed by super_admin
CREATE TABLE IF NOT EXISTS hrm_work_settings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_start_time         TIME NOT NULL DEFAULT '09:00',
    work_end_time           TIME NOT NULL DEFAULT '18:00',
    full_day_hours          DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    half_day_hours          DECIMAL(4,2) NOT NULL DEFAULT 4.0,
    checkin_reminder_time   TIME NOT NULL DEFAULT '09:00',
    checkout_reminder_time  TIME NOT NULL DEFAULT '18:00',
    reminders_enabled       BOOLEAN NOT NULL DEFAULT true,
    updated_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- Seed default row if not exists
INSERT INTO hrm_work_settings (
    work_start_time, work_end_time, full_day_hours, half_day_hours,
    checkin_reminder_time, checkout_reminder_time, reminders_enabled
)
SELECT '09:00','18:00', 8.0, 4.0, '09:00','18:00', true
WHERE NOT EXISTS (SELECT 1 FROM hrm_work_settings);

-- RLS
ALTER TABLE hrm_work_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hrm_work_settings_policy" ON hrm_work_settings;
CREATE POLICY "hrm_work_settings_policy" ON hrm_work_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger: auto-update updated_at on work settings save
CREATE OR REPLACE FUNCTION update_work_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_work_settings_updated_at ON hrm_work_settings;
CREATE TRIGGER trg_work_settings_updated_at
    BEFORE UPDATE ON hrm_work_settings
    FOR EACH ROW EXECUTE FUNCTION update_work_settings_timestamp();

-- Index for today's check-in lookups
CREATE INDEX IF NOT EXISTS idx_hrm_att_checkin_time ON hrm_attendance(check_in_time);
CREATE INDEX IF NOT EXISTS idx_hrm_att_checkout_time ON hrm_attendance(check_out_time);
