/**
 * POST /api/whatsapp/broadcast
 * Sends a pre-approved template message to multiple recipients.
 *
 * Body:
 *   {
 *     template_name: string,
 *     language: string,                // e.g. "en_US"
 *     recipients: Array<{ phone: string, variables?: string[] }>,
 *     test_mode?: boolean              // if true, only send to first recipient
 *   }
 *
 * Returns: { sent: number, failed: number, results: [...] }
 *
 * NOTE: Templates must be APPROVED in Meta before they can be sent.
 *       The first contact with a user outside their 24h service window
 *       MUST be a template (regular text will silently fail with code 131047).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTemplate, type TemplateComponent } from '@/lib/whatsapp/meta-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60   // up to 60s for large broadcasts

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Recipient {
    phone: string
    variables?: string[]
    name?: string
}

interface Body {
    template_name?: string
    language?: string
    recipients?: Recipient[]
    test_mode?: boolean
}

// Conservative throttle so we don't trip Meta's per-second limits
const BATCH_SIZE = 10
const BATCH_DELAY_MS = 1000

export async function POST(request: NextRequest) {
    let body: Body
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const templateName = body.template_name?.trim()
    const language = body.language?.trim() || 'en_US'
    const allRecipients = (body.recipients || []).filter(r => r.phone)
    const recipients = body.test_mode ? allRecipients.slice(0, 1) : allRecipients

    if (!templateName) return NextResponse.json({ error: 'template_name required' }, { status: 400 })
    if (recipients.length === 0) return NextResponse.json({ error: 'recipients required' }, { status: 400 })
    if (recipients.length > 1000) {
        return NextResponse.json({ error: 'max 1000 recipients per request' }, { status: 400 })
    }

    const results: Array<{ phone: string; ok: boolean; wamid?: string; error?: string }> = []

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(batch.map(r => sendOne(r, templateName, language)))
        results.push(...batchResults)
        if (i + BATCH_SIZE < recipients.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
        }
    }

    const sent = results.filter(r => r.ok).length
    const failed = results.length - sent

    return NextResponse.json({ sent, failed, results })
}

async function sendOne(
    r: Recipient,
    templateName: string,
    language: string
): Promise<{ phone: string; ok: boolean; wamid?: string; error?: string }> {
    const phone = normalizePhone(r.phone)
    try {
        const components: TemplateComponent[] | undefined = r.variables && r.variables.length > 0
            ? [{
                type: 'body',
                parameters: r.variables.map(v => ({ type: 'text', text: String(v) })),
            }]
            : undefined

        const resp = await sendTemplate(phone, templateName, language, components)
        const wamid = resp?.messages?.[0]?.id || undefined

        // Persist as outbound message in the matching conversation (create if missing)
        try {
            const { data: convId } = await supabase.rpc('get_or_create_whatsapp_conversation', {
                p_phone: phone,
                p_name: r.name || null,
            })
            if (convId) {
                await supabase.from('whatsapp_messages').insert({
                    conversation_id: convId as string,
                    wa_message_id: wamid,
                    direction: 'outbound',
                    role: 'system',
                    type: 'template',
                    content: `[template: ${templateName}]${r.variables?.length ? ' vars=' + JSON.stringify(r.variables) : ''}`,
                    meta_payload: resp,
                    status: 'sent',
                })
                await supabase
                    .from('whatsapp_conversations')
                    .update({ last_outbound_at: new Date().toISOString() })
                    .eq('id', convId as string)
            }
        } catch (e) {
            console.warn('[broadcast] failed to log message for', phone, e)
        }

        return { phone, ok: true, wamid }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'send failed'
        return { phone, ok: false, error: msg }
    }
}

// Strip non-digits, then require at least 10 digits.
// Indian numbers without country code get prefixed with 91.
function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D+/g, '')
    if (digits.length === 10) return '91' + digits
    return digits
}
