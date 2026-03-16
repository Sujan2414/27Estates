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

// ─────────────────────────────────────────────────────────────────
// Lead Scoring Engine (0–100)
// ─────────────────────────────────────────────────────────────────
export function calculateScore(data: {
    source?: string
    email?: string | null
    phone?: string | null
    budget_min?: number | null
    budget_max?: number | null
    preferred_location?: string | null
    property_type?: string | null
    notes?: string | null
    status?: string
    activity_count?: number
    last_contacted_at?: string | null
}): { score: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {}

    // Source quality (0–25)
    const sourceScores: Record<string, number> = {
        referral: 25, google_ads: 20, meta_ads: 18,
        website: 15, magicbricks: 14, '99acres': 13,
        housing: 12, justdial: 10, whatsapp: 20,
        chatbot: 8, manual: 10,
    }
    breakdown.source = sourceScores[data.source || ''] || 5

    // Contact completeness (0–20)
    let contactScore = 0
    if (data.email) contactScore += 10
    if (data.phone) contactScore += 10
    breakdown.contact = contactScore

    // Budget provided (0–15)
    breakdown.budget = (data.budget_min || data.budget_max) ? 15 : 0

    // Profile completeness (0–15)
    let profileScore = 0
    if (data.preferred_location) profileScore += 7
    if (data.property_type) profileScore += 8
    breakdown.profile = profileScore

    // Activity / engagement (0–15)
    const actCount = data.activity_count || 0
    breakdown.engagement = Math.min(actCount * 3, 15)

    // Recency — was contacted recently (0–10)
    if (data.last_contacted_at) {
        const daysSince = (Date.now() - new Date(data.last_contacted_at).getTime()) / 86400000
        breakdown.recency = daysSince < 1 ? 10 : daysSince < 3 ? 7 : daysSince < 7 ? 4 : 1
    } else {
        breakdown.recency = 0
    }

    const score = Math.min(
        100,
        breakdown.source + breakdown.contact + breakdown.budget +
        breakdown.profile + breakdown.engagement + breakdown.recency
    )

    return { score, breakdown }
}

// Auto-set priority based on score
function scoreToPriority(score: number): string {
    if (score >= 70) return 'hot'
    if (score >= 40) return 'warm'
    return 'cold'
}

// ─────────────────────────────────────────────────────────────────
// Notifications helper
// ─────────────────────────────────────────────────────────────────
async function createNotification(payload: {
    type: string
    title: string
    body?: string
    link?: string
    lead_id?: string
}) {
    // Use a fresh client cast to any so the untyped 'notifications' table works
    const sb = getSupabase() as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>
    await (sb as any).from('notifications').insert(payload).catch(() => {
        // Silently fail if table doesn't exist yet
    })
}

// ─────────────────────────────────────────────────────────────────
// Create a lead from any source
// ─────────────────────────────────────────────────────────────────
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

    const { score, breakdown } = calculateScore({
        source: data.source,
        email: data.email,
        phone: data.phone,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        preferred_location: data.preferred_location,
        property_type: data.property_type,
        notes: data.notes,
    })

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
            priority: scoreToPriority(score),
            score,
            score_breakdown: breakdown,
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to create lead:', error)
        return null
    }

    // Log creation activity
    await supabase.from('lead_activities').insert({
        lead_id: lead.id,
        type: 'system',
        title: `Lead created from ${data.source}`,
        description: data.source_campaign ? `Campaign: ${data.source_campaign}` : null,
        metadata: { source: data.source },
        created_by: 'system',
    })

    // Notify CRM users of new lead
    await createNotification({
        type: 'new_lead',
        title: `New lead: ${data.name}`,
        body: `From ${data.source}${data.source_campaign ? ` · ${data.source_campaign}` : ''}`,
        link: `/crm/leads/${lead.id}`,
        lead_id: lead.id,
    })

    // Send welcome email (fire and forget)
    if (data.email) {
        sendEmailByCategory('welcome', data.email, { name: data.name }, lead.id).catch(
            err => console.error('Welcome email failed:', err)
        )
    }

    return lead
}

// ─────────────────────────────────────────────────────────────────
// Recalculate and persist score for an existing lead
// ─────────────────────────────────────────────────────────────────
export async function refreshLeadScore(leadId: string) {
    const supabase = getSupabase()

    const [{ data: lead }, { count: activityCount }] = await Promise.all([
        supabase.from('leads').select('*').eq('id', leadId).single(),
        supabase.from('lead_activities').select('id', { count: 'exact', head: true }).eq('lead_id', leadId),
    ])

    if (!lead) return

    const { score, breakdown } = calculateScore({
        source: lead.source,
        email: lead.email,
        phone: lead.phone,
        budget_min: lead.budget_min,
        budget_max: lead.budget_max,
        preferred_location: lead.preferred_location,
        property_type: lead.property_type,
        notes: lead.notes,
        last_contacted_at: lead.last_contacted_at,
        activity_count: activityCount || 0,
    })

    await supabase.from('leads').update({
        score,
        score_breakdown: breakdown,
        priority: scoreToPriority(score),
    }).eq('id', leadId)
}

// ─────────────────────────────────────────────────────────────────
// Log a webhook and process it
// ─────────────────────────────────────────────────────────────────
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

    if (status === 'processed') {
        await supabase.rpc('increment_connector_leads', { p_platform: platform }).catch(() => {})
    }
}

// ─────────────────────────────────────────────────────────────────
// Update lead status and log the change
// ─────────────────────────────────────────────────────────────────
export async function updateLeadStatus(leadId: string, newStatus: string, changedBy: string = 'system') {
    const supabase = getSupabase()

    const { data: lead } = await supabase
        .from('leads')
        .select('status, name')
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

    // Notify on key status changes
    if (['converted', 'lost', 'site_visit'].includes(newStatus)) {
        await createNotification({
            type: 'status_change',
            title: `${lead?.name || 'Lead'} → ${newStatus}`,
            body: `Status moved from ${oldStatus} to ${newStatus}`,
            link: `/crm/leads/${leadId}`,
            lead_id: leadId,
        })
    }

    // Re-score on status change
    await refreshLeadScore(leadId).catch(() => {})
}
