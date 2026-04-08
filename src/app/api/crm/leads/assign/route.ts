export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SLOT_GAP_MIN = 15 // minutes between calls

// Get work settings (with defaults)
async function getWorkSettings() {
    const { data } = await supabase.from('hrm_work_settings').select('*').limit(1).single()
    return {
        work_start: data?.work_start_time || '09:00',
        work_end: data?.work_end_time || '18:00',
        full_day_hours: data?.full_day_hours || 8,
        half_day_hours: data?.half_day_hours || 4,
    }
}

// Get IDs of agents who are unavailable today:
// - Marked absent
// - Haven't clocked in yet
// - Already checked out
async function getUnavailableAgentIds(): Promise<Set<string>> {
    const today = new Date().toISOString().split('T')[0]

    // Get all agents first
    const { data: allAgents } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'agent')

    const allAgentIds = new Set((allAgents || []).map(a => a.id))

    // Get today's attendance records for agents
    const { data: attendanceRecords } = await supabase
        .from('hrm_attendance')
        .select('employee_id, status, check_in, check_out')
        .eq('date', today)
        .in('employee_id', Array.from(allAgentIds))

    const unavailable = new Set<string>()
    const hasRecord = new Set<string>()

    for (const rec of (attendanceRecords || [])) {
        hasRecord.add(rec.employee_id)

        // Absent agents are unavailable
        if (rec.status === 'absent') {
            unavailable.add(rec.employee_id)
            continue
        }

        // Checked out agents are unavailable (check_out is set)
        if (rec.check_out) {
            unavailable.add(rec.employee_id)
            continue
        }
    }

    // Agents with NO attendance record today haven't clocked in — unavailable
    for (const agentId of allAgentIds) {
        if (!hasRecord.has(agentId)) {
            unavailable.add(agentId)
        }
    }

    return unavailable
}

// Get available agents (only clocked-in, not checked-out, not absent)
async function getAvailableAgents() {
    const unavailableIds = await getUnavailableAgentIds()
    const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'agent')
        .order('full_name')
    return (data || []).filter(a => !unavailableIds.has(a.id))
}

// Parse "HH:MM" to { h, m }
function parseTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    return { h, m }
}

// Build a Date for a given date-string + time-string in local terms
function dateAtTime(dateStr: string, timeStr: string): Date {
    const { h, m } = parseTime(timeStr)
    const d = new Date(dateStr + 'T00:00:00')
    d.setHours(h, m, 0, 0)
    return d
}

// Is a timestamp within working hours?
function isWithinWorkHours(ts: Date, workStart: string, workEnd: string): boolean {
    const dateStr = ts.toISOString().split('T')[0]
    const start = dateAtTime(dateStr, workStart)
    const end = dateAtTime(dateStr, workEnd)
    return ts >= start && ts < end
}

// Is a date a weekend?
function isWeekend(d: Date): boolean {
    const day = d.getDay()
    return day === 0 || day === 6
}

// Get next working day start
function nextWorkingDayStart(workStart: string): Date {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    while (isWeekend(d)) d.setDate(d.getDate() + 1)
    const dateStr = d.toISOString().split('T')[0]
    return dateAtTime(dateStr, workStart)
}

// Find next available slot for an agent on a given day
async function getNextSlot(agentId: string, dayStart: Date, workStart: string, workEnd: string): Promise<Date> {
    const dayStr = dayStart.toISOString().split('T')[0]
    const dayEndDate = dateAtTime(dayStr, workEnd)

    // Fetch existing pending/called schedules for this agent on this day
    const { data: existing } = await supabase
        .from('lead_schedules')
        .select('scheduled_at')
        .eq('agent_id', agentId)
        .gte('scheduled_at', dayStart.toISOString())
        .lt('scheduled_at', dayEndDate.toISOString())
        .in('status', ['pending', 'called', 'no_answer', 'postpone_requested'])
        .order('scheduled_at')

    const slots = (existing || []).map(r => new Date(r.scheduled_at))
    let candidate = new Date(Math.max(dayStart.getTime(), Date.now() + 5 * 60000)) // at least 5 min from now

    // Round up to next 15-min boundary
    const mins = candidate.getMinutes()
    const rem = mins % SLOT_GAP_MIN
    if (rem > 0) candidate.setMinutes(mins + (SLOT_GAP_MIN - rem), 0, 0)

    // Find a gap
    for (const occupied of slots) {
        const diff = (occupied.getTime() - candidate.getTime()) / 60000
        if (diff >= 0 && diff < SLOT_GAP_MIN) {
            // Overlaps — push after this slot
            candidate = new Date(occupied.getTime() + SLOT_GAP_MIN * 60000)
        }
    }

    // If pushed past work end, return next working day start slot
    if (candidate >= dayEndDate) {
        const nextDay = nextWorkingDayStart(workStart)
        return getNextSlot(agentId, nextDay, workStart, workEnd)
    }

    return candidate
}

// Round-robin: pick next agent and advance index
async function pickNextAgent(agents: { id: string; full_name: string; role: string }[]) {
    if (agents.length === 0) return null

    const { data: state } = await supabase
        .from('lead_assignment_state')
        .select('last_agent_index')
        .eq('id', 1)
        .single()

    const lastIdx = state?.last_agent_index ?? 0
    const nextIdx = (lastIdx + 1) % agents.length

    await supabase.from('lead_assignment_state')
        .update({ last_agent_index: nextIdx, updated_at: new Date().toISOString() })
        .eq('id', 1)

    return agents[nextIdx]
}

// Check if auto-assign is enabled
export async function isAutoAssignEnabled(): Promise<boolean> {
    const { data } = await supabase.from('hrm_work_settings').select('auto_assign_enabled').limit(1).single()
    return data?.auto_assign_enabled !== false  // default true if column missing
}

// Core assignment function
export async function assignLead(leadId: string, agentId?: string): Promise<{
    agent: { id: string; full_name: string } | null
    scheduledAt: string | null
    error?: string
}> {
    const settings = await getWorkSettings()
    const agents = await getAvailableAgents()

    let agent: { id: string; full_name: string; role: string } | null = null

    if (agentId) {
        // For manual assignment, allow agents AND managers (not just round-robin pool)
        agent = agents.find(a => a.id === agentId) || null
        if (!agent) {
            const { data: managerProfile } = await supabase
                .from('profiles').select('id, full_name, role')
                .eq('id', agentId).in('role', ['manager', 'admin', 'super_admin']).single()
            agent = managerProfile || null
        }
        if (!agent) return { agent: null, scheduledAt: null, error: 'Agent not available' }
    } else {
        agent = await pickNextAgent(agents)
        if (!agent) return { agent: null, scheduledAt: null, error: 'No available agents' }
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    let dayStart: Date
    if (isWithinWorkHours(now, settings.work_start, settings.work_end) && !isWeekend(now)) {
        dayStart = dateAtTime(todayStr, settings.work_start)
    } else {
        dayStart = nextWorkingDayStart(settings.work_start)
    }

    const slot = await getNextSlot(agent.id, dayStart, settings.work_start, settings.work_end)

    // Update the lead
    await supabase.from('leads').update({
        assigned_to: agent.id,
        assigned_at: now.toISOString(),
        scheduled_call_at: slot.toISOString(),
    }).eq('id', leadId)

    // Create schedule entry
    await supabase.from('lead_schedules').upsert(
        { lead_id: leadId, agent_id: agent.id, scheduled_at: slot.toISOString(), status: 'pending' },
        { onConflict: 'lead_id,agent_id' }
    )

    // Log activity
    await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'assignment',
        title: `Lead assigned to ${agent.full_name}`,
        description: `Scheduled call at ${slot.toLocaleString('en-IN')}`,
        metadata: { agent_id: agent.id, scheduled_at: slot.toISOString() },
        created_by: 'system',
    })

    return { agent, scheduledAt: slot.toISOString() }
}

// POST /api/crm/leads/assign
// Body: { lead_id?, agent_id?, auto_assign_unassigned?: true }
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { lead_id, agent_id, auto_assign_unassigned } = body

        if (auto_assign_unassigned) {
            // Bulk: assign all unassigned leads
            const { data: unassigned } = await supabase
                .from('leads')
                .select('id')
                .is('assigned_to', null)
                .not('status', 'in', '(converted,lost)')
                .order('created_at')

            const results = []
            for (const lead of (unassigned || [])) {
                const r = await assignLead(lead.id)
                results.push({ lead_id: lead.id, ...r })
            }
            return NextResponse.json({ assigned: results.length, results })
        }

        if (!lead_id) {
            return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
        }

        const result = await assignLead(lead_id, agent_id)
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 422 })
        }

        return NextResponse.json(result)
    } catch {
        return NextResponse.json({ error: 'Failed to assign lead' }, { status: 500 })
    }
}
