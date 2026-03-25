import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)
    if (!email) return NextResponse.json({ linked: false })

    const since = new Date(Date.now() - days * 86400000).toISOString()

    // Find profile by email
    const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .ilike('email', email.trim())
        .limit(1)

    if (!profiles?.length) return NextResponse.json({ linked: false })
    const user_id = profiles[0].id

    // Fetch page views + bookmarks in parallel
    const [viewsRes, bookmarksRes] = await Promise.all([
        admin.from('user_page_views')
            .select('page_path, page_title, duration_seconds, session_id, created_at')
            .eq('user_id', user_id)
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(200),
        admin.from('user_bookmarks')
            .select('property_id, project_id, created_at')
            .eq('user_id', user_id)
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
    const topPages = Object.entries(pageMap)
        .map(([path, d]) => ({ path, ...d, avgSecs: d.visits > 0 ? Math.round(d.totalSecs / d.visits) : 0 }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 8)

    // Summary
    const totalViews = views.length
    const uniqueSessions = new Set(views.map(r => r.session_id)).size
    const totalSecs = views.reduce((s, r) => s + (r.duration_seconds || 0), 0)
    const lastSeen = views[0]?.created_at || null

    // Identify listing pages visited (properties/projects)
    const propViewMap: Record<string, number> = {}
    const projViewMap: Record<string, number> = {}
    for (const v of views) {
        const pm = v.page_path.match(/^\/properties\/([a-f0-9-]{36})$/)
        if (pm) propViewMap[pm[1]] = (propViewMap[pm[1]] || 0) + 1
        const jm = v.page_path.match(/^\/projects\/([a-f0-9-]{36})$/)
        if (jm) projViewMap[jm[1]] = (projViewMap[jm[1]] || 0) + 1
    }

    // Fetch bookmarked + viewed listings details
    const propIds = [...new Set([
        ...bookmarks.filter(b => b.property_id).map(b => b.property_id!),
        ...Object.keys(propViewMap),
    ])]
    const projIds = [...new Set([
        ...bookmarks.filter(b => b.project_id).map(b => b.project_id!),
        ...Object.keys(projViewMap),
    ])]

    const [propsRes, projsRes] = await Promise.all([
        propIds.length > 0
            ? admin.from('properties').select('id, title, location, city, images, price_text, category').in('id', propIds)
            : Promise.resolve({ data: [] }),
        projIds.length > 0
            ? admin.from('projects').select('id, project_name, location, city, images, status, section').in('id', projIds)
            : Promise.resolve({ data: [] }),
    ])

    const propMap = Object.fromEntries((propsRes.data || []).map(p => [p.id, p]))
    const projMap = Object.fromEntries((projsRes.data || []).map(p => [p.id, p]))

    const bookmarkSet = new Set([
        ...bookmarks.filter(b => b.property_id).map(b => b.property_id!),
        ...bookmarks.filter(b => b.project_id).map(b => b.project_id!),
    ])

    // Build viewed listings list (most viewed first)
    const viewedListings = [
        ...Object.entries(propViewMap).filter(([id]) => propMap[id]).map(([id, views]) => ({
            id, type: 'property' as const, title: propMap[id].title,
            location: propMap[id].city || propMap[id].location,
            image: propMap[id].images?.[0] || null,
            category: propMap[id].category,
            views, bookmarked: bookmarkSet.has(id),
            href: `/properties/${id}`,
        })),
        ...Object.entries(projViewMap).filter(([id]) => projMap[id]).map(([id, views]) => ({
            id, type: 'project' as const, title: projMap[id].project_name,
            location: projMap[id].city || projMap[id].location,
            image: projMap[id].images?.[0] || null,
            category: projMap[id].section || 'residential',
            views, bookmarked: bookmarkSet.has(id),
            href: `/projects/${id}`,
        })),
    ].sort((a, b) => b.views - a.views).slice(0, 10)

    // Bookmarked items not already in viewedListings
    const savedListings = [
        ...bookmarks.filter(b => b.property_id && propMap[b.property_id]).map(b => ({
            id: b.property_id!, type: 'property' as const,
            title: propMap[b.property_id!].title,
            location: propMap[b.property_id!].city || propMap[b.property_id!].location,
            image: propMap[b.property_id!].images?.[0] || null,
            category: propMap[b.property_id!].category,
            savedAt: b.created_at, href: `/properties/${b.property_id}`,
        })),
        ...bookmarks.filter(b => b.project_id && projMap[b.project_id]).map(b => ({
            id: b.project_id!, type: 'project' as const,
            title: projMap[b.project_id!].project_name,
            location: projMap[b.project_id!].city || projMap[b.project_id!].location,
            image: projMap[b.project_id!].images?.[0] || null,
            category: projMap[b.project_id!].section || 'residential',
            savedAt: b.created_at, href: `/projects/${b.project_id}`,
        })),
    ].slice(0, 10)

    return NextResponse.json({
        linked: true,
        user_id,
        lastSeen,
        totalViews,
        uniqueSessions,
        totalSecs,
        totalBookmarks: bookmarks.length,
        topPages,
        viewedListings,
        savedListings,
        recentViews: views.slice(0, 5),
    })
}
