/**
 * Meta WhatsApp Cloud API client
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
import crypto from 'crypto'

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0'

function graphUrl(path: string) {
    return `https://graph.facebook.com/${GRAPH_VERSION}${path}`
}

function authHeaders() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN missing in env')
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    }
}

function phoneNumberId() {
    const id = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID missing in env')
    return id
}

// ─────────────────────────────────────────────────────────────
// Meta API response shapes (only what we use)
// ─────────────────────────────────────────────────────────────
export interface MetaSendResponse {
    messaging_product: 'whatsapp'
    contacts: { input: string; wa_id: string }[]
    messages: { id: string }[]
}

interface MetaError {
    error?: {
        message: string
        type: string
        code: number
        error_subcode?: number
        fbtrace_id?: string
    }
}

// ─────────────────────────────────────────────────────────────
// Send a plain text message
// 'to' should be E.164 without leading + (e.g. "918618907491")
// ─────────────────────────────────────────────────────────────
export async function sendText(to: string, body: string): Promise<MetaSendResponse> {
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body, preview_url: true },
    }
    return graphPost<MetaSendResponse>(`/${phoneNumberId()}/messages`, payload)
}

// ─────────────────────────────────────────────────────────────
// Send a pre-approved template (required for first contact outside 24h window)
// ─────────────────────────────────────────────────────────────
export interface TemplateComponent {
    type: 'header' | 'body' | 'button'
    parameters?: Array<{ type: 'text' | 'image'; text?: string; image?: { link: string } }>
    sub_type?: 'url' | 'quick_reply'
    index?: number
}

export async function sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components?: TemplateComponent[]
): Promise<MetaSendResponse> {
    const payload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
            name: templateName,
            language: { code: languageCode },
            ...(components ? { components } : {}),
        },
    }
    return graphPost<MetaSendResponse>(`/${phoneNumberId()}/messages`, payload)
}

// ─────────────────────────────────────────────────────────────
// Send interactive buttons (Reply Buttons — up to 3)
// ─────────────────────────────────────────────────────────────
export interface ReplyButton {
    id: string         // your internal payload, max 256 chars
    title: string      // shown to user, max 20 chars
}

export async function sendButtons(
    to: string,
    body: string,
    buttons: ReplyButton[],
    header?: string,
    footer?: string,
): Promise<MetaSendResponse> {
    const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
            type: 'button',
            ...(header ? { header: { type: 'text', text: header } } : {}),
            body: { text: body },
            ...(footer ? { footer: { text: footer } } : {}),
            action: {
                buttons: buttons.slice(0, 3).map(b => ({
                    type: 'reply',
                    reply: { id: b.id, title: b.title.slice(0, 20) },
                })),
            },
        },
    }
    return graphPost<MetaSendResponse>(`/${phoneNumberId()}/messages`, payload)
}

// ─────────────────────────────────────────────────────────────
// Mark an inbound message as "read" (the blue ticks)
// ─────────────────────────────────────────────────────────────
export async function markAsRead(messageId: string): Promise<void> {
    const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
    }
    await graphPost<unknown>(`/${phoneNumberId()}/messages`, payload).catch(err => {
        // Best-effort — don't fail the whole webhook if read receipt fails
        console.warn('[whatsapp] markAsRead failed:', err.message)
    })
}

// ─────────────────────────────────────────────────────────────
// Verify Meta's HMAC SHA-256 signature on incoming webhooks
// Header: X-Hub-Signature-256: sha256=<hex>
// Returns true if signature is valid OR if APP_SECRET is unset (dev mode warning)
// ─────────────────────────────────────────────────────────────
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    const appSecret = process.env.META_APP_SECRET
    if (!appSecret) {
        console.warn('[whatsapp] META_APP_SECRET not set — skipping signature verification')
        return true
    }
    if (!signatureHeader) return false

    const expected = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody, 'utf8')
        .digest('hex')

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signatureHeader),
            Buffer.from(expected)
        )
    } catch {
        return false
    }
}

// ─────────────────────────────────────────────────────────────
// Internal: POST helper with proper error surfacing
// ─────────────────────────────────────────────────────────────
async function graphPost<T>(path: string, payload: unknown): Promise<T> {
    const res = await fetch(graphUrl(path), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    })

    const json = await res.json().catch(() => ({})) as T & MetaError

    if (!res.ok || json?.error) {
        const err = json?.error
        const msg = err
            ? `Meta API error ${err.code}: ${err.message}${err.fbtrace_id ? ` (trace: ${err.fbtrace_id})` : ''}`
            : `Meta API HTTP ${res.status}`
        throw new Error(msg)
    }

    return json
}
