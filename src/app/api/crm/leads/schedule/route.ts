export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/leads/schedule?agent_id=X&date=YYYY-MM-DD&all=true
// Returns today's call schedule for an agent (or all agents for admin)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id') || ''
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const all = searchParams.get('all') === 'true'

    try {
        const dayStart = `${dateParam}T00:00:00.000Z`
        const dayEnd   = `${dateParam}T23:59:59.999Z`

        let query = supabase
            .from('lead_schedules')
            .select(`
                *,
                lead:lead_id (id, name, phone, email, status, priority, score, source),
                agent:agent_id (id, full_name, role),
                approver:postpone_approved_by (id, full_name)
            `)
            .gte('scheduled_at', dayStart)
            .lte('scheduled_at', dayEnd)
            .order('scheduled_at')

        if (!all && agentId) query = query.eq('agent_id', agentId)
        if (all && agentId) query = query.eq('agent_id', agentId) // filter even in all-mode if agent specified

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ schedules: data || [], date: dateParam })
    } catch {
        return NextResponse.json({ schedules: [] })
    }
}

// PATCH /api/crm/leads/schedule — update a schedule slot (log call, request/approve postpone)
// Body variants:
//   Log call:           { id, status: 'called'|'no_answer', outcome?, notes?, actual_called_at? }
//   Request postpone:   { id, action: 'request_postpone' }
//   Approve postpone:   { id, action: 'approve_postpone', approved_by, postpone_to? }
//   Reject postpone:    { id, action: 'reject_postpone' }
//   Reassign slot:      { id, action: 'reassign', new_agent_id }
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, action, status, outcome, notes, actual_called_at, approved_by, postpone_to, new_agent_id } = body

        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        // Fetch existing schedule
        const { data: sched, error: fetchErr } = await supabase
            .from('lead_schedules')
            .select('*, lead:lead_id(id, name, assigned_to)')
            .eq('id', id)
            .single()

        if (fetchErr || !sched) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

        if (action === 'request_postpone') {
            const { data, error } = await supabase.from('lead_schedules').update({
                status: 'postpone_requested',
                postpone_requested_at: new Date().toISOString(),
            }).eq('id', id).select().single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })

            // Notify managers
            await notifyManagers(
                `Postpone request: ${sched.lead?.name}`,
                `Agent requested to postpone call scheduled at ${new Date(sched.scheduled_at).toLocaleString('en-IN')}`,
                `/crm/leads/${sched.lead_id}`
            )
            return NextResponse.json({ schedule: data })
        }

        if (action === 'approve_postpone') {
            // Determine when to reschedule
            let newTime: Date
            if (postpone_to) {
                newTime = new Date(postpone_to)
            } else {
                // Next working day at same time-of-day
                const orig = new Date(sched.scheduled_at)
                newTime = new Date(orig)
                newTime.setDate(newTime.getDate() + 1)
                while (newTime.getDay() === 0 || newTime.getDay() === 6) newTime.setDate(newTime.getDate() + 1)
            }

            // Mark current as postponed
            await supabase.from('lead_schedules').update({
                status: 'postponed',
                postpone_approved_by: approved_by || null,
                postpone_approved_at: new Date().toISOString(),
                postpone_to: newTime.toISOString(),
            }).eq('id', id)

            // Create new schedule slot
            const { data: newSched, error: insertErr } = await supabase
                .from('lead_schedules')
                .insert({
                    lead_id: sched.lead_id,
                    agent_id: sched.agent_id,
                    scheduled_at: newTime.toISOString(),
                    status: 'pending',
                })
                .select()
                .single()

            if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

            // Update lead's scheduled_call_at
            await supabase.from('leads').update({ scheduled_call_at: newTime.toISOString() }).eq('id', sched.lead_id)

            // Log activity
            await supabase.from('lead_activities').insert({
                lead_id: sched.lead_id,
                type: 'postpone',
                title: 'Call postponed',
                description: `Rescheduled to ${newTime.toLocaleString('en-IN')}`,
                metadata: { approved_by, new_schedule_id: newSched?.id },
                created_by: approved_by || 'system',
            })

            return NextResponse.json({ schedule: newSched })
        }

        if (action === 'reject_postpone') {
            const { data, error } = await supabase.from('lead_schedules').update({
                status: 'pending',
                postpone_requested_at: null,
            }).eq('id', id).select().single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ schedule: data })
        }

        if (action === 'reassign') {
            if (!new_agent_id) return NextResponse.json({ error: 'new_agent_id required' }, { status: 400 })

            await supabase.from('lead_schedules').update({ status: 'reassigned' }).eq('id', id)

            // Get new agent name
            const { data: newAgent } = await supabase.from('profiles').select('id, full_name').eq('id', new_agent_id).single()

            // Create new slot for new agent
            const { data: newSched } = await supabase.from('lead_schedules').insert({
                lead_id: sched.lead_id,
                agent_id: new_agent_id,
                scheduled_at: new Date().toISOString(), // immediate
                status: 'pending',
            }).select().single()

            await supabase.from('leads').update({ assigned_to: new_agent_id, assigned_at: new Date().toISOString() }).eq('id', sched.lead_id)

            await supabase.from('lead_activities').insert({
                lead_id: sched.lead_id,
                type: 'reassignment',
                title: `Lead reassigned to ${newAgent?.full_name || 'agent'}`,
                description: 'Reassigned due to agent absence or manager action',
                metadata: { new_agent_id },
                created_by: 'system',
            })

            return NextResponse.json({ schedule: newSched })
        }

        // Default: log call outcome
        if (!status) return NextResponse.json({ error: 'status or action required' }, { status: 400 })

        const update: Record<string, unknown> = {
            status,
            notes: notes || null,
            outcome: outcome || null,
            actual_called_at: actual_called_at || new Date().toISOString(),
        }

        const { data, error } = await supabase.from('lead_schedules').update(update).eq('id', id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Update lead last_activity_at and status if contacted
        const leadUpdate: Record<string, unknown> = { last_activity_at: new Date().toISOString() }
        if (status === 'called') leadUpdate.status = 'contacted'
        await supabase.from('leads').update(leadUpdate).eq('id', sched.lead_id)

        // Log activity
        await supabase.from('lead_activities').insert({
            lead_id: sched.lead_id,
            type: 'call',
            title: status === 'called' ? `Call logged — ${outcome || 'outcome not set'}` : 'No answer',
            description: notes || null,
            metadata: { schedule_id: id, outcome, status },
            created_by: sched.agent_id,
        })

        return NextResponse.json({ schedule: data })
    } catch {
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
    }
}

async function notifyManagers(title: string, body: string, link: string) {
    const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin'])
    for (const mgr of (managers || [])) {
        void mgr // reference to suppress unused warning
        await supabase.from('notifications').insert({ type: 'postpone_request', title, body, link })
    }
}
