export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = await createClient()

        console.log('====== INCOMING B2BBRICKS WEBHOOK ======')
        console.log(JSON.stringify(body, null, 2))
        console.log('========================================')

        // 1. Log the webhook payload for debugging
        const { data: logData, error: logError } = await supabase
            .from('webhook_logs')
            .insert({
                platform: 'b2bbricks',
                event_type: 'new_lead',
                payload: body,
                status: 'received'
            })
            .select()
            .single()

        if (logError) {
            console.error('Failed to save webhook log:', logError)
        }

        // 2. Map B2BBricks payload to our leads table
        // Sample JSON provided:
        // {
        //   "name": "Test lead name",
        //   "mobile": "9999999999",
        //   "email": "abc@b2bbricks.com",
        //   "message": "I am intrested in project ABC",
        //   "project": "ABC Project",
        //   "refid": "123"
        // }

        const leadData = {
            name: body.name || 'Unknown Webhook Lead',
            phone: body.mobile || null,
            email: body.email || null,
            notes: body.message || null,
            source: 'b2bbricks',
            source_raw_data: body,
            // If they pass a project name, we store it in notes or tags for now 
            // since project_interest expects a UUID.
            tags: body.project ? [body.project] : []
        }

        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert(leadData)
            .select()
            .single()

        if (leadError) {
            console.error('Error inserting lead:', leadError)

            // Update log to failed
            if (logData) {
                await supabase.from('webhook_logs').update({
                    status: 'failed',
                    error_message: leadError.message
                }).eq('id', logData.id)
            }

            return NextResponse.json(
                { success: false, error: 'Database insertion failed' },
                { status: 500 }
            )
        }

        // Update log to processed
        if (logData) {
            await supabase.from('webhook_logs').update({
                status: 'processed',
                lead_id: lead.id
            }).eq('id', logData.id)
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook processed and lead saved successfully.'
        }, { status: 200 })

    } catch (error) {
        console.error('Error processing B2BBRICKS webhook:', error)
        return NextResponse.json(
            { success: false, error: 'Invalid payload or server error' },
            { status: 400 }
        )
    }
}

// Allow GET requests just so they can easily ping/test the endpoint in a browser
export async function GET() {
    return NextResponse.json({
        success: true,
        message: '27Estates B2BBRICKS Webhook Endpoint is active and listening for POST requests.'
    }, { status: 200 })
}
