export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/tasks - Get tasks (optionally filtered by lead)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const showCompleted = searchParams.get('completed') === 'true'
    const overdue = searchParams.get('overdue') === 'true'

    let query = supabase
        .from('lead_tasks')
        .select(`*, leads (name, phone)`)
        .order('due_date', { ascending: true })

    if (leadId) query = query.eq('lead_id', leadId)
    if (!showCompleted) query = query.eq('is_completed', false)
    if (overdue) query = query.lt('due_date', new Date().toISOString())

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: data })
}

// POST /api/crm/tasks - Create a task
export async function POST(request: NextRequest) {
    try {
        const { lead_id, title, description, due_date, assigned_to } = await request.json()

        if (!lead_id || !title || !due_date) {
            return NextResponse.json(
                { error: 'lead_id, title, and due_date are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('lead_tasks')
            .insert({
                lead_id,
                title,
                description: description || null,
                due_date,
                assigned_to: assigned_to || null,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update next_follow_up_at on the lead
        await supabase
            .from('leads')
            .update({ next_follow_up_at: due_date })
            .eq('id', lead_id)

        return NextResponse.json({ task: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
}

// PATCH /api/crm/tasks - Complete a task
export async function PATCH(request: NextRequest) {
    try {
        const { id, is_completed } = await request.json()

        const updateData: Record<string, unknown> = { is_completed }
        if (is_completed) updateData.completed_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('lead_tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ task: data })
    } catch {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}
