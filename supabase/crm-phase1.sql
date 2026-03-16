-- CRM Phase 1: Lead Scoring, Notifications, Site Visits
-- Run via Supabase Management API

-- ───────────────────────────────────────────────
-- 1. Lead Scoring columns on leads table
-- ───────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}';

-- ───────────────────────────────────────────────
-- 2. Notifications table
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'new_lead' | 'status_change' | 'task_due' | 'overdue' | 'note'
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ───────────────────────────────────────────────
-- 3. Site Visits table
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    agent_id UUID,
    visit_date DATE NOT NULL,
    visit_time TIME,
    status TEXT DEFAULT 'scheduled', -- 'scheduled' | 'completed' | 'no_show' | 'cancelled'
    outcome TEXT, -- 'interested' | 'not_interested' | 'closed' | 'follow_up'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);

-- ───────────────────────────────────────────────
-- 4. Email Campaigns table
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- 'draft' | 'sending' | 'sent' | 'cancelled'
    filter_source TEXT,
    filter_status TEXT,
    filter_priority TEXT,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipient_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- 5. RLS policies (service role bypasses these but needed for completeness)
-- ───────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
CREATE POLICY "Service role full access notifications" ON notifications
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access site_visits" ON site_visits;
CREATE POLICY "Service role full access site_visits" ON site_visits
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access email_campaigns" ON email_campaigns;
CREATE POLICY "Service role full access email_campaigns" ON email_campaigns
    USING (true) WITH CHECK (true);
