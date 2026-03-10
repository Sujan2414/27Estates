import { AdPlatformConnector } from './base'
import { NormalizedLead } from '../types'

// Google Ads Lead Form Extensions Connector
// Docs: https://developers.google.com/google-ads/api/docs/leads/overview
export const googleAdsConnector: AdPlatformConnector = {
    platform: 'google_ads',

    parseWebhook(payload: Record<string, unknown>): NormalizedLead | null {
        try {
            // Google Ads webhook format varies by setup
            // Common format from Google Ads lead form extensions:
            const leadData = (payload.lead_form_submission || payload) as Record<string, unknown>
            const userData = (leadData.user_column_data as Array<{ column_id: string; string_value: string }>) || []

            const getField = (columnId: string): string | undefined => {
                const field = userData.find(f =>
                    f.column_id.toLowerCase().includes(columnId.toLowerCase())
                )
                return field?.string_value
            }

            // Also handle flat payload format (from Zapier/webhook relay)
            const name = getField('FULL_NAME') || getField('name') ||
                (payload.name as string) ||
                `${(payload.first_name as string) || ''} ${(payload.last_name as string) || ''}`.trim()

            if (!name) return null

            return {
                name,
                email: getField('EMAIL') || (payload.email as string),
                phone: getField('PHONE_NUMBER') || (payload.phone as string),
                source: 'google_ads',
                source_campaign: (leadData.campaign_id || payload.campaign_name) as string || undefined,
                source_ad_id: (leadData.ad_group_id || payload.ad_id) as string || undefined,
                source_form_id: (leadData.form_id || payload.form_id) as string || undefined,
                source_raw_data: payload,
                preferred_location: getField('CITY') || (payload.city as string),
                property_type: getField('PROPERTY_TYPE') || (payload.property_type as string),
                notes: getField('COMMENTS') || (payload.message as string),
            }
        } catch {
            console.error('Failed to parse Google Ads webhook')
            return null
        }
    },

    verifyWebhook(headers: Record<string, string>): boolean {
        // Google Ads verification depends on setup method
        // For webhook relay services, check the secret token
        const token = headers['x-goog-webhook-token'] || headers['authorization']
        const expectedToken = process.env.GOOGLE_ADS_WEBHOOK_SECRET

        if (!expectedToken) return true // Skip verification if not configured
        return token === expectedToken || token === `Bearer ${expectedToken}`
    }
}
