import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createLead } from '@/lib/crm/leads'
import { assignLead } from './assign/route'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/leads - List leads with filters
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const assignedTo = searchParams.get('assigned_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
        .from('leads')
        .select(`
            *,
            assignee:assigned_to (id, full_name),
            properties (title, property_id),
            projects (project_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status && status !== 'all') query = query.eq('status', status)
    if (source && source !== 'all') query = query.eq('source', source)
    if (priority && priority !== 'all') query = query.eq('priority', priority)
    if (assignedTo === 'unassigned') query = query.is('assigned_to', null)
    else if (assignedTo) query = query.eq('assigned_to', assignedTo)
    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ leads: data, total: count, page, limit })
}

// POST /api/crm/leads - Create a lead manually
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const lead = await createLead({
            name: body.name,
            email: body.email,
            phone: body.phone,
            source: body.source || 'manual',
            source_campaign: body.source_campaign,
            preferred_location: body.preferred_location,
            property_type: body.property_type,
            budget_min: body.budget_min,
            budget_max: body.budget_max,
            notes: body.notes,
            property_interest: body.property_interest,
            project_interest: body.project_interest,
        })

        if (!lead) {
            return NextResponse.json({ error: 'Duplicate lead detected' }, { status: 409 })
        }

        // Auto-assign via round-robin (fire and forget — don't block response)
        assignLead(lead.id).catch(err => console.error('Auto-assign failed for lead', lead.id, err))

        return NextResponse.json({ lead }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }
}
