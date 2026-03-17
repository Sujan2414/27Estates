-- ============================================================
-- HRM Regularizations
-- Short-day employees apply, super admin approves
-- ============================================================

-- 1. Add quota columns to hrm_work_settings
ALTER TABLE hrm_work_settings
    ADD COLUMN IF NOT EXISTS max_regularizations_per_month  INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS max_regularizations_per_year   INTEGER NOT NULL DEFAULT 10;

-- 2. Regularization requests
CREATE TABLE IF NOT EXISTS hrm_regularizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date            DATE NOT NULL,                    -- the attendance date to regularize
    reason          TEXT NOT NULL,
    actual_hours    DECIMAL(5,2),                     -- hours actually worked (from attendance)
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
    approved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    admin_notes     TEXT,
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, date)                         -- one request per day per employee
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_regularization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_regularization_updated_at ON hrm_regularizations;
CREATE TRIGGER trg_regularization_updated_at
    BEFORE UPDATE ON hrm_regularizations
    FOR EACH ROW EXECUTE FUNCTION update_regularization_timestamp();

-- RLS
ALTER TABLE hrm_regularizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hrm_regularizations_policy" ON hrm_regularizations;
CREATE POLICY "hrm_regularizations_policy" ON hrm_regularizations
    FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hrm_reg_employee ON hrm_regularizations(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_reg_status   ON hrm_regularizations(status);
CREATE INDEX IF NOT EXISTS idx_hrm_reg_date     ON hrm_regularizations(date);
