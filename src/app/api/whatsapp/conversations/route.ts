/**
 * GET /api/whatsapp/conversations
 * Query params:
 *   status  : 'active' | 'qualified' | 'handoff' | 'closed' | 'all' (default: all)
 *   ai      : 'on' | 'off' | 'all' (default: all)
 *   search  : phone or contact_name substring
 *   page    : default 1
 *   limit   : default 50
 *
 * Returns: { items: [...], page, limit, total }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const ai = searchParams.get('ai') || 'all'
    const search = (searchParams.get('search') || '').trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const offset = (page - 1) * limit

    let q = supabase
        .from('whatsapp_conversations')
        .select(
            `id, wa_phone, contact_name, lead_id, status, ai_enabled, assigned_agent_id,
             last_inbound_at, last_outbound_at, unread_count, created_at, updated_at,
             leads:lead_id ( id, name, status, priority, score )`,
            { count: 'exact' }
        )

    if (status !== 'all') q = q.eq('status', status)
    if (ai === 'on') q = q.eq('ai_enabled', true)
    if (ai === 'off') q = q.eq('ai_enabled', false)
    if (search) {
        q = q.or(`wa_phone.ilike.%${search}%,contact_name.ilike.%${search}%`)
    }

    const { data, error, count } = await q
        .order('last_inbound_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error('[whatsapp/conversations] GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        items: data || [],
        page,
        limit,
        total: count ?? (data?.length || 0),
    })
}
