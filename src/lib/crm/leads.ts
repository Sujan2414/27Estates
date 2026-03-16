import { createClient } from '@supabase/supabase-js'
import { NormalizedLead, Lead } from './types'
import { sendEmailByCategory } from './email'

// Server-side Supabase client for CRM operations
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Create a lead from any source (webhook, chatbot, manual, etc.)
export async function createLead(data: NormalizedLead): Promise<Lead | null> {
    const supabase = getSupabase()

    // Check for duplicate by phone or email (within last 24 hours from same source)
    if (data.email || data.phone) {
        const duplicateQuery = supabase
            .from('leads')
            .select('id')
            .eq('source', data.source)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (data.email) duplicateQuery.eq('email', data.email)
        else if (data.phone) duplicateQuery.eq('phone', data.phone)

        const { data: existing } = await duplicateQuery.limit(1)
        if (existing && existing.length > 0) {
            return null // Duplicate within 24h from same source
        }
    }

    const { data: lead, error } = await supabase
        .from('leads')
        .insert({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            source: data.source,
            source_campaign: data.source_campaign || null,
            source_ad_id: data.source_ad_id || null,
            source_form_id: data.source_form_id || null,
            source_raw_data: data.source_raw_data || null,
            property_interest: data.property_interest || null,
            project_interest: data.project_interest || null,
            preferred_location: data.preferred_location || null,
            property_type: data.property_type || null,
            budget_min: data.budget_min || null,
            budget_max: data.budget_max || null,
            notes: data.notes || null,
            status: 'new',
            priority: 'warm',
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to create lead:', error)
        return null
    }

    // Log the creation as an activity
    await supabase.from('lead_activities').insert({
        lead_id: lead.id,
        type: 'system',
        title: `Lead created from ${data.source}`,
        description: data.source_campaign ? `Campaign: ${data.source_campaign}` : null,
        metadata: { source: data.source },
        created_by: 'system',
    })

    // Send welcome email if lead has an email address (fire and forget)
    if (data.email) {
        sendEmailByCategory('welcome', data.email, { name: data.name }, lead.id).catch(
            err => console.error('Welcome email failed:', err)
        )
    }

    return lead
}

// Log a webhook and process it
export async function processWebhook(
    platform: string,
    eventType: string | null,
    payload: Record<string, unknown>,
    leadId: string | null = null,
    status: string = 'received',
    errorMessage: string | null = null
) {
    const supabase = getSupabase()

    await supabase.from('webhook_logs').insert({
        platform,
        event_type: eventType,
        payload,
        status,
        error_message: errorMessage,
        lead_id: leadId,
    })

    // Update connector stats
    if (status === 'processed') {
        await supabase.rpc('increment_connector_leads', { p_platform: platform }).catch(() => {
            // RPC may not exist yet, silently fail
        })
    }
}

// Update lead status and log the change
export async function updateLeadStatus(leadId: string, newStatus: string, changedBy: string = 'system') {
    const supabase = getSupabase()

    const { data: lead } = await supabase
        .from('leads')
        .select('status')
        .eq('id', leadId)
        .single()

    const oldStatus = lead?.status ?? 'unknown'

    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'converted') updateData.converted_at = new Date().toISOString()
    if (newStatus === 'contacted') updateData.last_contacted_at = new Date().toISOString()

    await supabase.from('leads').update(updateData).eq('id', leadId)

    await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'status_change',
        title: `Status changed to ${newStatus}`,
        description: `Changed from ${oldStatus} to ${newStatus}`,
        metadata: { old_status: oldStatus, new_status: newStatus },
        created_by: changedBy,
    })
}
