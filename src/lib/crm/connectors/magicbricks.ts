import { AdPlatformConnector } from './base'
import { NormalizedLead } from '../types'

// Dedicated connector for MagicBricks
// MagicBricks sends leads via GET query parameters:
//   ?name=shailendra&countryCode=91&mobile=7760569940&email=shailendra.oc%40gmail.com
//   &city=Bangalore&locality=Nandi+Hills&state=&property=10000
//   &propertyType=&project=Brigade+Oasis+Phase+3&budget=13200000
//   &leadExpectedBudget=13200000&notes=This+user+is+looking+for+...
//   &leadStatus=Schedule+Site+Visit&subsource=organic
//   &LeadId=1406586661&submittedDate=20260401

export const magicBricksConnector: AdPlatformConnector = {
    platform: 'magicbricks',

    parseWebhook(payload: Record<string, unknown>): NormalizedLead | null {
        try {
            const str = (key: string): string | undefined => {
                const val = payload[key]
                return (val && typeof val === 'string' && val.trim()) ? val.trim() : undefined
            }

            const name = str('name') || str('contact') || str('full_name')
            if (!name) return null

            // Phone: combine countryCode + mobile
            let phone = str('mobile') || str('phone')
            const countryCode = str('countryCode') || str('country_code')
            if (phone && countryCode && !phone.startsWith('+') && !phone.startsWith(countryCode)) {
                phone = `+${countryCode}${phone}`
            }

            // Budget: prefer leadExpectedBudget, fall back to budget
            const budgetStr = str('leadExpectedBudget') || str('budget')
            const budgetNum = budgetStr ? Number(budgetStr) : undefined
            const budgetMin = (budgetNum && !isNaN(budgetNum) && budgetNum > 0) ? budgetNum : undefined

            // Location: prefer locality (more specific), then city
            const locality = str('locality')
            const city = str('city')
            const preferred_location = locality && city
                ? `${locality}, ${city}`
                : locality || city

            // Property type: combine property + propertyType
            const propType = str('propertyType') || str('property_type')
            const propCategory = str('property')
            const property_type = propType && propCategory
                ? `${propCategory} - ${propType}`
                : propType || propCategory || undefined

            // Project name
            const project = str('project')

            // Notes: combine notes + leadStatus
            const noteBase = str('notes') || str('message')
            const leadStatus = str('leadStatus') || str('lead_status')
            const parts = [
                noteBase,
                leadStatus ? `Lead Status: ${leadStatus}` : '',
                city ? `City: ${city}` : '',
            ].filter(Boolean)
            const notes = parts.length > 0 ? parts.join(' | ') : undefined

            // MagicBricks LeadId for dedup & reference
            const source_ad_id = str('LeadId') || str('lead_id')

            // Subsource as medium
            const subsource = str('subsource')

            return {
                name,
                email: str('email'),
                phone,
                source: 'magicbricks',
                source_campaign: project || undefined,
                source_ad_id,
                source_raw_data: payload,
                preferred_location,
                property_type,
                budget_min: budgetMin,
                budget_max: budgetMin, // MagicBricks sends a single budget figure
                notes,
                project_interest: project || undefined,
            }
        } catch {
            console.error('Failed to parse MagicBricks webhook')
            return null
        }
    },

    verifyWebhook(): boolean {
        // MagicBricks doesn't send auth headers — verification is optional
        const expectedToken = process.env.MAGICBRICKS_WEBHOOK_SECRET
        if (!expectedToken) return true
        return true
    }
}
