import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

// POST /api/crm/hrm/reminders
// Body: { type: 'checkin' | 'checkout' }
// Called by a cron job or manually. Protected by CRON_SECRET.
export async function POST(request: NextRequest) {
    // Simple secret check so this can't be called by random users
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await request.json()
    if (!['checkin', 'checkout'].includes(type)) {
        return NextResponse.json({ error: 'type must be checkin or checkout' }, { status: 400 })
    }

    // Fetch all active employees
    const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['admin', 'super_admin', 'agent'])

    if (empError) return NextResponse.json({ error: empError.message }, { status: 500 })
    if (!employees?.length) return NextResponse.json({ sent: 0 })

    const today = new Date().toISOString().split('T')[0]

    // For check-out: skip employees who already checked out today
    let skipIds = new Set<string>()
    if (type === 'checkout') {
        const { data: alreadyOut } = await supabase
            .from('hrm_attendance')
            .select('employee_id')
            .eq('date', today)
            .not('check_out_time', 'is', null)

        skipIds = new Set((alreadyOut || []).map(r => r.employee_id))
    }

    // For check-in: skip employees who already checked in today
    if (type === 'checkin') {
        const { data: alreadyIn } = await supabase
            .from('hrm_attendance')
            .select('employee_id')
            .eq('date', today)
            .not('check_in_time', 'is', null)

        skipIds = new Set((alreadyIn || []).map(r => r.employee_id))
    }

    const targets = employees.filter(e => e.email && !skipIds.has(e.id))

    if (!targets.length) {
        return NextResponse.json({ sent: 0, message: 'All employees already checked in/out' })
    }

    const isCheckin = type === 'checkin'
    const subject = isCheckin
        ? '⏰ Reminder: Please Check In | 27 Estates'
        : '⏰ Reminder: Please Check Out | 27 Estates'

    const results = await Promise.allSettled(
        targets.map(emp =>
            resend.emails.send({
                from: `27 Estates HR <${FROM_EMAIL}>`,
                to: emp.email,
                subject,
                html: buildReminderEmail(emp.full_name, isCheckin, today),
            })
        )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - sent

    return NextResponse.json({ sent, failed, total: targets.length })
}

function buildReminderEmail(name: string, isCheckin: boolean, date: string): string {
    const action = isCheckin ? 'Check In' : 'Check Out'
    const time = isCheckin ? '9:00 AM' : '6:00 PM'
    const greeting = isCheckin ? "Good morning" : "Good evening"
    const msg = isCheckin
        ? "This is a friendly reminder to check in on the HR portal. Your location will be captured to confirm remote or in-office attendance."
        : "This is a reminder to check out on the HR portal so your working hours are logged accurately."
    const cta = isCheckin ? "Check In Now" : "Check Out Now"
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9f6f3;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f3;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#183C38;padding:24px 32px;">
          <table width="100%"><tr>
            <td>
              <span style="display:inline-flex;align-items:center;gap:8px;">
                <span style="background:#BFA270;color:#183C38;font-weight:800;font-size:14px;border-radius:6px;padding:4px 8px;">27</span>
                <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.01em;">27 Estates HR</span>
              </span>
            </td>
            <td align="right" style="color:#BFA270;font-size:13px;font-weight:600;">${action} Reminder</td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">${greeting}, ${name} 👋</p>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">${msg}</p>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="font-size:13px;color:#166534;font-weight:600;">📅 ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:4px;">Expected ${action.toLowerCase()} time: <strong>${time}</strong></div>
          </div>

          <table width="100%"><tr><td align="center">
            <a href="${siteUrl}/crm/hrm/attendance"
               style="display:inline-block;background:#183C38;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:-0.01em;">
              ${cta} →
            </a>
          </td></tr></table>

          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
            You're receiving this because you're an employee of 27 Estates.<br>
            <a href="${siteUrl}/crm" style="color:#BFA270;text-decoration:none;">Visit CRM</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} 27 Estates · Own the Extraordinary</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
