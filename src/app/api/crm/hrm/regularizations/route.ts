export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/hrm/regularizations?status=pending&employee_id=X&month=YYYY-MM
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const employeeId = searchParams.get('employee_id') || ''
    const month = searchParams.get('month') || ''
    const includeQuota = searchParams.get('include_quota') === 'true'

    try {
        let query = supabase
            .from('hrm_regularizations')
            .select(`
                *,
                employee:employee_id (id, full_name, role),
                approver:approved_by (id, full_name)
            `)
            .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)
        if (employeeId) query = query.eq('employee_id', employeeId)
        if (month) {
            const start = `${month}-01`
            const [y, m] = month.split('-').map(Number)
            const end = new Date(y, m, 0).toISOString().split('T')[0]
            query = query.gte('date', start).lte('date', end)
        }

        const { data, error } = await query
        if (error) {
            if (error.code === '42P01') return NextResponse.json({ regularizations: [], tableExists: false })
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const result: Record<string, unknown> = { regularizations: data || [], tableExists: true }

        // Include quota info from work_settings
        if (includeQuota) {
            const { data: ws } = await supabase
                .from('hrm_work_settings')
                .select('max_regularizations_per_month, max_regularizations_per_year')
                .limit(1)
                .single()
            result.quota = ws || { max_regularizations_per_month: 2, max_regularizations_per_year: 10 }
        }

        return NextResponse.json(result)
    } catch {
        return NextResponse.json({ regularizations: [], tableExists: false })
    }
}

function approverRoleFor(role: string): string {
    if (role === 'agent')   return 'manager'
    if (role === 'manager') return 'admin'
    if (role === 'admin')   return 'super_admin'
    return 'super_admin'
}
function roleWeight(role: string): number {
    const w: Record<string, number> = { agent: 1, manager: 2, admin: 3, super_admin: 4 }
    return w[role] ?? 0
}

// POST /api/crm/hrm/regularizations — employee applies
// Body: { employee_id, date, reason, actual_hours, requesting_user_id, requesting_user_role }
export async function POST(request: NextRequest) {
    try {
        const { employee_id, date, reason, actual_hours, requesting_user_id, requesting_user_role } = await request.json()
        if (!employee_id || !date || !reason) {
            return NextResponse.json({ error: 'employee_id, date, and reason are required' }, { status: 400 })
        }

        // Ownership check: agents & managers can only apply for themselves
        if (requesting_user_id && requesting_user_role) {
            const isPrivileged = requesting_user_role === 'admin' || requesting_user_role === 'super_admin'
            if (!isPrivileged && requesting_user_id !== employee_id) {
                return NextResponse.json({ error: 'You can only submit regularization for yourself' }, { status: 403 })
            }
        }

        // Set requires_approval_from based on employee role
        const { data: emp } = await supabase.from('profiles').select('role').eq('id', employee_id).single()
        const requires_approval_from = approverRoleFor(emp?.role || 'agent')

        // Check monthly quota usage
        const monthStr = date.slice(0, 7) // YYYY-MM
        const start = `${monthStr}-01`
        const [y, m] = monthStr.split('-').map(Number)
        const end = new Date(y, m, 0).toISOString().split('T')[0]

        const [{ count: monthCount }, { data: ws }] = await Promise.all([
            supabase
                .from('hrm_regularizations')
                .select('id', { count: 'exact', head: true })
                .eq('employee_id', employee_id)
                .gte('date', start)
                .lte('date', end)
                .neq('status', 'rejected'),
            supabase
                .from('hrm_work_settings')
                .select('max_regularizations_per_month, max_regularizations_per_year')
                .limit(1)
                .single(),
        ])

        const monthLimit = ws?.max_regularizations_per_month ?? 2
        if ((monthCount || 0) >= monthLimit) {
            return NextResponse.json(
                { error: `Monthly regularization limit of ${monthLimit} reached` },
                { status: 422 }
            )
        }

        // Upsert (one per employee per date)
        const { data, error } = await supabase
            .from('hrm_regularizations')
            .upsert(
                { employee_id, date, reason, actual_hours: actual_hours || null, status: 'pending', requires_approval_from },
                { onConflict: 'employee_id,date' }
            )
            .select(`*, employee:employee_id (id, full_name)`)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ regularization: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to apply for regularization' }, { status: 500 })
    }
}

// PATCH /api/crm/hrm/regularizations — approve/reject (chain-enforced)
// Body: { id, status, approved_by, approver_role, admin_notes? }
export async function PATCH(request: NextRequest) {
    try {
        const { id, status, approved_by, approver_role, admin_notes } = await request.json()
        if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
        }

        // Fetch regularization to check approval authority
        const { data: reg } = await supabase
            .from('hrm_regularizations')
            .select('*, employee:employee_id (id, role, reporting_manager_id)')
            .eq('id', id)
            .single()

        if (!reg) return NextResponse.json({ error: 'Regularization not found' }, { status: 404 })

        const emp = reg.employee as { id: string; role: string; reporting_manager_id?: string | null } | null
        const empRole = emp?.role || 'agent'
        const neededRole = approverRoleFor(empRole)

        if (approver_role && roleWeight(approver_role) < roleWeight(neededRole)) {
            return NextResponse.json({
                error: `Regularization requires approval from a ${neededRole} or above`
            }, { status: 403 })
        }

        if (approver_role === 'manager' && approved_by && emp?.reporting_manager_id !== approved_by) {
            return NextResponse.json({ error: 'Managers can only approve regularizations for their direct reports' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from('hrm_regularizations')
            .update({
                status,
                approved_by: approved_by || null,
                admin_notes: admin_notes || null,
                approved_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select(`*, employee:employee_id (id, full_name), approver:approved_by (id, full_name)`)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Send email to employee about the decision
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', data.employee_id)
                .single()
            if (profile?.email) {
                const { Resend } = await import('resend')
                const resend = new Resend(process.env.RESEND_API_KEY)
                const dateLabel = new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                const isApproved = status === 'approved'
                await resend.emails.send({
                    from: `27 Estates HR <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                    to: profile.email,
                    subject: isApproved
                        ? `✅ Regularisation Approved — ${data.date}`
                        : `❌ Regularisation Rejected — ${data.date}`,
                    html: `<p>Hi ${profile.full_name},</p>
<p>Your regularisation request for <strong>${dateLabel}</strong> has been <strong style="color:${isApproved ? '#22c55e' : '#ef4444'}">${status.toUpperCase()}</strong>.</p>
${admin_notes ? `<p><strong>Admin Note:</strong> ${admin_notes}</p>` : ''}
<p>— 27 Estates HR</p>`,
                })
            }
        } catch { /* non-blocking */ }

        return NextResponse.json({ regularization: data })
    } catch {
        return NextResponse.json({ error: 'Failed to update regularization' }, { status: 500 })
    }
}
