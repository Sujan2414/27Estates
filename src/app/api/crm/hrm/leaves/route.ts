export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Approval chain: agent → manager → admin → super_admin
// Returns the minimum role that can approve a leave for the given applicant role
function approverRoleFor(role: string): string {
    if (role === 'agent')   return 'manager'
    if (role === 'manager') return 'admin'
    if (role === 'admin')   return 'super_admin'
    return 'super_admin' // fallback
}

function roleWeight(role: string): number {
    const w: Record<string, number> = { agent: 1, manager: 2, admin: 3, super_admin: 4 }
    return w[role] ?? 0
}

// GET /api/crm/hrm/leaves?status=pending&employee_id=...&approver_id=...&team_only=true&fy_start=...&fy_end=...&all=true
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status     = searchParams.get('status') || ''
    const employeeId = searchParams.get('employee_id') || ''
    const approverId = searchParams.get('approver_id') || ''   // manager seeing their team's pending
    const teamOnly   = searchParams.get('team_only') === 'true'
    const fyStart    = searchParams.get('fy_start') || ''
    const fyEnd      = searchParams.get('fy_end') || ''

    try {
        let query = supabase
            .from('hrm_leaves')
            .select(`*, employee:employee_id (id, full_name, role, reporting_manager_id), approver:approved_by (id, full_name)`)
            .order('created_at', { ascending: false })

        if (status)     query = query.eq('status', status)
        if (employeeId) query = query.eq('employee_id', employeeId)
        if (fyStart)    query = query.gte('start_date', fyStart)
        if (fyEnd)      query = query.lte('end_date', fyEnd)

        const { data, error } = await query
        if (error) {
            if (error.code === '42P01') return NextResponse.json({ leaves: [], tableExists: false })
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        let leaves = data || []

        // If approver_id provided: filter to leaves that this approver can approve
        // i.e. leaves where the employee reports to this approver OR approver has sufficient role weight
        if (approverId && teamOnly) {
            // Fetch approver role
            const { data: approver } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('id', approverId)
                .single()

            if (approver) {
                leaves = leaves.filter((l: { employee: { reporting_manager_id?: string | null; role?: string } }) => {
                    const emp = l.employee as { reporting_manager_id?: string | null; role?: string } | null
                    if (!emp) return false
                    const empRole = emp.role || 'agent'
                    const needed = approverRoleFor(empRole)
                    const approverCanHandle = roleWeight(approver.role) >= roleWeight(needed)
                    const isDirectReport = emp.reporting_manager_id === approverId
                    // Manager can only approve their direct reports; admin/super_admin see all pending
                    if (approver.role === 'manager') return isDirectReport && approverCanHandle
                    return approverCanHandle
                })
            }
        }

        return NextResponse.json({ leaves, tableExists: true })
    } catch {
        return NextResponse.json({ leaves: [], tableExists: false })
    }
}

// POST /api/crm/hrm/leaves — apply for leave
// Enforces: employee can only apply for themselves (unless admin+)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { employee_id, leave_type, start_date, end_date, reason, requesting_user_id, requesting_user_role } = body

        if (!employee_id || !leave_type || !start_date || !end_date) {
            return NextResponse.json({ error: 'employee_id, leave_type, start_date, end_date required' }, { status: 400 })
        }

        // Ownership check: agents & managers can only apply for themselves
        if (requesting_user_id && requesting_user_role) {
            const isPrivileged = requesting_user_role === 'admin' || requesting_user_role === 'super_admin'
            if (!isPrivileged && requesting_user_id !== employee_id) {
                return NextResponse.json({ error: 'You can only apply leave for yourself' }, { status: 403 })
            }
        }

        // Fetch employee role to set requires_approval_from
        const { data: emp } = await supabase
            .from('profiles')
            .select('id, role, reporting_manager_id')
            .eq('id', employee_id)
            .single()

        const empRole = emp?.role || 'agent'
        const requires_approval_from = approverRoleFor(empRole)

        const { data, error } = await supabase
            .from('hrm_leaves')
            .insert({ employee_id, leave_type, start_date, end_date, reason, status: 'pending', requires_approval_from })
            .select(`*, employee:employee_id (id, full_name)`)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ leave: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to apply for leave' }, { status: 500 })
    }
}

// PATCH /api/crm/hrm/leaves — approve / reject
// Enforces: approver must have sufficient role weight
export async function PATCH(request: NextRequest) {
    try {
        const { id, status, approved_by, approver_role } = await request.json()
        if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
        if (!['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 })

        // Fetch the leave to check approval chain
        const { data: leave } = await supabase
            .from('hrm_leaves')
            .select('*, employee:employee_id (id, full_name, email, role, reporting_manager_id)')
            .eq('id', id)
            .single()

        if (!leave) return NextResponse.json({ error: 'Leave not found' }, { status: 404 })

        const emp = leave.employee as { id: string; full_name: string; email: string; role: string; reporting_manager_id?: string | null } | null
        const empRole = emp?.role || 'agent'
        const neededRole = approverRoleFor(empRole)

        // Check approver has sufficient authority
        if (approver_role && roleWeight(approver_role) < roleWeight(neededRole)) {
            return NextResponse.json({
                error: `This leave requires approval from a ${neededRole} or above`
            }, { status: 403 })
        }

        // Manager can only approve their direct reports
        if (approver_role === 'manager' && approved_by && emp?.reporting_manager_id !== approved_by) {
            return NextResponse.json({ error: 'Managers can only approve leaves for their direct reports' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from('hrm_leaves')
            .update({ status, approved_by: approved_by || null, approved_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Send notification email
        try {
            if (emp?.email) {
                const { Resend } = await import('resend')
                const resend = new Resend(process.env.RESEND_API_KEY)
                const isApproved = status === 'approved'
                const startLabel = new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                const endLabel   = new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                await resend.emails.send({
                    from: `27 Estates HR <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                    to: emp.email,
                    subject: isApproved
                        ? `✅ Leave Approved — ${startLabel} to ${endLabel}`
                        : `❌ Leave Rejected — ${startLabel} to ${endLabel}`,
                    html: `<p>Hi ${emp.full_name},</p>
<p>Your leave request (<strong>${leave.leave_type}</strong>) from <strong>${startLabel}</strong> to <strong>${endLabel}</strong> has been <strong style="color:${isApproved ? '#22c55e' : '#ef4444'}">${status.toUpperCase()}</strong>.</p>
<p>— 27 Estates HR</p>`,
                })
            }
        } catch { /* non-blocking */ }

        return NextResponse.json({ leave: data })
    } catch {
        return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 })
    }
}
