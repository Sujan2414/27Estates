# WhatsApp Funnel — Architecture & Build Plan

> Owner: Sujan · Last updated: 2026-05-15 · Status: **PLAN** (not yet built beyond Phase 0)

## 1. Goal

Turn the WhatsApp Business number into the **primary lead-capture and qualification channel** for 27 Estates, fed by:

- MagicBricks "Chat on WhatsApp" buttons on property listings
- 99acres / B2B Bricks property pages
- Meta Click-to-WhatsApp (CTWA) ads on Facebook & Instagram
- Google Ads with WhatsApp CTA extensions
- The floating WhatsApp button on `27estates.com`
- QR codes on hoardings, brochures, site signage

Inbound leads should be **qualified inside WhatsApp** (intent → location → budget → BHK), shown matching listings via deep-link back to the website, and converted to a site visit or human-agent conversation — without ever leaving the chat.

## 2. Current state (Phase 0 — done)

| Component | Status |
|---|---|
| Meta App "Automation" (App ID `1009882105030740`) | ✅ Created |
| WABA `1309457601140541` + Test Number `1208000389053201` (+1 555-635-6525) | ✅ Linked |
| Webhook `POST/GET /api/whatsapp/webhook` | ✅ Live, HMAC verified |
| Permanent System User token (Never expires) | ✅ Rotated, in Vercel prod |
| KIWI lead-qualifier AI (Azure OpenAI gpt-5.2-chat) | ✅ Responding to free-form text |
| Inbound payload parsing (text + interactive types already typed) | ✅ See [webhook/route.ts:101-116](src/app/api/whatsapp/webhook/route.ts#L101-L116) |
| Admin conversation viewer / templates / broadcast routes | ✅ Scaffolded |
| CRM lead pipeline + agent assignment + site-visits + nurture-triggers | ✅ Exists |

**What's missing for a real funnel:** structured conversation flow (buttons/lists), ad-source attribution, deep links to filtered listings, site-visit booking inside chat, agent handoff, and Meta-approved templates for re-engagement past 24h.

## 3. Target architecture

```
       ┌──────────────────────────────────────────────────────┐
       │  ENTRY POINTS (all funnel into one WhatsApp inbox)   │
       ├──────────────────────────────────────────────────────┤
       │  MagicBricks ─┐                                       │
       │  99acres ─────┤                                       │
       │  B2B Bricks ──┼──► wa.me/<num>?text=<src+propId>      │
       │  Web button ──┤                                       │
       │  QR codes ────┘                                       │
       │  Meta CTWA  ──► native referral payload in webhook    │
       │  Google Ads ──► wa.me CTA with prefilled text         │
       └─────────────────────┬────────────────────────────────┘
                             │
                             ▼
   ┌──────────────────────────────────────────────────────────┐
   │  /api/whatsapp/webhook                                    │
   │   • HMAC-verify, idempotency on wamid                     │
   │   • parse: text | button_reply | list_reply | referral    │
   │   • upsert lead in crm_leads (channel='whatsapp')         │
   │   • read conversation.stage  →  route to stage handler    │
   └─────────────────────┬────────────────────────────────────┘
                         ▼
   ╔══════════════════════════════════════════════════════════╗
   ║  STAGE MACHINE                                            ║
   ║                                                            ║
   ║  NEW ──► WELCOMED ──► INTENT_KNOWN ──► LOCATION_KNOWN     ║
   ║                                            │              ║
   ║                                            ▼              ║
   ║  CONVERTED ◄── SITE_VISIT_BOOKED ◄── BUDGET_KNOWN         ║
   ║       ▲              ▲                     │              ║
   ║       │              │                     ▼              ║
   ║       │       AGENT_HANDOFF ◄── ENGAGED_AI ◄── BHK_KNOWN  ║
   ║       │              ▲                                    ║
   ║       └──── LOST ◄───┘                                    ║
   ╚══════════════════════════════════════════════════════════╝
                         │
                         ▼
   ┌──────────────────────────────────────────────────────────┐
   │  send via Meta Cloud API                                  │
   │   sendText | sendButtons | sendList | sendCtaUrl |        │
   │   sendCarousel | sendFlow | sendTemplate                  │
   └──────────────────────────────────────────────────────────┘
```

## 4. Stage-by-stage spec

Each stage describes: **trigger → what KIWI sends → what user does → next state**.

### Stage 0 → NEW

**Trigger**: First-ever inbound message from a `wa_id`.

**Side effects**:
- Insert `crm_leads` row, `channel='whatsapp'`, `wa_id=<from>`, `source=<parsed from referral or wa.me text>`.
- Insert `whatsapp_conversations` row, `stage='NEW'`.
- If lead came from a property page → store `interest_property_id` on the lead.

Transitions to **WELCOMED** by sending the welcome interactive message.

### Stage 1 → WELCOMED (interactive, NOT AI)

**KIWI sends** (reply-buttons message, max 3):

```
Hi 👋 I'm KIWI from 27 Estates — your AI assistant.

I can help you find a home, book a site visit,
or connect you with one of our agents.

What brings you here today?

[ 🏠 Looking to Buy ]  [ 🔑 Looking to Rent ]  [ 👤 Talk to Agent ]
```

If lead came in with a specific property ref:

```
Hi 👋 I see you're interested in {{property_name}} at {{location}}.

What would you like to do?

[ 📋 Property details ]  [ 📅 Book site visit ]  [ 👤 Talk to agent ]
```

**User taps**: webhook receives `interactive.button_reply.id` → save to lead, transition to **INTENT_KNOWN**.

### Stage 2 → INTENT_KNOWN → LOCATION_KNOWN → BUDGET_KNOWN → BHK_KNOWN

Three back-to-back list messages, one per attribute. List messages support up to 10 items per section.

**Location list** (driven from a configurable list in admin):
```
Section: "Bangalore"
  • Whitefield
  • Sarjapur Road
  • Hebbal
  • Electronic City
  • Yelahanka
Section: "Other cities"
  • Hyderabad
  • Mumbai
  • Other (type below)
```

**Budget list**:
```
  • Under ₹50 Lakh
  • ₹50 L – 1 Cr
  • ₹1 – 2 Cr
  • ₹2 – 5 Cr
  • ₹5 Cr+
  • Need help deciding
```

**BHK reply buttons** (only 3 buttons, so use a list if we need more options):
```
[ 2 BHK ] [ 3 BHK ] [ 4 BHK+ ]
```

Each `list_reply` writes the chosen value onto the lead row. When all three are filled → **BHK_KNOWN**.

### Stage 3 → LISTINGS_SENT (deep link + carousel)

**KIWI sends**:
1. Query the listings DB for matches with the captured filters.
2. Send a **carousel of top 3** (image header + title + price + CTA buttons "Details" / "Book Visit").
3. Send a final CTA URL message:
   ```
   I found {{N}} more properties matching your filters.
   [ 🔗 View all on 27estates.com ]
   ```
   Link: `https://27estates.com/listings?city=BLR&budget=1cr&bhk=3&ref=wa-{{lead_id}}`

The website page reads `?ref=wa-...` and stitches the WhatsApp session ID into its own analytics so we can measure cross-channel funnel performance.

Transitions to **ENGAGED_AI**.

### Stage 4 → ENGAGED_AI (KIWI takes over)

**Trigger**: Any free-form text after listings are shown.

KIWI handles:
- "Does the Whitefield one have a park view?"
- "Is the Sarjapur project ready to move in?"
- "What's the maintenance cost?"

Implementation:
- KIWI receives the lead's known filters + the property list it just sent
- Retrieves the relevant property details from Supabase (RAG over `listings` table)
- Answers in natural language
- After every AI reply, append a footer:
  ```
  [ 📅 Book Site Visit ] [ 👤 Talk to Agent ]
  ```

Two button taps escalate to **SITE_VISIT_BOOKED** or **AGENT_HANDOFF**.

### Stage 5a → SITE_VISIT_BOOKED (WhatsApp Flow)

User taps "Book Site Visit" → KIWI sends a **WhatsApp Flow** message (multi-step form inside WhatsApp):

```
Screen 1: "Which property?"
  → dropdown (the properties they viewed)

Screen 2: "Preferred date"
  → date picker (next 14 days, excluding Sundays)

Screen 3: "Preferred time slot"
  → 10 AM-12 PM / 12-3 PM / 3-6 PM

Screen 4: "Anything else we should know?"
  → free-text (optional)

Submit
```

On submit, our Flow data endpoint receives the response, creates a `site_visits` row, assigns an agent (round-robin or by location), and KIWI confirms:

```
✅ Booked — {{property}} on {{date}} at {{time_slot}}.
Your agent {{agent_name}} ({{agent_phone}}) will meet you at the gate.

We'll send a reminder 24h before.

[ 📍 Get directions ]  [ ✏️ Reschedule ]  [ ❌ Cancel ]
```

### Stage 5b → AGENT_HANDOFF (human takes over)

User taps "Talk to Agent" or types "talk to human" / "agent" / "call me":
- Set `conversation.human_takeover = true`
- AI is muted from this point
- Round-robin assign to an online agent (or by location/specialty)
- Push notification to admin dashboard
- KIWI sends:
  ```
  Connecting you with {{agent_name}}. They'll reply here in a few minutes.

  Office hours: 9 AM – 8 PM IST · 7 days a week
  ```

Agent replies via the admin dashboard → backend posts as the brand to the same WhatsApp thread.

Agent can release back to AI when done (`human_takeover = false`).

### Stage 5c → LOST

Triggered automatically:
- No response in 7 days after `LISTINGS_SENT`
- User taps "Not interested" in a follow-up template
- User sends "STOP" / "unsubscribe" (also flips `marketing_opted_out=true`)

Marked lost in CRM but stays reachable via templates (unless opted out).

## 5. Cloud API building blocks

We'll add these helpers to [src/lib/whatsapp/meta-client.ts](src/lib/whatsapp/meta-client.ts) (only `sendText` + `markAsRead` exist today).

| Helper | Cloud API endpoint | Used in stage |
|---|---|---|
| `sendButtons(to, body, buttons[])` | `POST /{phone_id}/messages` with `interactive.type=button` | Stage 1, AI fallback footer |
| `sendList(to, body, sections[])` | same, `interactive.type=list` | Stage 2 (location, budget) |
| `sendCtaUrl(to, body, button_text, url)` | same, `interactive.type=cta_url` | Stage 3 (deep link) |
| `sendCarousel(to, cards[])` | same, `interactive.type=product_list` (catalog required) OR repeated image+button messages | Stage 3 top-3 |
| `sendFlow(to, flow_id, flow_token, screen)` | same, `interactive.type=flow` | Stage 5a (site visit) |
| `sendTemplate(to, name, lang, components[])` | `POST /{phone_id}/messages` with `type=template` | All outside-24h re-engagement |
| `markAsRead(message_id)` | same, with `status=read` | already implemented |

**Payload shapes** (so future Sujan and future Claude can both write these from memory):

```jsonc
// Reply buttons (max 3, button title ≤ 20 chars, id ≤ 256 chars)
{
  "messaging_product": "whatsapp",
  "to": "918618907491",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "What brings you here today?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "intent_buy",  "title": "🏠 Looking to Buy" }},
        { "type": "reply", "reply": { "id": "intent_rent", "title": "🔑 Looking to Rent" }},
        { "type": "reply", "reply": { "id": "intent_agent","title": "👤 Talk to Agent" }}
      ]
    }
  }
}

// List message (up to 10 rows per section, multiple sections allowed)
{
  "messaging_product": "whatsapp",
  "to": "918618907491",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": { "type": "text", "text": "Pick a location" },
    "body": { "text": "Where are you looking?" },
    "action": {
      "button": "View locations",
      "sections": [
        { "title": "Bangalore", "rows": [
          { "id": "loc_whitefield",  "title": "Whitefield" },
          { "id": "loc_sarjapur",    "title": "Sarjapur Road" }
        ]}
      ]
    }
  }
}

// CTA URL
{
  "messaging_product": "whatsapp",
  "to": "918618907491",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "body": { "text": "I found 27 properties matching your filters." },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "🔗 View all on 27estates.com",
        "url": "https://27estates.com/listings?city=BLR&budget=1cr&bhk=3&ref=wa-abc123"
      }
    }
  }
}
```

## 6. Ad-source attribution

The webhook already receives every inbound message. We just need to parse `referral` (for Meta CTWA) or the prefilled text (for `wa.me` deep links from other channels).

### 6a. Meta CTWA — native referral

Meta enriches the FIRST inbound message after an ad click with a `referral` block:

```jsonc
{
  "messages": [{
    "from": "918618907491",
    "id": "wamid....",
    "type": "text",
    "text": { "body": "Hi, interested in Whitefield 3BHK" },
    "referral": {
      "source_url": "https://fb.com/...",
      "source_id": "120207...adset id...",
      "source_type": "ad",
      "headline": "Premium 3BHK in Whitefield",
      "body": "Starting ₹1.2 Cr",
      "media_type": "image",
      "image_url": "...",
      "ctwa_clid": "AbCdEf..."
    }
  }]
}
```

Persist `referral` as JSONB on the lead. `source_id` is the ad/adset ID — join against Meta Ads Manager export for ROAS.

### 6b. `wa.me` deep links from other channels

Every non-Meta source uses `wa.me/<our_number>?text=<encoded>` with a parseable code:

| Source | Prefilled text template |
|---|---|
| MagicBricks | `Hi, interested in [MB-PROP{{listing_id}}]` |
| 99acres | `Hi, interested in [99-PROP{{listing_id}}]` |
| B2B Bricks | `Hi, interested in [B2B-PROP{{listing_id}}]` |
| Google Ads | `Hi, I saw your Google ad for [G-CAMP{{campaign_id}}-{{kw}}]` |
| Website button | `Hi, interested in [WEB-PROP{{slug}}]` |
| Brochure QR | `Hi, I scanned the QR at [QR-{{location_code}}]` |

Parse regex on first inbound text:

```ts
const SOURCE_RE = /\[(MB|99|B2B|G|WEB|QR)-([\w-]+)\]/
const m = body.match(SOURCE_RE)
if (m) lead.source = m[1], lead.source_ref = m[2]
```

### 6c. Attribution writes

On lead insert/upsert:

```sql
INSERT INTO crm_leads (
  wa_id, channel, source, source_ref, referral_json, interest_property_id, ...
) VALUES (...) ON CONFLICT (wa_id) DO UPDATE
  SET last_touched_at = NOW(),
      -- never overwrite first-touch attribution
      source = COALESCE(crm_leads.source, EXCLUDED.source);
```

This gives clean source-of-truth reporting:

```sql
SELECT source, COUNT(*) leads, SUM(CASE WHEN status='CONVERTED' THEN 1 ELSE 0 END) conversions
FROM crm_leads WHERE channel='whatsapp' GROUP BY source;
```

## 7. Lead state machine — full enumeration

| Stage | Set by | Allowed next |
|---|---|---|
| `NEW` | first inbound | `WELCOMED` |
| `WELCOMED` | sent welcome buttons | `INTENT_KNOWN`, `AGENT_HANDOFF`, `LOST` |
| `INTENT_KNOWN` | tapped Buy/Rent | `LOCATION_KNOWN`, `AGENT_HANDOFF` |
| `LOCATION_KNOWN` | list_reply location | `BUDGET_KNOWN` |
| `BUDGET_KNOWN` | list_reply budget | `BHK_KNOWN` |
| `BHK_KNOWN` | reply BHK | `LISTINGS_SENT` |
| `LISTINGS_SENT` | sent carousel + CTA | `ENGAGED_AI`, `SITE_VISIT_BOOKED`, `AGENT_HANDOFF`, `LOST` |
| `ENGAGED_AI` | any text after listings | `SITE_VISIT_BOOKED`, `AGENT_HANDOFF`, `LOST` |
| `SITE_VISIT_BOOKED` | flow submit | `SITE_VISIT_DONE`, `SITE_VISIT_NO_SHOW`, `CONVERTED`, `LOST` |
| `AGENT_HANDOFF` | manual / intent detect | `ENGAGED_AI` (released), `CONVERTED`, `LOST` |
| `CONVERTED` | agent marks deal closed | terminal |
| `LOST` | 7-day no-response or opt-out | terminal (re-engageable via template) |

Always-valid transitions (from any state): `AGENT_HANDOFF` (user asks for human), `LOST` (user opts out).

## 8. Template library (for Meta approval)

Templates take 3–7 days to approve. Submit these in [whatsapp/templates](src/app/api/whatsapp/templates/route.ts) once the funnel is built.

| Template name | Category | Variables | When sent |
|---|---|---|---|
| `welcome_new_lead_v1` | UTILITY | `{{1}}=name, {{2}}=property?` | Outside 24h, first-touch reactivation |
| `site_visit_reminder_24h` | UTILITY | `{{1}}=property, {{2}}=date_time, {{3}}=agent` | 24h before visit |
| `site_visit_reminder_2h` | UTILITY | `{{1}}=property, {{2}}=time, {{3}}=agent_phone` | 2h before visit |
| `site_visit_followup` | UTILITY | `{{1}}=property, {{2}}=agent` | 1h after visit, request feedback |
| `property_recommendation_v1` | MARKETING | `{{1}}=count, {{2}}=bhk, {{3}}=location` | Weekly: new matches for past qualified leads |
| `price_drop_alert` | MARKETING | `{{1}}=property, {{2}}=old_price, {{3}}=new_price` | When listing price drops |
| `followup_no_response_48h` | MARKETING | `{{1}}=name, {{2}}=property` | 48h after `LISTINGS_SENT` with no engagement |
| `agent_unavailable_callback` | UTILITY | `{{1}}=agent, {{2}}=ETA` | When user requests agent outside hours |

**UTILITY** templates (transactional) are free. **MARKETING** templates cost per conversation (per Meta's pricing).

## 9. Database additions

Audit existing schema before applying — some tables may already exist.

```sql
-- New
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid REFERENCES crm_leads(id) ON DELETE CASCADE,
  wa_id           text NOT NULL UNIQUE,                  -- E.164 without +
  stage           text NOT NULL DEFAULT 'NEW',
  intent          text,                                  -- 'buy' | 'rent' | 'agent'
  filter_city     text,
  filter_budget   text,
  filter_bhk      text,
  last_property_ids uuid[],                              -- last carousel shown
  human_takeover  bool NOT NULL DEFAULT false,
  assigned_agent  uuid REFERENCES profiles(id),
  marketing_opted_out bool NOT NULL DEFAULT false,
  conversation_window_expires_at timestamptz,            -- the 24h Meta rule
  last_user_msg_at timestamptz,
  last_bot_msg_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX whatsapp_conversations_stage_idx ON whatsapp_conversations(stage);
CREATE INDEX whatsapp_conversations_window_idx ON whatsapp_conversations(conversation_window_expires_at);

-- Existing (probable additions to crm_leads)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS channel               text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS source                text,            -- MB | 99 | B2B | META | GOOGLE | WEB | QR
  ADD COLUMN IF NOT EXISTS source_ref            text,            -- listing_id / ad_id / campaign_id
  ADD COLUMN IF NOT EXISTS referral_json         jsonb,
  ADD COLUMN IF NOT EXISTS wa_id                 text UNIQUE,
  ADD COLUMN IF NOT EXISTS interest_property_id  uuid REFERENCES listings(id);
```

## 10. Phase plan

| Phase | Deliverable | Effort | Deps | Outcome |
|---|---|---|---|---|
| **1. Welcome + stage machine** | Replace free-form welcome with 3-button welcome. Conversation table + stage transitions. | 1 day | — | Structured funnel skeleton in place |
| **2. Qualification (lists)** | Location → budget → BHK list messages. Lead filter columns persisted. | 1 day | 1 | Each lead has structured filters by stage end |
| **3. Filtered web deep link** | CTA URL → `27estates.com/listings?...&ref=wa-...`. Listings page reads filters. | 1 day | 2 | One-click jump from chat to web |
| **4. Ad-source attribution** | Parse `referral` + `wa.me` regex. Write `source` + `source_ref` to lead. Reporting query. | 0.5 day | 1 | Ready to spend ad budget with tracking |
| **5. Top-3 inline carousel** | Send top 3 matches as image-header messages with Details/Visit buttons. | 1 day | 2 | Lower friction than leaving WA |
| **6. AI fallback (Stage 4)** | Re-enable KIWI for any text in `LISTINGS_SENT` / `ENGAGED_AI`. RAG over property DB. | 0.5 day | 5 | Smart Q&A on top of structured funnel |
| **7. WhatsApp Flow for site visit** | Design Flow JSON, host data endpoint, wire submit → `site_visits` row. | 1.5 days | 5 | Multi-step booking inside chat |
| **8. Agent handoff + admin UI** | `human_takeover` flag, admin dashboard claim/reply panel, push notifications. | 1 day | 1 | Humans can take over any conversation |
| **9. Template library + Meta approval** | Submit 8 templates. Build broadcast/scheduled sender for follow-ups. | 2 days build + 3-7d Meta review | 1, 4 | Outside-24h re-engagement enabled |
| **10. Migrate off Test Number** | Add real Indian DID to WABA. Verify. Swap `WHATSAPP_PHONE_NUMBER_ID`. | 0.5 day (excl. number procurement) | All | Production-ready, can scale |

**Critical path to ads live**: 1 → 2 → 3 → 4 → 10. ~3.5 days of build + Meta verification time on the number.

**Critical path to full conversion**: All ten phases. ~9-10 build days + Meta review for templates.

## 11. Open decisions (need user input before Phase 1)

| # | Decision | Options | Default I'd pick |
|---|---|---|---|
| D1 | Languages | English only / EN+Hindi / EN+Hindi+Kannada | EN only for v1, add multi-lang in Phase 11 |
| D2 | Tone | Formal / Casual / Bilingual code-switch | Casual professional ("Hi 👋 I'm KIWI...") |
| D3 | Cities at launch | BLR only / BLR+HYD / BLR+HYD+MUM | BLR + HYD |
| D4 | Budget brackets | as listed in §4 / different | as listed |
| D5 | BHK options | 2/3/4+ / 1/2/3/4+ / 1/2/3/4/5+ | 2/3/4+ (drop 1BHK; rarely sold) |
| D6 | Office hours for agent handoff | 24/7 with night-AI / 9 AM-8 PM only | 9 AM-8 PM, AI auto-replies outside hours with "We'll respond at 9 AM" |
| D7 | Agent assignment | Round-robin / By city / By specialty | Round-robin within city, fallback to round-robin overall |
| D8 | Indian business number to migrate to | New procurement / existing office DID | Need to ask Sujan — likely procure new |
| D9 | KIWI's persona name & avatar | "KIWI" / "Ria" / "Rohan" / brand-name | Keep "KIWI" (already set up) |
| D10 | Listings-carousel size | Top 3 / Top 5 / Top 10 | Top 3 (WhatsApp caps interactive messages tight) |

## 12. Critical gotchas

1. **24-hour conversation window** — after the user's last message, Meta resets a 24h timer. After that, only **approved templates** can be sent (free-form is blocked). The webhook must update `conversation_window_expires_at` on every inbound user message; the scheduled-message worker must check this before sending free-form.

2. **Test Number limit** — `+1 555-635-6525` can only message phones added to the Test recipients list in Meta. **Cannot connect ads until we migrate to a real verified number.** Verification requires a number you control, OTP delivery, and ~10-15 min in Business Settings.

3. **Pre-filled `wa.me` text is user-editable** — they CAN delete the `[MB-PROP123]` tag before sending. Mitigation: ALSO log Meta CTWA `referral` natively, and treat `wa.me` codes as best-effort attribution.

4. **Idempotency** — Meta retries webhooks on 5xx. Always upsert by `wamid` to avoid duplicate AI replies.

5. **Marketing template cost** — every MARKETING template sent costs ~₹0.80–1.20 (India rate, may have changed). UTILITY templates are mostly free. Use UTILITY for service messages, MARKETING only for true promos.

6. **WhatsApp Flow endpoint signing** — Flow data exchange requires public-key signed payloads. Adds ~half a day to Phase 7.

7. **`vercel redeploy` doesn't pick up env changes from the same deployment** — must redeploy with `vercel redeploy <url> --target production` which forces a rebuild. ([Token rotation runbook in reference_whatsapp_prod.md])

8. **Don't reply to status updates** — webhook gets both `messages` (real user msgs) and `statuses` (delivery receipts). Stage handlers must only fire on `messages`.

9. **Opt-out compliance** — user types "STOP" / "unsubscribe" → set `marketing_opted_out=true` → exclude from all marketing templates forever. UTILITY templates still allowed.

10. **Stage skipping** — if user types free text in Stage 1 instead of tapping a button (e.g., "I want a 3BHK in Whitefield under 1.5Cr"), let KIWI extract intent and skip ahead to `BHK_KNOWN` instead of forcing the buttons. Hybrid > strict.

## 13. Appendix — file changes summary

```
src/lib/whatsapp/
  meta-client.ts            ← add sendButtons, sendList, sendCtaUrl, sendCarousel, sendFlow, sendTemplate
  funnel-handlers.ts        ← NEW: one handler per stage, dispatched from webhook
  attribution.ts            ← NEW: parseReferral + parseWaMeText
  ai-agent.ts               ← extend: accept lead-context object (filters, last_properties)
  templates.ts              ← NEW: template name → component-builder fns
  flow-handlers.ts          ← NEW (Phase 7): receive Flow submission, create site visit

src/app/api/whatsapp/
  webhook/route.ts          ← route inbound to funnel-handlers by stage
  flow/route.ts             ← NEW (Phase 7): Flow data exchange endpoint
  templates/route.ts        ← extend: submit templates programmatically (already exists)

src/app/listings/page.tsx   ← read ?ref=wa-... + structured filters
src/components/admin/crm/   ← agent claim UI for human handoff (Phase 8)

supabase/migrations/
  YYYYMMDD_whatsapp_funnel.sql    ← new tables/columns from §9
```

---

**Review checklist for Sujan:**

- [ ] §4 stage flow — does the conversation feel right for a real estate buyer?
- [ ] §6 attribution codes — are these the actual sources (MB/99/B2B/META/GOOGLE)?
- [ ] §8 template list — anything missing (loan EMI calc? broker discount?)
- [ ] §10 phase order — okay to do 1→2→3→4→10 first to get ads live, then 5-9?
- [ ] §11 open decisions D1-D10 — agree with defaults? any to change?
- [ ] §12 gotcha #2 — when will we have the real Indian number?

When ready: tell me which phase to start, and I'll move on it.
