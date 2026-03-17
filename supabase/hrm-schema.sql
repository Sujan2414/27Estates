-- ============================================================
-- HRM Schema for 21 Estates CRM
-- Run this in Supabase SQL Editor
-- ============================================================

-- Employee Tasks (Kanban)
CREATE TABLE IF NOT EXISTS hrm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'sales', 'admin', 'marketing', 'legal', 'finance', 'operations')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance Tracking
CREATE TABLE IF NOT EXISTS hrm_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'work_from_home')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, date)
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS hrm_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-compute days_count via trigger
CREATE OR REPLACE FUNCTION compute_leave_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days_count := (NEW.end_date - NEW.start_date) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_leave_days ON hrm_leaves;
CREATE TRIGGER trg_compute_leave_days
    BEFORE INSERT OR UPDATE ON hrm_leaves
    FOR EACH ROW EXECUTE FUNCTION compute_leave_days();

-- Auto-update updated_at on hrm_tasks
CREATE OR REPLACE FUNCTION update_hrm_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hrm_task_updated_at ON hrm_tasks;
CREATE TRIGGER trg_hrm_task_updated_at
    BEFORE UPDATE ON hrm_tasks
    FOR EACH ROW EXECUTE FUNCTION update_hrm_task_timestamp();

-- Row Level Security
ALTER TABLE hrm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hrm_tasks_policy" ON hrm_tasks;
DROP POLICY IF EXISTS "hrm_attendance_policy" ON hrm_attendance;
DROP POLICY IF EXISTS "hrm_leaves_policy" ON hrm_leaves;

CREATE POLICY "hrm_tasks_policy" ON hrm_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hrm_attendance_policy" ON hrm_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hrm_leaves_policy" ON hrm_leaves FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hrm_tasks_assigned_to ON hrm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_hrm_tasks_status ON hrm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_hrm_tasks_due_date ON hrm_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_employee_date ON hrm_attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_date ON hrm_attendance(date);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_employee ON hrm_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_leaves_status ON hrm_leaves(status);
