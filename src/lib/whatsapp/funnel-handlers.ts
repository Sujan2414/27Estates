/**
 * WhatsApp funnel — stage machine.
 *
 * The webhook dispatches each inbound message to this module BEFORE calling
 * the free-form AI. The handler returns a FunnelAction telling the webhook
 * what to send and what stage to transition to.
 *
 * Phase 1 implements:
 *   NEW       → send welcome buttons → WELCOMED
 *   WELCOMED  → button tap → save intent → INTENT_KNOWN (delegate to AI for now)
 *               → free-form text → delegate to AI immediately (skip funnel)
 *   ENGAGED_AI / anything else → delegate to AI
 *
 * Phase 2+ will add lists for location/budget/BHK and replace the AI delegation
 * after WELCOMED with structured questions.
 *
 * See WHATSAPP_FUNNEL.md §4, §7.
 */

import type { ReplyButton } from './meta-client'

export type Stage =
    | 'NEW'
    | 'WELCOMED'
    | 'INTENT_KNOWN'
    | 'LOCATION_KNOWN'
    | 'BUDGET_KNOWN'
    | 'BHK_KNOWN'
    | 'LISTINGS_SENT'
    | 'ENGAGED_AI'
    | 'SITE_VISIT_BOOKED'
    | 'AGENT_HANDOFF'
    | 'CONVERTED'
    | 'LOST'

export type Intent = 'buy' | 'rent' | 'agent'

export interface FunnelInput {
    stage: Stage
    contactName: string | null
    contentText: string | null
    buttonReplyId?: string
    listReplyId?: string
    messageType: string
}

export type FunnelAction =
    | {
          kind: 'send-buttons'
          body: string
          buttons: ReplyButton[]
          header?: string
          footer?: string
          nextStage: Stage
          patch?: Partial<ConversationPatch>
      }
    | {
          kind: 'send-text'
          body: string
          nextStage?: Stage
          patch?: Partial<ConversationPatch>
      }
    | {
          kind: 'delegate-to-ai'
          nextStage?: Stage
          patch?: Partial<ConversationPatch>
      }
    | {
          kind: 'escalate'
          reason: string
          summary: string
          farewellText: string
      }
    | { kind: 'noop' }

export interface ConversationPatch {
    intent: Intent | null
    filter_city: string | null
    filter_budget: string | null
    filter_bhk: string | null
}

// ─────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────
export function dispatchByStage(input: FunnelInput): FunnelAction {
    switch (input.stage) {
        case 'NEW':
            return handleNew(input)
        case 'WELCOMED':
            return handleWelcomed(input)
        // Phase 2 will add LOCATION_KNOWN / BUDGET_KNOWN / BHK_KNOWN handlers.
        // For now anything past WELCOMED falls through to the existing AI.
        default:
            return { kind: 'delegate-to-ai' }
    }
}

// ─────────────────────────────────────────────────────────────
// Stage handlers
// ─────────────────────────────────────────────────────────────

function handleNew(input: FunnelInput): FunnelAction {
    const name = firstName(input.contactName)
    const body = `Hi ${name} 👋 I'm KIWI from 27 Estates — your AI assistant.

I can help you find a home, book a site visit, or connect you with one of our agents.

What brings you here today?`

    return {
        kind: 'send-buttons',
        body,
        buttons: [
            { id: 'intent_buy', title: '🏠 Looking to Buy' },
            { id: 'intent_rent', title: '🔑 Looking to Rent' },
            { id: 'intent_agent', title: '👤 Talk to Agent' },
        ],
        nextStage: 'WELCOMED',
    }
}

function handleWelcomed(input: FunnelInput): FunnelAction {
    // User tapped one of the welcome buttons
    if (input.buttonReplyId) {
        switch (input.buttonReplyId) {
            case 'intent_buy':
                return {
                    kind: 'send-text',
                    body:
                        "Great — buying. Which city are you looking in? (Bangalore, Hyderabad, or somewhere else?)",
                    nextStage: 'INTENT_KNOWN',
                    patch: { intent: 'buy' },
                }
            case 'intent_rent':
                return {
                    kind: 'send-text',
                    body:
                        "Got it — looking to rent. Which city, and any specific area in mind?",
                    nextStage: 'INTENT_KNOWN',
                    patch: { intent: 'rent' },
                }
            case 'intent_agent':
                return {
                    kind: 'escalate',
                    reason: 'user_request',
                    summary: 'User tapped "Talk to Agent" from welcome screen.',
                    farewellText:
                        "Connecting you with one of our agents. They'll reply here shortly.\n\nOffice hours: 9 AM – 8 PM IST, 7 days a week.",
                }
        }
    }

    // Free-form text instead of a button tap — let the AI handle it (the user
    // probably typed something like "3BHK in Whitefield" which the AI is better
    // at extracting than our limited button payloads).
    return { kind: 'delegate-to-ai', nextStage: 'INTENT_KNOWN' }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function firstName(full: string | null | undefined): string {
    if (!full) return 'there'
    const first = full.trim().split(/\s+/)[0]
    return first || 'there'
}
