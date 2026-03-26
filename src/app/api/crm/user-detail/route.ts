export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)
    const since = new Date(Date.now() - days * 86400000).toISOString()

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const [viewsRes, bookmarksRes] = await Promise.all([
        admin
            .from('user_page_views')
            .select('page_path, page_title, duration_seconds, session_id, created_at')
            .eq('user_id', user_id)
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(500),
        admin
            .from('user_bookmarks')
            .select('property_id, project_id, created_at')
            .eq('user_id', user_id)
            .gte('created_at', since)
            .order('created_at', { ascending: false }),
    ])

    const views = viewsRes.data || []
    const bookmarks = bookmarksRes.data || []

    // Aggregate per-page stats
    const pageMap: Record<string, { title: string; visits: number; totalSecs: number; lastVisit: string }> = {}
    for (const r of views) {
        if (!pageMap[r.page_path]) {
            pageMap[r.page_path] = { title: r.page_title || r.page_path, visits: 0, totalSecs: 0, lastVisit: r.created_at }
        }
        pageMap[r.page_path].visits++
        pageMap[r.page_path].totalSecs += r.duration_seconds || 0
        if (r.created_at > pageMap[r.page_path].lastVisit) pageMap[r.page_path].lastVisit = r.created_at
    }
    const pageStats = Object.entries(pageMap)
        .map(([path, d]) => ({ path, ...d, avgSecs: d.visits > 0 ? Math.round(d.totalSecs / d.visits) : 0 }))
        .sort((a, b) => b.totalSecs - a.totalSecs)

    // Summary
    const totalViews = views.length
    const uniqueSessions = new Set(views.map(r => r.session_id)).size
    const totalSecs = views.reduce((s, r) => s + (r.duration_seconds || 0), 0)

    // Bookmarks — fetch property/project details
    const propIds = bookmarks.filter(b => b.property_id).map(b => b.property_id!)
    const projIds = bookmarks.filter(b => b.project_id).map(b => b.project_id!)

    const [propsRes, projsRes] = await Promise.all([
        propIds.length > 0
            ? admin.from('properties').select('id, title, location, city, images, price, price_text, category').in('id', propIds)
            : Promise.resolve({ data: [] }),
        projIds.length > 0
            ? admin.from('projects').select('id, project_name, location, city, images, min_price, max_price, status, section').in('id', projIds)
            : Promise.resolve({ data: [] }),
    ])

    const propMap = Object.fromEntries((propsRes.data || []).map(p => [p.id, p]))
    const projMap = Object.fromEntries((projsRes.data || []).map(p => [p.id, p]))

    const savedProperties = bookmarks
        .filter(b => b.property_id && propMap[b.property_id])
        .map(b => ({ ...propMap[b.property_id!], savedAt: b.created_at }))

    const allSavedProjects = bookmarks
        .filter(b => b.project_id && projMap[b.project_id])
        .map(b => ({ ...projMap[b.project_id!], name: projMap[b.project_id!].project_name, savedAt: b.created_at }))

    const savedProjects = allSavedProjects.filter(p => !p.section || p.section === 'residential')
    const savedCommercial = allSavedProjects.filter(p => p.section === 'commercial')
    const savedWarehouse = allSavedProjects.filter(p => p.section === 'warehouse')

    return NextResponse.json({
        totalViews, uniqueSessions, totalSecs,
        totalBookmarks: bookmarks.length,
        pageStats,
        savedProperties,
        savedProjects,
        savedCommercial,
        savedWarehouse,
        recentViews: views.slice(0, 30),
    })
}
