export const dynamic = 'force-dynamic'

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

    // Get all usage data for the last 30 days
    const { data: usageData } = await supabase
        .from('api_usage')
        .select('*')
        .gte('created_at', monthAgo)
        .order('created_at', { ascending: true })

    const entries = usageData || []

    // Totals
    const totalTokens = entries.reduce((sum, e) => sum + (e.total_tokens || 0), 0)
    const totalCost = entries.reduce((sum, e) => sum + parseFloat(e.estimated_cost || '0'), 0)
    const totalRequests = entries.length

    // Today
    const todayEntries = entries.filter(e => e.created_at >= today)
    const todayTokens = todayEntries.reduce((sum, e) => sum + (e.total_tokens || 0), 0)
    const todayCost = todayEntries.reduce((sum, e) => sum + parseFloat(e.estimated_cost || '0'), 0)
    const todayRequests = todayEntries.length

    // This week
    const weekEntries = entries.filter(e => e.created_at >= weekAgo)
    const weekTokens = weekEntries.reduce((sum, e) => sum + (e.total_tokens || 0), 0)
    const weekCost = weekEntries.reduce((sum, e) => sum + parseFloat(e.estimated_cost || '0'), 0)

    // Daily breakdown for chart (last 30 days)
    const dailyMap: Record<string, { tokens: number; cost: number; requests: number }> = {}
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000)
        const key = d.toISOString().split('T')[0]
        dailyMap[key] = { tokens: 0, cost: 0, requests: 0 }
    }
    entries.forEach(e => {
        const key = new Date(e.created_at).toISOString().split('T')[0]
        if (dailyMap[key]) {
            dailyMap[key].tokens += e.total_tokens || 0
            dailyMap[key].cost += parseFloat(e.estimated_cost || '0')
            dailyMap[key].requests += 1
        }
    })

    const daily = Object.entries(dailyMap).map(([date, data]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        ...data,
        cost: parseFloat(data.cost.toFixed(4)),
    }))

    return NextResponse.json({
        total: { tokens: totalTokens, cost: totalCost.toFixed(4), requests: totalRequests },
        today: { tokens: todayTokens, cost: todayCost.toFixed(4), requests: todayRequests },
        week: { tokens: weekTokens, cost: weekCost.toFixed(4) },
        daily,
    })
}
