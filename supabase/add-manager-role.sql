-- ================================================================
-- Add 'manager' role to profiles table
-- Approval chain: agent → manager → admin → super_admin
-- ================================================================

-- 1. Update CHECK constraint to include manager
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'agent', 'manager', 'admin', 'super_admin'));

-- 2. Add approved_by_role column to hrm_leaves for chain tracking
ALTER TABLE hrm_leaves ADD COLUMN IF NOT EXISTS requires_approval_from text;
ALTER TABLE hrm_leaves ADD COLUMN IF NOT EXISTS approval_chain text[] DEFAULT '{}';

-- 3. Same for regularizations
ALTER TABLE hrm_regularizations ADD COLUMN IF NOT EXISTS requires_approval_from text;

-- 4. Make sure reporting_manager_id exists on profiles (it should already)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reporting_manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Verify
SELECT 'Manager role migration complete' as status;
