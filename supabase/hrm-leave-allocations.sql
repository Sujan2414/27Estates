-- ============================================================
-- HRM Leave Allocations
-- Financial Year: April 1 – March 31 (Indian standard)
-- Only Super Admin can set allocations
-- ============================================================

CREATE TABLE IF NOT EXISTS hrm_leave_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    financial_year TEXT NOT NULL,          -- e.g. '2025-26'
    leave_type TEXT NOT NULL CHECK (leave_type IN (
        'casual', 'sick', 'annual', 'maternity', 'paternity'
    )),
    allocated_days INTEGER NOT NULL DEFAULT 0 CHECK (allocated_days >= 0),
    allocated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, financial_year, leave_type)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_leave_allocation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leave_allocation_updated_at ON hrm_leave_allocations;
CREATE TRIGGER trg_leave_allocation_updated_at
    BEFORE UPDATE ON hrm_leave_allocations
    FOR EACH ROW EXECUTE FUNCTION update_leave_allocation_timestamp();

-- RLS
ALTER TABLE hrm_leave_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hrm_leave_allocations_policy" ON hrm_leave_allocations;
CREATE POLICY "hrm_leave_allocations_policy" ON hrm_leave_allocations
    FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hrm_alloc_employee ON hrm_leave_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_alloc_fy ON hrm_leave_allocations(financial_year);
CREATE INDEX IF NOT EXISTS idx_hrm_alloc_emp_fy ON hrm_leave_allocations(employee_id, financial_year);
