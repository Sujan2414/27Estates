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

    // Fetch all bookmarks in period with user profiles
    const [bookmarksRes, profilesRes] = await Promise.all([
        admin
            .from('user_bookmarks')
            .select('user_id, property_id, project_id, created_at')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(2000),
        admin
            .from('profiles')
            .select('id, full_name, email'),
    ])

    const bookmarks = bookmarksRes.data || []
    const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
    for (const p of (profilesRes.data || [])) {
        profileMap[p.id] = { full_name: p.full_name, email: p.email }
    }

    if (bookmarks.length === 0) {
        return NextResponse.json({
            totalBookmarks: 0, uniqueUsers: 0,
            trendingProperties: [], trendingProjects: [], trendingCommercial: [], trendingWarehouse: [],
            recentActivity: [], userBookmarks: [], dailyTrend: [], allCities: [],
        })
    }

    // Count per-item bookmark counts
    const propCount: Record<string, number> = {}
    const projCount: Record<string, number> = {}
    for (const b of bookmarks) {
        if (b.property_id) propCount[b.property_id] = (propCount[b.property_id] || 0) + 1
        if (b.project_id) projCount[b.project_id] = (projCount[b.project_id] || 0) + 1
    }

    const allPropIds = Object.keys(propCount)
    const allProjIds = Object.keys(projCount)

    // Fetch details for ALL bookmarked properties + projects (used for trending + per-user maps)
    const [propsRes, projsRes] = await Promise.all([
        allPropIds.length > 0
            ? admin.from('properties').select('id, title, location, city, images, price, price_text, category').in('id', allPropIds)
            : Promise.resolve({ data: [] }),
        allProjIds.length > 0
            ? admin.from('projects').select('id, project_name, location, city, images, min_price, max_price, status, section').in('id', allProjIds)
            : Promise.resolve({ data: [] }),
    ])

    // Build lookup maps for city/section
    const propMetaMap: Record<string, { city: string; location: string }> = {}
    for (const p of (propsRes.data || [])) {
        propMetaMap[p.id] = { city: p.city || '', location: p.location || '' }
    }
    const projMetaMap: Record<string, { city: string; location: string; section: string }> = {}
    for (const p of (projsRes.data || [])) {
        projMetaMap[p.id] = { city: p.city || '', location: p.location || '', section: p.section || 'residential' }
    }

    // Trending: sort by bookmark count, take top 10 each
    const trendingProperties = (propsRes.data || [])
        .map(p => ({ ...p, bookmarkCount: propCount[p.id] || 0 }))
        .sort((a, b) => b.bookmarkCount - a.bookmarkCount)
        .slice(0, 10)

    const allProjects = (projsRes.data || [])
        .map(p => ({ ...p, name: p.project_name, bookmarkCount: projCount[p.id] || 0 }))
        .sort((a, b) => b.bookmarkCount - a.bookmarkCount)

    const trendingProjects = allProjects.filter(p => !p.section || p.section === 'residential').slice(0, 10)
    const trendingCommercial = allProjects.filter(p => p.section === 'commercial').slice(0, 10)
    const trendingWarehouse = allProjects.filter(p => p.section === 'warehouse').slice(0, 10)

    // Per-user bookmark summary — with section breakdown and cities
    const userMap: Record<string, {
        name: string | null; email: string | null
        propertyCount: number; projectCount: number; commercialCount: number; warehouseCount: number
        lastBookmarked: string; cities: Set<string>
    }> = {}

    for (const b of bookmarks) {
        if (!userMap[b.user_id]) {
            const prof = profileMap[b.user_id]
            userMap[b.user_id] = {
                name: prof?.full_name || null, email: prof?.email || null,
                propertyCount: 0, projectCount: 0, commercialCount: 0, warehouseCount: 0,
                lastBookmarked: b.created_at, cities: new Set()
            }
        }
        const u = userMap[b.user_id]
        if (b.created_at > u.lastBookmarked) u.lastBookmarked = b.created_at

        if (b.property_id) {
            u.propertyCount++
            const meta = propMetaMap[b.property_id]
            const city = meta?.city || meta?.location
            if (city) u.cities.add(city)
        }
        if (b.project_id) {
            const meta = projMetaMap[b.project_id]
            const section = meta?.section || 'residential'
            if (section === 'commercial') u.commercialCount++
            else if (section === 'warehouse') u.warehouseCount++
            else u.projectCount++
            const city = meta?.city || meta?.location
            if (city) u.cities.add(city)
        }
    }

    const userBookmarks = Object.entries(userMap)
        .map(([user_id, d]) => ({
            user_id,
            name: d.name,
            email: d.email,
            propertyCount: d.propertyCount,
            projectCount: d.projectCount,
            commercialCount: d.commercialCount,
            warehouseCount: d.warehouseCount,
            total: d.propertyCount + d.projectCount + d.commercialCount + d.warehouseCount,
            lastBookmarked: d.lastBookmarked,
            cities: Array.from(d.cities).filter(Boolean).sort(),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 50)

    // All unique cities across all bookmarked listings
    const allCities = Array.from(new Set([
        ...(propsRes.data || []).map((p: { city?: string | null }) => p.city).filter(Boolean),
        ...(projsRes.data || []).map((p: { city?: string | null }) => p.city).filter(Boolean),
    ])).sort() as string[]

    // Recent bookmark activity (latest 20)
    const recentActivity = bookmarks.slice(0, 20).map(b => {
        const prof = profileMap[b.user_id]
        return {
            user_id: b.user_id,
            user_name: prof?.full_name || prof?.email?.split('@')[0] || 'Unknown',
            user_email: prof?.email || null,
            type: b.property_id ? 'property' : 'project',
            item_id: b.property_id || b.project_id,
            created_at: b.created_at,
        }
    })

    // Daily bookmark trend
    const dayMap: Record<string, { total: number; properties: number; projects: number }> = {}
    for (const b of bookmarks) {
        const day = b.created_at.slice(0, 10)
        if (!dayMap[day]) dayMap[day] = { total: 0, properties: 0, projects: 0 }
        dayMap[day].total++
        if (b.property_id) dayMap[day].properties++
        if (b.project_id) dayMap[day].projects++
    }
    const dailyTrend = Object.entries(dayMap)
        .map(([date, d]) => ({ date, ...d }))
        .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
        totalBookmarks: bookmarks.length,
        uniqueUsers: Object.keys(userMap).length,
        trendingProperties,
        trendingProjects,
        trendingCommercial,
        trendingWarehouse,
        recentActivity,
        userBookmarks,
        dailyTrend,
        allCities,
    })
}
