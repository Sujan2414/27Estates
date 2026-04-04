-- Add auto_assign_enabled toggle to work settings
ALTER TABLE hrm_work_settings
  ADD COLUMN IF NOT EXISTS auto_assign_enabled boolean NOT NULL DEFAULT true;
