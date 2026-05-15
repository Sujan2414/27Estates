/**
 * WhatsApp Cloud API webhook
 *   GET  → Meta verification challenge
 *   POST → Incoming messages / status updates from Meta
 *
 * Setup in Meta App → WhatsApp → Configuration → Webhook:
 *   Callback URL : https://<your-domain>/api/whatsapp/webhook
 *   Verify token : (value of WHATSAPP_VERIFY_TOKEN env var)
 *   Subscribe to : "messages" (required)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    sendText,
    markAsRead,
    verifyWebhookSignature,
} from '@/lib/whatsapp/meta-client'
import { generateReply } from '@/lib/whatsapp/ai-agent'

export const runtime = 'nodejs'           // need Node crypto for HMAC
export const dynamic = 'force-dynamic'

function db() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ════════════════════════════════════════════════════════════
// GET — verification handshake (Meta calls this once when you save the webhook URL)
// ════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const expected = process.env.WHATSAPP_VERIFY_TOKEN
    if (mode === 'subscribe' && token === expected && challenge) {
        // Meta wants the challenge echoed back as plaintext, 200
        return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain' } })
    }
    return new Response('Forbidden', { status: 403 })
}

// ════════════════════════════════════════════════════════════
// POST — receive messages + status updates
// ════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
    // Read raw body once for HMAC verification, then parse
    const raw = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!verifyWebhookSignature(raw, signature)) {
        console.warn('[whatsapp] invalid signature — rejecting')
        return new Response('Invalid signature', { status: 401 })
    }

    let payload: WebhookPayload
    try {
        payload = JSON.parse(raw)
    } catch {
        return new Response('Invalid JSON', { status: 400 })
    }

    // Acknowledge fast (Meta retries if we take > 20s).
    // We still process synchronously — typical OpenAI call returns in 1–3s
    // and Vercel doesn't reliably run promises after the response is sent.
    try {
        await handlePayload(payload)
    } catch (err) {
        console.error('[whatsapp] handler error:', err)
        // Return 200 anyway — Meta retries on non-2xx, and we don't want a poison message
        // to lock the queue. Failures are logged for inspection.
    }

    return NextResponse.json({ received: true })
}

// ════════════════════════════════════════════════════════════
// Payload types (only fields we use)
// ════════════════════════════════════════════════════════════
interface WebhookPayload {
    object?: string
    entry?: Array<{
        id?: string
        changes?: Array<{
            field?: string
            value?: {
                messaging_product?: string
                metadata?: { phone_number_id?: string; display_phone_number?: string }
                contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>
                messages?: Array<InboundMessage>
                statuses?: Array<StatusUpdate>
            }
        }>
    }>
}

interface InboundMessage {
    from: string                // sender's wa_id (E.164 without +)
    id: string                  // wamid
    timestamp?: string
    type: string                // 'text' | 'image' | 'interactive' | 'audio' | ...
    text?: { body: string }
    interactive?: {
        type: 'button_reply' | 'list_reply'
        button_reply?: { id: string; title: string }
        list_reply?: { id: string; title: string; description?: string }
    }
    image?: { id: string; caption?: string; mime_type?: string }
    audio?: { id: string; mime_type?: string }
    document?: { id: string; filename?: string; caption?: string }
    location?: { latitude: number; longitude: number; name?: string; address?: string }
}

interface StatusUpdate {
    id: string                  // wamid
    status: 'sent' | 'delivered' | 'read' | 'failed'
    timestamp?: string
    recipient_id?: string
    errors?: Array<{ code: number; message: string; title?: string }>
}

// ════════════════════════════════════════════════════════════
// Main dispatcher
// ════════════════════════════════════════════════════════════
async function handlePayload(payload: WebhookPayload) {
    if (!payload.entry?.length) return

    for (const entry of payload.entry) {
        for (const change of entry.changes || []) {
            if (change.field !== 'messages') continue
            const value = change.value
            if (!value) continue

            const contactName = value.contacts?.[0]?.profile?.name || undefined

            // Process new inbound messages
            for (const msg of value.messages || []) {
                await handleInboundMessage(msg, contactName)
            }

            // Process delivery status updates (sent / delivered / read / failed)
            for (const status of value.statuses || []) {
                await handleStatusUpdate(status)
            }
        }
    }
}

// ════════════════════════════════════════════════════════════
// Handle a single inbound message
// ════════════════════════════════════════════════════════════
async function handleInboundMessage(msg: InboundMessage, contactName?: string) {
    const supabase = db()

    // Dedupe — if we've already stored this wamid, ignore (Meta retries on non-2xx)
    const { data: existing } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('wa_message_id', msg.id)
        .maybeSingle()
    if (existing) return

    // Get/create conversation row
    const { data: convId, error: convErr } = await supabase.rpc(
        'get_or_create_whatsapp_conversation',
        { p_phone: msg.from, p_name: contactName || null }
    )
    if (convErr || !convId) {
        console.error('[whatsapp] failed to get/create conversation:', convErr)
        return
    }
    const conversationId = convId as string

    // Extract text content from various message types
    const { contentText, mediaUrl, displayType } = extractContent(msg)

    // Persist inbound message
    await supabase.from('whatsapp_messages').insert({
        conversation_id: conversationId,
        wa_message_id: msg.id,
        direction: 'inbound',
        role: 'user',
        type: displayType,
        content: contentText,
        media_url: mediaUrl,
        meta_payload: msg,
    })

    await supabase
        .from('whatsapp_conversations')
        .update({
            last_inbound_at: new Date().toISOString(),
            unread_count: 0, // user replied — clear our pending count
        })
        .eq('id', conversationId)

    // Mark as read in Meta (blue ticks)
    markAsRead(msg.id).catch(() => undefined)

    // Decide whether to invoke the AI
    if (process.env.WHATSAPP_AI_DISABLED === 'true') return

    const { data: conv } = await supabase
        .from('whatsapp_conversations')
        .select('ai_enabled, status')
        .eq('id', conversationId)
        .single()

    if (!conv?.ai_enabled) return // human owns this chat
    if (!contentText) {
        // Non-text message (image/audio/etc) — acknowledge briefly without calling AI
        await sendAndStore(
            conversationId,
            msg.from,
            "Thanks! I'll get a team member to review what you sent and reach out shortly. 🙏",
            'system'
        )
        return
    }

    // Reply with AI
    try {
        const result = await generateReply(conversationId)
        if (result.replyText) {
            await sendAndStore(conversationId, msg.from, result.replyText, 'assistant', {
                ai_model: process.env.AZURE_OPENAI_DEPLOYMENT || 'azure-openai',
                ai_usage: result.usage,
            })
        }
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        const errStack = err instanceof Error ? err.stack : undefined
        console.error('[whatsapp] AI reply failed:', errMsg, errStack)
        await sendAndStore(
            conversationId,
            msg.from,
            "Sorry, I'm having a small hiccup. A team member will reach out shortly.",
            'system'
        )
        // Flag for human pickup
        await supabase
            .from('whatsapp_conversations')
            .update({ ai_enabled: false, status: 'handoff' })
            .eq('id', conversationId)
    }
}

// ════════════════════════════════════════════════════════════
// Handle status updates — find the message we sent and update its status
// ════════════════════════════════════════════════════════════
async function handleStatusUpdate(status: StatusUpdate) {
    const supabase = db()
    const errorText = status.errors?.length
        ? status.errors.map(e => `[${e.code}] ${e.message}`).join('; ')
        : null

    await supabase
        .from('whatsapp_messages')
        .update({
            status: status.status,
            error: errorText,
        })
        .eq('wa_message_id', status.id)
}

// ════════════════════════════════════════════════════════════
// Extract text/media from an inbound message of any type
// ════════════════════════════════════════════════════════════
function extractContent(msg: InboundMessage): {
    contentText: string | null
    mediaUrl: string | null
    displayType: string
} {
    switch (msg.type) {
        case 'text':
            return { contentText: msg.text?.body || '', mediaUrl: null, displayType: 'text' }
        case 'interactive': {
            const btn = msg.interactive?.button_reply || msg.interactive?.list_reply
            return {
                contentText: btn ? btn.title : '',
                mediaUrl: null,
                displayType: 'interactive',
            }
        }
        case 'image':
            return { contentText: msg.image?.caption || '[image]', mediaUrl: null, displayType: 'image' }
        case 'audio':
            return { contentText: '[voice note]', mediaUrl: null, displayType: 'audio' }
        case 'document':
            return {
                contentText: msg.document?.caption || `[document: ${msg.document?.filename || 'file'}]`,
                mediaUrl: null,
                displayType: 'document',
            }
        case 'location':
            return {
                contentText: msg.location
                    ? `[location: ${msg.location.name || `${msg.location.latitude},${msg.location.longitude}`}]`
                    : '[location]',
                mediaUrl: null,
                displayType: 'location',
            }
        default:
            return { contentText: null, mediaUrl: null, displayType: msg.type || 'unknown' }
    }
}

// ════════════════════════════════════════════════════════════
// Send via Meta + persist outbound row in one shot
// ════════════════════════════════════════════════════════════
async function sendAndStore(
    conversationId: string,
    to: string,
    text: string,
    role: 'assistant' | 'agent' | 'system',
    extras: { ai_model?: string; ai_usage?: unknown } = {}
) {
    const supabase = db()
    try {
        const resp = await sendText(to, text)
        const wamid = resp?.messages?.[0]?.id || null
        await supabase.from('whatsapp_messages').insert({
            conversation_id: conversationId,
            wa_message_id: wamid,
            direction: 'outbound',
            role,
            type: 'text',
            content: text,
            meta_payload: resp,
            ai_model: extras.ai_model || null,
            ai_usage: extras.ai_usage || null,
            status: 'sent',
        })
        await supabase
            .from('whatsapp_conversations')
            .update({ last_outbound_at: new Date().toISOString() })
            .eq('id', conversationId)
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'send failed'
        await supabase.from('whatsapp_messages').insert({
            conversation_id: conversationId,
            direction: 'outbound',
            role,
            type: 'text',
            content: text,
            status: 'failed',
            error: errMsg,
            ai_model: extras.ai_model || null,
            ai_usage: extras.ai_usage || null,
        })
        throw err
    }
}
