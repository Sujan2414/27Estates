export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/export?format=csv&status=new&source=meta_ads
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    let query = supabase
        .from('leads')
        .select(`
            id, name, email, phone, source, status, priority, score,
            budget_min, budget_max, preferred_location, property_type,
            notes, last_contacted_at, next_follow_up_at, created_at,
            source_campaign, lost_reason, converted_at,
            agents (name),
            properties (title),
            projects (project_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5000)

    if (status && status !== 'all') query = query.eq('status', status)
    if (source && source !== 'all') query = query.eq('source', source)
    if (priority && priority !== 'all') query = query.eq('priority', priority)
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data || []) as Record<string, any>[]

    // Build CSV
    const headers = [
        'ID', 'Name', 'Email', 'Phone', 'Source', 'Campaign', 'Status', 'Priority', 'Score',
        'Budget Min', 'Budget Max', 'Location', 'Property Type', 'Assigned Agent',
        'Property Interest', 'Project Interest', 'Notes', 'Lost Reason',
        'Last Contacted', 'Next Follow-up', 'Converted At', 'Created At',
    ]

    const escape = (v: unknown) => {
        if (v == null) return ''
        const s = String(v).replace(/"/g, '""')
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
    }

    const csvRows = rows.map(r => [
        escape(r.id),
        escape(r.name),
        escape(r.email),
        escape(r.phone),
        escape(r.source),
        escape(r.source_campaign),
        escape(r.status),
        escape(r.priority),
        escape(r.score),
        escape(r.budget_min),
        escape(r.budget_max),
        escape(r.preferred_location),
        escape(r.property_type),
        escape((r.agents as any)?.name || ''),
        escape((r.properties as any)?.title || ''),
        escape((r.projects as any)?.project_name || ''),
        escape(r.notes),
        escape(r.lost_reason),
        escape(r.last_contacted_at ? new Date(r.last_contacted_at).toLocaleDateString('en-IN') : ''),
        escape(r.next_follow_up_at ? new Date(r.next_follow_up_at).toLocaleDateString('en-IN') : ''),
        escape(r.converted_at ? new Date(r.converted_at).toLocaleDateString('en-IN') : ''),
        escape(new Date(r.created_at).toLocaleDateString('en-IN')),
    ].join(','))

    const csv = [headers.join(','), ...csvRows].join('\n')

    const date = new Date().toISOString().split('T')[0]
    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="leads-${date}.csv"`,
        },
    })
}
