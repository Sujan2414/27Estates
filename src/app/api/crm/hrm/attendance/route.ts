import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/hrm/attendance?date=YYYY-MM-DD&employee_id=...&month=YYYY-MM&today=true
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || ''
    const employeeId = searchParams.get('employee_id') || ''
    const month = searchParams.get('month') || ''
    const todayOnly = searchParams.get('today') === 'true'

    try {
        let query = supabase
            .from('hrm_attendance')
            .select(`*, employee:employee_id (id, full_name, role)`)
            .order('date', { ascending: false })

        if (todayOnly) {
            const today = new Date().toISOString().split('T')[0]
            query = query.eq('date', today)
        } else if (date) {
            query = query.eq('date', date)
        } else if (month) {
            const start = `${month}-01`
            const [y, m] = month.split('-').map(Number)
            const end = new Date(y, m, 0).toISOString().split('T')[0]
            query = query.gte('date', start).lte('date', end)
        }

        if (employeeId) query = query.eq('employee_id', employeeId)

        const { data, error } = await query
        if (error) {
            if (error.code === '42P01') return NextResponse.json({ attendance: [], tableExists: false })
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ attendance: data || [], tableExists: true })
    } catch {
        return NextResponse.json({ attendance: [], tableExists: false })
    }
}

// POST /api/crm/hrm/attendance — upsert attendance record (manual mark)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { employee_id, date, status, check_in, check_out, notes, work_mode } = body
        if (!employee_id || !date) return NextResponse.json({ error: 'employee_id and date required' }, { status: 400 })

        const { data, error } = await supabase
            .from('hrm_attendance')
            .upsert(
                { employee_id, date, status: status || 'present', check_in, check_out, notes, work_mode: work_mode || 'office' },
                { onConflict: 'employee_id,date' }
            )
            .select(`*, employee:employee_id (id, full_name)`)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ record: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
    }
}

// PATCH /api/crm/hrm/attendance — check-in or check-out with geo
// Body: { employee_id, action: 'check_in'|'check_out', lat?, lng?, address? }
export async function PATCH(request: NextRequest) {
    try {
        const {
            employee_id,
            action,
            lat,
            lng,
            address,
        } = await request.json()

        if (!employee_id || !action) {
            return NextResponse.json({ error: 'employee_id and action required' }, { status: 400 })
        }
        if (!['check_in', 'check_out'].includes(action)) {
            return NextResponse.json({ error: 'action must be check_in or check_out' }, { status: 400 })
        }

        const now = new Date()
        const today = now.toISOString().split('T')[0]

        if (action === 'check_in') {
            // Upsert: create or update today's record with check-in time
            const { data, error } = await supabase
                .from('hrm_attendance')
                .upsert(
                    {
                        employee_id,
                        date: today,
                        status: 'present',
                        work_mode: lat ? 'remote' : 'office',
                        check_in_time: now.toISOString(),
                        check_in_lat: lat || null,
                        check_in_lng: lng || null,
                        check_in_address: address || null,
                    },
                    { onConflict: 'employee_id,date' }
                )
                .select()
                .single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ record: data, action: 'checked_in', time: now.toISOString() })
        }

        // check_out: fetch existing record to compute hours_worked
        const { data: existing } = await supabase
            .from('hrm_attendance')
            .select('check_in_time')
            .eq('employee_id', employee_id)
            .eq('date', today)
            .single()

        let hoursWorked: number | null = null
        if (existing?.check_in_time) {
            const diffMs = now.getTime() - new Date(existing.check_in_time).getTime()
            hoursWorked = Math.round((diffMs / 3600000) * 100) / 100 // 2 decimal places
        }

        // Determine status from hours worked vs work settings
        const { data: ws } = await supabase
            .from('hrm_work_settings')
            .select('full_day_hours, half_day_hours')
            .limit(1)
            .single()

        const fullDayH = ws?.full_day_hours ?? 8
        const halfDayH = ws?.half_day_hours ?? 4

        let autoStatus = 'present'
        if (hoursWorked !== null) {
            if (hoursWorked >= fullDayH) autoStatus = 'present'
            else if (hoursWorked >= halfDayH) autoStatus = 'half_day'
            else autoStatus = 'absent'
        }

        const { data, error } = await supabase
            .from('hrm_attendance')
            .upsert(
                {
                    employee_id,
                    date: today,
                    status: autoStatus,
                    check_out_time: now.toISOString(),
                    check_out_lat: lat || null,
                    check_out_lng: lng || null,
                    check_out_address: address || null,
                    hours_worked: hoursWorked,
                },
                { onConflict: 'employee_id,date' }
            )
            .select()
            .single()

        // If marked absent, send notification email
        if (autoStatus === 'absent' && !error) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', employee_id)
                    .single()
                if (profile?.email) {
                    const { Resend } = await import('resend')
                    const resend = new Resend(process.env.RESEND_API_KEY)
                    await resend.emails.send({
                        from: `27 Estates HR <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                        to: profile.email,
                        subject: `⚠️ Attendance Marked Absent — ${today}`,
                        html: `<p>Hi ${profile.full_name},</p><p>Your attendance for <strong>${new Date(today).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> has been automatically marked as <strong style="color:#ef4444">Absent</strong> because your logged hours (${hoursWorked?.toFixed(1)}h) are below the required minimum.</p><p>If you believe this is incorrect, please apply for <strong>regularisation</strong> through the HR portal.</p><p>— 27 Estates HR</p>`,
                    })
                }
            } catch { /* non-blocking */ }
        }

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ record: data, action: 'checked_out', hours_worked: hoursWorked, status: autoStatus, time: now.toISOString() })
    } catch {
        return NextResponse.json({ error: 'Failed to process check-in/out' }, { status: 500 })
    }
}
