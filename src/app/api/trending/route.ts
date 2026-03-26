import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns top-bookmarked property and project IDs for the Trending section
export async function GET() {
    const since = new Date(Date.now() - 30 * 86400000).toISOString()

    const { data: bookmarks } = await admin
        .from('user_bookmarks')
        .select('property_id, project_id')
        .gte('created_at', since)
        .limit(1000)

    if (!bookmarks || bookmarks.length === 0) {
        return NextResponse.json({ properties: [], projects: [] })
    }

    const propCount: Record<string, number> = {}
    const projCount: Record<string, number> = {}
    for (const b of bookmarks) {
        if (b.property_id) propCount[b.property_id] = (propCount[b.property_id] || 0) + 1
        if (b.project_id) projCount[b.project_id] = (projCount[b.project_id] || 0) + 1
    }

    // Top 6 of each, min 1 bookmark
    const topProps = Object.entries(propCount)
        .filter(([, c]) => c >= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, count]) => ({ id, count }))

    const topProjs = Object.entries(projCount)
        .filter(([, c]) => c >= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, count]) => ({ id, count }))

    return NextResponse.json({ properties: topProps, projects: topProjs })
}
