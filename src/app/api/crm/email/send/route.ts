import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateEmail, scheduleEmail } from '@/lib/crm/email'

// POST /api/crm/email/send - Send or schedule an email
export async function POST(request: NextRequest) {
    try {
        const { template_id, to_email, to_name, variables, lead_id, schedule_for } = await request.json()

        if (!template_id || !to_email) {
            return NextResponse.json(
                { error: 'template_id and to_email are required' },
                { status: 400 }
            )
        }

        if (schedule_for) {
            await scheduleEmail(
                template_id,
                to_email,
                to_name || '',
                variables || {},
                new Date(schedule_for),
                lead_id
            )
            return NextResponse.json({ message: 'Email scheduled', scheduled_for: schedule_for })
        }

        const result = await sendTemplateEmail(template_id, to_email, variables || {}, lead_id)
        return NextResponse.json({ message: 'Email sent', id: result?.id })
    } catch (error: unknown) {
        console.error('Email send error:', error)
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        )
    }
}
