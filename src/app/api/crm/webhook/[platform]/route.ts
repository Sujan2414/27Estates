export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getConnector } from '@/lib/crm/connectors'
import { createLead, processWebhook } from '@/lib/crm/leads'
import { assignLead } from '@/app/api/crm/leads/assign/route'

// Universal webhook endpoint: /api/crm/webhook/[platform]
// e.g., /api/crm/webhook/meta_ads, /api/crm/webhook/google_ads, etc.

// GET - Meta requires a verification endpoint for webhook setup
export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
    const { platform } = await params

    if (platform === 'meta_ads') {
        // Meta webhook verification challenge
        const { searchParams } = new URL(request.url)
        const mode = searchParams.get('hub.mode')
        const token = searchParams.get('hub.verify_token')
        const challenge = searchParams.get('hub.challenge')

        if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
            return new NextResponse(challenge, { status: 200 })
        }
        return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }

    return NextResponse.json({ status: 'ok', platform })
}

// POST - Receive leads from any ad platform
export async function POST(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
    const { platform } = await params
    const bodyText = await request.text()

    let payload: Record<string, unknown>
    try {
        payload = JSON.parse(bodyText)
    } catch {
        await processWebhook(platform, null, { raw: bodyText }, null, 'failed', 'Invalid JSON')
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Get the connector for this platform
    const connector = getConnector(platform)
    if (!connector) {
        await processWebhook(platform, 'unknown', payload, null, 'failed', `No connector for platform: ${platform}`)
        return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 })
    }

    // Verify webhook authenticity
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => { headers[key] = value })

    if (!connector.verifyWebhook(headers, bodyText)) {
        await processWebhook(platform, 'verification_failed', payload, null, 'failed', 'Webhook verification failed')
        return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }

    // Parse the webhook into a normalized lead
    const normalizedLead = connector.parseWebhook(payload)

    if (!normalizedLead) {
        await processWebhook(platform, 'parse_failed', payload, null, 'failed', 'Could not parse lead data')
        return NextResponse.json({ error: 'Could not parse lead data' }, { status: 422 })
    }

    // Create the lead in the CRM
    let lead;
    try {
        lead = await createLead(normalizedLead)
    } catch (err: any) {
        await processWebhook(platform, 'db_error', payload, null, 'failed', err.message || 'Database error')
        return NextResponse.json({ error: 'Database error creating lead' }, { status: 500 })
    }

    if (!lead) {
        await processWebhook(platform, 'duplicate', payload, null, 'duplicate', 'Duplicate lead')
        return NextResponse.json({ message: 'Duplicate lead, skipped' }, { status: 200 })
    }

    // Log successful processing
    await processWebhook(platform, 'lead_created', payload, lead.id, 'processed')

    // Auto-assign via round-robin (non-blocking)
    assignLead(lead.id).catch(err => console.error('Auto-assign failed for webhook lead', lead.id, err))

    return NextResponse.json({ message: 'Lead created', lead_id: lead.id }, { status: 201 })
}
