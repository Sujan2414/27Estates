'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    Eye, Bookmark, MessageSquare, Users, Clock, TrendingUp,
    BarChart3, Filter, RefreshCw, ArrowUpDown, Home,
} from 'lucide-react'
import { proxyUrl } from '@/lib/proxy-url'

type Health = 'great' | 'good' | 'warning' | 'poor'

interface Listing {
    id: string; type: 'property' | 'project'; title: string; location: string
    image: string | null; category?: string; section?: string; status?: string; price_text?: string
    views: number; uniqueUsers: number; avgSecs: number; returnVisitors: number
    bookmarks: number; inquiries: number; bmRate: number; inqRate: number
    health: Health; href: string
}

interface PerformanceData { properties: Listing[]; projects: Listing[] }

const HEALTH: Record<Health, { label: string; color: string; bg: string }> = {
    great:   { label: 'Great',   color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    good:    { label: 'Good',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    warning: { label: 'Warning', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
    poor:    { label: 'Poor',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const TYPE_STYLE: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    property:    { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', label: 'Property',   icon: '🏠' },
    project:     { bg: 'rgba(22,163,74,0.12)',  color: '#16a34a', label: 'Project',    icon: '🏗️' },
    commercial:  { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'Commercial', icon: '🏢' },
    warehouse:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Warehouse',  icon: '🏭' },
}

function getTypeKey(l: Listing) {
    if (l.type === 'property') return 'property'
    if (l.section === 'commercial') return 'commercial'
    if (l.section === 'warehouse') return 'warehouse'
    return 'project'
}

function HealthBadge({ health }: { health: Health }) {
    const h = HEALTH[health]
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 10px', borderRadius: '999px',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em',
            color: h.color, backgroundColor: h.bg,
        }}>
            {health === 'great' ? '✓' : health === 'good' ? '●' : health === 'warning' ? '!' : '✕'} {h.label}
        </span>
    )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <div style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: 'var(--crm-border)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
            </div>
        </div>
    )
}

function fmtSecs(s: number) {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
}

type SortKey = 'views' | 'bookmarks' | 'inquiries' | 'bmRate' | 'inqRate' | 'avgSecs' | 'returnVisitors' | 'uniqueUsers'

export default function ListingsPage() {
    const [data, setData] = useState<PerformanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)
    const [typeFilter, setTypeFilter] = useState<'all' | 'property' | 'project' | 'commercial' | 'warehouse'>('all')
    const [healthFilter, setHealthFilter] = useState<'all' | Health>('all')
    const [sortKey, setSortKey] = useState<SortKey>('views')
    const [sortDesc, setSortDesc] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/crm/listing-performance?days=${days}`)
            if (res.ok) setData(await res.json())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [days]) // eslint-disable-line react-hooks/exhaustive-deps

    const listings = useMemo<Listing[]>(() => {
        if (!data) return []
        const all: Listing[] = [
            ...data.properties.map(p => ({ ...p, type: 'property' as const })),
            ...data.projects.map(p => ({ ...p, type: 'project' as const })),
        ]
        return all.filter(l => {
            if (typeFilter === 'all') return true
            if (typeFilter === 'property') return l.type === 'property'
            if (typeFilter === 'project') return l.type === 'project' && (!l.section || l.section === 'residential')
            if (typeFilter === 'commercial') return l.section === 'commercial'
            if (typeFilter === 'warehouse') return l.section === 'warehouse'
            return true
        }).filter(l => healthFilter === 'all' || l.health === healthFilter)
          .sort((a, b) => {
              const diff = a[sortKey] - b[sortKey]
              return sortDesc ? -diff : diff
          })
    }, [data, typeFilter, healthFilter, sortKey, sortDesc])

    const maxViews = useMemo(() => Math.max(...listings.map(l => l.views), 1), [listings])
    const maxBm    = useMemo(() => Math.max(...listings.map(l => l.bookmarks), 1), [listings])
    const maxInq   = useMemo(() => Math.max(...listings.map(l => l.inquiries), 1), [listings])

    const totalViews = useMemo(() => listings.reduce((s, l) => s + l.views, 0), [listings])
    const totalBm    = useMemo(() => listings.reduce((s, l) => s + l.bookmarks, 0), [listings])
    const totalInq   = useMemo(() => listings.reduce((s, l) => s + l.inquiries, 0), [listings])
    const healthCounts = useMemo(() => {
        const all = data ? [...data.properties, ...data.projects] : []
        return {
            great: all.filter(l => l.health === 'great').length,
            good:  all.filter(l => l.health === 'good').length,
            warning: all.filter(l => l.health === 'warning').length,
            poor:  all.filter(l => l.health === 'poor').length,
        }
    }, [data])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDesc(d => !d)
        else { setSortKey(key); setSortDesc(true) }
    }

    const SortBtn = ({ col }: { col: SortKey }) => (
        <button onClick={() => handleSort(col)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 2px', color: sortKey === col ? 'var(--crm-accent)' : 'var(--crm-text-muted)', lineHeight: 0 }}>
            <ArrowUpDown size={11} />
        </button>
    )

    const pillBtn = (active: boolean) => ({
        padding: '5px 14px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem',
        fontWeight: active ? 600 : 400,
        border: active ? '1px solid var(--crm-btn-primary-bg)' : '1px solid var(--crm-border)',
        backgroundColor: active ? 'var(--crm-btn-primary-bg)' : 'var(--crm-surface)',
        color: active ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-secondary)',
    } as React.CSSProperties)

    const dayBtn = (active: boolean) => ({
        padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
        fontWeight: active ? 600 : 400,
        border: '1px solid var(--crm-border)',
        backgroundColor: active ? 'var(--crm-btn-primary-bg)' : 'var(--crm-surface)',
        color: active ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-secondary)',
    } as React.CSSProperties)

    const totalListings = data ? data.properties.length + data.projects.length : 0

    const summaryCards = [
        { label: 'Listings',       value: totalListings.toString(),     icon: <BarChart3 size={15} />,    color: '#8b5cf6' },
        { label: 'Total Views',    value: totalViews.toLocaleString(),  icon: <Eye size={15} />,          color: '#3b82f6' },
        { label: 'Bookmarks',      value: totalBm.toLocaleString(),     icon: <Bookmark size={15} />,     color: '#f59e0b' },
        { label: 'Inquiries',      value: totalInq.toLocaleString(),    icon: <MessageSquare size={15} />,color: '#10b981' },
        { label: 'Great Health',   value: healthCounts.great.toString(),icon: <TrendingUp size={15} />,   color: '#16a34a' },
        { label: 'Need Attention', value: (healthCounts.warning + healthCounts.poor).toString(), icon: <Filter size={15} />, color: '#ef4444' },
    ]

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Home size={18} style={{ color: 'var(--crm-accent)' }} /> Listing Performance
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--crm-text-muted)' }}>
                        View → Bookmark → Inquiry funnel across all properties and projects
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[7, 14, 30, 60, 90].map(d => (
                        <button key={d} onClick={() => setDays(d)} style={dayBtn(days === d)}>{d}d</button>
                    ))}
                    <button
                        onClick={load}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-surface)', cursor: 'pointer', color: 'var(--crm-text-muted)', lineHeight: 0 }}
                        title="Refresh"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            {data && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {summaryCards.map(s => (
                        <div key={s.label} style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: s.color, marginBottom: '0.5rem' }}>
                                {s.icon}
                                <span style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)', fontWeight: 500 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '2px' }}>
                    <Filter size={12} /> Type:
                </span>
                {([['all', 'All'], ['property', '🏠 Property'], ['project', '🏗️ Project'], ['commercial', '🏢 Commercial'], ['warehouse', '🏭 Warehouse']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setTypeFilter(val)} style={pillBtn(typeFilter === val)}>{label}</button>
                ))}
                <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--crm-border)', margin: '0 4px' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--crm-text-muted)' }}>Health:</span>
                {(['all', 'great', 'good', 'warning', 'poor'] as const).map(v => (
                    <button key={v} onClick={() => setHealthFilter(v)} style={pillBtn(healthFilter === v)}>
                        {v === 'all' ? 'All' : `${v === 'great' ? '✓' : v === 'good' ? '●' : v === 'warning' ? '!' : '✕'} ${HEALTH[v]?.label || v}`}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--crm-text-muted)' }}>
                    {listings.length} listing{listings.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--crm-text-muted)' }}>
                    <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ fontSize: '0.875rem' }}>Loading listing data…</div>
                </div>
            ) : listings.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--crm-text-muted)', backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px' }}>
                    <BarChart3 size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>No listings tracked yet</div>
                    <div style={{ fontSize: '0.85rem' }}>Views and bookmarks will appear once users browse the site.</div>
                </div>
            ) : (
                <div style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)' }}>
                                    <th style={thStyle('280px')}>Listing</th>
                                    <th style={thStyleCenter()}>Health</th>
                                    <th style={thStyle('110px')}><span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>Views <SortBtn col="views" /></span></th>
                                    <th style={thStyle('110px')}><span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>Bookmarks <SortBtn col="bookmarks" /></span></th>
                                    <th style={thStyle('110px')}><span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>Inquiries <SortBtn col="inquiries" /></span></th>
                                    <th style={thStyleCenter()}><span style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}><Users size={11} /> Unique <SortBtn col="uniqueUsers" /></span></th>
                                    <th style={thStyleCenter()}><span style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}><Clock size={11} /> Avg Time <SortBtn col="avgSecs" /></span></th>
                                    <th style={thStyleCenter()}><span style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>Bm% <SortBtn col="bmRate" /></span></th>
                                    <th style={thStyleCenter()}><span style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>Inq% <SortBtn col="inqRate" /></span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map((l, i) => {
                                    const tk = getTypeKey(l)
                                    const ts = TYPE_STYLE[tk]
                                    return (
                                        <tr
                                            key={l.id}
                                            style={{ borderBottom: i < listings.length - 1 ? '1px solid var(--crm-border)' : 'none' }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--crm-elevated)', position: 'relative' }}>
                                                        {l.image ? (
                                                            <Image src={proxyUrl(l.image)} alt={l.title} fill style={{ objectFit: 'cover' }} sizes="42px" unoptimized />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>
                                                                {ts.icon}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <Link href={l.href} target="_blank" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                            {l.title}
                                                        </Link>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)', marginTop: '2px' }}>
                                                            {l.location}
                                                            {l.price_text && <span style={{ marginLeft: '6px', color: 'var(--crm-accent)', fontWeight: 600 }}>{l.price_text}</span>}
                                                        </div>
                                                        <span style={{ display: 'inline-block', marginTop: '3px', fontSize: '0.65rem', padding: '1px 7px', borderRadius: '999px', backgroundColor: ts.bg, color: ts.color, fontWeight: 600 }}>
                                                            {ts.icon} {ts.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 8px', textAlign: 'center' }}><HealthBadge health={l.health} /></td>
                                            <td style={{ padding: '10px 8px', minWidth: '110px' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{l.views.toLocaleString()}</div>
                                                <MiniBar value={l.views} max={maxViews} color="#6366f1" />
                                                {l.returnVisitors > 0 && <div style={{ fontSize: '0.65rem', color: '#f59e0b', marginTop: '2px' }}>↩ {l.returnVisitors} return</div>}
                                            </td>
                                            <td style={{ padding: '10px 8px', minWidth: '110px' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{l.bookmarks.toLocaleString()}</div>
                                                <MiniBar value={l.bookmarks} max={maxBm} color="#f59e0b" />
                                            </td>
                                            <td style={{ padding: '10px 8px', minWidth: '110px' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{l.inquiries.toLocaleString()}</div>
                                                <MiniBar value={l.inquiries} max={maxInq} color="#10b981" />
                                            </td>
                                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{l.uniqueUsers}</span>
                                            </td>
                                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: l.avgSecs >= 60 ? '#16a34a' : l.avgSecs >= 30 ? '#3b82f6' : 'var(--crm-text-muted)' }}>
                                                    {fmtSecs(l.avgSecs)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: l.bmRate >= 10 ? '#16a34a' : l.bmRate >= 5 ? '#f59e0b' : 'var(--crm-text-muted)' }}>
                                                    {l.bmRate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: l.inqRate >= 5 ? '#16a34a' : l.inqRate >= 2 ? '#f59e0b' : 'var(--crm-text-muted)' }}>
                                                    {l.inqRate.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

function thStyle(width?: string): React.CSSProperties {
    return { padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', color: 'var(--crm-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width }
}
function thStyleCenter(): React.CSSProperties {
    return { ...thStyle(), textAlign: 'center' }
}
