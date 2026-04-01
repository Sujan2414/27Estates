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

                const name = findField('name', 'contact', 'full_name', 'fullName', 'customer_name', 'buyer_name', 'user_name', 'contact_name')

                if (!name) return null

                // Build phone: combine countryCode + mobile if separate
                let phone = findField('phone', 'mobile', 'phone_number', 'phoneNumber', 'contact_number', 'mobile_number')
                const countryCode = findField('countryCode', 'country_code', 'isd_code')
                if (phone && countryCode && !phone.startsWith('+') && !phone.startsWith(countryCode)) {
                    phone = `+${countryCode}${phone}`
                }

                // Budget: support single budget field or min/max
                const budgetRaw = findField('budget', 'leadExpectedBudget', 'expected_budget')
                const budgetMin = payload.budget_min ? Number(payload.budget_min)
                    : budgetRaw ? Number(budgetRaw) : undefined
                const budgetMax = payload.budget_max ? Number(payload.budget_max) : undefined

                // Location: prefer locality over city
                const preferred_location = findField('locality', 'location', 'area', 'city', 'preferred_location')

                // Property type: combine property + propertyType if available
                const propType = findField('propertyType', 'property_type', 'bhk', 'configuration', 'unit_type', 'bedroom')
                const propCategory = findField('property', 'category', 'listing_type')
                const property_type = propType && propCategory
                    ? `${propCategory} - ${propType}`
                    : propType || propCategory

                // Campaign: project name or subsource
                const source_campaign = findField('project', 'campaign', 'campaign_name', 'subsource', 'listing_name')

                // Lead ID from MagicBricks for dedup/reference
                const source_ad_id = findField('LeadId', 'lead_id', 'listing_id', 'property_id', 'ad_id')

                // Notes: combine message + lead status if available
                const noteBase = findField('notes', 'message', 'comments', 'requirement', 'query', 'remarks')
                const leadStatus = findField('leadStatus', 'lead_status')
                const notes = [noteBase, leadStatus ? `Lead Status: ${leadStatus}` : ''].filter(Boolean).join(' | ') || undefined

                return {
                    name,
                    email: findField('email', 'email_id', 'emailId', 'customer_email', 'buyer_email'),
                    phone,
                    source: platform,
                    source_campaign,
                    source_ad_id,
                    source_raw_data: payload,
                    preferred_location,
                    property_type,
                    budget_min: budgetMin,
                    budget_max: budgetMax,
                    notes,
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

export const housingConnector = createGenericConnector('housing', 'Housing.com')
export const justDialConnector = createGenericConnector('justdial', 'JustDial')

