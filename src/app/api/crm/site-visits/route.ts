export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
) as any

// GET /api/crm/site-visits?lead_id=xxx or ?upcoming=true
export async function GET(request: NextRequest) {
    const sb = getSupabase()
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const upcoming = searchParams.get('upcoming') === 'true'
    const date = searchParams.get('date') // YYYY-MM-DD

    let query = sb
        .from('site_visits')
        .select(`
            *,
            leads (name, phone, email),
            properties (title, property_id),
            projects (project_name)
        `)
        .order('visit_date', { ascending: true })
        .order('visit_time', { ascending: true })

    if (leadId) query = query.eq('lead_id', leadId)
    if (upcoming) query = query.gte('visit_date', new Date().toISOString().split('T')[0]).eq('status', 'scheduled')
    if (date) query = query.eq('visit_date', date)

    const { data, error } = await query.limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ visits: data || [] })
}

// POST /api/crm/site-visits
export async function POST(request: NextRequest) {
    const sb = getSupabase()
    const body = await request.json()

    if (!body.lead_id || !body.visit_date) {
        return NextResponse.json({ error: 'lead_id and visit_date are required' }, { status: 400 })
    }

    const { data, error } = await sb
        .from('site_visits')
        .insert({
            lead_id: body.lead_id,
            property_id: body.property_id || null,
            project_id: body.project_id || null,
            agent_id: body.assigned_to || body.agent_id || null,
            visit_date: body.visit_date,
            visit_time: body.visit_time || null,
            status: 'scheduled',
            notes: body.notes || null,
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log as lead activity
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('lead_activities').insert({
        lead_id: body.lead_id,
        type: 'site_visit',
        title: `Site visit scheduled for ${body.visit_date}${body.visit_time ? ' at ' + body.visit_time : ''}`,
        metadata: { visit_id: data.id },
        created_by: body.created_by || 'admin',
    })

    return NextResponse.json({ visit: data }, { status: 201 })
}

// PATCH /api/crm/site-visits
export async function PATCH(request: NextRequest) {
    const sb = getSupabase()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data, error } = await sb
        .from('site_visits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ visit: data })
}

// DELETE /api/crm/site-visits?id=xxx
export async function DELETE(request: NextRequest) {
    const sb = getSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await sb
        .from('site_visits')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
