export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface HealthCheck {
    key: string
    label: string
    value: number | boolean   // count or true/false
    earned: number
    max: number
    tip?: string
}

function scoreProperty(p: Record<string, unknown>): { score: number; checks: HealthCheck[] } {
    const checks: HealthCheck[] = []
    let score = 0

    // Images — 25 pts
    const imgCount = ((p.images as string[]) || []).length
    let imgPts = imgCount >= 6 ? 25 : imgCount >= 3 ? 18 : imgCount >= 1 ? 10 : 0
    score += imgPts
    checks.push({ key: 'images', label: 'Photos', value: imgCount, earned: imgPts, max: 25,
        tip: imgCount < 3 ? `Add ${3 - imgCount} more photo${imgCount === 2 ? '' : 's'} (6+ for full score)` : imgCount < 6 ? 'Add more photos for full score' : undefined })

    // Title — 5 pts
    const hasTitle = !!((p.title as string)?.trim())
    const titlePts = hasTitle ? 5 : 0
    score += titlePts
    checks.push({ key: 'title', label: 'Title', value: hasTitle, earned: titlePts, max: 5 })

    // City + Location — 8 pts
    const hasCity = !!((p.city as string)?.trim())
    const hasLoc  = !!((p.location as string)?.trim())
    const locPts  = hasCity && hasLoc ? 8 : hasCity ? 4 : 0
    score += locPts
    checks.push({ key: 'location', label: 'Location', value: hasCity, earned: locPts, max: 8,
        tip: !hasCity ? 'Add city and locality' : !hasLoc ? 'Add locality for full score' : undefined })

    // Price — 10 pts
    const hasPrice = !!((p.price as number) && (p.price as number) > 0)
    const pricePts = hasPrice ? 10 : 0
    score += pricePts
    checks.push({ key: 'price', label: 'Price', value: hasPrice, earned: pricePts, max: 10,
        tip: !hasPrice ? 'Add a listing price' : undefined })

    // Description — 15 pts
    const descLen  = ((p.description as string) || '').trim().length
    const descPts  = descLen >= 300 ? 15 : descLen >= 100 ? 10 : descLen > 0 ? 5 : 0
    score += descPts
    checks.push({ key: 'description', label: 'Description', value: descLen, earned: descPts, max: 15,
        tip: descLen === 0 ? 'Add a description' : descLen < 100 ? 'Expand to 100+ characters' : descLen < 300 ? 'Expand to 300+ chars for full score' : undefined })

    // Amenities — 12 pts
    const amenCount = ((p.amenities as string[]) || []).length
    const amenPts   = amenCount >= 8 ? 12 : amenCount >= 4 ? 9 : amenCount >= 1 ? 5 : 0
    score += amenPts
    checks.push({ key: 'amenities', label: 'Amenities', value: amenCount, earned: amenPts, max: 12,
        tip: amenCount < 4 ? 'Add at least 4 amenities' : amenCount < 8 ? 'Add 8+ amenities for full score' : undefined })

    // Video — 8 pts
    const hasVideo  = !!((p.video_url as string)?.trim())
    const videoPts  = hasVideo ? 8 : 0
    score += videoPts
    checks.push({ key: 'video', label: 'Video', value: hasVideo, earned: videoPts, max: 8,
        tip: !hasVideo ? 'Add a YouTube/Vimeo video tour' : undefined })

    // Area/sqft — 7 pts
    const hasSqft = !!((p.sqft as number) && (p.sqft as number) > 0)
    const sqftPts = hasSqft ? 7 : 0
    score += sqftPts
    checks.push({ key: 'sqft', label: 'Area (sqft)', value: hasSqft, earned: sqftPts, max: 7,
        tip: !hasSqft ? 'Add property area in sqft' : undefined })

    // Bedrooms (5 pts — skip for commercial/warehouse, auto-full)
    const cat = ((p.category as string) || '').toLowerCase()
    const isResidential = !['commercial', 'warehouse', 'office', 'showroom'].includes(cat)
    if (isResidential) {
        const hasBed  = !!((p.bedrooms as number) && (p.bedrooms as number) > 0)
        const bedPts  = hasBed ? 5 : 0
        score += bedPts
        checks.push({ key: 'bedrooms', label: 'Bedrooms', value: hasBed, earned: bedPts, max: 5,
            tip: !hasBed ? 'Add BHK / bedroom count' : undefined })
    } else {
        score += 5
        checks.push({ key: 'bedrooms', label: 'Config', value: true, earned: 5, max: 5 })
    }

    // Category — 5 pts
    const hasCat  = !!(cat.trim())
    const catPts  = hasCat ? 5 : 0
    score += catPts
    checks.push({ key: 'category', label: 'Category', value: hasCat, earned: catPts, max: 5 })

    return { score: Math.min(score, 100), checks }
}

function scoreProject(p: Record<string, unknown>): { score: number; checks: HealthCheck[] } {
    const checks: HealthCheck[] = []
    let score = 0

    // Images — 25 pts
    const imgCount = ((p.images as string[]) || []).length
    const imgPts   = imgCount >= 6 ? 25 : imgCount >= 3 ? 18 : imgCount >= 1 ? 10 : 0
    score += imgPts
    checks.push({ key: 'images', label: 'Photos', value: imgCount, earned: imgPts, max: 25,
        tip: imgCount < 3 ? `Add ${3 - imgCount} more photo${imgCount === 2 ? '' : 's'} (6+ for full score)` : imgCount < 6 ? 'Add more photos for full score' : undefined })

    // Project Name — 5 pts
    const hasName  = !!((p.project_name as string)?.trim())
    const namePts  = hasName ? 5 : 0
    score += namePts
    checks.push({ key: 'title', label: 'Name', value: hasName, earned: namePts, max: 5 })

    // City + Location — 8 pts
    const hasCity  = !!((p.city as string)?.trim())
    const hasLoc   = !!((p.location as string)?.trim())
    const locPts   = hasCity && hasLoc ? 8 : hasCity ? 4 : 0
    score += locPts
    checks.push({ key: 'location', label: 'Location', value: hasCity, earned: locPts, max: 8,
        tip: !hasCity ? 'Add city and locality' : !hasLoc ? 'Add locality for full score' : undefined })

    // Price — 10 pts
    const minPrice = (p.min_price as string)?.trim()
    const hasPrice = !!(minPrice && minPrice !== 'Price on Request' && minPrice !== '')
    const pricePts = hasPrice ? 10 : 0
    score += pricePts
    checks.push({ key: 'price', label: 'Price', value: hasPrice, earned: pricePts, max: 10,
        tip: !hasPrice ? 'Add min/max price range' : undefined })

    // Description — 15 pts
    const descLen  = ((p.description as string) || '').trim().length
    const descPts  = descLen >= 300 ? 15 : descLen >= 100 ? 10 : descLen > 0 ? 5 : 0
    score += descPts
    checks.push({ key: 'description', label: 'Description', value: descLen, earned: descPts, max: 15,
        tip: descLen === 0 ? 'Add a project description' : descLen < 100 ? 'Expand to 100+ characters' : descLen < 300 ? 'Expand to 300+ chars for full score' : undefined })

    // Amenities — 12 pts
    const amenCount = ((p.amenities as string[]) || []).length
    const amenPts   = amenCount >= 8 ? 12 : amenCount >= 4 ? 9 : amenCount >= 1 ? 5 : 0
    score += amenPts
    checks.push({ key: 'amenities', label: 'Amenities', value: amenCount, earned: amenPts, max: 12,
        tip: amenCount < 4 ? 'Add at least 4 amenities' : amenCount < 8 ? 'Add 8+ amenities for full score' : undefined })

    // Brochure — 8 pts
    const hasBrochure = !!((p.brochure_url as string)?.trim())
    const brochurePts = hasBrochure ? 8 : 0
    score += brochurePts
    checks.push({ key: 'brochure', label: 'Brochure', value: hasBrochure, earned: brochurePts, max: 8,
        tip: !hasBrochure ? 'Upload a project brochure PDF' : undefined })

    // Video — 5 pts
    const hasVideo = !!((p.video_url as string)?.trim())
    const videoPts = hasVideo ? 5 : 0
    score += videoPts
    checks.push({ key: 'video', label: 'Video', value: hasVideo, earned: videoPts, max: 5,
        tip: !hasVideo ? 'Add a video walkthrough' : undefined })

    // Floor Plans — 5 pts
    const fpCount  = ((p.floor_plans as unknown[]) || []).length
    const fpPts    = fpCount > 0 ? 5 : 0
    score += fpPts
    checks.push({ key: 'floorPlans', label: 'Floor Plans', value: fpCount, earned: fpPts, max: 5,
        tip: fpCount === 0 ? 'Upload floor plan images' : undefined })

    // BHK / Config — 5 pts
    const bhkArr   = (p.bhk_options as string[]) || []
    const hasBhk   = bhkArr.length > 0
    const bhkPts   = hasBhk ? 5 : 0
    score += bhkPts
    checks.push({ key: 'bhk', label: 'BHK / Config', value: hasBhk, earned: bhkPts, max: 5,
        tip: !hasBhk ? 'Add BHK options or unit configurations' : undefined })

    // Developer — 2 pts
    const hasDev  = !!((p.developer_name as string)?.trim())
    const devPts  = hasDev ? 2 : 0
    score += devPts
    checks.push({ key: 'developer', label: 'Developer', value: hasDev, earned: devPts, max: 2,
        tip: !hasDev ? 'Add developer name' : undefined })

    return { score: Math.min(score, 100), checks }
}

export function gradeScore(score: number): 'great' | 'good' | 'warning' | 'poor' {
    if (score >= 80) return 'great'
    if (score >= 60) return 'good'
    if (score >= 40) return 'warning'
    return 'poor'
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)
    const since = new Date(Date.now() - days * 86400000).toISOString()

    // Fetch ALL properties and projects (not just ones with views)
    const [propsRes, projsRes, viewsRes, bmsRes, leadsRes] = await Promise.all([
        admin.from('properties').select(
            'id, title, city, location, category, images, description, amenities, video_url, price, price_text, sqft, bedrooms, folder'
        ).neq('folder', 'archive'),

        admin.from('projects').select(
            'id, project_name, city, location, section, images, description, amenities, video_url, brochure_url, floor_plans, bhk_options, min_price, max_price, developer_name, status'
        ),

        admin.from('user_page_views')
            .select('page_path, user_id, session_id, duration_seconds')
            .gte('created_at', since),

        admin.from('user_bookmarks')
            .select('property_id, project_id')
            .gte('created_at', since),

        admin.from('leads')
            .select('property_interest, project_interest')
            .gte('created_at', since),
    ])

    const allViews  = viewsRes.data  || []
    const allBms    = bmsRes.data    || []
    const allLeads  = leadsRes.data  || []

    // Aggregate engagement
    const propViews: Record<string, number> = {}
    const projViews: Record<string, number> = {}
    for (const v of allViews) {
        const pm = v.page_path.match(/^\/properties\/([a-f0-9-]{36})$/)
        if (pm) propViews[pm[1]] = (propViews[pm[1]] || 0) + 1
        const jm = v.page_path.match(/^\/projects\/([a-f0-9-]{36})$/)
        if (jm) projViews[jm[1]] = (projViews[jm[1]] || 0) + 1
    }
    const propBm: Record<string, number> = {}
    const projBm: Record<string, number> = {}
    for (const b of allBms) {
        if (b.property_id) propBm[b.property_id] = (propBm[b.property_id] || 0) + 1
        if (b.project_id)  projBm[b.project_id]  = (projBm[b.project_id]  || 0) + 1
    }
    const propInq: Record<string, number> = {}
    const projInq: Record<string, number> = {}
    for (const l of allLeads) {
        if (l.property_interest) propInq[l.property_interest] = (propInq[l.property_interest] || 0) + 1
        if (l.project_interest)  projInq[l.project_interest]  = (projInq[l.project_interest]  || 0) + 1
    }

    const properties = (propsRes.data || []).map(p => {
        const { score, checks } = scoreProperty(p as Record<string, unknown>)
        return {
            id: p.id, type: 'property' as const,
            title: p.title, location: p.city || p.location,
            image: (p.images as string[])?.[0] || null,
            category: p.category, price_text: p.price_text,
            score, grade: gradeScore(score), checks,
            views:     propViews[p.id]  || 0,
            bookmarks: propBm[p.id]     || 0,
            inquiries: propInq[p.id]    || 0,
            editHref: `/admin/properties/${p.id}/edit`,
            viewHref: `/properties/${p.id}`,
        }
    })

    const projects = (projsRes.data || []).map(p => {
        const { score, checks } = scoreProject(p as Record<string, unknown>)
        const section = (p.section as string) || 'residential'
        return {
            id: p.id, type: 'project' as const,
            title: p.project_name, location: p.city || p.location,
            image: (p.images as string[])?.[0] || null,
            section, status: p.status,
            score, grade: gradeScore(score), checks,
            views:     projViews[p.id]  || 0,
            bookmarks: projBm[p.id]     || 0,
            inquiries: projInq[p.id]    || 0,
            editHref: `/admin/projects/${p.id}/edit`,
            viewHref: `/projects/${p.id}`,
        }
    })

    return NextResponse.json({ properties, projects })
}
