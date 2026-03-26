import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/crm/email'

// GET /api/cron/email-queue - Process scheduled emails
// Set up as a Vercel cron job in vercel.json:
// { "crons": [{ "path": "/api/cron/email-queue", "schedule": "*/15 * * * *" }] }
export async function GET(request: NextRequest) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await processEmailQueue()
        return NextResponse.json({ message: `Processed ${result.processed} emails`, ...result })
    } catch (error) {
        console.error('Cron email queue error:', error)
        return NextResponse.json({ error: 'Failed to process queue' }, { status: 500 })
    }
}
