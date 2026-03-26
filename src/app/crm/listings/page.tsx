'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    RefreshCw, Filter, Image as ImageIcon, FileText, Tag,
    Zap, Film, BookOpen, LayoutGrid, List, Pencil, Eye,
    ExternalLink, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle2, XCircle, Bookmark, MessageSquare,
} from 'lucide-react'
import { proxyUrl } from '@/lib/proxy-url'

type Grade = 'great' | 'good' | 'warning' | 'poor'
type ViewMode = 'cards' | 'table'

interface HealthCheck {
    key: string; label: string; value: number | boolean
    earned: number; max: number; tip?: string
}

interface ListingHealth {
    id: string; type: 'property' | 'project'
    title: string; location: string; image: string | null
    category?: string; section?: string; status?: string; price_text?: string
    score: number; grade: Grade; checks: HealthCheck[]
    views: number; bookmarks: number; inquiries: number
    editHref: string; viewHref: string
}

const GRADE: Record<Grade, { label: string; color: string; bg: string; ring: string }> = {
    great:   { label: 'Great',   color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   ring: '#16a34a' },
    good:    { label: 'Good',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  ring: '#3b82f6' },
    warning: { label: 'Warning', color: '#d97706', bg: 'rgba(217,119,6,0.1)',   ring: '#d97706' },
    poor:    { label: 'Poor',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   ring: '#ef4444' },
}

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    property:   { label: 'Property',   icon: '🏠', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    project:    { label: 'Project',    icon: '🏗️', color: '#16a34a', bg: 'rgba(22,163,74,0.1)'  },
    commercial: { label: 'Commercial', icon: '🏢', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    warehouse:  { label: 'Warehouse',  icon: '🏭', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

const CHECK_ICONS: Record<string, string> = {
    images: '📷', title: '✏️', location: '📍', price: '₹', description: '📝',
    amenities: '🏊', video: '🎬', sqft: '📐', bedrooms: '🛏️', category: '🏷️',
    brochure: '📄', floorPlans: '🗂️', bhk: '🏠', developer: '👷',
}

const MISSING_FILTERS = [
    { key: 'images',      label: 'Photos',       icon: '📷' },
    { key: 'description', label: 'Description',  icon: '📝' },
    { key: 'price',       label: 'Price',        icon: '₹'  },
    { key: 'amenities',   label: 'Amenities',    icon: '🏊' },
    { key: 'video',       label: 'Video',        icon: '🎬' },
    { key: 'brochure',    label: 'Brochure',     icon: '📄' },
    { key: 'location',    label: 'Location',     icon: '📍' },
]

function getTypeKey(l: ListingHealth) {
    if (l.type === 'property') return 'property'
    if (l.section === 'commercial') return 'commercial'
    if (l.section === 'warehouse') return 'warehouse'
    return 'project'
}

function checkComplete(c: HealthCheck): boolean {
    if (typeof c.value === 'boolean') return c.value
    return (c.value as number) > 0
}

function checkMissing(l: ListingHealth, key: string): boolean {
    const c = l.checks.find(x => x.key === key)
    if (!c) return false
    return !checkComplete(c)
}

// ── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, grade, size = 52 }: { score: number; grade: Grade; size?: number }) {
    const r = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const fill = circ - (score / 100) * circ
    const g = GRADE[grade]
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--crm-border)" strokeWidth={5} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={g.ring} strokeWidth={5} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={fill}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}>
                <span style={{ fontSize: size * 0.27, fontWeight: 800, color: g.color }}>{score}</span>
            </div>
        </div>
    )
}

// ── Check Chip ──────────────────────────────────────────────────────────────
function CheckChip({ check, compact }: { check: HealthCheck; compact?: boolean }) {
    const ok = checkComplete(check)
    const icon = CHECK_ICONS[check.key] || '•'
    const val = typeof check.value === 'number' && check.value > 1 ? `(${check.value})` : ''
    return (
        <span title={check.tip || check.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: compact ? '2px 6px' : '3px 8px',
            borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600,
            backgroundColor: ok ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
            color: ok ? '#15803d' : '#dc2626',
            border: `1px solid ${ok ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)'}`,
            flexShrink: 0,
        }}>
            <span style={{ fontSize: '0.7rem' }}>{icon}</span>
            {!compact && <span>{check.label}{val ? ` ${val}` : ''}</span>}
            {ok
                ? <CheckCircle2 size={9} style={{ flexShrink: 0 }} />
                : <XCircle size={9} style={{ flexShrink: 0 }} />}
        </span>
    )
}

// ── Score Bar ───────────────────────────────────────────────────────────────
function ScoreBar({ check }: { check: HealthCheck }) {
    const ok = checkComplete(check)
    const pct = check.max > 0 ? Math.round((check.earned / check.max) * 100) : 0
    const icon = CHECK_ICONS[check.key] || '•'
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', width: '20px', textAlign: 'center' }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{check.label}</span>
                    <span style={{ fontSize: '0.68rem', color: ok ? '#16a34a' : '#ef4444', fontWeight: 700 }}>
                        {check.earned}/{check.max}
                    </span>
                </div>
                <div style={{ height: '4px', borderRadius: '4px', backgroundColor: 'var(--crm-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px',
                        backgroundColor: pct === 100 ? '#16a34a' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.5s ease',
                    }} />
                </div>
                {check.tip && <div style={{ fontSize: '0.63rem', color: '#d97706', marginTop: '2px' }}>💡 {check.tip}</div>}
            </div>
        </div>
    )
}

// ── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: ListingHealth }) {
    const [expanded, setExpanded] = useState(false)
    const g = GRADE[listing.grade]
    const tm = TYPE_META[getTypeKey(listing)]
    const missingChecks = listing.checks.filter(c => !checkComplete(c))
    const okChecks      = listing.checks.filter(c => checkComplete(c))

    return (
        <div style={{
            backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)',
            borderRadius: '12px', overflow: 'hidden',
            borderLeft: `3px solid ${g.ring}`,
        }}>
            {/* Main row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
                {/* Thumbnail */}
                <div style={{ width: 48, height: 48, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--crm-elevated)', position: 'relative' }}>
                    {listing.image ? (
                        <Image src={proxyUrl(listing.image)} alt={listing.title || ''} fill style={{ objectFit: 'cover' }} sizes="48px" unoptimized />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{tm.icon}</div>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                            {listing.title || '(Untitled)'}
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '999px', backgroundColor: tm.bg, color: tm.color, fontWeight: 600, flexShrink: 0 }}>
                            {tm.icon} {tm.label}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>
                        {listing.location || '—'}
                        {listing.price_text && <span style={{ marginLeft: '8px', color: 'var(--crm-accent)', fontWeight: 600 }}>{listing.price_text}</span>}
                    </div>
                    {/* Compact chips */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {listing.checks.map(c => <CheckChip key={c.key} check={c} compact />)}
                    </div>
                </div>

                {/* Score ring */}
                <ScoreRing score={listing.score} grade={listing.grade} size={52} />

                {/* Grade badge */}
                <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px',
                    borderRadius: '999px', backgroundColor: g.bg, color: g.color,
                    flexShrink: 0, display: 'none',
                }} className="grade-badge">
                    {g.label}
                </span>

                {/* Engagement */}
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    {[
                        { icon: <Eye size={11} />, val: listing.views,     color: '#6366f1' },
                        { icon: <Bookmark size={11} />, val: listing.bookmarks, color: '#f59e0b' },
                        { icon: <MessageSquare size={11} />, val: listing.inquiries, color: '#10b981' },
                    ].map((m, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                            <span style={{ color: m.color }}>{m.icon}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{m.val}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <Link href={listing.editHref} target="_blank" title="Edit listing" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: '7px',
                        border: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)',
                        color: 'var(--crm-text-muted)', textDecoration: 'none',
                    }}>
                        <Pencil size={13} />
                    </Link>
                    <Link href={listing.viewHref} target="_blank" title="View on site" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: '7px',
                        border: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)',
                        color: 'var(--crm-text-muted)', textDecoration: 'none',
                    }}>
                        <ExternalLink size={13} />
                    </Link>
                    <button
                        onClick={() => setExpanded(e => !e)}
                        title="Show details"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 30, height: 30, borderRadius: '7px',
                            border: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)',
                            color: 'var(--crm-text-muted)', cursor: 'pointer',
                        }}
                    >
                        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                </div>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div style={{
                    borderTop: '1px solid var(--crm-border)',
                    padding: '14px',
                    backgroundColor: 'var(--crm-elevated)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px',
                }}>
                    {listing.checks.map(c => <ScoreBar key={c.key} check={c} />)}
                </div>
            )}

            {/* Missing banner */}
            {missingChecks.length > 0 && !expanded && (
                <div style={{
                    borderTop: `1px solid rgba(217,119,6,0.15)`,
                    padding: '7px 14px',
                    backgroundColor: 'rgba(245,158,11,0.04)',
                    display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                }}>
                    <AlertTriangle size={11} style={{ color: '#d97706', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.67rem', color: '#d97706', fontWeight: 600, flexShrink: 0 }}>Missing:</span>
                    {missingChecks.map(c => (
                        <span key={c.key} style={{ fontSize: '0.67rem', color: '#d97706' }}>
                            {CHECK_ICONS[c.key]} {c.label}
                        </span>
                    ))}
                    <span style={{ fontSize: '0.67rem', color: 'rgba(217,119,6,0.5)', marginLeft: 'auto' }}>
                        {okChecks.length}/{listing.checks.length} complete
                    </span>
                </div>
            )}
        </div>
    )
}

// ── Table Row ─────────────────────────────────────────────────────────────────
function TableRow({ listing, cols }: { listing: ListingHealth; cols: string[] }) {
    const g  = GRADE[listing.grade]
    const tm = TYPE_META[getTypeKey(listing)]
    return (
        <tr style={{ borderBottom: '1px solid var(--crm-border)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            {/* Listing */}
            <td style={{ padding: '10px 12px', minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '7px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--crm-elevated)', position: 'relative' }}>
                        {listing.image
                            ? <Image src={proxyUrl(listing.image)} alt={listing.title || ''} fill style={{ objectFit: 'cover' }} sizes="38px" unoptimized />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tm.icon}</div>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>
                            {listing.title || '(Untitled)'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-muted)', display: 'flex', gap: '5px', alignItems: 'center', marginTop: '2px' }}>
                            {listing.location || '—'}
                            <span style={{ fontSize: '0.62rem', padding: '0 5px', borderRadius: '4px', backgroundColor: tm.bg, color: tm.color, fontWeight: 600 }}>
                                {tm.icon} {tm.label}
                            </span>
                        </div>
                    </div>
                </div>
            </td>

            {/* Score */}
            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                <ScoreRing score={listing.score} grade={listing.grade} size={44} />
            </td>

            {/* Per-criterion columns */}
            {cols.map(key => {
                const c = listing.checks.find(x => x.key === key)
                if (!c) return <td key={key} style={{ padding: '10px 8px', textAlign: 'center' }}>—</td>
                const ok = checkComplete(c)
                const icon = CHECK_ICONS[key] || '•'
                const val  = typeof c.value === 'number' && c.value > 0 ? c.value : null
                return (
                    <td key={key} style={{ padding: '10px 8px', textAlign: 'center' }} title={c.tip}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            fontSize: '0.72rem', fontWeight: 700,
                            color: ok ? '#16a34a' : '#ef4444',
                        }}>
                            {icon}
                            {val !== null && <span>{val}</span>}
                            {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        </span>
                    </td>
                )
            })}

            {/* Engagement */}
            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[listing.views, listing.bookmarks, listing.inquiries].map((v, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', fontWeight: 700, color: ['#6366f1', '#f59e0b', '#10b981'][i] }}>{v}</span>
                    ))}
                </div>
            </td>

            {/* Actions */}
            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <Link href={listing.editHref} target="_blank" style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--crm-border)', color: 'var(--crm-text-muted)', fontSize: '0.7rem', gap: '3px', textDecoration: 'none', backgroundColor: 'var(--crm-surface)' }}>
                        <Pencil size={11} /> Edit
                    </Link>
                </div>
            </td>
        </tr>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ListingsPage() {
    const [data, setData] = useState<{ properties: ListingHealth[]; projects: ListingHealth[] } | null>(null)
    const [loading, setLoading]       = useState(true)
    const [days, setDays]             = useState(30)
    const [viewMode, setViewMode]     = useState<ViewMode>('cards')
    const [typeFilter, setTypeFilter] = useState<'all' | 'property' | 'project' | 'commercial' | 'warehouse'>('all')
    const [gradeFilter, setGradeFilter] = useState<'all' | Grade>('all')
    const [missingFilter, setMissingFilter] = useState<string | null>(null)
    const [sortKey, setSortKey]       = useState<'score' | 'views' | 'title'>('score')
    const [sortDesc, setSortDesc]     = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/crm/listing-health?days=${days}`)
            if (res.ok) setData(await res.json())
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [days]) // eslint-disable-line

    const listings = useMemo<ListingHealth[]>(() => {
        if (!data) return []
        const all: ListingHealth[] = [
            ...data.properties.map(p => ({ ...p, type: 'property' as const })),
            ...data.projects.map(p => ({ ...p, type: 'project' as const })),
        ]
        return all
            .filter(l => {
                if (typeFilter === 'property') return l.type === 'property'
                if (typeFilter === 'project')    return l.type === 'project' && (!l.section || l.section === 'residential')
                if (typeFilter === 'commercial') return l.section === 'commercial'
                if (typeFilter === 'warehouse')  return l.section === 'warehouse'
                return true
            })
            .filter(l => gradeFilter === 'all' || l.grade === gradeFilter)
            .filter(l => !missingFilter || checkMissing(l, missingFilter))
            .sort((a, b) => {
                if (sortKey === 'score') return sortDesc ? b.score - a.score : a.score - b.score
                if (sortKey === 'views') return sortDesc ? b.views - a.views : a.views - b.views
                return sortDesc ? b.title?.localeCompare(a.title || '') ?? 0 : a.title?.localeCompare(b.title || '') ?? 0
            })
    }, [data, typeFilter, gradeFilter, missingFilter, sortKey, sortDesc])

    const stats = useMemo(() => {
        if (!data) return null
        const all = [...data.properties, ...data.projects] as ListingHealth[]
        const avg = all.length > 0 ? Math.round(all.reduce((s, l) => s + l.score, 0) / all.length) : 0
        const grade = { great: 0, good: 0, warning: 0, poor: 0 } as Record<Grade, number>
        for (const l of all) grade[l.grade]++
        return { total: all.length, avg, grade }
    }, [data])

    // Table column set
    const tableCols = typeFilter === 'property'
        ? ['images', 'description', 'price', 'amenities', 'video', 'sqft', 'bedrooms']
        : typeFilter === 'commercial' || typeFilter === 'warehouse'
        ? ['images', 'description', 'price', 'amenities', 'video', 'brochure', 'sqft']
        : ['images', 'description', 'price', 'amenities', 'video', 'brochure', 'floorPlans', 'bhk']

    const pillBtn = (active: boolean, color?: string) => ({
        padding: '5px 12px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.78rem',
        fontWeight: active ? 600 : 400,
        border: active ? `1px solid ${color || 'var(--crm-btn-primary-bg)'}` : '1px solid var(--crm-border)',
        backgroundColor: active ? (color ? color + '18' : 'var(--crm-btn-primary-bg)') : 'var(--crm-surface)',
        color: active ? (color || 'var(--crm-btn-primary-text)') : 'var(--crm-text-secondary)',
    } as React.CSSProperties)

    return (
        <div style={{ padding: '1.5rem' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--crm-text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} style={{ color: 'var(--crm-accent)' }} /> Listing Health
                    </h1>
                    <p style={{ fontSize: '0.82rem', color: 'var(--crm-text-muted)' }}>
                        Content quality score across photos · description · price · amenities · media
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {/* Day range */}
                    {[7, 14, 30, 60, 90].map(d => (
                        <button key={d} onClick={() => setDays(d)} style={{
                            padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem',
                            fontWeight: days === d ? 600 : 400,
                            border: '1px solid var(--crm-border)',
                            backgroundColor: days === d ? 'var(--crm-btn-primary-bg)' : 'var(--crm-surface)',
                            color: days === d ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-secondary)',
                        }}>{d}d</button>
                    ))}
                    {/* View toggle */}
                    <div style={{ display: 'flex', border: '1px solid var(--crm-border)', borderRadius: '8px', overflow: 'hidden' }}>
                        {([['cards', <LayoutGrid size={14} />], ['table', <List size={14} />]] as const).map(([m, ic]) => (
                            <button key={m} onClick={() => setViewMode(m as ViewMode)} style={{
                                display: 'flex', alignItems: 'center', padding: '5px 8px', cursor: 'pointer',
                                border: 'none', backgroundColor: viewMode === m ? 'var(--crm-btn-primary-bg)' : 'var(--crm-surface)',
                                color: viewMode === m ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-muted)',
                            }}>{ic}</button>
                        ))}
                    </div>
                    <button onClick={load} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-surface)', cursor: 'pointer', color: 'var(--crm-text-muted)', lineHeight: 0 }} title="Refresh">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* ── Summary cards ── */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Total Listings', value: stats.total,                 color: '#6366f1', icon: <Tag size={14} /> },
                        { label: 'Avg Score',       value: `${stats.avg}/100`,         color: stats.avg >= 80 ? '#16a34a' : stats.avg >= 60 ? '#3b82f6' : stats.avg >= 40 ? '#d97706' : '#ef4444', icon: <Zap size={14} /> },
                        { label: '✓ Great',         value: stats.grade.great,          color: '#16a34a', icon: <CheckCircle2 size={14} /> },
                        { label: '● Good',          value: stats.grade.good,           color: '#3b82f6', icon: <CheckCircle2 size={14} /> },
                        { label: '! Warning',       value: stats.grade.warning,        color: '#d97706', icon: <AlertTriangle size={14} /> },
                        { label: '✕ Poor',          value: stats.grade.poor,           color: '#ef4444', icon: <XCircle size={14} /> },
                    ].map(s => (
                        <div key={s.label} style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '10px', padding: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: s.color, marginBottom: '0.4rem' }}>
                                {s.icon}
                                <span style={{ fontSize: '0.68rem', color: 'var(--crm-text-muted)', fontWeight: 500 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--crm-text-primary)' }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filters ── */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Filter size={11} /> Type:
                </span>
                {([['all','All'],['property','🏠 Property'],['project','🏗️ Project'],['commercial','🏢 Commercial'],['warehouse','🏭 Warehouse']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setTypeFilter(v)} style={pillBtn(typeFilter === v)}>{l}</button>
                ))}

                <div style={{ width: 1, height: 20, backgroundColor: 'var(--crm-border)', margin: '0 4px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>Score:</span>
                {(['all', 'great', 'good', 'warning', 'poor'] as const).map(v => (
                    <button key={v} onClick={() => setGradeFilter(v)} style={pillBtn(gradeFilter === v, v !== 'all' ? GRADE[v].color : undefined)}>
                        {v === 'all' ? 'All' : `${v === 'great' ? '✓' : v === 'good' ? '●' : v === 'warning' ? '!' : '✕'} ${GRADE[v].label}`}
                    </button>
                ))}
            </div>

            {/* ── Missing filter ── */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <AlertTriangle size={11} /> Missing:
                </span>
                <button onClick={() => setMissingFilter(null)} style={pillBtn(!missingFilter)}>All</button>
                {MISSING_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setMissingFilter(missingFilter === f.key ? null : f.key)} style={pillBtn(missingFilter === f.key, '#d97706')}>
                        {f.icon} {f.label}
                    </button>
                ))}

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>Sort:</span>
                    {([['score','Score'],['views','Views'],['title','Title']] as const).map(([k, l]) => (
                        <button key={k} onClick={() => { if (sortKey === k) setSortDesc(d => !d); else { setSortKey(k); setSortDesc(true) } }} style={{
                            display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 9px',
                            borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer',
                            border: '1px solid var(--crm-border)',
                            backgroundColor: sortKey === k ? 'var(--crm-btn-primary-bg)' : 'var(--crm-surface)',
                            color: sortKey === k ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-muted)',
                            fontWeight: sortKey === k ? 600 : 400,
                        }}>
                            {l} {sortKey === k ? (sortDesc ? '↓' : '↑') : ''}
                        </button>
                    ))}
                    <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)', marginLeft: '6px' }}>
                        {listings.length} listing{listings.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--crm-text-muted)' }}>
                    <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ fontSize: '0.875rem' }}>Analysing listing health…</div>
                </div>
            ) : listings.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--crm-text-muted)', backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px' }}>
                    <Tag size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>No listings match filters</div>
                    <div style={{ fontSize: '0.85rem' }}>Try clearing the filters above.</div>
                </div>
            ) : viewMode === 'cards' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {listings.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>
            ) : (
                /* Table view */
                <div style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)' }}>
                                    <th style={thS('260px')}>Listing</th>
                                    <th style={thSC()}>Score</th>
                                    {tableCols.map(k => (
                                        <th key={k} style={thSC()} title={k}>
                                            <span style={{ fontSize: '0.85rem' }}>{CHECK_ICONS[k] || k}</span>
                                            <span style={{ display: 'block', fontSize: '0.6rem', marginTop: '1px' }}>{k === 'floorPlans' ? 'Plans' : k === 'bedrooms' ? 'BHK' : k.charAt(0).toUpperCase() + k.slice(1)}</span>
                                        </th>
                                    ))}
                                    <th style={thSC()}>
                                        <div style={{ fontSize: '0.6rem', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <span style={{ color: '#6366f1' }}>👁</span>
                                            <span style={{ color: '#f59e0b' }}>🔖</span>
                                            <span style={{ color: '#10b981' }}>✉</span>
                                        </div>
                                    </th>
                                    <th style={thSC()}>Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map(l => <TableRow key={l.id} listing={l} cols={tableCols} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Score legend */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--crm-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>Score guide:</span>
                {(['great','good','warning','poor'] as Grade[]).map(g => (
                    <span key={g} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: GRADE[g].color, fontWeight: 600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: GRADE[g].ring, display: 'inline-block' }} />
                        {g === 'great' ? '80–100' : g === 'good' ? '60–79' : g === 'warning' ? '40–59' : '0–39'} = {GRADE[g].label}
                    </span>
                ))}
                <span style={{ fontSize: '0.68rem', color: 'var(--crm-text-muted)', marginLeft: 'auto' }}>
                    Scored on: Photos · Description · Price · Location · Amenities · Video · Brochure · Floor Plans · Config
                </span>
            </div>
        </div>
    )
}

function thS(w?: string): React.CSSProperties {
    return { padding: '10px 12px', textAlign: 'left', fontSize: '0.68rem', color: 'var(--crm-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: w }
}
function thSC(): React.CSSProperties {
    return { ...thS(), textAlign: 'center' }
}
