-- Unify task storage. Up to now:
--   - Mobile (Workmate) wrote tasks to `hrm_tasks`
--   - Web CRM lead-detail wrote tasks to `lead_tasks`
-- so a task created in either place was invisible on the other.
--
-- This migration:
--   1. Adds a nullable `lead_id` column to `hrm_tasks` so a task can
--      optionally be attached to a lead.
--   2. Backfills existing `lead_tasks` rows into `hrm_tasks` so
--      historical web tasks don't disappear after the API switches.
--      lead_tasks.assigned_to / created_by are text; hrm_tasks expects
--      uuid, so they're cast explicitly. is_completed=true maps to
--      status='done' (the hrm_tasks check constraint enum is
--      'todo' | 'in_progress' | 'review' | 'done', no 'completed').
--   3. Leaves `lead_tasks` in place (read-only fallback) — drop in a
--      follow-up migration once we've verified everything works.

ALTER TABLE hrm_tasks
    ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hrm_tasks_lead_id ON hrm_tasks(lead_id);

INSERT INTO hrm_tasks (id, lead_id, title, description, assigned_to, created_by, status, priority, due_date, created_at, updated_at)
SELECT
    lt.id,
    lt.lead_id,
    lt.title,
    lt.description,
    lt.assigned_to::uuid,
    lt.created_by::uuid,
    CASE WHEN lt.is_completed THEN 'done' ELSE 'todo' END,
    COALESCE(lt.priority, 'medium'),
    lt.due_date,
    lt.created_at,
    lt.created_at
FROM lead_tasks lt
WHERE NOT EXISTS (SELECT 1 FROM hrm_tasks ht WHERE ht.id = lt.id);

COMMENT ON COLUMN hrm_tasks.lead_id IS
    'Optional link to a CRM lead. Web CRM lead-detail tasks and mobile '
    'Workmate "Add Task from lead" both write here. Null for org-wide '
    'tasks (admin assignments, internal todos).';
