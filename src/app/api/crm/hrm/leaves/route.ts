import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/hrm/leaves?status=pending&employee_id=...
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const employeeId = searchParams.get('employee_id') || ''

    try {
        let query = supabase
            .from('hrm_leaves')
            .select(`*, employee:employee_id (id, full_name, role), approver:approved_by (id, full_name)`)
            .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)
        if (employeeId) query = query.eq('employee_id', employeeId)

        const { data, error } = await query
        if (error) {
            if (error.code === '42P01') return NextResponse.json({ leaves: [], tableExists: false })
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ leaves: data || [], tableExists: true })
    } catch {
        return NextResponse.json({ leaves: [], tableExists: false })
    }
}

// POST /api/crm/hrm/leaves — apply for leave
export async function POST(request: NextRequest) {
    try {
        const { employee_id, leave_type, start_date, end_date, reason } = await request.json()
        if (!employee_id || !leave_type || !start_date || !end_date) {
            return NextResponse.json({ error: 'employee_id, leave_type, start_date, end_date required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('hrm_leaves')
            .insert({ employee_id, leave_type, start_date, end_date, reason, status: 'pending' })
            .select(`*, employee:employee_id (id, full_name)`)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ leave: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to apply for leave' }, { status: 500 })
    }
}

// PATCH /api/crm/hrm/leaves — approve / reject leave
export async function PATCH(request: NextRequest) {
    try {
        const { id, status, approved_by } = await request.json()
        if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
        if (!['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 })

        const { data, error } = await supabase
            .from('hrm_leaves')
            .update({ status, approved_by: approved_by || null, approved_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ leave: data })
    } catch {
        return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 })
    }
}
