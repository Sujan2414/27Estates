import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/hrm/work-settings
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('hrm_work_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST116') {
                // Table doesn't exist or no rows — return defaults
                return NextResponse.json({
                    settings: {
                        work_start_time: '09:00',
                        work_end_time: '18:00',
                        full_day_hours: 8.0,
                        half_day_hours: 4.0,
                        checkin_reminder_time: '09:00',
                        checkout_reminder_time: '18:00',
                        reminders_enabled: true,
                        max_regularizations_per_month: 2,
                        max_regularizations_per_year: 10,
                    },
                    tableExists: error.code !== '42P01',
                })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ settings: data, tableExists: true })
    } catch {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

// POST /api/crm/hrm/work-settings — upsert (super_admin only enforced client-side)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            work_start_time, work_end_time, full_day_hours, half_day_hours,
            checkin_reminder_time, checkout_reminder_time, reminders_enabled,
            max_regularizations_per_month, max_regularizations_per_year, updated_by,
        } = body

        const payload = {
            work_start_time, work_end_time, full_day_hours, half_day_hours,
            checkin_reminder_time, checkout_reminder_time, reminders_enabled,
            max_regularizations_per_month: max_regularizations_per_month ?? 2,
            max_regularizations_per_year: max_regularizations_per_year ?? 10,
            updated_by: updated_by || null,
        }

        const { data: existing } = await supabase.from('hrm_work_settings').select('id').limit(1).single()

        let result
        if (existing?.id) {
            const { data, error } = await supabase.from('hrm_work_settings').update(payload).eq('id', existing.id).select().single()
            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            result = data
        } else {
            const { data, error } = await supabase.from('hrm_work_settings').insert(payload).select().single()
            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            result = data
        }

        return NextResponse.json({ settings: result })
    } catch {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
