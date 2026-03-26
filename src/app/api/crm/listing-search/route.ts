export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const limit = 10

    const [propsRes, projsRes] = await Promise.all([
        admin.from('properties')
            .select('id, title, location, city, images, price_text, category')
            .ilike('title', `%${q}%`)
            .limit(limit),
        admin.from('projects')
            .select('id, project_name, location, city, images, status, section')
            .ilike('project_name', `%${q}%`)
            .limit(limit),
    ])

    const results = [
        ...(propsRes.data || []).map(p => ({
            id: p.id, type: 'property' as const,
            title: p.title, location: p.city || p.location,
            image: p.images?.[0] || null, category: p.category, section: null,
            href: `/properties/${p.id}`,
        })),
        ...(projsRes.data || []).map(p => ({
            id: p.id, type: 'project' as const,
            title: p.project_name, location: p.city || p.location,
            image: p.images?.[0] || null, category: null, section: p.section,
            href: `/projects/${p.id}`,
        })),
    ]

    return NextResponse.json({ results })
}
