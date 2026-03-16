import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/notifications - fetch unread + recent
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const unreadOnly = searchParams.get('unread') === 'true'

    const sb = getSupabase() as any
    let query = sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit)
    if (unreadOnly) query = query.eq('is_read', false)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { count: unreadCount } = await sb
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)

    return NextResponse.json({ notifications: data || [], unreadCount: unreadCount || 0 })
}

// PATCH /api/crm/notifications - mark as read
export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const sb = getSupabase() as any

    if (body.markAllRead) {
        await sb.from('notifications').update({ is_read: true }).eq('is_read', false)
    } else if (body.id) {
        await sb.from('notifications').update({ is_read: true }).eq('id', body.id)
    }

    return NextResponse.json({ success: true })
}

// DELETE /api/crm/notifications - clear all read
export async function DELETE() {
    const sb = getSupabase() as any
    await sb.from('notifications').delete().eq('is_read', true)
    return NextResponse.json({ success: true })
}
