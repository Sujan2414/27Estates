export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// CRM lead-detail tasks API — backed by hrm_tasks (the same table the
// mobile Workmate app reads/writes). Tasks created here show up in
// Workmate, and tasks created in Workmate (with a lead_id) show up
// here. Replaces an earlier implementation that wrote to lead_tasks
// which the mobile app didn't read.
//
// API shape stays the same (is_completed in the request/response) so
// the web UI doesn't need to change. We translate is_completed ↔
// status='completed' / 'todo' at the boundary.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// hrm_tasks.status enum is ('todo' | 'in_progress' | 'review' | 'done').
// 'done' is what we treat as "completed" at the API boundary so the
// existing web UI (which speaks is_completed:boolean) doesn't have to
// change.
function rowToTask(row: any) {
    return {
        ...row,
        is_completed: row.status === 'done',
        completed_at: row.status === 'done' ? row.updated_at : null,
    }
}

// GET /api/crm/tasks - Get tasks (optionally filtered by lead)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const showCompleted = searchParams.get('completed') === 'true'
    const overdue = searchParams.get('overdue') === 'true'

    let query = supabase
        .from('hrm_tasks')
        .select(`*, leads (name, phone), creator:created_by (id, full_name)`)
        .order('due_date', { ascending: true })

    if (leadId) query = query.eq('lead_id', leadId)
    if (!showCompleted) query = query.neq('status', 'done')
    if (overdue) query = query.lt('due_date', new Date().toISOString())

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ tasks: (data ?? []).map(rowToTask) })
}

// POST /api/crm/tasks - Create a task
export async function POST(request: NextRequest) {
    try {
        const { lead_id, title, description, due_date, assigned_to, created_by, priority } = await request.json()

        if (!lead_id || !title || !due_date) {
            return NextResponse.json(
                { error: 'lead_id, title, and due_date are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('hrm_tasks')
            .insert({
                lead_id,
                title,
                description: description || null,
                due_date,
                assigned_to: assigned_to || null,
                created_by: created_by || null,
                priority: (priority || 'medium').toLowerCase(),
                status: 'todo',
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        await supabase
            .from('leads')
            .update({ next_follow_up_at: due_date })
            .eq('id', lead_id)

        return NextResponse.json({ task: rowToTask(data) }, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Failed to create task' }, { status: 500 })
    }
}

// PATCH /api/crm/tasks - Update a task (complete, edit title/description/due_date)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, is_completed, title, description, due_date, priority } = body
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        const updateData: Record<string, unknown> = {}
        if (typeof is_completed === 'boolean') updateData.status = is_completed ? 'done' : 'todo'
        if (title !== undefined)       updateData.title = title
        if (description !== undefined) updateData.description = description || null
        if (due_date !== undefined)    updateData.due_date = due_date
        if (priority !== undefined)    updateData.priority = (priority || 'medium').toLowerCase()

        const { data, error } = await supabase
            .from('hrm_tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ task: rowToTask(data) })
    } catch {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}

// DELETE /api/crm/tasks - Delete a task
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('hrm_tasks').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
