export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/hrm/employees — list all CRM employees (profiles with crm roles)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const search             = searchParams.get('search') || ''
    const role               = searchParams.get('role') || ''
    const reportingManagerId = searchParams.get('reporting_manager_id') || ''

    let query = supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, avatar_url, reporting_manager_id, manager:reporting_manager_id(id, full_name)')
        .in('role', ['admin', 'super_admin', 'agent', 'manager'])
        .order('full_name', { ascending: true })

    if (role && role !== 'all') query = query.eq('role', role)
    if (reportingManagerId)     query = query.eq('reporting_manager_id', reportingManagerId)
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Attach lead conversion stats per employee
    const employeeIds = (data || []).map(e => e.id)
    let leadStats: Record<string, { total: number; converted: number }> = {}

    if (employeeIds.length > 0) {
        const { data: leads } = await supabase
            .from('leads')
            .select('assigned_to, status')
            .in('assigned_to', employeeIds)

        if (leads) {
            for (const l of leads) {
                if (!l.assigned_to) continue
                if (!leadStats[l.assigned_to]) leadStats[l.assigned_to] = { total: 0, converted: 0 }
                leadStats[l.assigned_to].total++
                if (l.status === 'converted') leadStats[l.assigned_to].converted++
            }
        }
    }

    const employees = (data || []).map(e => ({
        ...e,
        leads_assigned: leadStats[e.id]?.total || 0,
        leads_converted: leadStats[e.id]?.converted || 0,
    }))

    return NextResponse.json({ employees, total: employees.length })
}

// PATCH /api/crm/hrm/employees — update employee profile fields
export async function PATCH(request: NextRequest) {
    try {
        const { id, ...updates } = await request.json()
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        // Only allow safe fields to be updated
        const allowed = ['full_name', 'role', 'reporting_manager_id']
        const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

        const { data, error } = await supabase
            .from('profiles')
            .update(safe)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ employee: data })
    } catch {
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }
}
