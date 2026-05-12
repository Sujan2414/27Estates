-- supabase/migrations/20260429_hrm_leaves_reject_reason.sql
--
-- Mirror the hrm_regularizations.reject_reason column so admins can
-- explain WHY a leave was rejected. Without this, employees got a
-- "Leave Rejected" notification with no context and had to chase the
-- admin manually.

alter table public.hrm_leaves
  add column if not exists reject_reason text;
