'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Eye, Bookmark, Users, MessageSquare, ExternalLink, Clock, Star, UserCheck } from 'lucide-react'
import { proxyUrl } from '@/lib/proxy-url'

interface SearchResult {
    id: string; type: 'property' | 'project'; title: string; location: string
    image: string | null; category: string | null; section: string | null; href: string
}

interface AudienceMember {
    user_id: string; full_name: string; email: string; views: number; totalSecs: number
    firstSeen: string; lastSeen: string; bookmarked: boolean
    lead: { id: string; name: string; score: number; priority: string; status: string } | null
}

interface UnlinkedLead {
    id: string; name: string; email: string; phone: string; score: number
    priority: string; status: string; source: string; created_at: string
}

interface WarmData {
    listingId: string; listingType: string; totalViews: number; bookmarkCount: number
    anonSessions: number; leadCount: number; registeredCount: number
    audience: AudienceMember[]; unlinkedLeads: UnlinkedLead[]
}

function fmtSecs(s: number) {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
}

function fmtRelative(d: string) {
    const ms = Date.now() - new Date(d).getTime()
    const days = Math.floor(ms / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const PRIORITY: Record<string, { bg: string; color: string }> = {
    hot:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
    warm: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    cold: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
}

function PriorityBadge({ priority }: { priority: string }) {
    const s = PRIORITY[priority] || { bg: 'var(--crm-elevated)', color: 'var(--crm-text-muted)' }
    return (
        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: '999px', backgroundColor: s.bg, color: s.color }}>
            {priority}
        </span>
    )
}

export default function WarmAudiencePage() {
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searchOpen, setSearchOpen] = useState(false)
    const [selected, setSelected] = useState<SearchResult | null>(null)
    const [data, setData] = useState<WarmData | null>(null)
    const [loading, setLoading] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current)
        if (query.length < 2) { setSearchResults([]); setSearchOpen(false); return }
        searchTimer.current = setTimeout(async () => {
            const res = await fetch(`/api/crm/listing-search?q=${encodeURIComponent(query)}`)
            if (res.ok) {
                const d = await res.json()
                setSearchResults(d.results || [])
                setSearchOpen(true)
            }
        }, 300)
    }, [query])

    const selectListing = async (r: SearchResult) => {
        setSelected(r); setQuery(r.title); setSearchOpen(false); setLoading(true)
        try {
            const res = await fetch(`/api/crm/warm-audience?listing_id=${r.id}&type=${r.type}`)
            if (res.ok) setData(await res.json())
        } finally { setLoading(false) }
    }

    const thS: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', color: 'var(--crm-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} style={{ color: 'var(--crm-accent)' }} /> Warm Audience Finder
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--crm-text-muted)' }}>
                    Pick any listing to see every user who viewed, saved, or enquired — sorted by interest level
                </p>
            </div>

            {/* Search */}
            <div ref={searchRef} style={{ position: 'relative', maxWidth: '520px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 1px 4px var(--crm-shadow)' }}>
                    <Search size={15} style={{ color: 'var(--crm-text-muted)', flexShrink: 0 }} />
                    <input
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelected(null) }}
                        placeholder="Search property or project name…"
                        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: 'var(--crm-text-primary)' }}
                    />
                </div>
                {searchOpen && searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '10px', boxShadow: '0 8px 24px var(--crm-shadow)', overflow: 'hidden' }}>
                        {searchResults.map(r => (
                            <button
                                key={`${r.type}-${r.id}`}
                                onClick={() => selectListing(r)}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--crm-border)', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--crm-elevated)', flexShrink: 0, position: 'relative' }}>
                                    {r.image ? (
                                        <Image src={proxyUrl(r.image)} alt={r.title} fill style={{ objectFit: 'cover' }} sizes="36px" unoptimized />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '1rem' }}>
                                            {r.type === 'property' ? '🏠' : r.section === 'commercial' ? '🏢' : '🏗️'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{r.title}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>{r.location} · {r.type}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--crm-text-muted)' }}>
                    <div style={{ width: '28px', height: '28px', border: '3px solid var(--crm-border)', borderTopColor: 'var(--crm-accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 0.75rem' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ fontSize: '0.875rem' }}>Loading audience data…</div>
                </div>
            )}

            {/* Empty state */}
            {!loading && !data && (
                <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--crm-surface)', border: '2px dashed var(--crm-border)', borderRadius: '12px', color: 'var(--crm-text-muted)' }}>
                    <Users size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '0.4rem' }}>Search for a listing above</div>
                    <div style={{ fontSize: '0.85rem' }}>You&apos;ll see every visitor, bookmarker, and lead ranked by engagement</div>
                </div>
            )}

            {/* Results */}
            {!loading && data && (
                <>
                    {/* Selected listing banner */}
                    {selected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--crm-accent-bg)', border: '1px solid var(--crm-accent)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.25rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                                {selected.image ? (
                                    <Image src={proxyUrl(selected.image)} alt={selected.title} fill style={{ objectFit: 'cover' }} sizes="48px" unoptimized />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: 'var(--crm-elevated)', fontSize: '1.5rem' }}>
                                        {selected.type === 'property' ? '🏠' : '🏗️'}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--crm-text-primary)', fontSize: '0.9375rem' }}>{selected.title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--crm-text-muted)' }}>{selected.location}</div>
                            </div>
                            <Link href={selected.href} target="_blank" style={{ color: 'var(--crm-accent)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                                View <ExternalLink size={12} />
                            </Link>
                        </div>
                    )}

                    {/* Summary stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Views',  value: data.totalViews,      icon: <Eye size={14} />,       color: '#6366f1' },
                            { label: 'Bookmarks',    value: data.bookmarkCount,   icon: <Bookmark size={14} />,   color: '#f59e0b' },
                            { label: 'Inquiries',    value: data.leadCount,       icon: <MessageSquare size={14} />, color: '#10b981' },
                            { label: 'Registered',   value: data.registeredCount, icon: <UserCheck size={14} />,  color: '#8b5cf6' },
                            { label: 'Anonymous',    value: data.anonSessions,    icon: <Users size={14} />,      color: '#6b7280' },
                        ].map(s => (
                            <div key={s.label} style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '10px', padding: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: s.color, marginBottom: '0.4rem' }}>
                                    {s.icon}
                                    <span style={{ fontSize: '0.68rem', color: 'var(--crm-text-muted)', fontWeight: 500 }}>{s.label}</span>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Registered audience table */}
                    {data.audience.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Star size={15} style={{ color: '#f59e0b' }} /> Engaged Users
                                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', fontWeight: 400 }}>({data.audience.length} tracked)</span>
                            </h2>
                            <div style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)' }}>
                                                {['User', 'Views', 'Avg Time', 'Last Seen', 'Bookmarked', 'Lead'].map(h => (
                                                    <th key={h} style={thS}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.audience.map((u, i) => (
                                                <tr
                                                    key={u.user_id}
                                                    style={{ borderBottom: i < data.audience.length - 1 ? '1px solid var(--crm-border)' : 'none' }}
                                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                >
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--crm-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                                                {u.full_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{u.full_name}</div>
                                                                {u.email && <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)' }}>{u.email}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Eye size={12} style={{ color: 'var(--crm-text-muted)' }} />
                                                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{u.views}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--crm-text-muted)' }}>
                                                            <Clock size={12} />
                                                            <span style={{ fontSize: '0.8125rem' }}>{u.views > 0 ? fmtSecs(Math.round(u.totalSecs / u.views)) : '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--crm-text-secondary)' }}>{fmtRelative(u.lastSeen)}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        {u.bookmarked ? (
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', padding: '2px 9px', borderRadius: '999px' }}>
                                                                🔖 Saved
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        {u.lead ? (
                                                            <Link href={`/crm/leads/${u.lead.id}`} style={{ textDecoration: 'none' }}>
                                                                <PriorityBadge priority={u.lead.priority} />
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)', marginLeft: '4px' }}>{u.lead.status}</span>
                                                            </Link>
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>No lead</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Unlinked leads */}
                    {data.unlinkedLeads.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MessageSquare size={15} style={{ color: '#10b981' }} /> Enquiry-Only Leads
                                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', fontWeight: 400 }}>({data.unlinkedLeads.length} no web footprint)</span>
                            </h2>
                            <div style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)' }}>
                                            {['Name', 'Contact', 'Source', 'Score', 'Priority', ''].map(h => (
                                                <th key={h} style={thS}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.unlinkedLeads.map((l, i) => (
                                            <tr
                                                key={l.id}
                                                style={{ borderBottom: i < data.unlinkedLeads.length - 1 ? '1px solid var(--crm-border)' : 'none' }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{l.name}</div>
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--crm-text-muted)' }}>
                                                        {l.email && <div>{l.email}</div>}
                                                        {l.phone && <div>{l.phone}</div>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>{l.source}</span>
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: l.score >= 70 ? '#16a34a' : l.score >= 40 ? '#f59e0b' : 'var(--crm-text-muted)' }}>{l.score || '—'}</span>
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <PriorityBadge priority={l.priority} />
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <Link href={`/crm/leads/${l.id}`} style={{ color: 'var(--crm-accent)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}>
                                                        View <ExternalLink size={11} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {data.audience.length === 0 && data.unlinkedLeads.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px', color: 'var(--crm-text-muted)' }}>
                            <Users size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                            <div style={{ fontWeight: 600, color: 'var(--crm-text-secondary)' }}>No audience data yet</div>
                            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>No tracked visitors or leads found for this listing.</div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
