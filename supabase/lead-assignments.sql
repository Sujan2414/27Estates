-- ============================================================
-- Lead Assignment, Scheduling & Escalation System
-- ============================================================

-- 1. Add assignment + scheduling columns to leads
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS assigned_to          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_at          TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS scheduled_call_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_activity_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalated_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS escalation_count     INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to     ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_call  ON leads(scheduled_call_at);
CREATE INDEX IF NOT EXISTS idx_leads_escalated       ON leads(escalated_at);

-- 2. Round-robin state tracker (singleton)
CREATE TABLE IF NOT EXISTS lead_assignment_state (
    id                INTEGER PRIMARY KEY DEFAULT 1,
    last_agent_index  INTEGER NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ DEFAULT now()
);
INSERT INTO lead_assignment_state (id, last_agent_index)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. Daily call schedules
CREATE TABLE IF NOT EXISTS lead_schedules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    agent_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_at            TIMESTAMPTZ NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','called','no_answer','postpone_requested','postponed','escalated','reassigned')),
    outcome                 TEXT CHECK (outcome IN ('interested','not_interested','callback','no_answer','converted') OR outcome IS NULL),
    notes                   TEXT,
    postpone_requested_at   TIMESTAMPTZ,
    postpone_approved_by    UUID REFERENCES profiles(id),
    postpone_approved_at    TIMESTAMPTZ,
    postpone_to             TIMESTAMPTZ,
    actual_called_at        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_lead_schedule_ts()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_schedule_ts ON lead_schedules;
CREATE TRIGGER trg_lead_schedule_ts
    BEFORE UPDATE ON lead_schedules
    FOR EACH ROW EXECUTE FUNCTION update_lead_schedule_ts();

ALTER TABLE lead_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_schedules_all" ON lead_schedules;
CREATE POLICY "lead_schedules_all" ON lead_schedules FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ls_agent_time ON lead_schedules(agent_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ls_lead        ON lead_schedules(lead_id);
CREATE INDEX IF NOT EXISTS idx_ls_status      ON lead_schedules(status);
CREATE INDEX IF NOT EXISTS idx_ls_date        ON lead_schedules(scheduled_at);
