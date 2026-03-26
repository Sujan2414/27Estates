export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/hrm/tasks
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const assignedTo = searchParams.get('assigned_to') || ''
    const priority = searchParams.get('priority') || ''

    try {
        let query = supabase
            .from('hrm_tasks')
            .select(`
                *,
                assignee:assigned_to (id, full_name, email),
                creator:created_by (id, full_name)
            `)
            .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)
        if (assignedTo) query = query.eq('assigned_to', assignedTo)
        if (priority) query = query.eq('priority', priority)

        const { data, error } = await query
        if (error) {
            // Table may not exist yet
            if (error.code === '42P01') return NextResponse.json({ tasks: [], tableExists: false })
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ tasks: data || [], tableExists: true })
    } catch {
        return NextResponse.json({ tasks: [], tableExists: false })
    }
}

// POST /api/crm/hrm/tasks
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, description, assigned_to, created_by, status, priority, category, due_date } = body

        if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

        const { data, error } = await supabase
            .from('hrm_tasks')
            .insert({ title, description, assigned_to, created_by, status: status || 'todo', priority: priority || 'medium', category: category || 'general', due_date })
            .select(`*, assignee:assigned_to (id, full_name), creator:created_by (id, full_name)`)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ task: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
}

// PATCH /api/crm/hrm/tasks
export async function PATCH(request: NextRequest) {
    try {
        const { id, ...updates } = await request.json()
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        const allowed = ['title', 'description', 'assigned_to', 'status', 'priority', 'category', 'due_date']
        const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

        const { data, error } = await supabase
            .from('hrm_tasks')
            .update(safe)
            .eq('id', id)
            .select(`*, assignee:assigned_to (id, full_name)`)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ task: data })
    } catch {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}

// DELETE /api/crm/hrm/tasks
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('hrm_tasks').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
