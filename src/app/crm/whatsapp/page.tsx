'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Send, Bot, User, Megaphone, RefreshCw, Phone, ExternalLink, ChevronRight } from 'lucide-react'

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface Conversation {
    id: string
    wa_phone: string
    contact_name: string | null
    lead_id: string | null
    status: 'active' | 'qualified' | 'handoff' | 'closed'
    ai_enabled: boolean
    assigned_agent_id: string | null
    last_inbound_at: string | null
    last_outbound_at: string | null
    unread_count: number
    leads?: { id: string; name: string; status: string; priority: string; score: number | null } | null
}

interface Message {
    id: string
    wa_message_id: string | null
    direction: 'inbound' | 'outbound'
    role: 'user' | 'assistant' | 'agent' | 'system'
    type: string
    content: string | null
    status: string | null
    error: string | null
    ai_model: string | null
    created_at: string
}

interface ConversationDetail {
    conversation: Conversation & {
        leads?: {
            id: string; name: string; email: string | null; phone: string | null
            status: string; priority: string; score: number | null
            preferred_location: string | null; budget_min: number | null; budget_max: number | null
            property_type: string | null
        } | null
    }
    messages: Message[]
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function formatRelative(iso: string | null) {
    if (!iso) return '—'
    const ms = Date.now() - new Date(iso).getTime()
    const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), d = Math.floor(ms / 86400000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m`
    if (h < 24) return `${h}h`
    if (d < 7) return `${d}d`
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatPhone(p: string) {
    // 918618907491 → +91 86189 07491
    if (p.startsWith('91') && p.length === 12) {
        return `+91 ${p.slice(2, 7)} ${p.slice(7)}`
    }
    return `+${p}`
}

function formatBudget(min: number | null, max: number | null) {
    if (!min && !max) return null
    const fmt = (n: number) =>
        n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr`
            : n >= 100000 ? `₹${(n / 100000).toFixed(1)} L`
                : `₹${n.toLocaleString('en-IN')}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    return fmt((min || max) as number)
}

const statusColors: Record<string, string> = {
    active: '#3b82f6',
    qualified: '#22c55e',
    handoff: '#f59e0b',
    closed: '#6b7280',
}

const priorityColors: Record<string, string> = {
    hot: '#ef4444', warm: '#f59e0b', cold: '#6b7280',
}

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────
export default function WhatsAppCRMPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<ConversationDetail | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'qualified' | 'handoff' | 'closed'>('all')
    const [aiFilter, setAiFilter] = useState<'all' | 'on' | 'off'>('all')
    const [loadingList, setLoadingList] = useState(false)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [composer, setComposer] = useState('')
    const [sending, setSending] = useState(false)
    const threadEndRef = useRef<HTMLDivElement>(null)

    // ── Fetchers ────────────────────────────────────
    const fetchList = useCallback(async () => {
        setLoadingList(true)
        try {
            const params = new URLSearchParams({ limit: '100' })
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (aiFilter !== 'all') params.set('ai', aiFilter)
            if (search.trim()) params.set('search', search.trim())
            const res = await fetch(`/api/whatsapp/conversations?${params}`, { cache: 'no-store' })
            const j = await res.json()
            setConversations(j.items || [])
        } finally {
            setLoadingList(false)
        }
    }, [search, statusFilter, aiFilter])

    const fetchDetail = useCallback(async (id: string) => {
        setLoadingDetail(true)
        try {
            const res = await fetch(`/api/whatsapp/conversations/${id}`, { cache: 'no-store' })
            const j = await res.json()
            if (j.conversation) setDetail(j as ConversationDetail)
        } finally {
            setLoadingDetail(false)
        }
    }, [])

    // ── Initial load + search/filter changes ────────
    useEffect(() => { fetchList() }, [fetchList])

    // Poll list every 15s
    useEffect(() => {
        const t = setInterval(fetchList, 15000)
        return () => clearInterval(t)
    }, [fetchList])

    // Selected conversation: fetch + poll every 5s
    useEffect(() => {
        if (!selectedId) { setDetail(null); return }
        fetchDetail(selectedId)
        const t = setInterval(() => fetchDetail(selectedId), 5000)
        return () => clearInterval(t)
    }, [selectedId, fetchDetail])

    // Auto-scroll thread on new messages
    useEffect(() => {
        if (threadEndRef.current && detail) {
            threadEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [detail?.messages.length, detail])

    // ── Actions ─────────────────────────────────────
    async function toggleAI(enable: boolean) {
        if (!selectedId) return
        await fetch(`/api/whatsapp/conversations/${selectedId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ai_enabled: enable, status: enable ? 'active' : 'handoff' }),
        })
        fetchDetail(selectedId)
        fetchList()
    }

    async function sendReply() {
        if (!selectedId || !composer.trim() || sending) return
        const text = composer.trim()
        setComposer('')
        setSending(true)
        try {
            const res = await fetch(`/api/whatsapp/conversations/${selectedId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            })
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                alert(`Send failed: ${j.error || res.statusText}`)
                setComposer(text) // restore
            }
            await fetchDetail(selectedId)
            fetchList()
        } finally {
            setSending(false)
        }
    }

    // ── Render ──────────────────────────────────────
    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 60px)', backgroundColor: 'var(--crm-surface)' }}>
            {/* ─── Left: conversation list ─── */}
            <aside
                style={{
                    width: '360px',
                    minWidth: '360px',
                    borderRight: '1px solid var(--crm-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ padding: '16px', borderBottom: '1px solid var(--crm-border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--crm-text-primary)' }}>
                            WhatsApp
                        </h2>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link
                                href="/crm/whatsapp/broadcast"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '6px 10px', fontSize: '0.75rem', fontWeight: 500,
                                    borderRadius: 6, color: 'white', backgroundColor: '#25D366',
                                    textDecoration: 'none',
                                }}
                            >
                                <Megaphone size={12} /> Broadcast
                            </Link>
                            <button
                                onClick={fetchList}
                                disabled={loadingList}
                                title="Refresh"
                                style={{
                                    padding: 6, border: '1px solid var(--crm-border-subtle)', borderRadius: 6,
                                    background: 'transparent', cursor: 'pointer', color: 'var(--crm-text-secondary)',
                                }}
                            >
                                <RefreshCw size={14} style={{ animation: loadingList ? 'spin 1s linear infinite' : undefined }} />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                        <Search
                            size={14}
                            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-muted)' }}
                        />
                        <input
                            placeholder="Search phone or name"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '7px 10px 7px 30px',
                                border: '1px solid var(--crm-border-subtle)', borderRadius: 6,
                                fontSize: '0.8rem', backgroundColor: 'var(--crm-elevated)',
                                color: 'var(--crm-text-primary)',
                            }}
                        />
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 6, fontSize: '0.7rem' }}>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                            style={{
                                flex: 1, padding: '5px 8px', border: '1px solid var(--crm-border-subtle)',
                                borderRadius: 6, backgroundColor: 'var(--crm-elevated)', color: 'var(--crm-text-primary)',
                                fontSize: '0.7rem',
                            }}
                        >
                            <option value="all">All status</option>
                            <option value="active">Active</option>
                            <option value="qualified">Qualified</option>
                            <option value="handoff">Handoff</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select
                            value={aiFilter}
                            onChange={e => setAiFilter(e.target.value as typeof aiFilter)}
                            style={{
                                flex: 1, padding: '5px 8px', border: '1px solid var(--crm-border-subtle)',
                                borderRadius: 6, backgroundColor: 'var(--crm-elevated)', color: 'var(--crm-text-primary)',
                                fontSize: '0.7rem',
                            }}
                        >
                            <option value="all">AI: all</option>
                            <option value="on">AI: on</option>
                            <option value="off">AI: off</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {conversations.length === 0 && !loadingList && (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--crm-text-muted)', fontSize: '0.85rem' }}>
                            No conversations yet. They'll appear here when customers message your WhatsApp number.
                        </div>
                    )}
                    {conversations.map(c => {
                        const isSelected = c.id === selectedId
                        const title = c.contact_name || c.leads?.name || formatPhone(c.wa_phone)
                        return (
                            <button
                                key={c.id}
                                onClick={() => setSelectedId(c.id)}
                                style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '12px 16px',
                                    border: 'none', borderLeft: isSelected ? '3px solid #25D366' : '3px solid transparent',
                                    borderBottom: '1px solid var(--crm-border-subtle)',
                                    backgroundColor: isSelected ? 'var(--crm-elevated)' : 'transparent',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                                    <div style={{
                                        fontSize: '0.85rem', fontWeight: 600, color: 'var(--crm-text-primary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                                    }}>{title}</div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--crm-text-muted)' }}>
                                        {formatRelative(c.last_inbound_at)}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '0.7rem', color: 'var(--crm-text-muted)', marginTop: 2,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <Phone size={10} /> {formatPhone(c.wa_phone)}
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase',
                                        padding: '2px 6px', borderRadius: 4,
                                        color: statusColors[c.status] || '#6b7280',
                                        backgroundColor: `${statusColors[c.status] || '#6b7280'}22`,
                                    }}>{c.status}</span>
                                    <span style={{
                                        fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: 3,
                                        color: c.ai_enabled ? '#22c55e' : 'var(--crm-text-faint)',
                                    }}>
                                        {c.ai_enabled ? <Bot size={10} /> : <User size={10} />}
                                        {c.ai_enabled ? 'AI' : 'Human'}
                                    </span>
                                    {c.leads?.priority && (
                                        <span style={{
                                            fontSize: '0.6rem', fontWeight: 600, color: priorityColors[c.leads.priority],
                                        }}>● {c.leads.priority}</span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </aside>

            {/* ─── Right: thread or empty ─── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {!selectedId && (
                    <div style={{
                        display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center',
                        color: 'var(--crm-text-muted)', flexDirection: 'column', gap: 12,
                    }}>
                        <div style={{ fontSize: '3rem' }}>💬</div>
                        <div>Select a conversation to view the thread</div>
                    </div>
                )}

                {selectedId && detail && (
                    <ThreadView
                        detail={detail}
                        onToggleAI={toggleAI}
                        composer={composer}
                        setComposer={setComposer}
                        onSend={sendReply}
                        sending={sending}
                        threadEndRef={threadEndRef}
                    />
                )}

                {selectedId && !detail && loadingDetail && (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--crm-text-muted)' }}>
                        Loading conversation…
                    </div>
                )}
            </main>

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

// ────────────────────────────────────────────────
// Thread view
// ────────────────────────────────────────────────
interface ThreadViewProps {
    detail: ConversationDetail
    onToggleAI: (enable: boolean) => void
    composer: string
    setComposer: (s: string) => void
    onSend: () => void
    sending: boolean
    threadEndRef: React.RefObject<HTMLDivElement | null>
}

function ThreadView({ detail, onToggleAI, composer, setComposer, onSend, sending, threadEndRef }: ThreadViewProps) {
    const { conversation, messages } = detail
    const title = conversation.contact_name || conversation.leads?.name || formatPhone(conversation.wa_phone)
    const budget = formatBudget(conversation.leads?.budget_min ?? null, conversation.leads?.budget_max ?? null)

    return (
        <>
            {/* Header */}
            <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--crm-border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                backgroundColor: 'var(--crm-elevated)',
            }}>
                <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', marginTop: 2, display: 'flex', gap: 10 }}>
                        <span>{formatPhone(conversation.wa_phone)}</span>
                        {conversation.leads?.preferred_location && <span>· {conversation.leads.preferred_location}</span>}
                        {conversation.leads?.property_type && <span>· {conversation.leads.property_type}</span>}
                        {budget && <span>· {budget}</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {conversation.lead_id && (
                        <Link
                            href={`/crm/leads/${conversation.lead_id}`}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '6px 10px', fontSize: '0.75rem', fontWeight: 500,
                                borderRadius: 6, color: 'var(--crm-text-secondary)',
                                border: '1px solid var(--crm-border-subtle)',
                                textDecoration: 'none',
                            }}
                        >
                            View Lead <ExternalLink size={11} />
                        </Link>
                    )}
                    <label
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: '0.75rem', color: 'var(--crm-text-secondary)', cursor: 'pointer',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={conversation.ai_enabled}
                            onChange={e => onToggleAI(e.target.checked)}
                            style={{ accentColor: '#25D366' }}
                        />
                        <Bot size={12} /> AI replies {conversation.ai_enabled ? 'ON' : 'OFF'}
                    </label>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '20px',
                backgroundColor: 'var(--crm-surface)',
                display: 'flex', flexDirection: 'column', gap: 8,
            }}>
                {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
                <div ref={threadEndRef} />
            </div>

            {/* Composer */}
            <div style={{
                padding: '12px 16px', borderTop: '1px solid var(--crm-border-subtle)',
                backgroundColor: 'var(--crm-elevated)',
                display: 'flex', gap: 8, alignItems: 'flex-end',
            }}>
                <textarea
                    value={composer}
                    onChange={e => setComposer(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            onSend()
                        }
                    }}
                    placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    style={{
                        flex: 1, resize: 'none', padding: '8px 12px', fontSize: '0.85rem',
                        border: '1px solid var(--crm-border-subtle)', borderRadius: 8,
                        backgroundColor: 'var(--crm-surface)', color: 'var(--crm-text-primary)',
                        fontFamily: 'inherit',
                    }}
                />
                <button
                    onClick={onSend}
                    disabled={!composer.trim() || sending}
                    style={{
                        padding: '10px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: composer.trim() && !sending ? '#25D366' : 'var(--crm-border-subtle)',
                        color: 'white', cursor: composer.trim() && !sending ? 'pointer' : 'not-allowed',
                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600,
                    }}
                >
                    <Send size={14} /> {sending ? 'Sending…' : 'Send'}
                </button>
            </div>
            {conversation.ai_enabled && (
                <div style={{
                    padding: '6px 16px', fontSize: '0.7rem', color: 'var(--crm-text-muted)',
                    backgroundColor: 'var(--crm-elevated)', borderTop: '1px solid var(--crm-border-subtle)',
                }}>
                    💡 Sending a manual message will pause AI replies for this chat.
                </div>
            )}
        </>
    )
}

// ────────────────────────────────────────────────
// Single message bubble
// ────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
    const isInbound = msg.direction === 'inbound'
    const isSystem = msg.role === 'system'
    const isAI = msg.role === 'assistant'
    const isAgent = msg.role === 'agent'

    if (isSystem && !isInbound) {
        return (
            <div style={{ alignSelf: 'center', fontSize: '0.7rem', color: 'var(--crm-text-muted)', padding: '4px 10px' }}>
                {msg.content}
            </div>
        )
    }

    const bg = isInbound
        ? 'var(--crm-elevated)'
        : isAI ? '#dcf8c6'
            : isAgent ? '#25D366' : '#0084ff'

    const color = isInbound
        ? 'var(--crm-text-primary)'
        : isAI ? '#000' : '#fff'

    return (
        <div style={{
            display: 'flex', justifyContent: isInbound ? 'flex-start' : 'flex-end',
            paddingRight: isInbound ? '20%' : 0, paddingLeft: isInbound ? 0 : '20%',
        }}>
            <div style={{
                maxWidth: '85%', padding: '8px 12px', borderRadius: isInbound ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                backgroundColor: bg, color,
                fontSize: '0.85rem', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
            }}>
                {!isInbound && (
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, opacity: 0.7, marginBottom: 2, textTransform: 'uppercase' }}>
                        {isAI ? '🤖 KIWI (AI)' : isAgent ? '👤 Agent' : 'System'}
                    </div>
                )}
                <div>{msg.content || <em style={{ opacity: 0.5 }}>[{msg.type}]</em>}</div>
                <div style={{ fontSize: '0.62rem', opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                    {formatTime(msg.created_at)}
                    {msg.status === 'failed' && <span style={{ marginLeft: 6, color: '#ef4444' }}>· failed</span>}
                </div>
            </div>
        </div>
    )
}
