export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
) as any

// GET /api/crm/site-visits?lead_id=xxx or ?upcoming=true
//
// CRITICAL: this endpoint had `agent:agent_id (full_name, avatar_url)` in the
// embedded select — but `site_visits.agent_id` has NO foreign-key constraint
// to `profiles` in the schema. PostgREST returns PGRST200 on any embed it
// can't resolve via FK, which 500s the WHOLE query. The lead-detail page
// then silently shows "Site Visits (0)" even though the row was just
// inserted (visible in activity log). This was the client's exact complaint:
// "shows scheduled in activity logs but we can't see it anywhere".
//
// Defensive rewrite: fetch the raw site_visits rows, then batch-resolve the
// joined data via separate queries. A few extra round trips, but resilient
// to schema gaps and per-table RLS.
export async function GET(request: NextRequest) {
    const sb = getSupabase()
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const upcoming = searchParams.get('upcoming') === 'true'
    const date = searchParams.get('date') // YYYY-MM-DD

    let query = sb
        .from('site_visits')
        .select('*')
        .order('visit_date', { ascending: true })
        .order('visit_time', { ascending: true })

    if (leadId) query = query.eq('lead_id', leadId)
    if (upcoming) query = query.gte('visit_date', new Date().toISOString().split('T')[0]).eq('status', 'scheduled')
    if (date) query = query.eq('visit_date', date)

    const { data: rows, error } = await query.limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const visits = rows || []
    const leadIds  = [...new Set(visits.map((v: any) => v.lead_id).filter(Boolean))]
    const propIds  = [...new Set(visits.map((v: any) => v.property_id).filter(Boolean))]
    const projIds  = [...new Set(visits.map((v: any) => v.project_id).filter(Boolean))]
    const agentIds = [...new Set(visits.map((v: any) => v.agent_id).filter(Boolean))]

    const [leadsRes, propsRes, projsRes, agentsRes] = await Promise.all([
        leadIds.length  ? sb.from('leads').select('id, name, phone, email').in('id', leadIds)        : Promise.resolve({ data: [], error: null }),
        propIds.length  ? sb.from('properties').select('id, title, property_id').in('id', propIds)   : Promise.resolve({ data: [], error: null }),
        projIds.length  ? sb.from('projects').select('id, project_name').in('id', projIds)          : Promise.resolve({ data: [], error: null }),
        agentIds.length ? sb.from('profiles').select('id, full_name, avatar_url').in('id', agentIds): Promise.resolve({ data: [], error: null }),
    ])

    const leadMap  = new Map((leadsRes.data  ?? []).map((r: any) => [r.id, r]))
    const propMap  = new Map((propsRes.data  ?? []).map((r: any) => [r.id, r]))
    const projMap  = new Map((projsRes.data  ?? []).map((r: any) => [r.id, r]))
    const agentMap = new Map((agentsRes.data ?? []).map((r: any) => [r.id, r]))

    const enriched = visits.map((v: any) => ({
        ...v,
        leads:      v.lead_id     ? leadMap.get(v.lead_id)     ?? null : null,
        properties: v.property_id ? propMap.get(v.property_id) ?? null : null,
        projects:   v.project_id  ? projMap.get(v.project_id)  ?? null : null,
        agent:      v.agent_id    ? agentMap.get(v.agent_id)   ?? null : null,
    }))

    return NextResponse.json({ visits: enriched })
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

    // Log as lead activity. Non-fatal: if this fails (FK on created_by,
    // missing column, etc.) the visit is still saved successfully — we
    // just lose the timeline entry. Previously a failure here was hidden
    // and the activities row was silently lost.
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        // created_by is a UUID FK on profiles. If the caller didn't send a
        // valid UUID we omit it rather than send 'admin' (which used to
        // make the insert silently fail).
        const isUuid = typeof body.created_by === 'string'
            && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.created_by)
        const activityRow: Record<string, any> = {
            lead_id: body.lead_id,
            type: 'site_visit',
            title: `Site visit scheduled for ${body.visit_date}${body.visit_time ? ' at ' + body.visit_time : ''}`,
            metadata: { visit_id: data.id },
        }
        if (isUuid) activityRow.created_by = body.created_by
        const { error: actErr } = await supabase.from('lead_activities').insert(activityRow)
        if (actErr) console.warn('[site-visits] lead_activities insert failed:', actErr.message)
    } catch (e) {
        console.warn('[site-visits] lead_activities insert threw:', e)
    }

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
