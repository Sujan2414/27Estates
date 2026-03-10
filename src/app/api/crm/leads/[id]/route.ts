import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateLeadStatus } from '@/lib/crm/leads'

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

    // Update remaining fields
    if (Object.keys(body).length > 0) {
        const { error } = await supabase
            .from('leads')
            .update(body)
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
            properties (title, property_id),
            projects (project_name)
        `)
        .eq('id', id)
        .single()

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
