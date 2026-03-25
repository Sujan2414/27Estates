import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listing_id')
    const listingType = searchParams.get('type') as 'property' | 'project' | null

    if (!listingId || !listingType) {
        return NextResponse.json({ error: 'listing_id and type required' }, { status: 400 })
    }

    const pagePath = `/${listingType === 'property' ? 'properties' : 'projects'}/${listingId}`

    // Fetch views, bookmarks, and leads in parallel
    const [viewsRes, bookmarksRes, leadsRes] = await Promise.all([
        admin.from('user_page_views')
            .select('user_id, session_id, created_at, duration_seconds')
            .eq('page_path', pagePath)
            .order('created_at', { ascending: false }),
        listingType === 'property'
            ? admin.from('user_bookmarks').select('user_id, created_at').eq('property_id', listingId)
            : admin.from('user_bookmarks').select('user_id, created_at').eq('project_id', listingId),
        listingType === 'property'
            ? admin.from('leads').select('id, name, email, phone, score, priority, status, source, created_at').eq('property_interest', listingId)
            : admin.from('leads').select('id, name, email, phone, score, priority, status, source, created_at').eq('project_interest', listingId),
    ])

    const views = viewsRes.data || []
    const bookmarks = bookmarksRes.data || []
    const leads = leadsRes.data || []

    // Collect all unique user_ids from views + bookmarks
    const userIds = [...new Set([
        ...views.filter(v => v.user_id).map(v => v.user_id as string),
        ...bookmarks.filter(b => b.user_id).map(b => b.user_id as string),
    ])]

    // Fetch profiles for all known user_ids
    const profilesRes = userIds.length > 0
        ? await admin.from('profiles').select('id, full_name, email').in('id', userIds)
        : { data: [] }
    const profileMap: Record<string, { full_name: string; email: string }> =
        Object.fromEntries((profilesRes.data || []).map(p => [p.id, p]))

    // Per user_id aggregation
    const userMap: Record<string, {
        user_id: string
        full_name: string
        email: string
        views: number
        totalSecs: number
        firstSeen: string
        lastSeen: string
        bookmarked: boolean
        lead: { id: string; name: string; score: number; priority: string; status: string } | null
    }> = {}

    for (const v of views) {
        const uid = v.user_id || v.session_id
        if (!uid) continue
        if (!userMap[uid]) {
            const p = v.user_id ? profileMap[v.user_id] : null
            userMap[uid] = {
                user_id: uid,
                full_name: p?.full_name || (v.user_id ? 'Registered User' : 'Anonymous'),
                email: p?.email || '',
                views: 0, totalSecs: 0,
                firstSeen: v.created_at, lastSeen: v.created_at,
                bookmarked: false, lead: null,
            }
        }
        userMap[uid].views++
        userMap[uid].totalSecs += v.duration_seconds || 0
        if (v.created_at < userMap[uid].firstSeen) userMap[uid].firstSeen = v.created_at
        if (v.created_at > userMap[uid].lastSeen) userMap[uid].lastSeen = v.created_at
    }

    // Mark bookmarked
    for (const b of bookmarks) {
        const uid = b.user_id
        if (!uid) continue
        if (!userMap[uid]) {
            const p = profileMap[uid]
            userMap[uid] = {
                user_id: uid,
                full_name: p?.full_name || 'Registered User',
                email: p?.email || '',
                views: 0, totalSecs: 0,
                firstSeen: b.created_at, lastSeen: b.created_at,
                bookmarked: false, lead: null,
            }
        }
        userMap[uid].bookmarked = true
    }

    // Match leads by email
    for (const lead of leads) {
        if (!lead.email) continue
        // Find user_id with matching email
        const match = Object.entries(profileMap).find(([, p]) => p.email?.toLowerCase() === lead.email.toLowerCase())
        const uid = match ? match[0] : null

        if (uid && userMap[uid]) {
            userMap[uid].lead = { id: lead.id, name: lead.name, score: lead.score, priority: lead.priority, status: lead.status }
        }
    }

    // Anonymous session count (no user_id)
    const anonSessions = new Set(views.filter(v => !v.user_id).map(v => v.session_id)).size

    // Total stats
    const totalViews = views.length
    const bookmarkCount = bookmarks.length

    // Leads without website footprint
    const linkedLeadEmails = new Set(
        Object.values(userMap).filter(u => u.lead).map(u => u.email.toLowerCase())
    )
    const unlinkedLeads = leads.filter(l => !l.email || !linkedLeadEmails.has(l.email.toLowerCase()))

    const audience = Object.values(userMap).sort((a, b) => {
        // Hot sort: bookmarked > most views > most recent
        if (b.bookmarked !== a.bookmarked) return b.bookmarked ? 1 : -1
        return b.views - a.views
    })

    return NextResponse.json({
        listingId,
        listingType,
        totalViews,
        bookmarkCount,
        anonSessions,
        leadCount: leads.length,
        registeredCount: Object.values(userMap).filter(u => u.email).length,
        audience,        // registered users / sessions
        unlinkedLeads,   // leads with interest but no website footprint match
    })
}
