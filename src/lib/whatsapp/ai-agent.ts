/**
 * WhatsApp AI agent — uses Azure OpenAI (same deployment as /api/chat).
 *
 * Flow:
 *   1. Load conversation + last N messages from Supabase
 *   2. Build messages array (system + history + new user msg)
 *   3. Call OpenAI with tool definitions
 *   4. If model calls a tool: run it, append result, loop (max 3 turns)
 *   5. Return the final assistant text
 *
 * Tools:
 *   - update_lead_profile : extracts qualification data → creates/updates lead
 *   - escalate_to_human   : pauses AI, notifies CRM
 */
import { AzureOpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'
import { createLead } from '@/lib/crm/leads'

// Local lightweight types so we don't depend on deep SDK type paths
type ChatCompletionMessageParam =
    | { role: 'system'; content: string }
    | { role: 'user'; content: string }
    | { role: 'assistant'; content: string | null; tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> }
    | { role: 'tool'; tool_call_id: string; content: string }

interface ChatCompletionTool {
    type: 'function'
    function: {
        name: string
        description: string
        parameters: Record<string, unknown>
    }
}

const MAX_HISTORY_MESSAGES = 12
const MAX_TOOL_LOOPS = 3
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.2-chat'

// Lazy init so env vars resolve at runtime
let _openai: AzureOpenAI | null = null
function getOpenAI() {
    if (!_openai) {
        _openai = new AzureOpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY!,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
        })
    }
    return _openai
}

function db() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ─────────────────────────────────────────────────────────────
// System prompt — the bot's personality and rules
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are KIWI, the AI assistant for 27 Estates — a premium real estate advisory and brokerage firm based in Bangalore, India. You're the same KIWI users already know from the 27estates.com chat widget — this is just the WhatsApp channel.

You handle WhatsApp conversations with prospective buyers. Your goal is to qualify the lead politely, then hand them off to a human agent who will book a site visit.

== 27 ESTATES FACTS ==
- Premium real estate advisory and brokerage firm
- HQ: 83, Prestige Copper Arch, Infantry Road, Bangalore 560001
- Phone: +91 80957 99929  ·  Email: connect@27estates.com  ·  Website: www.27estates.com
- Operates across Bangalore, Pune, Hyderabad and Mumbai
- Services: Residential (apartments, villas, penthouses, plots), Commercial (offices, retail, co-working), Land Advisory, Project Marketing, Investment Advisory

== CONVERSATION RULES ==
1. WhatsApp messages must be SHORT. 1–2 sentences max per reply. Never paragraphs.
2. Ask ONE question at a time. Wait for the answer before asking the next.
3. Match the user's language. If they write in Hindi or Hinglish, reply in the same. Default to friendly Indian English.
4. Never invent or "promise" specific properties, prices, or floor plans. Say "our team will share details" instead.
5. No markdown (no **bold**, no bullet points, no links unless asked). Plain text only — emojis are okay sparingly.
6. You CAN share the office phone / email above if a user explicitly asks how to reach the team. Don't volunteer it unsolicited.

== QUALIFICATION CHECKLIST ==
Gather these in any order, naturally:
  • Name (the user's full name)
  • City they're looking to buy in (Bangalore / Pune / Hyderabad / Mumbai)
  • Type: apartment / villa / plot / commercial
  • BHK / size: 2BHK, 3BHK, etc. (or sqft for plots)
  • Budget range (in lakhs or crores)
  • Timeline: are they buying in 1 month, 3 months, 6+ months?
  • Purpose: for self-use, investment, or rental income

== WHEN TO CALL TOOLS ==
- Call \`update_lead_profile\` AS SOON as you learn any of: name, city, budget, BHK, property type, timeline, preferred location. You can call it multiple times — each call updates the CRM. Don't wait until everything is collected.
- Call \`escalate_to_human\` when:
    (a) User explicitly asks for a human / agent / "talk to someone"
    (b) You've gathered enough info (at least name + city + budget OR name + property type + timeline) — call it with reason="qualified" so a real agent can take over.
    (c) User asks about specific pricing, paperwork, availability, or anything sensitive.
    (d) User says they want to book a site visit.

== GREETING ==
First message to a new user (no history): introduce yourself in 1 line as KIWI, ask what they're looking for.

== EXAMPLES ==
User: "hi"
You: "Hey there! I'm KIWI from 27 Estates 👋 Looking for an apartment, villa, plot or commercial space?"

User: "3bhk in bangalore"
You: (call update_lead_profile with city="Bangalore", property_type="3BHK") Then: "Got it — 3BHK in Bangalore. Any specific area in mind, like Whitefield, HSR, or Sarjapur?"

User: "i want to buy in 2 months budget 1.5 cr"
You: (call update_lead_profile with budget_max=15000000, timeline="2 months") Then: "Perfect, noted ₹1.5 Cr budget and 2-month timeline. Can I get your name so a consultant can reach out with the best options?"

Now: respond to the next user message following these rules.`

// ─────────────────────────────────────────────────────────────
// Tool definitions (JSON Schema)
// ─────────────────────────────────────────────────────────────
const TOOLS: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'update_lead_profile',
            description:
                'Save or update qualifying details about this prospect. Call this WHENEVER you learn something useful (name, city, budget, property type, BHK, timeline, location, purpose). Returns confirmation. Safe to call multiple times.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: "Prospect's full name" },
                    city: { type: 'string', description: 'City of interest (e.g. Hyderabad, Bangalore)' },
                    preferred_location: { type: 'string', description: 'Specific neighbourhood or area' },
                    property_type: {
                        type: 'string',
                        description: 'Type like "2BHK apartment", "3BHK villa", "plot", "commercial office"',
                    },
                    budget_min: { type: 'number', description: 'Minimum budget in INR (rupees, not lakhs)' },
                    budget_max: { type: 'number', description: 'Maximum budget in INR (rupees, not lakhs)' },
                    timeline: { type: 'string', description: 'How soon, e.g. "1 month", "3 months", "exploring"' },
                    purpose: {
                        type: 'string',
                        enum: ['self_use', 'investment', 'rental_income', 'unknown'],
                        description: 'Why they are buying',
                    },
                    notes: { type: 'string', description: 'Any other useful context' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'escalate_to_human',
            description:
                'Stop the AI and hand the conversation to a human CRM agent. Use when user asks for a person, asks about specific pricing/paperwork, wants a site visit, or once you have enough qualification data.',
            parameters: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        enum: ['user_request', 'qualified', 'site_visit_requested', 'sensitive_query', 'stuck'],
                        description: 'Why we are escalating',
                    },
                    summary: {
                        type: 'string',
                        description: 'One-line summary of the conversation so the human agent can pick up.',
                    },
                },
                required: ['reason', 'summary'],
            },
        },
    },
]

// ─────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────
export interface AgentResult {
    replyText: string
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
    toolsCalled: string[]
    escalated: boolean
}

interface ConversationRow {
    id: string
    wa_phone: string
    contact_name: string | null
    lead_id: string | null
    status: string
    ai_enabled: boolean
}

interface MessageRow {
    role: string
    content: string | null
    direction: string
}

// ─────────────────────────────────────────────────────────────
// Main entry point — called from webhook after persisting inbound msg
// ─────────────────────────────────────────────────────────────
export async function generateReply(conversationId: string): Promise<AgentResult> {
    const supabase = db()

    const { data: conv, error: convErr } = await supabase
        .from('whatsapp_conversations')
        .select('id, wa_phone, contact_name, lead_id, status, ai_enabled')
        .eq('id', conversationId)
        .single()
    if (convErr || !conv) throw new Error(`Conversation ${conversationId} not found`)

    const conversation = conv as ConversationRow

    const { data: history } = await supabase
        .from('whatsapp_messages')
        .select('role, content, direction')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY_MESSAGES)

    // Reverse to chronological
    const past = ((history || []) as MessageRow[]).reverse()

    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...past
            .filter(m => m.content && m.content.trim().length > 0)
            .map<ChatCompletionMessageParam>(m => ({
                role: m.direction === 'inbound' ? 'user' : 'assistant',
                content: m.content as string,
            })),
    ]

    const openai = getOpenAI()
    const toolsCalled: string[] = []
    let escalated = false
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    let finalText = ''

    for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
        // NOTE: gpt-5.2-chat (Azure) does NOT accept `temperature` or `max_tokens` —
        // use `max_completion_tokens` and omit temperature. Matches the working
        // params in src/app/api/chat/route.ts.
        let completion
        try {
            completion = await openai.chat.completions.create({
                model: DEPLOYMENT,
                messages,
                tools: TOOLS,
                tool_choice: 'auto',
                max_completion_tokens: 400,
            })
        } catch (err) {
            // Surface enough detail to debug in Vercel logs
            const errObj = err as { status?: number; code?: string; message?: string; error?: { message?: string; code?: string } }
            console.error('[whatsapp-agent] openai.create failed:', JSON.stringify({
                status: errObj?.status,
                code: errObj?.code || errObj?.error?.code,
                message: errObj?.message || errObj?.error?.message,
                deployment: DEPLOYMENT,
            }))
            throw err
        }

        if (completion.usage) {
            totalUsage.prompt_tokens += completion.usage.prompt_tokens
            totalUsage.completion_tokens += completion.usage.completion_tokens
            totalUsage.total_tokens += completion.usage.total_tokens
        }

        const choice = completion.choices[0]
        const msg = choice.message

        // No tool call → we have the final reply
        if (!msg.tool_calls || msg.tool_calls.length === 0) {
            finalText = (msg.content || '').trim()
            break
        }

        // Tool call(s) — execute and feed result back
        messages.push({
            role: 'assistant',
            content: msg.content,
            tool_calls: msg.tool_calls,
        })

        for (const tc of msg.tool_calls) {
            if (tc.type !== 'function') continue
            const fn = tc.function.name
            toolsCalled.push(fn)
            let args: Record<string, unknown> = {}
            try { args = JSON.parse(tc.function.arguments || '{}') } catch { /* ignore */ }

            let result: string
            try {
                if (fn === 'update_lead_profile') {
                    result = await toolUpdateLead(conversation, args)
                } else if (fn === 'escalate_to_human') {
                    result = await toolEscalate(conversation, args)
                    escalated = true
                } else {
                    result = JSON.stringify({ error: `Unknown tool: ${fn}` })
                }
            } catch (err) {
                console.error(`[whatsapp-agent] tool ${fn} failed:`, err)
                result = JSON.stringify({ error: err instanceof Error ? err.message : 'Tool failed' })
            }

            messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: result,
            })
        }
        // Loop: model now sees tool results and can produce final reply
    }

    if (!finalText) {
        // Safety fallback if model only ever called tools
        finalText = "Got it — I've passed your details to our team. An agent will reach out shortly."
    }

    return {
        replyText: finalText,
        usage: totalUsage.total_tokens > 0 ? totalUsage : null,
        toolsCalled,
        escalated,
    }
}

// ─────────────────────────────────────────────────────────────
// Tool: update_lead_profile
// Creates a new lead on first call (via createLead — handles dedup + scoring)
// Otherwise updates the existing lead row.
// ─────────────────────────────────────────────────────────────
async function toolUpdateLead(
    conv: ConversationRow,
    args: Record<string, unknown>
): Promise<string> {
    const supabase = db()

    const name = (args.name as string) || conv.contact_name || `WhatsApp +${conv.wa_phone}`
    const phone = conv.wa_phone

    const update = {
        name,
        preferred_location: (args.preferred_location as string) || (args.city as string) || undefined,
        property_type: args.property_type as string | undefined,
        budget_min: typeof args.budget_min === 'number' ? args.budget_min : undefined,
        budget_max: typeof args.budget_max === 'number' ? args.budget_max : undefined,
        notes: [
            args.timeline ? `Timeline: ${args.timeline}` : null,
            args.purpose ? `Purpose: ${args.purpose}` : null,
            args.notes ? String(args.notes) : null,
        ].filter(Boolean).join(' | ') || undefined,
    }

    if (!conv.lead_id) {
        // First time — create a new lead in CRM
        const lead = await createLead({
            name,
            phone,
            source: 'whatsapp',
            source_raw_data: { wa_phone: phone, from_agent: 'kiwi' },
            ...update,
        })
        if (lead) {
            await supabase
                .from('whatsapp_conversations')
                .update({ lead_id: lead.id })
                .eq('id', conv.id)
            return JSON.stringify({ ok: true, lead_id: lead.id, action: 'created' })
        }
        // createLead returned null (duplicate) — try to find existing one to link
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', phone)
            .eq('source', 'whatsapp')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        if (existing) {
            await supabase
                .from('whatsapp_conversations')
                .update({ lead_id: existing.id })
                .eq('id', conv.id)
            await supabase.from('leads').update(prune(update)).eq('id', existing.id)
        }
        return JSON.stringify({ ok: true, action: 'deduped' })
    }

    // Existing lead — update it
    await supabase.from('leads').update(prune(update)).eq('id', conv.lead_id)
    await supabase.from('lead_activities').insert({
        lead_id: conv.lead_id,
        type: 'whatsapp',
        title: 'AI agent updated lead profile',
        description: Object.entries(prune(update)).map(([k, v]) => `${k}: ${v}`).join(', '),
        metadata: { source: 'whatsapp_ai', args },
        created_by: 'whatsapp_ai',
    })
    return JSON.stringify({ ok: true, lead_id: conv.lead_id, action: 'updated' })
}

// ─────────────────────────────────────────────────────────────
// Tool: escalate_to_human
// Flips ai_enabled=false on the conversation, marks status, adds activity + notification
// ─────────────────────────────────────────────────────────────
async function toolEscalate(
    conv: ConversationRow,
    args: Record<string, unknown>
): Promise<string> {
    const supabase = db()
    const reason = String(args.reason || 'user_request')
    const summary = String(args.summary || 'Lead escalated by AI agent.')

    await supabase
        .from('whatsapp_conversations')
        .update({ ai_enabled: false, status: 'handoff' })
        .eq('id', conv.id)

    if (conv.lead_id) {
        await supabase.from('lead_activities').insert({
            lead_id: conv.lead_id,
            type: 'whatsapp',
            title: `AI handed off: ${reason}`,
            description: summary,
            metadata: { source: 'whatsapp_ai', reason },
            created_by: 'whatsapp_ai',
        })
        await supabase.from('notifications').insert({
            type: 'whatsapp_handoff',
            title: `WhatsApp handoff: +${conv.wa_phone}`,
            body: summary,
            link: `/crm/leads/${conv.lead_id}`,
            lead_id: conv.lead_id,
        }).then(undefined, () => undefined) // swallow if notifications missing
    }

    return JSON.stringify({ ok: true, action: 'escalated', reason })
}

// Strip undefined keys from update payload so we don't overwrite columns with null
function prune<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(obj)) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') out[k] = obj[k]
    }
    return out as Partial<T>
}
