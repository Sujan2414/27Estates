export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailByCategory } from '@/lib/crm/email'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Trigger definitions ───────────────────────────────────────────────────
export const NURTURE_TRIGGERS = [
    {
        id: 'stale_hot',
        name: 'Hot Lead Gone Silent',
        description: 'Hot leads with no activity in 5+ days',
        icon: '🔥',
        emailCategory: 'follow_up',
        color: '#ef4444',
    },
    {
        id: 'stale_warm',
        name: 'Warm Lead Follow-Up',
        description: 'Warm leads not contacted in 7+ days',
        icon: '🟡',
        emailCategory: 'follow_up',
        color: '#f59e0b',
    },
    {
        id: 'new_uncontacted',
        name: 'Fresh Lead — No Touch',
        description: 'New leads older than 24h with no contact activity',
        icon: '🆕',
        emailCategory: 'welcome',
        color: '#3b82f6',
    },
    {
        id: 'revisit_no_lead',
        name: 'Return Visitor Welcome',
        description: 'Website users who revisited a listing 2+ times but never submitted a form — send welcome',
        icon: '👀',
        emailCategory: 'welcome',
        color: '#8b5cf6',
    },
    {
        id: 'overdue_followup',
        name: 'Overdue Follow-Up',
        description: 'Leads with a past next_follow_up_at date',
        icon: '⏰',
        emailCategory: 'follow_up',
        color: '#f97316',
    },
]

// GET: evaluate which leads match each trigger
export async function GET() {
    const now = Date.now()
    const since5d = new Date(now - 5 * 86400000).toISOString()
    const since7d = new Date(now - 7 * 86400000).toISOString()
    const since24h = new Date(now - 86400000).toISOString()

    const [hotStaleRes, warmStaleRes, freshRes, overdueRes] = await Promise.all([
        // Hot + no contact in 5d
        admin.from('leads')
            .select('id, name, email, phone, priority, status, score, last_contacted_at, created_at')
            .eq('priority', 'hot')
            .in('status', ['new', 'contacted', 'qualified', 'negotiation'])
            .or(`last_contacted_at.is.null,last_contacted_at.lt.${since5d}`)
            .order('score', { ascending: false })
            .limit(20),

        // Warm + no contact in 7d
        admin.from('leads')
            .select('id, name, email, phone, priority, status, score, last_contacted_at, created_at')
            .eq('priority', 'warm')
            .in('status', ['new', 'contacted', 'qualified'])
            .or(`last_contacted_at.is.null,last_contacted_at.lt.${since7d}`)
            .order('score', { ascending: false })
            .limit(20),

        // New + created > 24h ago + never contacted
        admin.from('leads')
            .select('id, name, email, phone, priority, status, score, last_contacted_at, created_at')
            .eq('status', 'new')
            .lt('created_at', since24h)
            .is('last_contacted_at', null)
            .order('created_at', { ascending: true })
            .limit(15),

        // Overdue follow-ups
        admin.from('leads')
            .select('id, name, email, phone, priority, status, score, next_follow_up_at')
            .not('next_follow_up_at', 'is', null)
            .lt('next_follow_up_at', new Date().toISOString())
            .in('status', ['new', 'contacted', 'qualified', 'negotiation', 'site_visit'])
            .order('next_follow_up_at', { ascending: true })
            .limit(20),
    ])

    const triggerResults: Record<string, { lead_id: string; name: string; email: string | null; phone: string | null; priority: string; status: string; score: number; meta: string }[]> = {}

    triggerResults['stale_hot'] = (hotStaleRes.data || []).map(l => ({
        lead_id: l.id, name: l.name, email: l.email, phone: l.phone, priority: l.priority, status: l.status, score: l.score || 0,
        meta: l.last_contacted_at ? `Last contact ${Math.floor((now - new Date(l.last_contacted_at).getTime()) / 86400000)}d ago` : 'Never contacted',
    }))

    triggerResults['stale_warm'] = (warmStaleRes.data || []).map(l => ({
        lead_id: l.id, name: l.name, email: l.email, phone: l.phone, priority: l.priority, status: l.status, score: l.score || 0,
        meta: l.last_contacted_at ? `Last contact ${Math.floor((now - new Date(l.last_contacted_at).getTime()) / 86400000)}d ago` : 'Never contacted',
    }))

    triggerResults['new_uncontacted'] = (freshRes.data || []).map(l => ({
        lead_id: l.id, name: l.name, email: l.email, phone: l.phone, priority: l.priority, status: l.status, score: l.score || 0,
        meta: `Created ${Math.floor((now - new Date(l.created_at).getTime()) / 3600000)}h ago`,
    }))

    triggerResults['overdue_followup'] = (overdueRes.data || []).map(l => ({
        lead_id: l.id, name: l.name, email: l.email, phone: l.phone, priority: l.priority, status: l.status, score: l.score || 0,
        meta: `Follow-up due ${Math.floor((now - new Date(l.next_follow_up_at!).getTime()) / 86400000)}d ago`,
    }))

    triggerResults['revisit_no_lead'] = [] // requires website data — shown as 0 for now

    return NextResponse.json({ triggers: NURTURE_TRIGGERS, results: triggerResults })
}

// POST: fire email for a trigger + lead
export async function POST(req: Request) {
    const { trigger_id, lead_id } = await req.json()

    const triggerDef = NURTURE_TRIGGERS.find(t => t.id === trigger_id)
    if (!triggerDef) return NextResponse.json({ error: 'Unknown trigger' }, { status: 400 })

    const { data: lead } = await admin.from('leads').select('id, name, email, phone, priority, status').eq('id', lead_id).single()
    if (!lead || !lead.email) return NextResponse.json({ error: 'Lead not found or no email' }, { status: 404 })

    await sendEmailByCategory(triggerDef.emailCategory as Parameters<typeof sendEmailByCategory>[0], lead.email, {
        name: lead.name,
    }, lead_id)

    // Log activity
    await admin.from('lead_activities').insert({
        lead_id,
        type: 'email',
        title: `Nurture email sent: ${triggerDef.name}`,
        description: `Automated nurture email (${triggerDef.emailCategory}) triggered by rule "${triggerDef.name}"`,
        created_by: 'system',
    })

    return NextResponse.json({ success: true })
}
