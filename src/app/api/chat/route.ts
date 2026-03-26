export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { AzureOpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'
import { createLead } from '@/lib/crm/leads'

// Lazy-init so env vars are available at runtime, not build time
let _openai: AzureOpenAI | null = null
function getOpenAI() {
    if (!_openai) {
        _openai = new AzureOpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY!,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
            apiVersion: '2024-12-01-preview',
        })
    }
    return _openai
}
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const formatPrice = (amount: number): string => {
    if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(2)} L`
    return `\u20B9${amount.toLocaleString('en-IN')}`
}

// ─── In-memory cache (refreshes every 2 minutes) ───
let cachedProperties: any[] = []
let cachedProjects: any[] = []
let cacheTime = 0
const CACHE_TTL = 2 * 60 * 1000

async function getInventory() {
    if (Date.now() - cacheTime < CACHE_TTL && cachedProjects.length > 0) {
        return { properties: cachedProperties, projects: cachedProjects }
    }

    const [{ data: properties }, { data: projects }] = await Promise.all([
        supabase
            .from('properties')
            .select('id, title, location, city, price, price_text, bedrooms, sqft, property_type, category, images')
            .order('created_at', { ascending: false }),
        supabase
            .from('projects')
            .select('id, project_name, location, city, category, developer_name, min_price, max_price, bhk_options, images, status, is_rera_approved')
            .order('created_at', { ascending: false }),
    ])

    cachedProperties = properties || []
    cachedProjects = projects || []
    cacheTime = Date.now()
    return { properties: cachedProperties, projects: cachedProjects }
}

// ─── Smart context filtering — only send relevant listings ───
function buildContext(userMessage: string, allMessages: any[], properties: any[], projects: any[]): string {
    // Combine last 3 user messages for keyword extraction
    const recentText = allMessages
        .filter(m => m.role === 'user')
        .slice(-3)
        .map(m => m.content)
        .join(' ')
        .toLowerCase()

    const text = (recentText + ' ' + userMessage).toLowerCase()

    // Check if this is a general greeting / non-property query
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'thanks', 'thank you', 'bye', 'ok', 'okay']
    const isGreeting = greetings.some(g => text.trim() === g || text.trim() === g + '!')
    const isLeadCapture = /\b\d{10}\b/.test(text) || /my name is/i.test(text) || /phone|number|contact|email/i.test(text)

    if (isGreeting || isLeadCapture) {
        // No need to send any listings for greetings or lead capture
        return '\n\n(No specific listings needed for this response. You have access to properties and projects — ask the user what they are looking for.)'
    }

    // Extract keywords for filtering
    const keywords: string[] = []

    // Cities
    const cities = ['bangalore', 'bengaluru', 'pune', 'mumbai', 'hyderabad', 'delhi', 'gurgaon', 'noida', 'chennai', 'goa']
    cities.forEach(c => { if (text.includes(c)) keywords.push(c) })

    // Categories
    if (/residential|apartment|flat|home/i.test(text)) keywords.push('residential')
    if (/commercial|office|retail|shop/i.test(text)) keywords.push('commercial')
    if (/villa|bungalow|house/i.test(text)) keywords.push('villa')
    if (/plot|land|site/i.test(text)) keywords.push('plot')

    // BHK
    const bhkMatch = text.match(/(\d)\s*bhk/i)
    if (bhkMatch) keywords.push(bhkMatch[1] + 'bhk', bhkMatch[1] + ' bhk')

    // Budget
    const hasBudget = /\d+\s*(cr|crore|lakh|l)\b/i.test(text) || /under|below|budget|within|less than|above|over/i.test(text)

    // Developers
    const developers = ['prestige', 'brigade', 'sobha', 'embassy', 'godrej', 'puravankara', 'purva', 'birla', 'tata', 'lodha', 'mahindra', 'raymond', 'assetz', 'total', 'mana', 'provident', 'salarpuria', 'mantri', 'rohan']
    developers.forEach(d => { if (text.includes(d)) keywords.push(d) })

    // Location keywords from the text (extract any multi-word location-like terms)
    const locationTerms = ['whitefield', 'sarjapur', 'electronic city', 'hsr', 'koramangala', 'indiranagar', 'jp nagar', 'jayanagar', 'hebbal', 'yelahanka', 'devanahalli', 'north bangalore', 'south bangalore', 'east bangalore', 'west bangalore', 'hennur', 'thanisandra', 'kanakapura', 'bannerghatta', 'mysore road', 'tumkur road', 'bellary road', 'hosur road', 'old madras road', 'varthur', 'marathahalli', 'bellandur', 'hinjewadi', 'wakad', 'baner', 'kharadi', 'hadapsar']
    locationTerms.forEach(l => { if (text.includes(l)) keywords.push(l) })

    // Score and filter
    function scoreItem(searchText: string): number {
        if (keywords.length === 0) return 1 // No keywords = show everything
        let score = 0
        for (const kw of keywords) {
            if (searchText.includes(kw)) score += 1
        }
        return score
    }

    // Score properties
    const scoredProps = properties.map(p => {
        const searchable = `${p.title} ${p.location} ${p.city} ${p.category} ${p.property_type} ${p.bedrooms || ''}bhk`.toLowerCase()
        return { item: p, score: scoreItem(searchable) }
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score)

    // Score projects
    const scoredProjects = projects.map(p => {
        const searchable = `${p.project_name} ${p.location} ${p.city} ${p.category} ${p.developer_name} ${p.bhk_options?.join(' ') || ''} ${p.status || ''}`.toLowerCase()
        return { item: p, score: scoreItem(searchable) }
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score)

    // If no keywords matched anything, show top 10 of each as fallback
    const matchedProps = scoredProps.length > 0 ? scoredProps.slice(0, 10) : properties.slice(0, 8).map(p => ({ item: p, score: 0 }))
    const matchedProjects = scoredProjects.length > 0 ? scoredProjects.slice(0, 15) : projects.slice(0, 10).map(p => ({ item: p, score: 0 }))

    let ctx = ''
    if (matchedProps.length > 0) {
        ctx += '\n\nMatching Properties (use [PROPERTY_CARD:id] to show cards):\n'
        matchedProps.forEach(({ item: p }) => {
            ctx += `- ID:${p.id} | ${p.title} | ${p.category} | ${p.location || p.city} | ${p.bedrooms ? p.bedrooms + 'BHK' : ''} | ${p.sqft ? p.sqft + ' sqft' : ''} | ${p.price ? (p.price_text || formatPrice(p.price)) : 'Price on request'} | ${p.property_type || ''}\n`
        })
    }
    if (matchedProjects.length > 0) {
        ctx += '\nMatching Projects (use [PROJECT_CARD:id] to show cards):\n'
        matchedProjects.forEach(({ item: p }) => {
            const priceRange = p.min_price && p.max_price
                ? `${formatPrice(p.min_price)} - ${formatPrice(p.max_price)}`
                : p.min_price ? `Starting ${formatPrice(p.min_price)}` : 'Price on request'
            ctx += `- ID:${p.id} | ${p.project_name} | ${p.category} | ${p.location || p.city} | ${priceRange} | by ${p.developer_name || 'N/A'} | ${p.bhk_options?.join(', ') || ''} | ${p.status || ''}\n`
        })
    }

    if (!ctx) {
        ctx = '\n\n(No matching listings found for this query. Suggest the user refine their search or offer to connect them with a consultant.)'
    }

    return ctx
}

// ─── System prompt ───
const SYSTEM_PROMPT = `You are a friendly and professional real estate assistant for 27 Estates, a premium real estate advisory and brokerage firm based in Bangalore, India.

Your role:
- Help visitors find suitable properties and projects based on their requirements (budget, BHK, location, property type)
- Answer questions about specific properties, projects, pricing, locations, and developers using ONLY the data provided below
- Encourage visitors to share their name and phone number so an agent can follow up
- Be warm, helpful, and knowledgeable about Indian real estate (Bangalore, Pune, Hyderabad, Mumbai)

Key information about 27 Estates:
- Premium real estate advisory and brokerage firm
- Address: 83, Prestige Copper Arch, Infantry Road, Bangalore 560001
- Phone: +91 80957 99929
- Email: connect@27estates.com
- Website: www.27estates.com
- Services: Residential (apartments, villas, penthouses, plots), Commercial (offices, retail, co-working), Land Advisory, Project Marketing, Investment Advisory
- Operates across Bangalore, Pune, Hyderabad, and Mumbai

CRITICAL RESPONSE FORMAT:
- Keep responses short — 1 to 2 sentences max. Be brief.
- ONLY share property/project details from the data below — NEVER invent or guess
- Be conversational, not robotic — warm, professional tone
- If asked about something not in the data, say you'll have a consultant follow up
- NEVER use markdown formatting like **bold**, *italic*, # headings, or bullet lists. Plain text only. No asterisks.

CARD SYSTEM:
When recommending properties or projects, include card references:
- For properties: [PROPERTY_CARD:id]
- For projects: [PROJECT_CARD:id]
Include up to 4 cards. Do NOT repeat details in text — let cards show the info.

SUGGESTIONS:
End EVERY response with: [SUGGESTIONS]["opt1","opt2","opt3"][/SUGGESTIONS]
Keep each under 25 characters.

LEAD CAPTURE:
When user shares name + phone, add at the end:
[LEAD_CAPTURE]{"name":"...","phone":"...","email":"..."}[/LEAD_CAPTURE]`

// ─── Parse reply ───
function parseReply(fullText: string, properties: any[], projects: any[]) {
    let reply = fullText

    const leadMatch = reply.match(/\[LEAD_CAPTURE\](.*?)\[\/LEAD_CAPTURE\]/s)
    let leadData: { name?: string; phone?: string; email?: string } | null = null
    if (leadMatch) {
        try { leadData = JSON.parse(leadMatch[1]) } catch { /* ignore */ }
        reply = reply.replace(/\[LEAD_CAPTURE\].*?\[\/LEAD_CAPTURE\]/s, '').trim()
    }

    let suggestions: string[] = []
    const sugMatch = reply.match(/\[SUGGESTIONS\](.*?)\[\/SUGGESTIONS\]/s)
    if (sugMatch) {
        try { suggestions = JSON.parse(sugMatch[1]) } catch { /* ignore */ }
        reply = reply.replace(/\[SUGGESTIONS\].*?\[\/SUGGESTIONS\]/s, '').trim()
    }

    const propertyCardIds = [...reply.matchAll(/\[PROPERTY_CARD:([^\]]+)\]/g)].map(m => m[1])
    const projectCardIds = [...reply.matchAll(/\[PROJECT_CARD:([^\]]+)\]/g)].map(m => m[1])
    reply = reply.replace(/\[PROPERTY_CARD:[^\]]+\]/g, '').replace(/\[PROJECT_CARD:[^\]]+\]/g, '').trim()
    reply = reply.replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ').trim()

    const cards: any[] = []
    for (const pid of propertyCardIds.slice(0, 4)) {
        const p = properties.find(prop => prop.id === pid)
        if (p) {
            cards.push({
                type: 'property', id: p.id, title: p.title,
                location: p.location || p.city || '',
                price: p.price ? (p.price_text || formatPrice(p.price)) : 'Price on request',
                image: p.images?.[0] || '',
                bedrooms: p.bedrooms ? `${p.bedrooms} BHK` : undefined,
                sqft: p.sqft ? `${p.sqft} sqft` : undefined,
                category: p.category || undefined,
                link: `/properties/${p.id}`,
            })
        }
    }
    for (const pid of projectCardIds.slice(0, 4)) {
        const p = projects.find(proj => proj.id === pid)
        if (p) {
            const priceRange = p.min_price && p.max_price
                ? `${formatPrice(p.min_price)} - ${formatPrice(p.max_price)}`
                : p.min_price ? `Starting ${formatPrice(p.min_price)}` : 'Price on request'
            cards.push({
                type: 'project', id: p.id, title: p.project_name,
                location: p.location || p.city || '',
                price: priceRange, image: p.images?.[0] || '',
                developer: p.developer_name || undefined,
                bhk_options: p.bhk_options || undefined,
                category: p.category || undefined,
                status: p.status || undefined,
                link: `/projects/${p.id}`,
            })
        }
    }

    return { reply, cards, suggestions, leadData }
}

// ─── POST handler — streaming ───
export async function POST(request: NextRequest) {
    try {
        const { messages, sessionId, visitorId } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            })
        }

        const inventory = await getInventory()

        // Smart filter: only send relevant listings based on user's message
        const lastUserMsg = messages[messages.length - 1]?.content || ''
        const contextMessage = buildContext(lastUserMsg, messages, inventory.properties, inventory.projects)

        const stream = await getOpenAI().chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.2-chat',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + contextMessage },
                ...messages.slice(-6),
            ],
            max_completion_tokens: 400,
            stream: true,
        })

        const encoder = new TextEncoder()

        const readable = new ReadableStream({
            async start(controller) {
                let fullText = ''
                try {
                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta?.content
                        if (delta) {
                            fullText += delta
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: delta })}\n\n`))
                        }
                    }

                    const parsed = parseReply(fullText, inventory.properties, inventory.projects)

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'done',
                        reply: parsed.reply,
                        cards: parsed.cards,
                        suggestions: parsed.suggestions,
                    })}\n\n`))

                    // Background tasks
                    if (parsed.leadData?.name && (parsed.leadData.phone || parsed.leadData.email)) {
                        createLead({
                            name: parsed.leadData.name,
                            email: parsed.leadData.email,
                            phone: parsed.leadData.phone,
                            source: 'chatbot',
                            notes: `Captured via website chatbot. Session: ${sessionId || 'unknown'}`,
                        }).then(lead => {
                            if (lead && sessionId) {
                                supabase.from('chat_sessions').update({ lead_id: lead.id }).eq('id', sessionId)
                            }
                        }).catch(() => {})
                    }

                    if (sessionId) {
                        const userMessage = messages[messages.length - 1]
                        supabase.from('chat_messages').insert([
                            { session_id: sessionId, role: 'user', content: userMessage.content },
                            { session_id: sessionId, role: 'assistant', content: parsed.reply },
                        ]).then(() => {}).catch(() => {})
                    }

                    controller.close()
                } catch (err) {
                    const errMsg = err instanceof Error ? err.message : String(err)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`))
                    controller.close()
                }
            },
        })

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error)
        console.error('Chat API error:', errMsg)
        console.error('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT ? 'SET' : 'MISSING')
        console.error('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING')
        console.error('AZURE_OPENAI_DEPLOYMENT:', process.env.AZURE_OPENAI_DEPLOYMENT || 'NOT SET')
        console.error('AZURE_OPENAI_API_VERSION:', process.env.AZURE_OPENAI_API_VERSION || 'NOT SET')
        return new Response(JSON.stringify({
            error: 'Failed to process chat message',
            detail: errMsg,
            debug: {
                endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'SET' : 'MISSING',
                key: process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING',
                deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'NOT SET',
                version: process.env.AZURE_OPENAI_API_VERSION || 'NOT SET',
            }
        }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        })
    }
}
