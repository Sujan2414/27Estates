-- ============================================================
-- WhatsApp Funnel — Phase 1
-- Add stage machine + qualification filters to whatsapp_conversations.
-- See WHATSAPP_FUNNEL.md §4, §7, §9 for the spec.
-- ============================================================

ALTER TABLE whatsapp_conversations
    ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'NEW',
    -- stage: NEW | WELCOMED | INTENT_KNOWN | LOCATION_KNOWN | BUDGET_KNOWN
    --      | BHK_KNOWN | LISTINGS_SENT | ENGAGED_AI | SITE_VISIT_BOOKED
    --      | AGENT_HANDOFF | CONVERTED | LOST
    ADD COLUMN IF NOT EXISTS intent TEXT,                       -- 'buy' | 'rent' | 'agent'
    ADD COLUMN IF NOT EXISTS filter_city TEXT,
    ADD COLUMN IF NOT EXISTS filter_budget TEXT,
    ADD COLUMN IF NOT EXISTS filter_bhk TEXT,
    ADD COLUMN IF NOT EXISTS last_property_ids UUID[] DEFAULT ARRAY[]::UUID[],
    ADD COLUMN IF NOT EXISTS marketing_opted_out BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS conversation_window_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS funnel_source TEXT,                -- MB | 99 | B2B | META | GOOGLE | WEB | QR
    ADD COLUMN IF NOT EXISTS funnel_source_ref TEXT,            -- listing_id / ad_id / etc.
    ADD COLUMN IF NOT EXISTS funnel_referral_json JSONB;        -- raw referral payload from Meta CTWA

CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_stage ON whatsapp_conversations(stage);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_window ON whatsapp_conversations(conversation_window_expires_at);

-- Backfill: any existing conversation that has already been replied to by us
-- should NOT get a welcome message replayed. Mark them as ENGAGED_AI so the
-- funnel skips them and the existing AI path keeps running.
UPDATE whatsapp_conversations
SET stage = 'ENGAGED_AI'
WHERE stage = 'NEW'
  AND EXISTS (
      SELECT 1 FROM whatsapp_messages
      WHERE conversation_id = whatsapp_conversations.id
        AND direction = 'outbound'
  );
