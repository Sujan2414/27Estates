import { AdPlatformConnector } from './base'
import { NormalizedLead, LeadSource } from '../types'

// Generic connector for MagicBricks, Housing.com, JustDial
// These platforms typically send leads via email or simple webhook/API
// This connector handles a flat JSON payload format
function createGenericConnector(platform: LeadSource, displayName: string): AdPlatformConnector {
    return {
        platform,

        parseWebhook(payload: Record<string, unknown>): NormalizedLead | null {
            try {
                // Case-insensitive field matching for different platforms
                const findField = (...keys: string[]): string | undefined => {
                    const payloadKeys = Object.keys(payload)
                    for (const key of keys) {
                        const lowerKey = key.toLowerCase()
                        const matchedKey = payloadKeys.find(pk => pk.toLowerCase() === lowerKey)
                        if (matchedKey) {
                            const value = payload[matchedKey]
                            if (value && typeof value === 'string') return value
                        }
                    }
                    return undefined
                }

                const name = findField('name', 'full_name', 'fullName', 'customer_name', 'buyer_name', 'user_name', 'contact_name')

                if (!name) return null

                return {
                    name,
                    email: findField('email', 'email_id', 'emailId', 'customer_email', 'buyer_email'),
                    phone: findField('phone', 'mobile', 'phone_number', 'phoneNumber', 'contact_number', 'mobile_number'),
                    source: platform,
                    source_campaign: findField('campaign', 'campaign_name', 'listing_type', 'project'),
                    source_ad_id: findField('listing_id', 'property_id', 'ad_id'),
                    source_raw_data: payload,
                    preferred_location: findField('location', 'city', 'area', 'locality'),
                    property_type: findField('property_type', 'bhk', 'configuration', 'unit_type', 'propertyType', 'bedroom'),
                    budget_min: payload.budget_min ? Number(payload.budget_min) : undefined,
                    budget_max: payload.budget_max ? Number(payload.budget_max) : undefined,
                    notes: findField('message', 'comments', 'requirement', 'description', 'query', 'remarks'),
                }
            } catch {
                console.error(`Failed to parse ${displayName} webhook`)
                return null
            }
        },

        verifyWebhook(headers: Record<string, string>): boolean {
            // Generic verification using a shared secret token
            const token = headers['x-webhook-secret'] || headers['authorization']
            const envKey = `${platform.toUpperCase().replace(/[^A-Z]/g, '_')}_WEBHOOK_SECRET`
            const expectedToken = process.env[envKey]

            if (!expectedToken) return true // Skip if not configured
            return token === expectedToken || token === `Bearer ${expectedToken}`
        }
    }
}

export const magicBricksConnector = createGenericConnector('magicbricks', 'MagicBricks')
export const housingConnector = createGenericConnector('housing', 'Housing.com')
export const justDialConnector = createGenericConnector('justdial', 'JustDial')

