export const leadStatusConfig: Record<string, { color: string; label: string }> = {
    new: { color: '#3b82f6', label: 'New' },
    contacted: { color: '#f59e0b', label: 'Contacted' },
    qualified: { color: '#8b5cf6', label: 'Qualified' },
    negotiation: { color: '#f97316', label: 'Negotiation' },
    site_visit: { color: '#06b6d4', label: 'Site Visit' },
    converted: { color: '#22c55e', label: 'Converted' },
    lost: { color: '#ef4444', label: 'Lost' },
}

export const leadSourceConfig: Record<string, { label: string; color: string; bg: string }> = {
    website: { label: 'Website', color: '#3b82f6', bg: '#3b82f620' },
    meta_ads: { label: 'Meta Ads', color: '#ec4899', bg: '#ec489920' },
    google_ads: { label: 'Google Ads', color: '#f59e0b', bg: '#f59e0b20' },
    '99acres': { label: '99acres', color: '#ef4444', bg: '#ef444420' },
    magicbricks: { label: 'MagicBricks', color: '#f97316', bg: '#f9731620' },
    'housing': { label: 'Housing.com', color: '#06b6d4', bg: '#06b6d420' },
    justdial: { label: 'JustDial', color: '#8b5cf6', bg: '#8b5cf620' },
    chatbot: { label: 'Chatbot', color: '#22c55e', bg: '#22c55e20' },
    whatsapp: { label: 'WhatsApp', color: '#25D366', bg: '#25D36620' },
    manual: { label: 'Manual', color: '#a78bfa', bg: '#a78bfa20' },
    referral: { label: 'Referral', color: '#BFA270', bg: '#BFA27020' },
    b2bbricks: { label: 'B2BBricks', color: '#fb7185', bg: '#fb718520' },
    sulekha: { label: 'Sulekha', color: '#34d399', bg: '#34d39920' },
    commonfloor: { label: 'CommonFloor', color: '#60a5fa', bg: '#60a5fa20' },
}

export const FALLBACK_CHART_COLORS = ['#fb923c', '#4ade80', '#f472b6', '#38bdf8', '#a3e635', '#fbbf24', '#c084fc', '#2dd4bf']

export const getStatusColor = (status: string) => leadStatusConfig[status]?.color || '#6b7280'
export const getStatusLabel = (status: string) => leadStatusConfig[status]?.label || status
export const getSourceColor = (source: string) => leadSourceConfig[source]?.color || '#6b7280'
export const getSourceLabel = (source: string) => leadSourceConfig[source]?.label || source
export const getSourceBg = (source: string) => leadSourceConfig[source]?.bg || '#6b728020'
