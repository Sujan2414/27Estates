import { AdPlatformConnector } from './base'
import { NormalizedLead } from '../types'
import crypto from 'crypto'

// Meta (Facebook/Instagram) Lead Ads Connector
// Docs: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/
export const metaAdsConnector: AdPlatformConnector = {
    platform: 'meta_ads',

    parseWebhook(payload: Record<string, unknown>): NormalizedLead | null {
        try {
            // Meta sends leadgen webhooks in this format:
            // { entry: [{ changes: [{ value: { leadgen_id, page_id, form_id, ... } }] }] }
            const entry = (payload.entry as Array<Record<string, unknown>>)?.[0]
            const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0]
            const value = changes?.value as Record<string, unknown>

            if (!value) return null

            // The actual field_data comes from a separate API call to fetch lead details
            // This handles both the webhook notification and pre-fetched lead data
            const fieldData = (value.field_data as Array<{ name: string; values: string[] }>) || []

            const getField = (name: string): string | undefined => {
                const field = fieldData.find(f =>
                    f.name.toLowerCase() === name.toLowerCase() ||
                    f.name.toLowerCase().includes(name.toLowerCase())
                )
                return field?.values?.[0]
            }

            const name = getField('full_name') || getField('name') ||
                `${getField('first_name') || ''} ${getField('last_name') || ''}`.trim()

            if (!name) return null

            return {
                name,
                email: getField('email'),
                phone: getField('phone_number') || getField('phone'),
                source: 'meta_ads',
                source_campaign: value.campaign_name as string || undefined,
                source_ad_id: value.ad_id as string || undefined,
                source_form_id: value.form_id as string || undefined,
                source_raw_data: payload,
                preferred_location: getField('city') || getField('location'),
                property_type: getField('property_type') || getField('what_are_you_looking_for'),
                notes: getField('message') || getField('comments'),
            }
        } catch {
            console.error('Failed to parse Meta Ads webhook')
            return null
        }
    },

    verifyWebhook(headers: Record<string, string>, body: string): boolean {
        const signature = headers['x-hub-signature-256']
        const appSecret = process.env.META_APP_SECRET

        if (!signature || !appSecret) return false

        const expectedSignature = 'sha256=' +
            crypto.createHmac('sha256', appSecret).update(body).digest('hex')

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )
    }
}
