/**
 * GET   /api/whatsapp/conversations/[id]  → conversation + recent messages
 * PATCH /api/whatsapp/conversations/[id]  → update ai_enabled / status / assigned_agent_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MSG_LIMIT = 200

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const { data: conv, error: convErr } = await supabase
        .from('whatsapp_conversations')
        .select(
            `id, wa_phone, contact_name, lead_id, status, ai_enabled, assigned_agent_id,
             last_inbound_at, last_outbound_at, unread_count, metadata, created_at, updated_at,
             leads:lead_id ( id, name, email, phone, status, priority, score, preferred_location, budget_min, budget_max, property_type )`
        )
        .eq('id', id)
        .single()

    if (convErr || !conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('id, wa_message_id, direction, role, type, content, media_url, status, error, ai_model, ai_usage, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(MSG_LIMIT)

    return NextResponse.json({ conversation: conv, messages: messages || [] })
}

interface PatchBody {
    ai_enabled?: boolean
    status?: 'active' | 'qualified' | 'handoff' | 'closed'
    assigned_agent_id?: string | null
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    let body: PatchBody
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {}
    if (typeof body.ai_enabled === 'boolean') patch.ai_enabled = body.ai_enabled
    if (body.status) patch.status = body.status
    if ('assigned_agent_id' in body) patch.assigned_agent_id = body.assigned_agent_id

    if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('whatsapp_conversations')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversation: data })
}
