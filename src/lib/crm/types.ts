// CRM Types

export type LeadSource = 'website' | 'meta_ads' | 'google_ads' | '99acres' | 'magicbricks' | 'housing' | 'justdial' | 'chatbot' | 'whatsapp' | 'manual' | 'referral'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiation' | 'site_visit' | 'converted' | 'lost'
export type LeadPriority = 'hot' | 'warm' | 'cold'
export type ActivityType = 'call' | 'email_sent' | 'email_received' | 'whatsapp' | 'site_visit' | 'note' | 'status_change' | 'chatbot' | 'system'

export interface Lead {
    id: string
    name: string
    email: string | null
    phone: string | null
    source: LeadSource
    source_campaign: string | null
    source_ad_id: string | null
    source_form_id: string | null
    source_raw_data: Record<string, unknown> | null
    status: LeadStatus
    priority: LeadPriority
    assigned_to: string | null
    assigned_agent_id: string | null // alias kept for backward compat
    property_interest: string | null
    project_interest: string | null
    budget_min: number | null
    budget_max: number | null
    preferred_location: string | null
    property_type: string | null
    notes: string | null
    tags: string[]
    score: number | null
    score_breakdown: Record<string, number> | null
    lead_preferences: Record<string, unknown> | null
    last_contacted_at: string | null
    next_follow_up_at: string | null
    converted_at: string | null
    lost_reason: string | null
    escalated_at: string | null
    escalation_count: number
    created_at: string
    updated_at: string
    // Joined fields
    agents?: { name: string; email: string; phone: string } | null
    assignee?: { id: string; full_name: string } | null
    properties?: { title: string; property_id: string } | null
    projects?: { project_name: string } | null
}

export interface LeadActivity {
    id: string
    lead_id: string
    type: ActivityType
    title: string
    description: string | null
    metadata: Record<string, unknown> | null
    created_by: string
    created_at: string
}

export interface LeadTask {
    id: string
    lead_id: string
    title: string
    description: string | null
    due_date: string
    is_completed: boolean
    completed_at: string | null
    assigned_to: string | null
    created_at: string
}

export interface AdConnector {
    id: string
    platform: string
    display_name: string
    is_active: boolean
    config: Record<string, unknown>
    webhook_url: string | null
    last_synced_at: string | null
    leads_count: number
    created_at: string
    updated_at: string
}

export interface WebhookLog {
    id: string
    platform: string
    event_type: string | null
    payload: Record<string, unknown>
    status: 'received' | 'processed' | 'failed' | 'duplicate'
    error_message: string | null
    lead_id: string | null
    created_at: string
}

export interface EmailTemplate {
    id: string
    name: string
    subject: string
    body_html: string
    variables: string[]
    category: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ChatSession {
    id: string
    visitor_id: string
    lead_id: string | null
    status: 'active' | 'closed' | 'escalated'
    started_at: string
    ended_at: string | null
}

export interface ChatMessage {
    id: string
    session_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    metadata: Record<string, unknown> | null
    created_at: string
}

// Normalized lead data that all connectors must produce
export interface NormalizedLead {
    name: string
    email?: string
    phone?: string
    source: LeadSource
    source_campaign?: string
    source_ad_id?: string
    source_form_id?: string
    source_raw_data?: Record<string, unknown>
    property_interest?: string
    project_interest?: string
    preferred_location?: string
    property_type?: string
    budget_min?: number
    budget_max?: number
    notes?: string
}
