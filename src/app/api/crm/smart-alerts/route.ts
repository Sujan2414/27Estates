import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const now = Date.now()
    const since24h = new Date(now - 86400000).toISOString()
    const since7d = new Date(now - 7 * 86400000).toISOString()
    const since48h = new Date(now - 2 * 86400000).toISOString()
    const since30d = new Date(now - 30 * 86400000).toISOString()

    // 1. Leads active on site today (browsing but not yet called)
    //    — find leads with emails, look up their profiles, check if they browsed today
    const [hotLeadsRes, recentViewsRes] = await Promise.all([
        // Hot/warm leads not contacted in 7+ days
        admin.from('leads')
            .select('id, name, email, phone, priority, status, last_contacted_at, score')
            .in('priority', ['hot', 'warm'])
            .in('status', ['new', 'contacted', 'qualified'])
            .or(`last_contacted_at.is.null,last_contacted_at.lt.${since7d}`)
            .order('score', { ascending: false })
            .limit(20),
        // Page views in last 24h for listing pages
        admin.from('user_page_views')
            .select('user_id, page_path, created_at')
            .gte('created_at', since24h)
            .like('page_path', '/properties/%')
            .or('page_path.like./projects/%')
            .not('user_id', 'is', null)
            .limit(500),
    ])

    const hotLeads = hotLeadsRes.data || []
    const recentViews = recentViewsRes.data || []

    // Get profiles for users who browsed listings today
    const browsingUserIds = [...new Set(recentViews.map(v => v.user_id as string))]
    const [profilesRes, allLeadsRes] = await Promise.all([
        browsingUserIds.length > 0
            ? admin.from('profiles').select('id, full_name, email').in('id', browsingUserIds)
            : Promise.resolve({ data: [] }),
        // All leads emails for matching
        admin.from('leads').select('id, name, email, priority, status, score').not('email', 'is', null).limit(2000),
    ])

    const profiles = profilesRes.data || []
    const allLeads = allLeadsRes.data || []

    // Map email → lead
    const emailToLead: Record<string, typeof allLeads[0]> = {}
    for (const l of allLeads) {
        if (l.email) emailToLead[l.email.toLowerCase()] = l
    }

    // "Ready to Call": leads browsing site today
    const readyToCall: Array<{
        lead_id: string; lead_name: string; lead_email: string
        priority: string; status: string; score: number
        listing_count: number; last_seen: string
    }> = []
    const seenLeads = new Set<string>()

    for (const profile of profiles) {
        if (!profile.email) continue
        const matchedLead = emailToLead[profile.email.toLowerCase()]
        if (!matchedLead || seenLeads.has(matchedLead.id)) continue

        const userViews = recentViews.filter(v => v.user_id === profile.id)
        const listingPaths = new Set(userViews.filter(v =>
            v.page_path.match(/\/(properties|projects)\/[a-f0-9-]{36}/)
        ).map(v => v.page_path))

        if (listingPaths.size > 0) {
            seenLeads.add(matchedLead.id)
            const lastSeen = userViews.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at
            readyToCall.push({
                lead_id: matchedLead.id,
                lead_name: matchedLead.name,
                lead_email: matchedLead.email || '',
                priority: matchedLead.priority,
                status: matchedLead.status,
                score: matchedLead.score || 0,
                listing_count: listingPaths.size,
                last_seen: lastSeen,
            })
        }
    }
    readyToCall.sort((a, b) => b.score - a.score)

    // 2. Return visitors without a lead (visited a listing 3+ times in 30d, no lead)
    const allListingViews = await admin.from('user_page_views')
        .select('user_id, session_id, page_path')
        .gte('created_at', since30d)
        .not('user_id', 'is', null)
        .limit(5000)

    const listingViewMap: Record<string, Record<string, number>> = {}
    for (const v of allListingViews.data || []) {
        const m = v.page_path.match(/\/(properties|projects)\/([a-f0-9-]{36})/)
        if (!m || !v.user_id) continue
        if (!listingViewMap[v.user_id]) listingViewMap[v.user_id] = {}
        listingViewMap[v.user_id][v.page_path] = (listingViewMap[v.user_id][v.page_path] || 0) + 1
    }

    // Find users with 3+ views on any single listing but no lead
    const returnVisitorUserIds = Object.entries(listingViewMap)
        .filter(([, paths]) => Object.values(paths).some(c => c >= 3))
        .map(([uid]) => uid)

    const returnProfiles = returnVisitorUserIds.length > 0
        ? (await admin.from('profiles').select('id, full_name, email').in('id', returnVisitorUserIds)).data || []
        : []

    const returnVisitorsWithoutLead = returnProfiles
        .filter(p => p.email && !emailToLead[p.email.toLowerCase()])
        .slice(0, 10)
        .map(p => {
            const paths = listingViewMap[p.id] || {}
            const topListing = Object.entries(paths).sort((a, b) => b[1] - a[1])[0]
            return {
                user_id: p.id,
                full_name: p.full_name,
                email: p.email,
                return_visits: topListing?.[1] || 0,
                top_listing_path: topListing?.[0] || '',
            }
        })

    // 3. Re-engage: hot leads silent for 7-30 days
    const reEngageLeads = hotLeads.slice(0, 8).map(l => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        priority: l.priority,
        status: l.status,
        score: l.score,
        silent_days: l.last_contacted_at
            ? Math.floor((now - new Date(l.last_contacted_at).getTime()) / 86400000)
            : null,
    }))

    // 4. Listing activity spike: listings with more views today vs. avg
    const [todayViewsRes, weekViewsRes] = await Promise.all([
        admin.from('user_page_views').select('page_path').gte('created_at', since24h),
        admin.from('user_page_views').select('page_path').gte('created_at', since7d).lt('created_at', since24h),
    ])

    const countByPath = (views: { page_path: string }[]) => {
        const m: Record<string, number> = {}
        for (const v of views) {
            if (v.page_path.match(/\/(properties|projects)\/[a-f0-9-]{36}/)) {
                m[v.page_path] = (m[v.page_path] || 0) + 1
            }
        }
        return m
    }

    const todayCounts = countByPath(todayViewsRes.data || [])
    const weekCounts = countByPath(weekViewsRes.data || [])

    const spikes: Array<{ path: string; today: number; dailyAvg: number; multiplier: number }> = []
    for (const [path, today] of Object.entries(todayCounts)) {
        const weekTotal = weekCounts[path] || 0
        const dailyAvg = weekTotal / 6  // 6 prior days
        if (today >= 3 && dailyAvg > 0 && today / dailyAvg >= 2) {
            spikes.push({ path, today, dailyAvg: Math.round(dailyAvg * 10) / 10, multiplier: Math.round((today / dailyAvg) * 10) / 10 })
        }
    }

    // Fetch listing titles for spikes
    const spikePropIds = spikes.filter(s => s.path.startsWith('/properties/')).map(s => s.path.split('/')[2])
    const spikeProjIds = spikes.filter(s => s.path.startsWith('/projects/')).map(s => s.path.split('/')[2])
    const [spikePropRes, spikeProjRes] = await Promise.all([
        spikePropIds.length > 0 ? admin.from('properties').select('id, title').in('id', spikePropIds) : Promise.resolve({ data: [] }),
        spikeProjIds.length > 0 ? admin.from('projects').select('id, project_name').in('id', spikeProjIds) : Promise.resolve({ data: [] }),
    ])
    const spikePropMap = Object.fromEntries((spikePropRes.data || []).map(p => [p.id, p.title]))
    const spikeProjMap = Object.fromEntries((spikeProjRes.data || []).map(p => [p.id, p.project_name]))

    const activitySpikes = spikes.slice(0, 5).map(s => {
        const id = s.path.split('/')[2]
        const title = s.path.startsWith('/properties/') ? spikePropMap[id] : spikeProjMap[id]
        return { ...s, title: title || id, href: s.path }
    })

    // New leads in last 48h not yet contacted
    const { data: freshUncontacted } = await admin.from('leads')
        .select('id, name, source, priority, created_at')
        .eq('status', 'new')
        .gte('created_at', since48h)
        .order('created_at', { ascending: false })
        .limit(10)

    return NextResponse.json({
        readyToCall: readyToCall.slice(0, 8),
        returnVisitorsWithoutLead,
        reEngageLeads,
        activitySpikes,
        freshUncontacted: freshUncontacted || [],
    })
}
