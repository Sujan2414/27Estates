/**
 * GET /api/whatsapp/templates
 * Fetches the list of approved message templates from Meta's Graph API.
 * Used to populate the broadcast UI dropdown.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface MetaTemplate {
    id: string
    name: string
    language: string
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | string
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | string
    components?: Array<{
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
        text?: string
        format?: string
        example?: { body_text?: string[][]; header_text?: string[] }
        buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>
    }>
}

interface MetaTemplatesResponse {
    data?: MetaTemplate[]
    paging?: { cursors?: { before?: string; after?: string }; next?: string }
    error?: { message: string; code: number }
}

export async function GET() {
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const version = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0'

    if (!wabaId || !token) {
        return NextResponse.json(
            { error: 'WHATSAPP_BUSINESS_ACCOUNT_ID or WHATSAPP_ACCESS_TOKEN missing in env' },
            { status: 500 }
        )
    }

    const url = `https://graph.facebook.com/${version}/${wabaId}/message_templates?limit=100&fields=id,name,language,status,category,components`

    try {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        })
        const json = (await res.json()) as MetaTemplatesResponse
        if (!res.ok || json.error) {
            return NextResponse.json(
                { error: json.error?.message || `Meta API HTTP ${res.status}` },
                { status: 502 }
            )
        }
        const templates = (json.data || []).filter(t => t.status === 'APPROVED')
        return NextResponse.json({ templates })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Fetch failed'
        return NextResponse.json({ error: msg }, { status: 502 })
    }
}
