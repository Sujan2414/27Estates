export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)
    const since = new Date(Date.now() - days * 86400000).toISOString()

    // Fetch agents (CRM profiles with agent/admin role)
    const { data: agents } = await admin
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['agent', 'admin', 'super_admin'])

    if (!agents || agents.length === 0) {
        return NextResponse.json({ agents: [] })
    }

    const agentIds = agents.map(a => a.id)

    // Fetch leads assigned to agents in period
    const [leadsRes, activitiesRes] = await Promise.all([
        admin.from('leads')
            .select('id, assigned_to, status, priority, score, created_at, last_contacted_at, budget_min, budget_max')
            .in('assigned_to', agentIds)
            .gte('created_at', since),
        admin.from('lead_activities')
            .select('lead_id, type, created_at, created_by')
            .gte('created_at', since)
            .in('type', ['call', 'email', 'note', 'meeting', 'whatsapp', 'site_visit', 'status_change']),
    ])

    const leads = leadsRes.data || []
    const activities = activitiesRes.data || []

    // Per-agent stats
    const agentStats: Record<string, {
        total_leads: number
        converted: number
        lost: number
        active: number
        hot_leads: number
        avg_score: number
        total_activities: number
        contact_activities: number
        pipeline_value: number
        weighted_value: number
        days_to_first_contact: number[]
    }> = {}

    for (const a of agents) {
        agentStats[a.id] = {
            total_leads: 0, converted: 0, lost: 0, active: 0, hot_leads: 0,
            avg_score: 0, total_activities: 0, contact_activities: 0,
            pipeline_value: 0, weighted_value: 0, days_to_first_contact: [],
        }
    }

    const STAGE_PROB: Record<string, number> = {
        new: 0.05, contacted: 0.15, qualified: 0.35,
        negotiation: 0.60, site_visit: 0.75, converted: 1.0, lost: 0,
    }

    for (const l of leads) {
        if (!l.assigned_to || !agentStats[l.assigned_to]) continue
        const s = agentStats[l.assigned_to]
        s.total_leads++
        if (l.status === 'converted') s.converted++
        else if (l.status === 'lost') s.lost++
        else s.active++
        if (l.priority === 'hot') s.hot_leads++

        const mid = ((l.budget_min || 0) + (l.budget_max || l.budget_min || 0)) / 2
        s.pipeline_value += mid
        s.weighted_value += mid * (STAGE_PROB[l.status] || 0)
    }

    // Activities per agent
    for (const a of activities) {
        if (!a.created_by) continue
        const s = agentStats[a.created_by]
        if (!s) continue
        s.total_activities++
        if (['call', 'email', 'whatsapp', 'meeting'].includes(a.type)) s.contact_activities++
    }

    // Avg score
    for (const agentId of agentIds) {
        const agentLeads = leads.filter(l => l.assigned_to === agentId)
        if (agentLeads.length > 0) {
            agentStats[agentId].avg_score = Math.round(
                agentLeads.reduce((s, l) => s + (l.score || 0), 0) / agentLeads.length
            )
        }
    }

    // Build result
    const result = agents.map(a => {
        const s = agentStats[a.id]
        const winRate = s.total_leads > 0 ? Math.round((s.converted / s.total_leads) * 100) : 0
        const responseRate = s.total_leads > 0 ? Math.round((s.contact_activities / Math.max(s.total_leads, 1)) * 100) : 0
        return {
            id: a.id,
            name: a.full_name,
            email: a.email,
            role: a.role,
            total_leads: s.total_leads,
            converted: s.converted,
            lost: s.lost,
            active: s.active,
            hot_leads: s.hot_leads,
            win_rate: winRate,
            avg_score: s.avg_score,
            total_activities: s.total_activities,
            contact_activities: s.contact_activities,
            response_rate: responseRate,
            pipeline_value: Math.round(s.pipeline_value),
            weighted_value: Math.round(s.weighted_value),
        }
    }).sort((a, b) => b.converted - a.converted || b.total_leads - a.total_leads)

    return NextResponse.json({ agents: result, days })
}
