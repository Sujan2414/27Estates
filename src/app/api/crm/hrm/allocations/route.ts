export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LEAVE_TYPES = ['casual', 'sick', 'annual', 'maternity', 'paternity', 'general'] as const

// GET /api/crm/hrm/allocations?financial_year=2025-26&employee_id=X&include_balance=true
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const financialYear = searchParams.get('financial_year') || ''
    const employeeId = searchParams.get('employee_id') || ''
    const includeBalance = searchParams.get('include_balance') === 'true'

    if (!financialYear) {
        return NextResponse.json({ error: 'financial_year is required' }, { status: 400 })
    }

    try {
        // Determine FY date range (April 1 – March 31)
        const startYear = parseInt(financialYear.split('-')[0])
        const fyStart = `${startYear}-04-01`
        const fyEnd = `${startYear + 1}-03-31`

        // Build allocations query
        let allocQuery = supabase
            .from('hrm_leave_allocations')
            .select('*, employee:employee_id (id, full_name, role), allocator:allocated_by (id, full_name)')
            .eq('financial_year', financialYear)
            .order('employee_id')

        if (employeeId) allocQuery = allocQuery.eq('employee_id', employeeId)

        const { data: allocations, error: allocError } = await allocQuery
        if (allocError) {
            if (allocError.code === '42P01') return NextResponse.json({ allocations: [], tableExists: false })
            return NextResponse.json({ error: allocError.message }, { status: 500 })
        }

        if (!includeBalance) {
            return NextResponse.json({ allocations: allocations || [], tableExists: true })
        }

        // Fetch approved leaves in FY to compute used days
        let leavesQuery = supabase
            .from('hrm_leaves')
            .select('employee_id, leave_type, total_days')
            .eq('status', 'approved')
            .gte('start_date', fyStart)
            .lte('end_date', fyEnd)

        if (employeeId) leavesQuery = leavesQuery.eq('employee_id', employeeId)

        const { data: approvedLeaves } = await leavesQuery

        // Build map: employee_id → leave_type → used_days
        const usedMap: Record<string, Record<string, number>> = {}
        for (const l of approvedLeaves || []) {
            if (!usedMap[l.employee_id]) usedMap[l.employee_id] = {}
            usedMap[l.employee_id][l.leave_type] =
                (usedMap[l.employee_id][l.leave_type] || 0) + (l.total_days || 0)
        }

        // Merge balance into allocations
        const withBalance = (allocations || []).map((a) => ({
            ...a,
            used_days: usedMap[a.employee_id]?.[a.leave_type] || 0,
            balance_days: a.allocated_days - (usedMap[a.employee_id]?.[a.leave_type] || 0),
        }))

        return NextResponse.json({ allocations: withBalance, tableExists: true })
    } catch {
        return NextResponse.json({ allocations: [], tableExists: false })
    }
}

// POST /api/crm/hrm/allocations — upsert single or bulk
// Single: { employee_id, financial_year, leave_type, allocated_days, allocated_by, notes }
// Bulk:   { financial_year, allocated_by, allocations: [{ employee_id, leave_type, allocated_days }] }
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        let rows: {
            employee_id: string
            financial_year: string
            leave_type: string
            allocated_days: number
            allocated_by?: string
            notes?: string
        }[] = []

        if (body.allocations && Array.isArray(body.allocations)) {
            // Bulk upsert
            rows = body.allocations.map((a: { employee_id: string; leave_type: string; allocated_days: number; notes?: string }) => ({
                employee_id: a.employee_id,
                financial_year: body.financial_year,
                leave_type: a.leave_type,
                allocated_days: a.allocated_days,
                allocated_by: body.allocated_by || null,
                notes: a.notes || null,
            }))
        } else {
            // Single upsert
            const { employee_id, financial_year, leave_type, allocated_days, allocated_by, notes } = body
            if (!employee_id || !financial_year || !leave_type || allocated_days === undefined) {
                return NextResponse.json(
                    { error: 'employee_id, financial_year, leave_type, allocated_days required' },
                    { status: 400 }
                )
            }
            if (!LEAVE_TYPES.includes(leave_type)) {
                return NextResponse.json({ error: `leave_type must be one of ${LEAVE_TYPES.join(', ')}` }, { status: 400 })
            }
            rows = [{ employee_id, financial_year, leave_type, allocated_days, allocated_by, notes }]
        }

        const { data, error } = await supabase
            .from('hrm_leave_allocations')
            .upsert(rows, { onConflict: 'employee_id,financial_year,leave_type' })
            .select()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ allocations: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to upsert allocations' }, { status: 500 })
    }
}
