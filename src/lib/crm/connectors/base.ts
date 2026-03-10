import { NormalizedLead } from '../types'

// Base connector interface - all ad platform connectors must implement this
export interface AdPlatformConnector {
    platform: string
    // Parse incoming webhook payload into a normalized lead
    parseWebhook(payload: Record<string, unknown>): NormalizedLead | null
    // Verify webhook signature/authenticity
    verifyWebhook(headers: Record<string, string>, body: string): boolean
}

// Registry of all connectors - add new platforms here
const connectors: Record<string, AdPlatformConnector> = {}

export function registerConnector(connector: AdPlatformConnector) {
    connectors[connector.platform] = connector
}

export function getConnector(platform: string): AdPlatformConnector | null {
    return connectors[platform] || null
}

export function getAllConnectors(): Record<string, AdPlatformConnector> {
    return { ...connectors }
}
