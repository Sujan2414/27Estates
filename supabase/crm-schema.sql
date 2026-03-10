-- ============================================
-- 27 Estates CRM Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. LEADS TABLE - Central table for all leads from all sources
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    -- source values: 'website', 'meta_ads', 'google_ads', '99acres', 'magicbricks', 'housing', 'justdial', 'chatbot', 'whatsapp', 'manual', 'referral'
    source_campaign TEXT,          -- campaign name from ad platform
    source_ad_id TEXT,             -- ad ID from the platform
    source_form_id TEXT,           -- form ID (e.g., Meta Lead Form ID)
    source_raw_data JSONB,         -- raw payload from webhook for debugging
    status TEXT NOT NULL DEFAULT 'new',
    -- status values: 'new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted', 'lost'
    priority TEXT NOT NULL DEFAULT 'warm',
    -- priority values: 'hot', 'warm', 'cold'
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    property_interest UUID REFERENCES properties(id) ON DELETE SET NULL,
    project_interest UUID REFERENCES projects(id) ON DELETE SET NULL,
    budget_min NUMERIC,
    budget_max NUMERIC,
    preferred_location TEXT,
    property_type TEXT,            -- '2BHK', '3BHK', 'villa', 'plot', etc.
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    last_contacted_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    lost_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LEAD ACTIVITIES - Timeline of all interactions
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    -- type values: 'call', 'email_sent', 'email_received', 'whatsapp', 'site_visit', 'note', 'status_change', 'chatbot', 'system'
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,               -- extra data (e.g., old_status, new_status for status changes)
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LEAD TASKS - Follow-up reminders
CREATE TABLE IF NOT EXISTS lead_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AD PLATFORM CONNECTORS - Store API keys and webhook configs
CREATE TABLE IF NOT EXISTS ad_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE,
    -- platform values: 'meta_ads', 'google_ads', '99acres', 'magicbricks', 'housing', 'justdial', 'interakt', 'custom'
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    -- config stores: { api_key, webhook_secret, page_id, form_ids, etc. }
    -- Sensitive keys should be in env vars, this stores non-sensitive config
    webhook_url TEXT,              -- auto-generated webhook URL for this platform
    last_synced_at TIMESTAMPTZ,
    leads_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WEBHOOK LOGS - Debug log for all incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    event_type TEXT,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'received',
    -- status values: 'received', 'processed', 'failed', 'duplicate'
    error_message TEXT,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    -- e.g., ['{{name}}', '{{property_title}}', '{{agent_name}}']
    category TEXT DEFAULT 'general',
    -- category values: 'welcome', 'follow_up', 'property_alert', 'site_visit', 'general'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EMAIL REMINDERS / SCHEDULED EMAILS
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    -- status values: 'pending', 'sent', 'failed', 'cancelled'
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EMAIL LOGS - Track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    -- status values: 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    resend_id TEXT,                -- Resend message ID for tracking
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

-- 9. CHAT SESSIONS - Website chatbot
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    -- status values: 'active', 'closed', 'escalated'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 10. API USAGE TRACKING - Track tokens and costs
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL DEFAULT 'azure_openai',
    -- service values: 'azure_openai', 'resend', etc.
    model TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost NUMERIC(10,6) DEFAULT 0,
    session_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON api_usage FOR ALL USING (true) WITH CHECK (true);

-- 11. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    -- role values: 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date) WHERE is_completed = FALSE;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor ON chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- ============================================
-- AUTO-UPDATE updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ad_connectors_updated_at
    BEFORE UPDATE ON ad_connectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED default ad connectors
-- ============================================
INSERT INTO ad_connectors (platform, display_name, is_active) VALUES
    ('meta_ads', 'Meta Ads (Facebook/Instagram)', false),
    ('google_ads', 'Google Ads', false),
    ('99acres', '99acres', false),
    ('magicbricks', 'MagicBricks', false),
    ('housing', 'Housing.com', false),
    ('justdial', 'JustDial', false)
ON CONFLICT (platform) DO NOTHING;

-- ============================================
-- SEED default email templates
-- ============================================
INSERT INTO email_templates (name, subject, body_html, variables, category) VALUES
(
    'Welcome Email',
    'Welcome to 27 Estates - {{name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #183C38; padding: 24px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0;">27 Estates</h1>
        </div>
        <div style="padding: 32px 24px;">
            <h2 style="color: #183C38;">Hello {{name}},</h2>
            <p style="color: #374151; line-height: 1.6;">Thank you for your interest in 27 Estates. We specialize in premium real estate in Bangalore and would love to help you find your dream property.</p>
            <p style="color: #374151; line-height: 1.6;">Our team will get in touch with you shortly. In the meantime, feel free to explore our latest listings.</p>
            <a href="https://27estates.com/properties" style="display: inline-block; background-color: #183C38; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Browse Properties</a>
        </div>
        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p>27 Estates | Premium Real Estate</p>
        </div>
    </div>',
    ARRAY['{{name}}'],
    'welcome'
),
(
    'Follow Up - Day 3',
    'Still looking, {{name}}? We have something for you',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #183C38; padding: 24px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0;">27 Estates</h1>
        </div>
        <div style="padding: 32px 24px;">
            <h2 style="color: #183C38;">Hi {{name}},</h2>
            <p style="color: #374151; line-height: 1.6;">We noticed you were interested in properties with us. We wanted to check in and see if you had any questions.</p>
            <p style="color: #374151; line-height: 1.6;">Our property experts are available to help you find exactly what you are looking for. Would you like to schedule a call or a site visit?</p>
            <a href="https://27estates.com/contact" style="display: inline-block; background-color: #183C38; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Get In Touch</a>
        </div>
        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p>27 Estates | Premium Real Estate</p>
        </div>
    </div>',
    ARRAY['{{name}}'],
    'follow_up'
),
(
    'New Property Alert',
    'New Property Listed - {{property_title}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #183C38; padding: 24px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0;">27 Estates</h1>
        </div>
        <div style="padding: 32px 24px;">
            <h2 style="color: #183C38;">Hi {{name}},</h2>
            <p style="color: #374151; line-height: 1.6;">A new property matching your interests has been listed!</p>
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #183C38; margin: 0 0 8px;">{{property_title}}</h3>
                <p style="color: #6b7280; margin: 0;">{{property_location}}</p>
                <p style="color: #183C38; font-size: 20px; font-weight: 700; margin: 12px 0 0;">{{property_price}}</p>
            </div>
            <a href="{{property_url}}" style="display: inline-block; background-color: #183C38; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View Property</a>
        </div>
        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p>27 Estates | Premium Real Estate</p>
        </div>
    </div>',
    ARRAY['{{name}}', '{{property_title}}', '{{property_location}}', '{{property_price}}', '{{property_url}}'],
    'property_alert'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS POLICIES (enable RLS on all new tables)
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service role key)
-- Authenticated admin users get read/write access
CREATE POLICY "Service role full access" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON lead_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON lead_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON ad_connectors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON webhook_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON email_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON email_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
