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
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
        totalLeads,
        newLeads,
        todayLeads,
        weekLeads,
        byStatus,
        bySource,
        overdueTasks,
        hotLeads,
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
    })
}
