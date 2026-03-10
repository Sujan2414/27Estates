import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/crm/activities - Log an activity for a lead
export async function POST(request: NextRequest) {
    try {
        const { lead_id, type, title, description, created_by } = await request.json()

        if (!lead_id || !type || !title) {
            return NextResponse.json(
                { error: 'lead_id, type, and title are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('lead_activities')
            .insert({
                lead_id,
                type,
                title,
                description: description || null,
                created_by: created_by || 'admin',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update last_contacted_at if it's a contact activity
        if (['call', 'email_sent', 'whatsapp', 'site_visit'].includes(type)) {
            await supabase
                .from('leads')
                .update({ last_contacted_at: new Date().toISOString() })
                .eq('id', lead_id)
        }

        return NextResponse.json({ activity: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }
}
