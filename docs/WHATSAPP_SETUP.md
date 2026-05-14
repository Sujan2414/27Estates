# WhatsApp AI Agent — Setup Guide

A self-hosted lead-qualifier agent that runs on the **27 Estates** Meta WhatsApp number.

- **No third-party BSP** (no Interakt / AiSensy / WATI markup)
- **Direct Meta Cloud API** → pay Meta wholesale per-conversation
- **Azure OpenAI** (`gpt-5.2-chat`) — reuses the same deployment as `/api/chat`
- **Integrates with existing CRM** — every qualified chat creates / updates a row in `leads`

## What this gives you

| Capability | Behavior |
| --- | --- |
| Incoming WhatsApp message | Webhook receives, persists to DB, marks as read |
| Auto-reply | "Riya" (AI agent) asks qualifying questions, 1 at a time |
| Lead capture | When AI gathers name + city + budget etc → row in `leads` (source = `whatsapp`) |
| Handoff | AI escalates to human → `ai_enabled = false`, CRM notification fires |
| Human takeover | Set `ai_enabled = false` on the conversation → AI stops, your team replies |
| Kill switch | Set `WHATSAPP_AI_DISABLED=true` in env → bot stops replying everywhere |

---

## 1. Database

Run the migration in Supabase:

```sql
-- File: supabase/migrations/20260514_whatsapp_business.sql
-- Either run via Supabase Dashboard SQL Editor OR via Supabase CLI:
supabase db push
```

This creates:
- `whatsapp_conversations` (one row per WA number)
- `whatsapp_messages` (one row per message)
- `get_or_create_whatsapp_conversation()` RPC helper

## 2. Environment variables

Already added to `.env.local`. For production, paste the same values into **Vercel → Project → Settings → Environment Variables**:

| Variable | Where it comes from |
| --- | --- |
| `META_APP_ID` | App dashboard → App settings → Basic |
| `META_APP_SECRET` | Same page → click "Show" |
| `WHATSAPP_PHONE_NUMBER_ID` | App → WhatsApp → API Setup → "From" dropdown |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Same page → top |
| `WHATSAPP_ACCESS_TOKEN` | **Temporary token (24h)** until you generate a permanent one (see §5) |
| `WHATSAPP_VERIFY_TOKEN` | Any random string you invent — paste same value into Meta webhook config |
| `WHATSAPP_GRAPH_API_VERSION` | Defaults to `v21.0` |
| `WHATSAPP_AI_DISABLED` | `false` (or `true` to disable AI replies globally) |

## 3. Deploy

Webhook URL must be public HTTPS — Meta won't accept localhost or http.

### Option A — Local dev with ngrok (recommended for testing)

```powershell
# Terminal 1
npm run dev

# Terminal 2 — install ngrok if you don't have it: https://ngrok.com/download
ngrok http 3000
```

Copy the `https://xxxxx.ngrok-free.app` URL. Your webhook URL is:

```
https://xxxxx.ngrok-free.app/api/whatsapp/webhook
```

### Option B — Vercel (production)

Push your branch → Vercel auto-deploys. Your webhook URL is:

```
https://<your-vercel-domain>/api/whatsapp/webhook
```

## 4. Configure the webhook in Meta

1. Go to https://developers.facebook.com/apps → **Your App** → **WhatsApp** → **Configuration**
2. Scroll to **Webhook** → click **Edit**
3. **Callback URL**: paste your URL from §3
4. **Verify token**: paste the exact value of `WHATSAPP_VERIFY_TOKEN` from your env
5. Click **Verify and save** — Meta will hit your `GET` handler. Should succeed instantly.
6. Click **Manage** next to "Webhook fields" → **Subscribe** to:
   - ✅ `messages` (required — incoming user messages)
   - ✅ `message_template_status_update` (optional — template approval changes)

## 5. Generate a permanent access token

The token currently in `.env.local` (starts with `EAAOWe4Aiq…`) expires in **24 hours**. Replace it before going live:

1. https://business.facebook.com → **Business Settings**
2. **Users → System Users → Add** → name it `27Estates WhatsApp Bot` → Role: **Admin** → Create
3. Click the new system user → **Add Assets** → select your WhatsApp Business Account → toggle **Full control**
4. Click **Generate New Token** → select your app → check `whatsapp_business_messaging` + `whatsapp_business_management` → choose **Never expires** → **Generate**
5. **Copy the token once** (Meta won't show it again)
6. Replace `WHATSAPP_ACCESS_TOKEN` in `.env.local` AND in Vercel env vars

## 6. Test the flow end-to-end

1. In Meta App → WhatsApp → API Setup, add your own number to the **"To"** recipient list (verify with OTP).
2. From the page, send the default `hello_world` template to your number — confirm you receive it. This verifies the outbound path.
3. From WhatsApp on your phone, reply something to the bot's number, e.g. `"hi"`.
4. Within 2–4 seconds you should get a reply from "Riya".
5. Continue the chat — give a city, budget, BHK. After 3–5 exchanges, check Supabase:

```sql
select * from leads where source = 'whatsapp' order by created_at desc limit 5;
select * from whatsapp_messages order by created_at desc limit 20;
```

You should see a fresh lead with your details and a full message log.

## 7. Going live with real customers

Before pointing your real WhatsApp number at production:

- [ ] Permanent System User token in env (§5)
- [ ] Test number swapped for your business number on the API Setup page
- [ ] Start **Business Verification** at Business Settings → Security Center → Start Verification. Upload: GST cert, PAN, address proof. Takes 1–7 days.
- [ ] Submit **message templates** (any first-contact outreach to a user outside their 24h window needs a pre-approved template). Templates are created at App → WhatsApp → Configuration → Message Templates.
- [ ] Decide your **opt-in flow** — Meta requires that you only message users who consented (web form checkbox, "Send me updates" button, etc.). Document it.

## 8. Operational controls

| Action | Where |
| --- | --- |
| Pause AI for one chat | `update whatsapp_conversations set ai_enabled = false where wa_phone = '...'` |
| Kill switch (pause all AI) | Set `WHATSAPP_AI_DISABLED=true` in Vercel env → redeploy (or hot-reload) |
| Re-enable AI on a chat | `update whatsapp_conversations set ai_enabled = true, status = 'active' where wa_phone = '...'` |
| Read all incoming messages | `select * from whatsapp_messages where direction = 'inbound' order by created_at desc` |
| See linked CRM lead for a chat | join `whatsapp_conversations.lead_id` → `leads.id` |

## 9. Cost (current Meta India per-message rates)

| Conversation type | Per message |
| --- | --- |
| Service (user-initiated, within 24h) | **Free** |
| Marketing (you initiate with a template) | ~₹0.78 |
| Utility | ~₹0.115 |
| Authentication | ~₹0.108 |

A typical lead-qualifying chat = 1 marketing template + ~7 free service replies = **~₹0.78 per conversation**. Add ~₹0.30 for the AI inference (gpt-5.2-chat) → **~₹1.10 all-in per qualified lead**.

## 10. Architecture quick reference

```
WhatsApp user
    │
    ▼
Meta Cloud API ───► POST /api/whatsapp/webhook
                            │
                            ├─► verifyWebhookSignature() — HMAC SHA-256
                            ├─► get_or_create_whatsapp_conversation()
                            ├─► insert whatsapp_messages (inbound)
                            ├─► markAsRead()
                            ├─► generateReply()  ◄── Azure OpenAI + tools
                            │        │
                            │        ├─► update_lead_profile → createLead() / leads.update()
                            │        └─► escalate_to_human   → ai_enabled = false + notification
                            │
                            └─► sendText() → Meta → user
```

## 11. Admin UI at /crm/whatsapp

Visible to **admin / super_admin** roles. Three views:

| View | URL | What you can do |
| --- | --- | --- |
| Inbox | `/crm/whatsapp` | Browse conversations, filter by status / AI on-off, read full message threads, **take over from AI** (toggle), send manual replies. Polls every 5s on the active thread, 15s on the list. |
| Broadcast | `/crm/whatsapp/broadcast` | Send an approved template to up to 1000 recipients. Supports template variables (`{{1}}`, `{{2}}`…). Test mode sends to first recipient only. |
| Lead deep-link | "View Lead" button in thread header | Jumps to the linked `/crm/leads/[id]` page for full CRM context. |

**Behavior to know:**
- Sending a manual reply from the thread **auto-pauses AI** for that conversation (sets `ai_enabled=false`, `status=handoff`). Toggle AI back on from the thread header to resume.
- Broadcasts persist every send as an outbound row in `whatsapp_messages` so you have a unified audit trail.
- Templates list is fetched live from Meta — only `APPROVED` templates show up.

## 12. Templates (approval flow)

To start a chat outside the 24-hour service window, you MUST use a pre-approved template. Create them in Meta App → WhatsApp → Configuration → Message Templates. Approval is usually 5 min – few hours.

Body templates can contain numbered variables:

```
Hi {{1}}, the {{2}} you enquired about in {{3}} is now available for a site visit. Reply YES to book a slot.
```

In the broadcast UI, each recipient row provides the variable values after the phone:

```
918618907491, Sujan, 3BHK apartment, Hyderabad
918765432109, Priya, 2BHK apartment, Bangalore
```

## 13. Files in this feature

| Path | Purpose |
| --- | --- |
| `supabase/migrations/20260514_whatsapp_business.sql` | Tables + RLS + RPC |
| `src/lib/whatsapp/meta-client.ts` | Outbound Meta API wrapper |
| `src/lib/whatsapp/ai-agent.ts` | OpenAI conversation + tool calls |
| `src/app/api/whatsapp/webhook/route.ts` | Inbound webhook (GET verify + POST handler) |
| `src/app/api/whatsapp/conversations/route.ts` | List conversations |
| `src/app/api/whatsapp/conversations/[id]/route.ts` | Conversation detail + PATCH (AI toggle, status) |
| `src/app/api/whatsapp/conversations/[id]/messages/route.ts` | Send manual reply |
| `src/app/api/whatsapp/templates/route.ts` | List approved templates from Meta |
| `src/app/api/whatsapp/broadcast/route.ts` | Send template to a list with throttling |
| `src/app/crm/whatsapp/page.tsx` | Admin inbox UI (split list + thread) |
| `src/app/crm/whatsapp/broadcast/page.tsx` | Broadcast composer |
| `src/app/crm/layout.tsx` | (modified) Adds "WhatsApp" link to Automation nav |
| `.env.local` | Credentials (gitignored) |
| `docs/WHATSAPP_SETUP.md` | This file |

## Troubleshooting

| Problem | Likely cause |
| --- | --- |
| Meta verification fails (step 4) | `WHATSAPP_VERIFY_TOKEN` env value doesn't match what you typed in Meta UI, or deploy hasn't picked up the env var yet. |
| `Invalid signature` 401 in logs | `META_APP_SECRET` env doesn't match the app's actual secret. Re-copy from App settings → Basic. |
| `(#190) Access token has expired` | The 24h token expired — generate a permanent System User token (§5). |
| `(#131030) Recipient phone number not in allowed list` | You're still on a test number — add the recipient under "To" in API Setup. |
| AI never replies, no errors in log | Check `WHATSAPP_AI_DISABLED` env, and `whatsapp_conversations.ai_enabled` for that row. |
| Same message processed twice | Should not happen — webhook dedupes by `wa_message_id`. Check the unique index. |
