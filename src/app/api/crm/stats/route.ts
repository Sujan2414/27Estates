import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

    const [
        totalLeads,
        newLeads,
        todayLeads,
        weekLeads,
        byStatus,
        bySource,
        overdueTasks,
        hotLeads,
        unassignedLeads,
        staleLeads,
        overdueFollowups,
        upcomingVisits,
    ] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('leads').select('status'),
        supabase.from('leads').select('source'),
        supabase.from('lead_tasks').select('id', { count: 'exact', head: true })
            .eq('is_completed', false)
            .lt('due_date', now.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('priority', 'hot'),
        // Unassigned active leads
        supabase.from('leads').select('id, name, created_at, priority, source', { count: 'exact' })
            .is('assigned_agent_id', null)
            .not('status', 'in', '("converted","lost")')
            .order('created_at', { ascending: false })
            .limit(5),
        // Stale leads — active leads with no activity for 3+ days
        supabase.from('leads').select('id, name, status, priority, updated_at, source')
            .not('status', 'in', '("converted","lost")')
            .lt('updated_at', threeDaysAgo)
            .order('updated_at', { ascending: true })
            .limit(5),
        // Overdue follow-ups
        supabase.from('leads').select('id, name, next_follow_up_at, priority, status')
            .not('status', 'in', '("converted","lost")')
            .lt('next_follow_up_at', now.toISOString())
            .not('next_follow_up_at', 'is', null)
            .order('next_follow_up_at', { ascending: true })
            .limit(5),
        // Today's upcoming visits
        supabase.from('site_visits').select('id, lead_id, visit_date, visit_time, status, leads(name)')
            .eq('status', 'scheduled')
            .gte('visit_date', today.split('T')[0])
            .order('visit_date', { ascending: true })
            .limit(5),
    ])

    // Count by status
    const statusCounts: Record<string, number> = {}
    byStatus.data?.forEach((row: { status: string }) => {
        statusCounts[row.status] = (statusCounts[row.status] || 0) + 1
    })

    // Count by source
    const sourceCounts: Record<string, number> = {}
    bySource.data?.forEach((row: { source: string }) => {
        sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1
    })

    // Conversion rate
    const converted = statusCounts['converted'] || 0
    const total = totalLeads.count || 0
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0'

    return NextResponse.json({
        total: total,
        new: newLeads.count || 0,
        today: todayLeads.count || 0,
        thisWeek: weekLeads.count || 0,
        hot: hotLeads.count || 0,
        overdueTasks: overdueTasks.count || 0,
        conversionRate,
        byStatus: statusCounts,
        bySource: sourceCounts,
        // Attention items
        attention: {
            unassigned: unassignedLeads.data || [],
            unassignedCount: unassignedLeads.count || 0,
            stale: staleLeads.data || [],
            overdueFollowups: overdueFollowups.data || [],
            upcomingVisits: upcomingVisits.data || [],
        },
    })
}
