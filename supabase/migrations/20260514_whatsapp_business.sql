-- ============================================================
-- WhatsApp Business Cloud API integration
-- AI lead-qualifier agent
-- ============================================================

-- 1) Conversations — one row per WhatsApp number we talk to
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_phone TEXT NOT NULL UNIQUE,            -- E.164 e.g. "918618907491"
    contact_name TEXT,                        -- WhatsApp profile name (if shared)
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    -- status: 'active' | 'qualified' | 'handoff' | 'closed'
    ai_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- false = a human took over, AI pauses
    assigned_agent_id UUID,                   -- nullable: human owner of the chat
    last_inbound_at TIMESTAMPTZ,
    last_outbound_at TIMESTAMPTZ,
    unread_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_phone ON whatsapp_conversations(wa_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_lead ON whatsapp_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_last_inbound ON whatsapp_conversations(last_inbound_at DESC);

-- 2) Messages — one row per message (inbound or outbound)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    wa_message_id TEXT UNIQUE,                -- Meta's wamid for dedup
    direction TEXT NOT NULL,                  -- 'inbound' | 'outbound'
    role TEXT NOT NULL DEFAULT 'user',        -- 'user' | 'assistant' | 'agent' | 'system'
    type TEXT NOT NULL DEFAULT 'text',        -- 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive' | 'template' | 'system'
    content TEXT,                             -- text body or transcript
    media_url TEXT,                           -- public URL for media (if any)
    meta_payload JSONB,                       -- raw Meta webhook / send payload
    ai_model TEXT,                            -- e.g. 'gpt-5.2-chat'
    ai_usage JSONB,                           -- {prompt_tokens, completion_tokens, total_tokens}
    status TEXT,                              -- outbound: 'queued'|'sent'|'delivered'|'read'|'failed'
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_conv_created ON whatsapp_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_wamid ON whatsapp_messages(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_direction ON whatsapp_messages(direction);

-- 3) Trigger to bump updated_at on conversation changes
CREATE OR REPLACE FUNCTION whatsapp_touch_conversation()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_whatsapp_conv_touch ON whatsapp_conversations;
CREATE TRIGGER trg_whatsapp_conv_touch
BEFORE UPDATE ON whatsapp_conversations
FOR EACH ROW EXECUTE FUNCTION whatsapp_touch_conversation();

-- 4) RLS — service role bypasses; authenticated CRM staff can read
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (used by API routes with SUPABASE_SERVICE_ROLE_KEY)
DROP POLICY IF EXISTS "service role full access on whatsapp_conversations" ON whatsapp_conversations;
CREATE POLICY "service role full access on whatsapp_conversations"
ON whatsapp_conversations FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role full access on whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "service role full access on whatsapp_messages"
ON whatsapp_messages FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Authenticated CRM users can read both (admin UI)
DROP POLICY IF EXISTS "authenticated read whatsapp_conversations" ON whatsapp_conversations;
CREATE POLICY "authenticated read whatsapp_conversations"
ON whatsapp_conversations FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated read whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "authenticated read whatsapp_messages"
ON whatsapp_messages FOR SELECT TO authenticated
USING (true);

-- 5) Helper: get conversation by phone (creates if missing) — used by webhook
CREATE OR REPLACE FUNCTION get_or_create_whatsapp_conversation(
    p_phone TEXT,
    p_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM whatsapp_conversations WHERE wa_phone = p_phone;
    IF v_id IS NULL THEN
        INSERT INTO whatsapp_conversations (wa_phone, contact_name)
        VALUES (p_phone, p_name)
        RETURNING id INTO v_id;
    ELSIF p_name IS NOT NULL THEN
        UPDATE whatsapp_conversations SET contact_name = p_name
        WHERE id = v_id AND (contact_name IS NULL OR contact_name = '');
    END IF;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
