/**
 * POST /api/whatsapp/conversations/[id]/messages
 * Body: { text: string, agent?: string }
 * Sends a manual reply as a human agent. Auto-pauses AI on the conversation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendText } from '@/lib/whatsapp/meta-client'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Body {
    text?: string
    agent?: string
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    let body: Body
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const text = (body.text || '').trim()
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
    if (text.length > 4000) return NextResponse.json({ error: 'text too long' }, { status: 400 })

    const { data: conv, error: convErr } = await supabase
        .from('whatsapp_conversations')
        .select('id, wa_phone, lead_id, ai_enabled')
        .eq('id', id)
        .single()

    if (convErr || !conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    try {
        const resp = await sendText(conv.wa_phone, text)
        const wamid = resp?.messages?.[0]?.id || null

        await supabase.from('whatsapp_messages').insert({
            conversation_id: conv.id,
            wa_message_id: wamid,
            direction: 'outbound',
            role: 'agent',
            type: 'text',
            content: text,
            meta_payload: resp,
            status: 'sent',
        })

        // Sending a manual reply implies a human has taken over — pause AI
        await supabase
            .from('whatsapp_conversations')
            .update({
                ai_enabled: false,
                status: 'handoff',
                last_outbound_at: new Date().toISOString(),
                assigned_agent_id: body.agent || null,
            })
            .eq('id', conv.id)

        // Log activity on linked lead if any
        if (conv.lead_id) {
            await supabase.from('lead_activities').insert({
                lead_id: conv.lead_id,
                type: 'whatsapp',
                title: 'WhatsApp message sent by agent',
                description: text.slice(0, 200),
                metadata: { wamid, agent: body.agent || null },
                created_by: body.agent || 'agent',
            })
        }

        return NextResponse.json({ ok: true, wamid })
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Send failed'
        await supabase.from('whatsapp_messages').insert({
            conversation_id: conv.id,
            direction: 'outbound',
            role: 'agent',
            type: 'text',
            content: text,
            status: 'failed',
            error: errMsg,
        })
        return NextResponse.json({ error: errMsg }, { status: 502 })
    }
}
