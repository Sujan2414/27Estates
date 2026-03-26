export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ESCALATION_WINDOW_MIN = 15

// POST /api/crm/leads/escalate
// Body: { action: 'check_unattended' | 'redistribute_absent' }
// Protected by CRON_SECRET header OR called from admin UI
export async function POST(request: NextRequest) {
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json().catch(() => ({}))
        const action = body.action || 'check_unattended'

        if (action === 'check_unattended') {
            return await checkUnattendedLeads()
        }

        if (action === 'redistribute_absent') {
            return await redistributeAbsentAgentLeads()
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}

// GET /api/crm/leads/escalate — returns escalated/overdue count (for badge)
export async function GET() {
    const cutoff = new Date(Date.now() - ESCALATION_WINDOW_MIN * 60000).toISOString()

    // Count leads assigned but not contacted within window
    const { count: unattendedCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .not('assigned_to', 'is', null)
        .is('last_activity_at', null)
        .lt('assigned_at', cutoff)
        .not('status', 'in', '(converted,lost,contacted,qualified,negotiation,site_visit)')

    // Count overdue schedules
    const { count: overdueCount } = await supabase
        .from('lead_schedules')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('scheduled_at', new Date().toISOString())

    return NextResponse.json({
        unattended: unattendedCount || 0,
        overdue: overdueCount || 0,
        total: (unattendedCount || 0) + (overdueCount || 0),
    })
}

async function checkUnattendedLeads() {
    const cutoff = new Date(Date.now() - ESCALATION_WINDOW_MIN * 60000).toISOString()

    // Find leads assigned but not contacted within escalation window
    const { data: unattended } = await supabase
        .from('leads')
        .select('id, name, phone, assigned_to, assigned_at, escalation_count, assigned_agent:assigned_to(full_name, id)')
        .not('assigned_to', 'is', null)
        .is('last_activity_at', null)
        .lt('assigned_at', cutoff)
        .is('escalated_at', null) // not yet escalated
        .not('status', 'in', '(converted,lost,contacted,qualified,negotiation,site_visit)')

    if (!unattended || unattended.length === 0) {
        return NextResponse.json({ escalated: 0, message: 'No unattended leads' })
    }

    // Get managers
    const { data: managers } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['admin', 'super_admin'])

    const managerEmails = (managers || []).filter(m => m.email).map(m => ({ email: m.email, name: m.full_name }))

    let escalatedCount = 0

    for (const lead of unattended) {
        // Mark escalated
        await supabase.from('leads').update({
            escalated_at: new Date().toISOString(),
            escalation_count: (lead.escalation_count || 0) + 1,
        }).eq('id', lead.id)

        // Mark schedule as escalated
        await supabase.from('lead_schedules')
            .update({ status: 'escalated' })
            .eq('lead_id', lead.id)
            .eq('status', 'pending')

        // Create in-app notification
        await supabase.from('notifications').insert({
            type: 'escalation',
            title: `⚠️ Lead not attended: ${lead.name}`,
            body: `Assigned ${ESCALATION_WINDOW_MIN}+ min ago with no contact. Agent: ${(lead as any).assigned_agent?.full_name || 'Unknown'}`,
            link: `/crm/leads/${lead.id}`,
        })

        // Log activity
        await supabase.from('lead_activities').insert({
            lead_id: lead.id,
            type: 'escalation',
            title: `Escalated — not contacted within ${ESCALATION_WINDOW_MIN} minutes`,
            description: `Assigned to ${(lead as any).assigned_agent?.full_name || 'unknown agent'}`,
            metadata: { escalation_count: (lead.escalation_count || 0) + 1 },
            created_by: 'system',
        })

        // Send email to managers
        if (managerEmails.length > 0) {
            try {
                const { Resend } = await import('resend')
                const resend = new Resend(process.env.RESEND_API_KEY)
                await resend.emails.send({
                    from: `27 Estates CRM <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                    to: managerEmails.map(m => m.email),
                    subject: `⚠️ Lead Not Attended: ${lead.name}`,
                    html: `
                        <p>Hi Team,</p>
                        <p>The following lead has been assigned but <strong>not contacted within ${ESCALATION_WINDOW_MIN} minutes</strong>:</p>
                        <table style="border-collapse:collapse; margin:1rem 0">
                            <tr><td style="padding:4px 12px;color:#666">Lead</td><td style="padding:4px 12px;font-weight:bold">${lead.name}</td></tr>
                            <tr><td style="padding:4px 12px;color:#666">Phone</td><td style="padding:4px 12px">${lead.phone || '—'}</td></tr>
                            <tr><td style="padding:4px 12px;color:#666">Assigned to</td><td style="padding:4px 12px">${(lead as any).assigned_agent?.full_name || 'Unknown'}</td></tr>
                            <tr><td style="padding:4px 12px;color:#666">Assigned at</td><td style="padding:4px 12px">${new Date(lead.assigned_at).toLocaleString('en-IN')}</td></tr>
                        </table>
                        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/crm/leads/${lead.id}" style="background:#BFA270;color:#0f1117;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:bold">View Lead →</a></p>
                        <p>— 27 Estates CRM</p>
                    `,
                })
            } catch { /* non-blocking */ }
        }

        escalatedCount++
    }

    return NextResponse.json({ escalated: escalatedCount, leads: unattended.map(l => l.id) })
}

async function redistributeAbsentAgentLeads() {
    const today = new Date().toISOString().split('T')[0]

    // Get absent agents today
    const { data: absentRecords } = await supabase
        .from('hrm_attendance')
        .select('employee_id')
        .eq('date', today)
        .eq('status', 'absent')

    if (!absentRecords || absentRecords.length === 0) {
        return NextResponse.json({ redistributed: 0, message: 'No absent agents today' })
    }

    const absentIds = absentRecords.map(r => r.employee_id)

    // Get available agents only (not absent, agents only)
    const { data: allAgents } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'agent')
        .not('id', 'in', `(${absentIds.join(',')})`)

    if (!allAgents || allAgents.length === 0) {
        return NextResponse.json({ redistributed: 0, message: 'No available agents to reassign to' })
    }

    // Get pending schedules for absent agents today
    const dayStart = `${today}T00:00:00.000Z`
    const dayEnd   = `${today}T23:59:59.999Z`

    const { data: absentSchedules } = await supabase
        .from('lead_schedules')
        .select('id, lead_id, agent_id, scheduled_at')
        .in('agent_id', absentIds)
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
        .eq('status', 'pending')

    if (!absentSchedules || absentSchedules.length === 0) {
        return NextResponse.json({ redistributed: 0, message: 'No pending schedules for absent agents' })
    }

    let redistributed = 0
    let agentIndex = 0

    for (const sched of absentSchedules) {
        const newAgent = allAgents[agentIndex % allAgents.length]
        agentIndex++

        // Mark old slot as reassigned
        await supabase.from('lead_schedules').update({ status: 'reassigned' }).eq('id', sched.id)

        // Create new slot for available agent
        await supabase.from('lead_schedules').insert({
            lead_id: sched.lead_id,
            agent_id: newAgent.id,
            scheduled_at: sched.scheduled_at, // keep same time
            status: 'pending',
        })

        // Update lead assignment
        await supabase.from('leads').update({
            assigned_to: newAgent.id,
            assigned_at: new Date().toISOString(),
        }).eq('id', sched.lead_id)

        // Log activity
        await supabase.from('lead_activities').insert({
            lead_id: sched.lead_id,
            type: 'reassignment',
            title: `Reassigned to ${newAgent.full_name} (original agent absent)`,
            metadata: { new_agent_id: newAgent.id },
            created_by: 'system',
        })

        redistributed++
    }

    return NextResponse.json({ redistributed, absent_agents: absentIds.length })
}
