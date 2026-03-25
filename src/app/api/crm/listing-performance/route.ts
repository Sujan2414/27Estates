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

    // Fetch all page views in period
    const { data: views } = await admin
        .from('user_page_views')
        .select('page_path, user_id, session_id, duration_seconds, created_at')
        .gte('created_at', since)

    // Fetch all bookmarks in period
    const { data: bookmarks } = await admin
        .from('user_bookmarks')
        .select('property_id, project_id, user_id, created_at')
        .gte('created_at', since)

    // Fetch all leads in period (for inquiry counts)
    const { data: leads } = await admin
        .from('leads')
        .select('id, property_interest, project_interest, source, created_at')
        .gte('created_at', since)

    const allViews = views || []
    const allBookmarks = bookmarks || []
    const allLeads = leads || []

    // Aggregate property page views
    const propStats: Record<string, { views: number; uniqueUsers: Set<string>; totalSecs: number; returnVisitors: Set<string> }> = {}
    const projStats: Record<string, { views: number; uniqueUsers: Set<string>; totalSecs: number; returnVisitors: Set<string> }> = {}

    // Track per-user per-listing view count (for return visitor detection)
    const propUserViews: Record<string, Record<string, number>> = {}
    const projUserViews: Record<string, Record<string, number>> = {}

    for (const v of allViews) {
        const pm = v.page_path.match(/^\/properties\/([a-f0-9-]{36})$/)
        if (pm) {
            const id = pm[1]
            if (!propStats[id]) propStats[id] = { views: 0, uniqueUsers: new Set(), totalSecs: 0, returnVisitors: new Set() }
            propStats[id].views++
            propStats[id].uniqueUsers.add(v.user_id || v.session_id)
            propStats[id].totalSecs += v.duration_seconds || 0
            if (v.user_id) {
                if (!propUserViews[id]) propUserViews[id] = {}
                propUserViews[id][v.user_id] = (propUserViews[id][v.user_id] || 0) + 1
            }
        }
        const jm = v.page_path.match(/^\/projects\/([a-f0-9-]{36})$/)
        if (jm) {
            const id = jm[1]
            if (!projStats[id]) projStats[id] = { views: 0, uniqueUsers: new Set(), totalSecs: 0, returnVisitors: new Set() }
            projStats[id].views++
            projStats[id].uniqueUsers.add(v.user_id || v.session_id)
            projStats[id].totalSecs += v.duration_seconds || 0
            if (v.user_id) {
                if (!projUserViews[id]) projUserViews[id] = {}
                projUserViews[id][v.user_id] = (projUserViews[id][v.user_id] || 0) + 1
            }
        }
    }

    // Mark return visitors (viewed same listing 2+ times)
    for (const [id, userMap] of Object.entries(propUserViews)) {
        for (const [uid, cnt] of Object.entries(userMap)) {
            if (cnt >= 2 && propStats[id]) propStats[id].returnVisitors.add(uid)
        }
    }
    for (const [id, userMap] of Object.entries(projUserViews)) {
        for (const [uid, cnt] of Object.entries(userMap)) {
            if (cnt >= 2 && projStats[id]) projStats[id].returnVisitors.add(uid)
        }
    }

    // Bookmark counts
    const propBmCount: Record<string, number> = {}
    const projBmCount: Record<string, number> = {}
    for (const b of allBookmarks) {
        if (b.property_id) propBmCount[b.property_id] = (propBmCount[b.property_id] || 0) + 1
        if (b.project_id) projBmCount[b.project_id] = (projBmCount[b.project_id] || 0) + 1
    }

    // Inquiry counts from leads
    const propInqCount: Record<string, number> = {}
    const projInqCount: Record<string, number> = {}
    for (const l of allLeads) {
        if (l.property_interest) propInqCount[l.property_interest] = (propInqCount[l.property_interest] || 0) + 1
        if (l.project_interest) projInqCount[l.project_interest] = (projInqCount[l.project_interest] || 0) + 1
    }

    // Fetch listing details for all tracked IDs
    const propIds = [...new Set([...Object.keys(propStats), ...Object.keys(propBmCount)])]
    const projIds = [...new Set([...Object.keys(projStats), ...Object.keys(projBmCount)])]

    const [propsRes, projsRes] = await Promise.all([
        propIds.length > 0
            ? admin.from('properties').select('id, title, location, city, images, price_text, category').in('id', propIds)
            : Promise.resolve({ data: [] }),
        projIds.length > 0
            ? admin.from('projects').select('id, project_name, location, city, images, status, section, min_price, max_price').in('id', projIds)
            : Promise.resolve({ data: [] }),
    ])

    const buildHealth = (views: number, bookmarks: number, inquiries: number): 'great' | 'good' | 'warning' | 'poor' => {
        if (views === 0) return 'poor'
        const bmRate = bookmarks / views
        const inqRate = inquiries / Math.max(bookmarks, 1)
        if (bmRate >= 0.1 && inqRate >= 0.2) return 'great'
        if (bmRate >= 0.05) return 'good'
        if (views >= 20 && bookmarks === 0) return 'poor'
        return 'warning'
    }

    const properties = (propsRes.data || []).map(p => {
        const s = propStats[p.id] || { views: 0, uniqueUsers: new Set(), totalSecs: 0, returnVisitors: new Set() }
        const bm = propBmCount[p.id] || 0
        const inq = propInqCount[p.id] || 0
        return {
            id: p.id, type: 'property' as const,
            title: p.title, location: p.city || p.location,
            image: p.images?.[0] || null, category: p.category, price_text: p.price_text,
            views: s.views, uniqueUsers: s.uniqueUsers.size, avgSecs: s.views > 0 ? Math.round(s.totalSecs / s.views) : 0,
            returnVisitors: s.returnVisitors.size, bookmarks: bm, inquiries: inq,
            bmRate: s.views > 0 ? Math.round((bm / s.views) * 100) : 0,
            inqRate: bm > 0 ? Math.round((inq / bm) * 100) : 0,
            health: buildHealth(s.views, bm, inq),
            href: `/properties/${p.id}`,
        }
    }).sort((a, b) => b.views - a.views)

    const projects = (projsRes.data || []).map(p => {
        const s = projStats[p.id] || { views: 0, uniqueUsers: new Set(), totalSecs: 0, returnVisitors: new Set() }
        const bm = projBmCount[p.id] || 0
        const inq = projInqCount[p.id] || 0
        return {
            id: p.id, type: 'project' as const,
            title: p.project_name, location: p.city || p.location,
            image: p.images?.[0] || null, section: p.section || 'residential', status: p.status,
            views: s.views, uniqueUsers: s.uniqueUsers.size, avgSecs: s.views > 0 ? Math.round(s.totalSecs / s.views) : 0,
            returnVisitors: s.returnVisitors.size, bookmarks: bm, inquiries: inq,
            bmRate: s.views > 0 ? Math.round((bm / s.views) * 100) : 0,
            inqRate: bm > 0 ? Math.round((inq / bm) * 100) : 0,
            health: buildHealth(s.views, bm, inq),
            href: `/projects/${p.id}`,
        }
    }).sort((a, b) => b.views - a.views)

    return NextResponse.json({ properties, projects })
}
