export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateLeadStatus, calculateScore } from '@/lib/crm/leads'
import { sendEmailByCategory } from '@/lib/crm/email'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/leads/[id] - Get lead detail with activities, tasks, and behavioural score
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [leadResult, activitiesResult, tasksResult] = await Promise.all([
        supabase
            .from('leads')
            .select(`*, agents (id, name, email, phone), properties (title, property_id), projects (project_name)`)
            .eq('id', id)
            .single(),
        supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(50),
        supabase.from('lead_tasks').select('*').eq('lead_id', id).order('due_date', { ascending: true })
    ])

    if (leadResult.error) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const lead = leadResult.data

    // ── Behavioural enrichment (website signals) ──────────────────
    let webSignals = { web_page_views: 0, web_bookmarks: 0, web_return_visits: 0, web_last_seen_days: undefined as number | undefined }
    if (lead?.email) {
        const { data: profile } = await supabase.from('profiles').select('id').ilike('email', lead.email).limit(1).single()
        if (profile?.id) {
            const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
            const [viewsRes, bmRes] = await Promise.all([
                supabase.from('user_page_views').select('page_path, created_at, session_id').eq('user_id', profile.id).gte('created_at', since30d),
                supabase.from('user_bookmarks').select('id').eq('user_id', profile.id),
            ])
            const views = viewsRes.data || []
            webSignals.web_page_views = views.length
            webSignals.web_bookmarks = (bmRes.data || []).length
            // Count how many unique listing pages were visited 2+ times
            const listingHits: Record<string, number> = {}
            for (const v of views) {
                if (v.page_path.match(/\/(properties|projects)\/[a-f0-9-]{36}/)) {
                    listingHits[v.page_path] = (listingHits[v.page_path] || 0) + 1
                }
            }
            webSignals.web_return_visits = Object.values(listingHits).filter(n => n >= 2).length
            if (views.length > 0) {
                const lastSeen = views.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
                webSignals.web_last_seen_days = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 86400000)
            }
        }
    }

    // Resolve creator names for activities
    const rawActivities = activitiesResult.data || []
    const creatorIds = [...new Set(rawActivities.map((a: { created_by: string }) => a.created_by).filter((id: string) => id && id !== 'admin' && id.includes('-')))]
    let creatorMap: Record<string, string> = {}
    if (creatorIds.length > 0) {
        const { data: creators } = await supabase.from('profiles').select('id, full_name').in('id', creatorIds)
        if (creators) creatorMap = Object.fromEntries(creators.map((c: { id: string; full_name: string }) => [c.id, c.full_name]))
    }
    const activities = rawActivities.map((a: { created_by: string; [key: string]: unknown }) => ({
        ...a,
        creator_name: creatorMap[a.created_by] || (a.created_by === 'admin' ? 'Admin' : a.created_by),
    }))
    const { score, breakdown } = calculateScore({
        source: lead.source, email: lead.email, phone: lead.phone,
        budget_min: lead.budget_min, budget_max: lead.budget_max,
        preferred_location: lead.preferred_location, property_type: lead.property_type,
        activity_count: activities.length, last_contacted_at: lead.last_contacted_at,
        ...webSignals,
    })

    // Persist updated score silently
    supabase.from('leads').update({ score, score_breakdown: breakdown }).eq('id', id).then(() => {})

    // Resolve creator names for tasks
    const rawTasks = tasksResult.data || []
    const taskCreatorIds = [...new Set(rawTasks.map((t: { created_by: string | null }) => t.created_by).filter((id): id is string => !!id && id.includes('-')))]
    let taskCreatorMap: Record<string, string> = {}
    if (taskCreatorIds.length > 0) {
        const { data: taskCreators } = await supabase.from('profiles').select('id, full_name').in('id', taskCreatorIds)
        if (taskCreators) taskCreatorMap = Object.fromEntries(taskCreators.map((c: { id: string; full_name: string }) => [c.id, c.full_name]))
    }
    const tasks = rawTasks.map((t: { created_by: string | null; [key: string]: unknown }) => ({
        ...t,
        creator_name: t.created_by ? (taskCreatorMap[t.created_by] || t.created_by) : null,
    }))

    return NextResponse.json({
        lead: { ...lead, score, score_breakdown: breakdown, ...webSignals },
        activities,
        tasks,
    })
}

// Allowed fields for lead updates
const ALLOWED_LEAD_FIELDS = new Set([
    'name', 'email', 'phone', 'source', 'priority',
    'property_interest', 'project_interest', 'budget_min', 'budget_max',
    'preferred_location', 'property_type', 'notes', 'tags',
    'next_follow_up_at', 'lost_reason', 'lead_preferences',
    'assigned_to', 'score', 'score_breakdown',
])

// PATCH /api/crm/leads/[id] - Update a lead
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json()

    // Handle status changes specially to log them
    if (body.status) {
        await updateLeadStatus(id, body.status, body.changed_by || 'admin')
        delete body.status
        delete body.changed_by
    }

    // Track if a property is being assigned (for email notification)
    const newPropertyId = body.property_interest as string | undefined

    // Filter to allowed fields only (prevents injection of arbitrary columns)
    const sanitized: Record<string, unknown> = {}
    for (const key of Object.keys(body)) {
        if (ALLOWED_LEAD_FIELDS.has(key)) sanitized[key] = body[key]
    }

    // Update remaining fields
    if (Object.keys(sanitized).length > 0) {
        const { error } = await supabase
            .from('leads')
            .update(sanitized)
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    // Return updated lead
    const { data } = await supabase
        .from('leads')
        .select(`
            *,
            agents (id, name, email, phone),
            properties (title, property_id, location, price),
            projects (project_name)
        `)
        .eq('id', id)
        .single()

    // Send "Assigned Property" email if a property was just assigned and lead has email
    if (newPropertyId && data?.email && data.properties) {
        const prop = data.properties as { title?: string; property_id?: string; location?: string; price?: string }
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://27estates.com'
        const agentName = data.agents ? (data.agents as { name?: string }).name || '27 Estates Team' : '27 Estates Team'
        sendEmailByCategory('property_assigned', data.email, {
            name: data.name,
            agent_name: agentName,
            property_title: prop.title || 'New Property',
            property_location: prop.location || '',
            property_price: prop.price ? `₹${prop.price}` : 'Contact for price',
            property_url: `${siteUrl}/properties/${newPropertyId}`,
        }, id).catch(err => console.error('Assigned property email failed:', err))
    }

    return NextResponse.json({ lead: data })
}

// DELETE /api/crm/leads/[id] - Delete a lead
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
