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

    const { data: rows, error } = await admin
        .from('user_page_views')
        .select('user_id, user_email, session_id, page_path, page_title, duration_seconds, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows) return NextResponse.json({ totalViews: 0, uniqueUsers: 0, uniqueSessions: 0, avgSessionDuration: 0, topUsers: [], topPages: [], dailyTrend: [] })

    // ── Aggregations ────────────────────────────────────────────────
    const totalViews = rows.length
    const uniqueUsers = new Set(rows.filter(r => r.user_id).map(r => r.user_id)).size
    const uniqueSessions = new Set(rows.map(r => r.session_id)).size

    // Avg session duration
    const sessionMap: Record<string, number> = {}
    for (const r of rows) {
        sessionMap[r.session_id] = (sessionMap[r.session_id] || 0) + (r.duration_seconds || 0)
    }
    const sessionDurations = Object.values(sessionMap)
    const avgSessionDuration = sessionDurations.length
        ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
        : 0

    // Top users (authenticated only)
    const userMap: Record<string, { user_email: string; views: number; sessions: Set<string>; totalSecs: number; lastSeen: string }> = {}
    for (const r of rows) {
        if (!r.user_id) continue
        if (!userMap[r.user_id]) {
            userMap[r.user_id] = { user_email: r.user_email || 'Unknown', views: 0, sessions: new Set(), totalSecs: 0, lastSeen: r.created_at }
        }
        userMap[r.user_id].views++
        userMap[r.user_id].sessions.add(r.session_id)
        userMap[r.user_id].totalSecs += r.duration_seconds || 0
        if (r.created_at > userMap[r.user_id].lastSeen) userMap[r.user_id].lastSeen = r.created_at
    }
    const topUsers = Object.entries(userMap)
        .map(([user_id, d]) => ({
            user_id,
            user_email: d.user_email,
            views: d.views,
            sessions: d.sessions.size,
            totalSecs: d.totalSecs,
            lastSeen: d.lastSeen,
        }))
        .sort((a, b) => b.totalSecs - a.totalSecs)
        .slice(0, 20)

    // Top pages
    const pageMap: Record<string, { title: string; views: number; users: Set<string>; totalSecs: number }> = {}
    for (const r of rows) {
        if (!pageMap[r.page_path]) {
            pageMap[r.page_path] = { title: r.page_title || r.page_path, views: 0, users: new Set(), totalSecs: 0 }
        }
        pageMap[r.page_path].views++
        if (r.user_id) pageMap[r.page_path].users.add(r.user_id)
        pageMap[r.page_path].totalSecs += r.duration_seconds || 0
    }
    const topPages = Object.entries(pageMap)
        .map(([path, d]) => ({
            path,
            title: d.title,
            views: d.views,
            uniqueUsers: d.users.size,
            avgSecs: d.views > 0 ? Math.round(d.totalSecs / d.views) : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20)

    // Daily trend (last `days` days)
    const dayMap: Record<string, { views: number; users: Set<string>; sessions: Set<string> }> = {}
    for (const r of rows) {
        const day = r.created_at.slice(0, 10)
        if (!dayMap[day]) dayMap[day] = { views: 0, users: new Set(), sessions: new Set() }
        dayMap[day].views++
        if (r.user_id) dayMap[day].users.add(r.user_id)
        dayMap[day].sessions.add(r.session_id)
    }
    const dailyTrend = Object.entries(dayMap)
        .map(([date, d]) => ({ date, views: d.views, users: d.users.size, sessions: d.sessions.size }))
        .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
        totalViews,
        uniqueUsers,
        uniqueSessions,
        avgSessionDuration,
        topUsers,
        topPages,
        dailyTrend,
    })
}
