import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateLeadStatus } from '@/lib/crm/leads'
import { sendEmailByCategory } from '@/lib/crm/email'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/leads/[id] - Get lead detail with activities and tasks
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [leadResult, activitiesResult, tasksResult] = await Promise.all([
        supabase
            .from('leads')
            .select(`
                *,
                agents (id, name, email, phone),
                properties (title, property_id),
                projects (project_name)
            `)
            .eq('id', id)
            .single(),
        supabase
            .from('lead_activities')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false })
            .limit(50),
        supabase
            .from('lead_tasks')
            .select('*')
            .eq('lead_id', id)
            .order('due_date', { ascending: true })
    ])

    if (leadResult.error) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({
        lead: leadResult.data,
        activities: activitiesResult.data || [],
        tasks: tasksResult.data || [],
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
