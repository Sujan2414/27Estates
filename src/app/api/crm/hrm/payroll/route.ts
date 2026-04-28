export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/hrm/payroll?month=2025-04
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || ''

    try {
        const [{ data: payrolls, error }, { data: employees }] = await Promise.all([
            month
                ? supabase.from('hrm_payroll').select('*').eq('month', month).order('employee_name')
                : supabase.from('hrm_payroll').select('*').order('month', { ascending: false }).limit(200),
            supabase.from('profiles').select('id, full_name, role').neq('role', 'super_admin').order('full_name'),
        ])

        if (error) {
            if (error.code === '42P01') return NextResponse.json({ payrolls: [], employees: [], tableExists: false })
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ payrolls: payrolls || [], employees: employees || [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST /api/crm/hrm/payroll — upsert a payroll record
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            id, employee_id, employee_name, designation, month,
            basic_salary, hra, conveyance, special_allowance, travel_allowance,
            medical_allowance, bonus, pf_deduction, tax, professional_tax,
            lop_deduction, deductions, total_working_days, days_present,
            paid_leaves, unpaid_leaves, notes,
        } = body

        const gross_salary =
            (Number(basic_salary) || 0) + (Number(hra) || 0) + (Number(conveyance) || 0) +
            (Number(special_allowance) || 0) + (Number(travel_allowance) || 0) +
            (Number(medical_allowance) || 0) + (Number(bonus) || 0)

        const total_deductions =
            (Number(pf_deduction) || 0) + (Number(tax) || 0) + (Number(professional_tax) || 0) +
            (Number(lop_deduction) || 0) + (Number(deductions) || 0)

        const net_salary = gross_salary - total_deductions

        const payload = {
            employee_id, employee_name, designation, month,
            basic_salary: Number(basic_salary) || 0,
            hra: Number(hra) || 0,
            conveyance: Number(conveyance) || 0,
            special_allowance: Number(special_allowance) || 0,
            travel_allowance: Number(travel_allowance) || 0,
            medical_allowance: Number(medical_allowance) || 0,
            bonus: Number(bonus) || 0,
            gross_salary,
            pf_deduction: Number(pf_deduction) || 0,
            tax: Number(tax) || 0,
            professional_tax: Number(professional_tax) || 0,
            lop_deduction: Number(lop_deduction) || 0,
            deductions: Number(deductions) || 0,
            total_deductions,
            net_salary,
            total_working_days: Number(total_working_days) || 0,
            days_present: Number(days_present) || 0,
            paid_leaves: Number(paid_leaves) || 0,
            unpaid_leaves: Number(unpaid_leaves) || 0,
            notes: notes || null,
            status: 'pending',
            updated_at: new Date().toISOString(),
        }

        let result
        if (id) {
            // Update existing (preserve status unless explicitly changing)
            const { data, error } = await supabase
                .from('hrm_payroll')
                .update({ ...payload, status: body.status || 'pending' })
                .eq('id', id)
                .select()
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            result = data
        } else {
            const { data, error } = await supabase
                .from('hrm_payroll')
                .insert({ ...payload, created_at: new Date().toISOString() })
                .select()
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            result = data
        }

        return NextResponse.json({ payroll: result })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// PATCH /api/crm/hrm/payroll — approve or reject
export async function PATCH(request: NextRequest) {
    try {
        const { id, status, approved_by } = await request.json()
        if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

        const { data, error } = await supabase
            .from('hrm_payroll')
            .update({ status, approved_by: approved_by || null, approved_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ payroll: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
