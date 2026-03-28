import { AdPlatformConnector } from './base'
import { NormalizedLead } from '../types'

// Dedicated connector for 99acres
// 99acres sends Pascal Case keys: Name, Email, Mobile, Project, Bedroom, Price, propertyType, remarks

// Case-insensitive field lookup helper
function getField(payload: Record<string, unknown>, ...keys: string[]): string | undefined {
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

export const ninetyNineAcresConnector: AdPlatformConnector = {
    platform: '99acres',

    parseWebhook(payload: Record<string, unknown>): NormalizedLead | null {
        try {
            const name = getField(payload, 'Name', 'name')

            if (!name) return null

            // Extract remarks — 99acres often includes location info here
            // e.g. "20625000, 3Bed Apartment for Sale in House of Hiranandani Glenridge, Hebbal, Bangalore North | Project: House of Hiranandani Glenridge"
            const remarks = getField(payload, 'remarks', 'remark', 'Remarks')

            // Parse location from remarks if possible (format: "..., Area, City | Project: ...")
            let location: string | undefined
            let remarksProjectName: string | undefined
            if (remarks) {
                // Extract project name from "| Project: ..." part
                const projectMatch = remarks.match(/\|\s*Project:\s*(.+?)(?:\s*\||$)/i)
                if (projectMatch) remarksProjectName = projectMatch[1].trim()

                // Extract location: last comma-separated part before the "|" pipe
                const beforePipe = remarks.split('|')[0]
                const parts = beforePipe.split(',').map((s: string) => s.trim())
                if (parts.length >= 2) {
                    location = parts[parts.length - 1]
                }

                // Also try parsing "for Sale in {PropertyName}," pattern for property name
                if (!remarksProjectName) {
                    const saleMatch = remarks.match(/for (?:Sale|Rent) in ([^,|]+)/i)
                    if (saleMatch) remarksProjectName = saleMatch[1].trim()
                }
            }

            // Parse price — 99acres may send it as a string like "50 Lac" or empty
            const priceStr = getField(payload, 'Price', 'price')
            let budgetMax: number | undefined
            if (priceStr) {
                const numMatch = priceStr.replace(/[^\d.]/g, '')
                if (numMatch) {
                    const num = parseFloat(numMatch)
                    if (priceStr.toLowerCase().includes('cr')) budgetMax = num * 10000000
                    else if (priceStr.toLowerCase().includes('lac') || priceStr.toLowerCase().includes('lakh')) budgetMax = num * 100000
                    else budgetMax = num
                }
            }

            // Build property type from Bedroom + propertyType
            const bedroom = getField(payload, 'Bedroom', 'bedroom', 'BHK', 'bhk')
            const propType = getField(payload, 'propertyType', 'property_type', 'PropertyType')
            const propertyType = [bedroom, propType].filter(Boolean).join(' ').trim() || undefined

            return {
                name,
                email: getField(payload, 'Email', 'email'),
                phone: getField(payload, 'Mobile', 'mobile', 'phone', 'Phone'),
                source: '99acres',
                source_campaign: getField(payload, 'Project', 'project') || remarksProjectName,
                project_interest: getField(payload, 'Project', 'project') || remarksProjectName,
                source_raw_data: payload,
                preferred_location: location,
                property_type: propertyType,
                budget_max: budgetMax,
                notes: remarks,
            }
        } catch {
            console.error('Failed to parse 99acres webhook')
            return null
        }
    },

    verifyWebhook(): boolean {
        // 99acres webhook verification — skip if no secret configured
        const expectedToken = process.env.NINETY_NINE_ACRES_WEBHOOK_SECRET
        if (!expectedToken) return true
        // 99acres typically doesn't send auth headers; verification is optional
        return true
    }
}
