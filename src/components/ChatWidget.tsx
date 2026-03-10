'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, MapPin, ArrowUpRight, Building2, Bot } from 'lucide-react'

interface Card {
    type: 'property' | 'project'
    id: string
    title: string
    location: string
    price: string
    image: string
    bedrooms?: string
    sqft?: string
    category?: string
    developer?: string
    bhk_options?: string[]
    status?: string
    link: string
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    cards?: Card[]
    suggestions?: string[]
}

export default function ChatWidget() {
    const pathname = usePathname()
    const [ready, setReady] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window === 'undefined') return []
        try {
            const saved = sessionStorage.getItem('27e_chat_messages')
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null
        return sessionStorage.getItem('27e_chat_session') || null
    })
    const [visitorId] = useState(() => {
        if (typeof window === 'undefined') return 'ssr'
        const stored = localStorage.getItem('27e_visitor_id')
        if (stored) return stored
        const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        localStorage.setItem('27e_visitor_id', id)
        return id
    })
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => { scrollToBottom() }, [messages])

    // Persist messages & session to sessionStorage (survives navigation, clears on tab close)
    useEffect(() => {
        try { sessionStorage.setItem('27e_chat_messages', JSON.stringify(messages)) } catch { }
    }, [messages])
    useEffect(() => {
        if (sessionId) sessionStorage.setItem('27e_chat_session', sessionId)
    }, [sessionId])

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus()
    }, [isOpen])

    // Delay showing on home page so preloader finishes first
    useEffect(() => {
        if (pathname === '/') {
            setReady(false)
            const t = setTimeout(() => setReady(true), 3000)
            return () => clearTimeout(t)
        }
        setReady(true)
    }, [pathname])


    const initSession = async () => {
        if (sessionId) return sessionId
        try {
            const res = await fetch('/api/chat/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId }),
            })
            if (res.ok) {
                const data = await res.json()
                setSessionId(data.session.id)
                return data.session.id
            }
        } catch { /* continue without session */ }
        return null
    }

    const handleOpen = () => {
        setIsOpen(true)
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: 'Hey there! I\'m Kiwi, your AI assistant at 27 Estates. I can help you find your dream property. What are you looking for?',
                suggestions: ['Luxury apartments', 'Projects in Bangalore', 'Villas under 3 Cr', 'Book a site visit'],
            }])
        }
    }

    const handleSend = useCallback(async (overrideText?: string) => {
        const text = (overrideText || input).trim()
        if (!text || loading) return

        const userMessage: Message = { role: 'user', content: text }
        const newMessages = [...messages, userMessage]
        // Add an empty placeholder for streaming (hidden until text arrives)
        const assistantIdx = newMessages.length
        const withPlaceholder = [...newMessages, { role: 'assistant' as const, content: '' }]
        setMessages(withPlaceholder)
        setInput('')
        setLoading(true)

        try {
            const sid = await initSession()
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    sessionId: sid,
                    visitorId,
                }),
            })

            if (!res.ok || !res.body) {
                setMessages([...newMessages, {
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again or call us at +91 80957 99929.',
                    suggestions: ['Try again', 'Call us'],
                }])
                setLoading(false)
                return
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let streamedText = ''
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    try {
                        const event = JSON.parse(line.slice(6))
                        if (event.type === 'text') {
                            streamedText += event.content
                            // Clean display text (strip tags while streaming)
                            const displayText = streamedText
                                .replace(/\[PROPERTY_CARD:[^\]]*\]/g, '')
                                .replace(/\[PROJECT_CARD:[^\]]*\]/g, '')
                                .replace(/\[SUGGESTIONS\].*$/s, '')
                                .replace(/\[LEAD_CAPTURE\].*$/s, '')
                                .replace(/\n{3,}/g, '\n\n')
                                .trim()
                            setMessages(prev => {
                                const updated = [...prev]
                                updated[assistantIdx] = { role: 'assistant', content: displayText }
                                return updated
                            })
                        } else if (event.type === 'done') {
                            // Final structured message with cards + suggestions
                            setMessages(prev => {
                                const updated = [...prev]
                                updated[assistantIdx] = {
                                    role: 'assistant',
                                    content: event.reply,
                                    cards: event.cards,
                                    suggestions: event.suggestions,
                                }
                                return updated
                            })
                        } else if (event.type === 'error') {
                            setMessages(prev => {
                                const updated = [...prev]
                                updated[assistantIdx] = {
                                    role: 'assistant',
                                    content: 'Sorry, something went wrong. Please try again or call us at +91 80957 99929.',
                                    suggestions: ['Try again', 'Call us'],
                                }
                                return updated
                            })
                        }
                    } catch { /* skip malformed SSE lines */ }
                }
            }
        } catch {
            setMessages([...newMessages, {
                role: 'assistant',
                content: 'Unable to connect. Please try again or call us at +91 80957 99929.',
                suggestions: ['Try again', 'Call us'],
            }])
        }
        setLoading(false)
    }, [input, loading, messages, sessionId, visitorId])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSuggestionClick = (text: string) => {
        if (text === 'Call us') {
            window.open('tel:+918095799929')
            return
        }
        handleSend(text)
    }

    // Only show on home page and properties listing pages (not detail pages, admin, crm, etc.)
    const isHome = pathname === '/'
    const isPropertiesListing = pathname?.startsWith('/properties') && !/^\/properties\/[^/]+$/.test(pathname || '')
    if (!isHome && !isPropertiesListing) return null
    if (!ready) return null

    // Get the last assistant message's suggestions
    const lastSuggestions = messages.length > 0
        ? [...messages].reverse().find(m => m.role === 'assistant')?.suggestions
        : undefined

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div data-lenis-prevent style={{
                    position: 'fixed', bottom: '100px', right: '32px', zIndex: 99999,
                    width: '400px', maxWidth: 'calc(100vw - 48px)',
                    height: '600px', maxHeight: 'calc(100vh - 140px)',
                    borderRadius: '20px',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
                    display: 'flex', flexDirection: 'column',
                    backgroundColor: '#fff',
                    animation: 'chatSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #183C38 0%, #1a4a44 50%, #2d6a5f 100%)',
                        padding: '18px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #BFA270 0%, #d4b882 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(191, 162, 112, 0.4)',
                            }}>
                                <Bot size={22} color="#183C38" strokeWidth={2.2} />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.08em' }}>KIWI</span>
                                    <span style={{
                                        padding: '1px 6px', borderRadius: '4px',
                                        backgroundColor: 'rgba(191, 162, 112, 0.25)',
                                        color: '#BFA270', fontSize: '0.55rem', fontWeight: 700,
                                        letterSpacing: '0.05em',
                                    }}>AI</span>
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', marginTop: '1px' }}>27 Estates AI</div>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsOpen(false) }}
                            onPointerDown={(e) => { e.stopPropagation() }}
                            style={{
                                border: 'none', background: 'rgba(255,255,255,0.1)',
                                borderRadius: '10px', width: '34px', height: '34px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff', transition: 'background 0.2s',
                                position: 'relative', zIndex: 100000,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Messages — data-lenis-prevent stops Lenis from hijacking scroll */}
                    <div
                        data-lenis-prevent
                        style={{
                            flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px',
                            display: 'flex', flexDirection: 'column', gap: '14px',
                            backgroundColor: '#f4f5f7',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#d1d5db transparent',
                            WebkitOverflowScrolling: 'touch',
                        }}>
                        {messages.map((msg, i) => {
                            // Hide the empty placeholder bubble (typing dots shown separately)
                            if (msg.role === 'assistant' && msg.content === '' && !msg.cards) return null
                            return (
                                <div key={i} style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap: '8px',
                                }}>
                                    {/* Text bubble */}
                                    <div style={{
                                        maxWidth: '85%',
                                        padding: '11px 15px',
                                        borderRadius: msg.role === 'user'
                                            ? '16px 16px 4px 16px'
                                            : '16px 16px 16px 4px',
                                        backgroundColor: msg.role === 'user' ? '#183C38' : '#fff',
                                        color: msg.role === 'user' ? '#fff' : '#1f2937',
                                        fontSize: '0.85rem',
                                        lineHeight: 1.6,
                                        boxShadow: msg.role === 'assistant'
                                            ? '0 1px 4px rgba(0,0,0,0.06)'
                                            : '0 1px 3px rgba(24,60,56,0.2)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}>
                                        {msg.content}
                                    </div>

                                    {/* Property / Project Cards */}
                                    {msg.cards && msg.cards.length > 0 && (
                                        <div style={{
                                            display: 'flex', gap: '10px', overflowX: 'auto',
                                            paddingBottom: '4px', maxWidth: '100%',
                                            scrollbarWidth: 'none',
                                        }}>
                                            {msg.cards.map(card => (
                                                <a
                                                    key={card.id}
                                                    href={card.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'flex', flexDirection: 'column',
                                                        minWidth: '220px', maxWidth: '220px',
                                                        borderRadius: '14px', overflow: 'hidden',
                                                        backgroundColor: '#fff',
                                                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                                        textDecoration: 'none', color: 'inherit',
                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                        flexShrink: 0,
                                                        border: '1px solid rgba(0,0,0,0.05)',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.transform = 'translateY(0)'
                                                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
                                                    }}
                                                >
                                                    {/* Card Image */}
                                                    <div style={{
                                                        position: 'relative', width: '100%', height: '120px',
                                                        backgroundColor: '#e5e7eb', overflow: 'hidden',
                                                    }}>
                                                        {card.image ? (
                                                            <img
                                                                src={card.image}
                                                                alt={card.title}
                                                                style={{
                                                                    width: '100%', height: '100%',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: '100%', height: '100%',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: 'linear-gradient(135deg, #183C38, #2d6a5f)',
                                                            }}>
                                                                <Building2 size={28} color="rgba(255,255,255,0.4)" />
                                                            </div>
                                                        )}
                                                        {/* Category / Status badge */}
                                                        <div style={{
                                                            position: 'absolute', top: '8px', left: '8px',
                                                            display: 'flex', gap: '4px',
                                                        }}>
                                                            {card.status && (
                                                                <span style={{
                                                                    padding: '3px 8px', borderRadius: '6px',
                                                                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                                                    color: '#fff', fontSize: '0.6rem', fontWeight: 600,
                                                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                }}>{card.status}</span>
                                                            )}
                                                            {card.category && (
                                                                <span style={{
                                                                    padding: '3px 8px', borderRadius: '6px',
                                                                    backgroundColor: 'rgba(191,162,112,0.9)',
                                                                    color: '#fff', fontSize: '0.6rem', fontWeight: 600,
                                                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                }}>{card.category}</span>
                                                            )}
                                                        </div>
                                                        {/* Arrow icon */}
                                                        <div style={{
                                                            position: 'absolute', bottom: '8px', right: '8px',
                                                            width: '26px', height: '26px', borderRadius: '50%',
                                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <ArrowUpRight size={13} color="#183C38" />
                                                        </div>
                                                    </div>
                                                    {/* Card Content */}
                                                    <div style={{ padding: '12px' }}>
                                                        <div style={{
                                                            fontSize: '0.8rem', fontWeight: 700, color: '#1f2937',
                                                            lineHeight: 1.3, marginBottom: '6px',
                                                            display: '-webkit-box', WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                        }}>
                                                            {card.title}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            marginBottom: '8px',
                                                        }}>
                                                            <MapPin size={11} color="#9ca3af" />
                                                            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{card.location}</span>
                                                        </div>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        }}>
                                                            <span style={{
                                                                fontSize: '0.8rem', fontWeight: 700, color: '#183C38',
                                                            }}>{card.price}</span>
                                                            {(card.bedrooms || card.bhk_options) && (
                                                                <span style={{
                                                                    fontSize: '0.65rem', color: '#9ca3af',
                                                                    padding: '2px 6px', borderRadius: '4px',
                                                                    backgroundColor: '#f3f4f6',
                                                                }}>
                                                                    {card.bedrooms || card.bhk_options?.slice(0, 2).join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {card.developer && (
                                                            <div style={{
                                                                fontSize: '0.65rem', color: '#9ca3af', marginTop: '6px',
                                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                            }}>
                                                                <Building2 size={10} />
                                                                {card.developer}
                                                            </div>
                                                        )}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Typing indicator — only when loading and no streamed text yet */}
                        {loading && messages.length > 0 && messages[messages.length - 1].content === '' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    padding: '14px 18px', borderRadius: '16px 16px 16px 4px',
                                    backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                    display: 'flex', alignItems: 'center', gap: '3px',
                                }}>
                                    <span className="chat-dot" style={{ animationDelay: '0s' }} />
                                    <span className="chat-dot" style={{ animationDelay: '0.15s' }} />
                                    <span className="chat-dot" style={{ animationDelay: '0.3s' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Smart Suggestions */}
                    {!loading && lastSuggestions && lastSuggestions.length > 0 && (
                        <div style={{
                            padding: '10px 16px', display: 'flex', gap: '6px',
                            flexWrap: 'wrap', backgroundColor: '#f4f5f7',
                            borderTop: '1px solid #e5e7eb',
                        }}>
                            {lastSuggestions.map(q => (
                                <button key={q} onClick={() => handleSuggestionClick(q)}
                                    style={{
                                        padding: '7px 14px', borderRadius: '20px',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: '#fff', fontSize: '0.72rem', color: '#183C38',
                                        cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = '#183C38'
                                        e.currentTarget.style.color = '#fff'
                                        e.currentTarget.style.borderColor = '#183C38'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = '#fff'
                                        e.currentTarget.style.color = '#183C38'
                                        e.currentTarget.style.borderColor = '#e5e7eb'
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{
                        padding: '14px 16px', borderTop: '1px solid #e5e7eb',
                        display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#fff',
                    }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about properties, locations..."
                            style={{
                                flex: 1, padding: '11px 16px',
                                border: '1.5px solid #e5e7eb',
                                borderRadius: '24px', fontSize: '0.85rem', outline: 'none',
                                transition: 'border-color 0.2s',
                                backgroundColor: '#fafafa',
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = '#183C38'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            style={{
                                width: '42px', height: '42px', borderRadius: '50%',
                                backgroundColor: input.trim() ? '#183C38' : '#e5e7eb',
                                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', transition: 'all 0.2s',
                                boxShadow: input.trim() ? '0 2px 8px rgba(24,60,56,0.3)' : 'none',
                            }}>
                            <Send size={16} />
                        </button>
                    </div>

                    {/* Powered by */}
                    <div style={{
                        textAlign: 'center', padding: '6px',
                        fontSize: '0.6rem', color: '#c0c4cc',
                        backgroundColor: '#fff',
                        borderTop: '1px solid #f3f4f6',
                    }}>
                        Powered by 27 Estates
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={isOpen ? () => setIsOpen(false) : handleOpen}
                aria-label="Chat with 27 Estates"
                style={{
                    position: 'fixed', bottom: '32px', right: '32px', zIndex: 99999,
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #183C38, #1a4a44)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(24, 60, 56, 0.45)',
                    color: '#fff', transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)'
                    e.currentTarget.style.boxShadow = '0 6px 30px rgba(24, 60, 56, 0.55)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(24, 60, 56, 0.45)'
                }}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                {!isOpen && <span className="chat-pulse-ring" />}
            </button>

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .chat-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background-color: #9ca3af;
                    display: inline-block;
                    animation: chatDotBounce 1.2s infinite ease-in-out;
                }
                @keyframes chatDotBounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-8px); opacity: 1; }
                }
                .chat-pulse-ring {
                    position: absolute;
                    width: 60px; height: 60px;
                    border-radius: 50%;
                    border: 2px solid #183C38;
                    animation: chatPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    pointer-events: none;
                }
                @keyframes chatPulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
            `}</style>
        </>
    )
}
