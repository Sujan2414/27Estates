-- HRM salary structures
--
-- Master CTC + breakdown per employee. Separate from hrm_payroll (which stays
-- per-month payslip ledger). The web admin panel writes here when defining or
-- updating an employee's salary; monthly payslip generation reads the
-- structure that was effective on the payslip's month-start.
--
-- Storage model decision: we store the final monthly *amounts* for each
-- earning + deduction rather than percentages. Reasoning:
--   1. Avoids floating-point drift when admins adjust amounts inline (the UI
--      derives the % live from amount/CTC for display; the % isn't stored).
--   2. Keeps payslip generation deterministic — the rupee value the admin
--      actually saw and approved is what gets used downstream.
--   3. Statutory components (conveyance ₹1,600, medical ₹1,250) are flat-INR,
--      not percentage-based, so a pct-only model would be awkward.
-- The default Indian split (40% basic + 50% of basic HRA + statutory + 5% LTA
-- + residual special allowance) is computed *client-side* in the admin UI
-- when the user clicks "Auto-distribute"; this table only persists the
-- final amounts, not the recipe used to generate them.

CREATE TABLE IF NOT EXISTS hrm_salary_structures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id     uuid NOT NULL
                  REFERENCES profiles(id)
                  ON DELETE CASCADE,

  -- Structure validity window. Multiple rows allowed per employee — the
  -- newest row whose effective_from <= current date is the "active" one.
  -- Old rows stay in place so July's payslip still references July's
  -- structure even after a salary revision in October.
  effective_from  date NOT NULL DEFAULT CURRENT_DATE,

  ctc_monthly     numeric(12, 2) NOT NULL CHECK (ctc_monthly > 0),

  -- ── Earnings (monthly amounts, all in INR) ───────────────────────────
  basic              numeric(12, 2) NOT NULL DEFAULT 0 CHECK (basic >= 0),
  hra                numeric(12, 2) NOT NULL DEFAULT 0 CHECK (hra >= 0),
  special_allowance  numeric(12, 2) NOT NULL DEFAULT 0 CHECK (special_allowance >= 0),
  travel_allowance   numeric(12, 2) NOT NULL DEFAULT 0 CHECK (travel_allowance >= 0),  -- LTA
  medical_allowance  numeric(12, 2) NOT NULL DEFAULT 0 CHECK (medical_allowance >= 0),
  conveyance         numeric(12, 2) NOT NULL DEFAULT 0 CHECK (conveyance >= 0),
  bonus              numeric(12, 2) NOT NULL DEFAULT 0 CHECK (bonus >= 0),

  -- ── Deductions (monthly amounts, all in INR) ─────────────────────────
  -- pf_deduction defaults to 0; admin UI computes 12% of basic capped at
  -- ₹1,800 and prefills, but the value is editable so finance can mark a
  -- specific employee as PF-exempt or set the larger ₹2,400 if their basic
  -- is < ₹15K and they've opted in.
  pf_deduction       numeric(12, 2) NOT NULL DEFAULT 0 CHECK (pf_deduction >= 0),
  -- Professional tax — state-specific, leave 0 by default per product spec.
  -- Admin enters per employee based on their work state (Karnataka ₹200,
  -- Maharashtra ₹200/₹300 slab, etc.).
  professional_tax   numeric(12, 2) NOT NULL DEFAULT 0 CHECK (professional_tax >= 0),
  -- TDS estimate — manual entry for now per product spec; later we can
  -- automate from Form 12BB declarations.
  tax_estimate       numeric(12, 2) NOT NULL DEFAULT 0 CHECK (tax_estimate >= 0),

  notes              text,

  created_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- One structure per (employee, effective_from). Admin saving on the same
  -- day overwrites the same row instead of creating a duplicate.
  UNIQUE (employee_id, effective_from)
);

-- ── Indexes ────────────────────────────────────────────────────────────
-- Hot path: "what's the active structure for employee X on date D?"
-- ORDER BY effective_from DESC LIMIT 1 → reverse-index helps.
CREATE INDEX IF NOT EXISTS hrm_salary_structures_employee_effective_idx
  ON hrm_salary_structures (employee_id, effective_from DESC);

-- ── updated_at auto-bump trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION hrm_salary_structures_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hrm_salary_structures_set_updated_at ON hrm_salary_structures;
CREATE TRIGGER hrm_salary_structures_set_updated_at
  BEFORE UPDATE ON hrm_salary_structures
  FOR EACH ROW
  EXECUTE FUNCTION hrm_salary_structures_set_updated_at();

-- ── Helper function: latest structure in effect on a given date ────────
-- Returns the structure row that was active on p_as_of (default = today)
-- for the given employee. Used by monthly payslip generation so August's
-- payslip uses the structure as it stood on Aug 1, even if the admin
-- revises pay in November.
CREATE OR REPLACE FUNCTION hrm_active_salary_structure(
  p_employee_id uuid,
  p_as_of       date DEFAULT CURRENT_DATE
)
RETURNS SETOF hrm_salary_structures
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM hrm_salary_structures
  WHERE employee_id = p_employee_id
    AND effective_from <= p_as_of
  ORDER BY effective_from DESC
  LIMIT 1;
$$;

-- ── Row-Level Security ─────────────────────────────────────────────────
ALTER TABLE hrm_salary_structures ENABLE ROW LEVEL SECURITY;

-- Super admins: full read + write. Salary is sensitive financial data; we
-- intentionally do NOT grant access to regular admins.
DROP POLICY IF EXISTS hrm_salary_structures_super_admin_all
  ON hrm_salary_structures;
CREATE POLICY hrm_salary_structures_super_admin_all
  ON hrm_salary_structures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Employees: read-only on their OWN structure. They cannot see anyone
-- else's salary; they cannot edit their own.
DROP POLICY IF EXISTS hrm_salary_structures_employee_select_own
  ON hrm_salary_structures;
CREATE POLICY hrm_salary_structures_employee_select_own
  ON hrm_salary_structures
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- ── Comments for the schema docs ───────────────────────────────────────
COMMENT ON TABLE hrm_salary_structures IS
  'Master CTC + monthly breakdown per employee. New row per revision; ' ||
  'old rows preserved as historical record for past payslip integrity. ' ||
  'Sum of (basic + hra + special_allowance + travel_allowance + ' ||
  'medical_allowance + conveyance + bonus) should equal ctc_monthly — ' ||
  'enforced UI-side, not constrained at DB level so admins can save ' ||
  'rounding-off drafts mid-edit.';

COMMENT ON FUNCTION hrm_active_salary_structure IS
  'Returns the salary structure row that was in effect for the given ' ||
  'employee on the given date (default: today). Used by payslip ' ||
  'generation so monthly payslips lock in the structure that applied ' ||
  'on that month, not whatever the latest revision happens to be.';
