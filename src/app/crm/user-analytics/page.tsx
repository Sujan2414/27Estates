'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
    Users, Eye, Clock, MousePointerClick, TrendingUp, Globe,
    Bookmark, Search, ChevronDown, X, ExternalLink
} from 'lucide-react'
import styles from '../crm.module.css'
import { proxyUrl } from '@/lib/proxy-url'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow { user_id: string; user_name: string | null; user_email: string; views: number; sessions: number; totalSecs: number; lastSeen: string }
interface PageRow { path: string; title: string; views: number; uniqueUsers: number; avgSecs: number }
interface DayRow { date: string; views: number; users: number; sessions: number }
interface MostViewedItem { id: string; title?: string; name?: string; location: string; city: string; images: string[]; views: number; uniqueUsers: number; avgSecs: number }
interface Analytics {
    totalViews: number; uniqueUsers: number; uniqueSessions: number; avgSessionDuration: number
    topUsers: UserRow[]; topPages: PageRow[]; dailyTrend: DayRow[]
    mostViewedProperties: MostViewedItem[]; mostViewedProjects: MostViewedItem[]
}
interface BookmarkUser { user_id: string; name: string | null; email: string | null; propertyCount: number; projectCount: number; commercialCount: number; warehouseCount: number; total: number; lastBookmarked: string; cities: string[] }
interface TrendingProperty { id: string; title: string; location: string; city: string; images: string[]; bookmarkCount: number }
interface TrendingProject { id: string; name: string; location: string; city: string; images: string[]; bookmarkCount: number }
interface RecentActivity { user_id: string; user_name: string; user_email: string | null; type: string; created_at: string }
interface BookmarkAnalytics {
    totalBookmarks: number; uniqueUsers: number
    trendingProperties: TrendingProperty[]
    trendingProjects: TrendingProject[]
    trendingCommercial: TrendingProject[]
    trendingWarehouse: TrendingProject[]
    recentActivity: RecentActivity[]; userBookmarks: BookmarkUser[]
    allCities: string[]
}
interface PageStat { path: string; title: string; visits: number; totalSecs: number; avgSecs: number; lastVisit: string }
interface SavedProperty { id: string; title: string; location: string; city: string; images: string[]; price: number; price_text: string; category: string; savedAt: string }
interface SavedProject { id: string; name: string; location: string; city: string; images: string[]; status: string; section?: string; savedAt: string }
interface UserDetail {
    totalViews: number; uniqueSessions: number; totalSecs: number; totalBookmarks: number
    pageStats: PageStat[]
    savedProperties: SavedProperty[]
    savedProjects: SavedProject[]
    savedCommercial: SavedProject[]
    savedWarehouse: SavedProject[]
    recentViews: { page_path: string; page_title: string; duration_seconds: number; created_at: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtSecs = (s: number) => {
    if (!s || s < 1) return '0s'
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60); const sec = s % 60
    if (m < 60) return sec > 0 ? `${m}m ${sec}s` : `${m}m`
    return `${Math.floor(m / 60)}h ${m % 60}m`
}
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtRelative = (d: string) => {
    const ms = Date.now() - new Date(d).getTime()
    const dd = Math.floor(ms / 86400000)
    if (dd === 0) return 'Today'; if (dd === 1) return 'Yesterday'; return `${dd}d ago`
}
const rankBadge = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#f97316', '#ec4899']
const avatarColor = (s: string) => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]

function Avatar({ name, email, size = 32 }: { name?: string | null; email?: string | null; size?: number }) {
    const label = name || email || '?'
    const c = avatarColor(label)
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: `${c}20`, border: `1.5px solid ${c}50`, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
            {label.charAt(0).toUpperCase()}
        </div>
    )
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
    return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 999, background: `${color}18`, color, fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{children}</span>
}

function SkeletonRows({ n = 5 }: { n?: number }) {
    return (
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {Array.from({ length: n }).map((_, i) => <div key={i} className={styles.skeleton} style={{ height: 44, borderRadius: 8 }} />)}
        </div>
    )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <div style={{ background: 'var(--crm-surface)', borderRadius: '0.875rem', border: '1px solid var(--crm-border)', overflow: 'hidden', ...style }}>{children}</div>
}

function SectionHeader({ icon, title, subtitle, right }: { icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode }) {
    return (
        <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--crm-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--crm-bg)' }}>
            {icon}
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{title}</span>
            {subtitle && <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-faint)' }}>{subtitle}</span>}
            {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
        </div>
    )
}

// ─── User Search Dropdown ─────────────────────────────────────────────────────
function UserPicker({ users, selected, onSelect }: { users: UserRow[]; selected: UserRow | null; onSelect: (u: UserRow | null) => void }) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = useMemo(() => {
        const q = query.toLowerCase()
        return users.filter(u => (u.user_name || '').toLowerCase().includes(q) || (u.user_email || '').toLowerCase().includes(q)).slice(0, 12)
    }, [users, query])

    if (selected) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: '2px solid var(--crm-accent)', background: 'var(--crm-accent-bg)', maxWidth: 320 }}>
                <Avatar name={selected.user_name} email={selected.user_email} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selected.user_name || selected.user_email?.split('@')[0]}
                    </div>
                    {selected.user_name && <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)' }}>{selected.user_email}</div>}
                </div>
                <button onClick={() => onSelect(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-faint)', display: 'flex', padding: 2, borderRadius: 4 }}>
                    <X size={14} />
                </button>
            </div>
        )
    }

    return (
        <div ref={ref} style={{ position: 'relative', width: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '0.625rem', border: '1px solid var(--crm-border)', background: 'var(--crm-surface)', cursor: 'text' }} onClick={() => setOpen(true)}>
                <Search size={13} style={{ color: 'var(--crm-text-faint)', flexShrink: 0 }} />
                <input
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search user by name or email…"
                    style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.8rem', color: 'var(--crm-text-primary)', minWidth: 0 }}
                />
                <ChevronDown size={12} style={{ color: 'var(--crm-text-faint)', flexShrink: 0 }} />
            </div>
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '0.625rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.8rem' }}>No users found</div>
                    ) : filtered.map(u => (
                        <div key={u.user_id} onClick={() => { onSelect(u); setQuery(''); setOpen(false) }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', cursor: 'pointer', borderBottom: '1px solid var(--crm-border-subtle)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Avatar name={u.user_name} email={u.user_email} size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {u.user_name || u.user_email?.split('@')[0]}
                                </div>
                                {u.user_name && <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)' }}>{u.user_email}</div>}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-faint)', textAlign: 'right', flexShrink: 0 }}>
                                <div>{u.views} views</div>
                                <div>{fmtSecs(u.totalSecs)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── User Detail Panel ────────────────────────────────────────────────────────
function UserDetailPanel({ user, detail, loading, days }: { user: UserRow; detail: UserDetail | null; loading: boolean; days: number }) {
    const [tab, setTab] = useState<'pages' | 'bookmarks' | 'activity'>('pages')
    const [pagesPage, setPagesPage] = useState(1)
    const [activityPage, setActivityPage] = useState(1)
    const DETAIL_PAGE = 10

    useEffect(() => { setPagesPage(1); setActivityPage(1) }, [user.user_id, days])

    const statItems = [
        { label: 'Page Views', value: detail?.totalViews ?? '—', icon: Eye, color: '#3b82f6' },
        { label: 'Sessions', value: detail?.uniqueSessions ?? '—', icon: MousePointerClick, color: '#f59e0b' },
        { label: 'Total Time', value: detail ? fmtSecs(detail.totalSecs) : '—', icon: Clock, color: '#22c55e', isText: true },
        { label: 'Bookmarks', value: detail?.totalBookmarks ?? '—', icon: Bookmark, color: '#8b5cf6' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* User header */}
            <SectionCard>
                <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <Avatar name={user.user_name} email={user.user_email} size={46} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                            {user.user_name || user.user_email?.split('@')[0] || 'Unknown'}
                        </div>
                        {user.user_name && <div style={{ fontSize: '0.78rem', color: 'var(--crm-text-faint)' }}>{user.user_email}</div>}
                        <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-faint)', marginTop: 2 }}>Last seen {fmtRelative(user.lastSeen)} · last {days} days</div>
                    </div>
                    {/* mini stats */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {statItems.map(({ label, value, icon: Icon, color, isText }) => (
                            <div key={label} style={{ textAlign: 'center', padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: `1px solid ${color}25`, background: `${color}0a`, minWidth: 80 }}>
                                <Icon size={14} style={{ color, marginBottom: 4 }} />
                                <div style={{ fontSize: isText ? '0.875rem' : '1.125rem', fontWeight: 700, color, lineHeight: 1 }}>
                                    {loading ? '…' : (isText ? value : Number(value).toLocaleString('en-IN'))}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)', marginTop: 2 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>

            {/* Tabs */}
            <SectionCard>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--crm-border)', padding: '0 0.5rem' }}>
                    {([
                        { key: 'pages', label: 'Page Visits', Icon: Globe },
                        { key: 'bookmarks', label: 'Saved Listings', Icon: Bookmark },
                        { key: 'activity', label: 'Recent Activity', Icon: TrendingUp },
                    ] as const).map(({ key, label, Icon }) => (
                        <button key={key} onClick={() => setTab(key)} style={{ padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: tab === key ? 600 : 400, color: tab === key ? 'var(--crm-accent)' : 'var(--crm-text-secondary)', borderBottom: tab === key ? '2px solid var(--crm-accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}>
                            <Icon size={13} />{label}
                        </button>
                    ))}
                </div>

                {loading ? <SkeletonRows /> : (
                    <>
                        {tab === 'pages' && (
                            <div style={{ overflowX: 'auto' }}>
                                {!detail?.pageStats?.length ? (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>No page visits recorded.</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                                {['#', 'Page', 'Visits', 'Total Time', 'Avg Time', 'Last Visit'].map(h => (
                                                    <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--crm-text-faint)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.pageStats.slice((pagesPage - 1) * DETAIL_PAGE, pagesPage * DETAIL_PAGE).map((p, i) => {
                                                const maxSecs = detail.pageStats[0]?.totalSecs || 1
                                                const pct = Math.round((p.totalSecs / maxSecs) * 100)
                                                return (
                                                    <tr key={p.path} style={{ borderBottom: '1px solid var(--crm-border-subtle)' }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--crm-text-faint)', width: 36, fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</td>
                                                        <td style={{ padding: '0.75rem 1rem', maxWidth: 300 }}>
                                                            <div style={{ fontWeight: 600, color: 'var(--crm-text-primary)', fontSize: '0.8125rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {p.title && p.title !== p.path ? p.title : p.path}
                                                            </div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)', fontFamily: 'monospace' }}>{p.path}</div>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--crm-text-primary)', fontSize: '0.8125rem' }}>{p.visits}</td>
                                                        <td style={{ padding: '0.75rem 1rem', minWidth: 120 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <Pill color="#22c55e">{fmtSecs(p.totalSecs)}</Pill>
                                                                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--crm-border)', overflow: 'hidden', minWidth: 30 }}>
                                                                    <div style={{ width: `${pct}%`, height: '100%', background: '#22c55e', borderRadius: 2 }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}><Pill color="#3b82f6">{fmtSecs(p.avgSecs)}</Pill></td>
                                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--crm-text-faint)', fontSize: '0.75rem' }}>{fmtRelative(p.lastVisit)}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                {(detail?.pageStats?.length ?? 0) > DETAIL_PAGE && (
                                    <Paginator page={pagesPage} total={detail!.pageStats.length} perPage={DETAIL_PAGE} onChange={setPagesPage} />
                                )}
                            </div>
                        )}

                        {tab === 'bookmarks' && (
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {!detail?.savedProperties?.length && !detail?.savedProjects?.length ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>No bookmarks in this period.</div>
                                ) : (
                                    <>
                                        {(detail?.savedProperties?.length ?? 0) > 0 && (
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
                                                    🏠 Saved Properties ({detail!.savedProperties.length})
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.625rem' }}>
                                                    {detail!.savedProperties.map(p => (
                                                        <a key={p.id} href={`/properties/${p.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: '0.625rem', padding: '0.625rem', borderRadius: '0.625rem', border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                                                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--crm-accent)')}
                                                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--crm-border)')}
                                                        >
                                                            {p.images?.[0] ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={proxyUrl(p.images[0])} alt={p.title} style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                                            ) : (
                                                                <div style={{ width: 50, height: 50, borderRadius: 6, background: 'var(--crm-surface-alt)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏠</div>
                                                            )}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--crm-accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                                                                <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)', marginTop: 2 }}>{p.city || p.location}</div>
                                                                {p.price_text && <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, marginTop: 2 }}>{p.price_text}</div>}
                                                                <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)', marginTop: 2 }}>Saved {fmtRelative(p.savedAt)}</div>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {((detail?.savedProjects?.length ?? 0) + (detail?.savedCommercial?.length ?? 0) + (detail?.savedWarehouse?.length ?? 0)) > 0 && (
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
                                                    🏗️ Saved Projects / Commercial / Warehouse ({(detail!.savedProjects.length + (detail!.savedCommercial?.length || 0) + (detail!.savedWarehouse?.length || 0))})
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.625rem' }}>
                                                    {[...detail!.savedProjects, ...(detail!.savedCommercial || []), ...(detail!.savedWarehouse || [])].map(p => (
                                                        <a key={p.id} href={`/projects/${p.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: '0.625rem', padding: '0.625rem', borderRadius: '0.625rem', border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                                                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--crm-accent)')}
                                                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--crm-border)')}
                                                        >
                                                            {p.images?.[0] ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={proxyUrl(p.images[0])} alt={p.name} style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                                            ) : (
                                                                <div style={{ width: 50, height: 50, borderRadius: 6, background: 'var(--crm-surface-alt)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                                                    {p.section === 'commercial' ? '🏢' : p.section === 'warehouse' ? '🏭' : '🏗️'}
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--crm-accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                                <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)', marginTop: 2 }}>{p.city || p.location}</div>
                                                                <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                                                                    <Pill color="#22c55e">{p.status}</Pill>
                                                                    {p.section && p.section !== 'residential' && <Pill color="#f97316">{p.section}</Pill>}
                                                                </div>
                                                                <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)', marginTop: 2 }}>Saved {fmtRelative(p.savedAt)}</div>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {tab === 'activity' && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {!detail?.recentViews?.length ? (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>No activity recorded.</div>
                                ) : (
                                    <>
                                        {detail.recentViews.slice((activityPage - 1) * DETAIL_PAGE, activityPage * DETAIL_PAGE).map((v, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', borderBottom: '1px solid var(--crm-border-subtle)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--crm-accent)', flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {v.page_title && v.page_title !== v.page_path ? v.page_title : v.page_path}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)', fontFamily: 'monospace' }}>{v.page_path}</div>
                                                </div>
                                                <Pill color="#22c55e">{fmtSecs(v.duration_seconds)}</Pill>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-faint)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>{fmtDateTime(v.created_at)}</div>
                                            </div>
                                        ))}
                                        <Paginator page={activityPage} total={detail.recentViews.length} perPage={DETAIL_PAGE} onChange={setActivityPage} />
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </SectionCard>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserAnalyticsPage() {
    const [data, setData] = useState<Analytics | null>(null)
    const [bmData, setBmData] = useState<BookmarkAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [bmLoading, setBmLoading] = useState(false)
    const [days, setDays] = useState(30)
    const [activeTab, setActiveTab] = useState<'users' | 'pages' | 'bookmarks'>('users')
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/crm/user-analytics?days=${days}`)
            .then(r => r.json()).then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [days])

    useEffect(() => {
        if (activeTab !== 'bookmarks' || bmData) return
        setBmLoading(true)
        fetch(`/api/crm/bookmark-analytics?days=${days}`)
            .then(r => r.json()).then(d => { setBmData(d); setBmLoading(false) })
            .catch(() => setBmLoading(false))
    }, [activeTab, days, bmData])

    useEffect(() => { setBmData(null) }, [days])

    // Load user detail when a user is selected
    useEffect(() => {
        if (!selectedUser) { setUserDetail(null); return }
        setDetailLoading(true)
        fetch(`/api/crm/user-detail?user_id=${selectedUser.user_id}&days=${days}`)
            .then(r => r.json()).then(d => { setUserDetail(d); setDetailLoading(false) })
            .catch(() => setDetailLoading(false))
    }, [selectedUser, days])

    const statCards = [
        { label: 'Total Page Views', value: data?.totalViews ?? 0, icon: Eye, color: '#3b82f6', sub: `last ${days}d` },
        { label: 'Unique Users', value: data?.uniqueUsers ?? 0, icon: Users, color: '#8b5cf6', sub: 'logged-in' },
        { label: 'Sessions', value: data?.uniqueSessions ?? 0, icon: MousePointerClick, color: '#f59e0b', sub: 'unique' },
        { label: 'Avg Session', value: data ? fmtSecs(data.avgSessionDuration) : '—', icon: Clock, color: '#22c55e', sub: 'time spent', isText: true },
    ]

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.15rem' }}>User Analytics</h1>
                    <p style={{ fontSize: '0.78rem', color: 'var(--crm-text-faint)' }}>Pages · Time spent · Bookmarks · Per-user drill-down</p>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', background: 'var(--crm-surface)', padding: '0.25rem', borderRadius: '0.625rem', border: '1px solid var(--crm-border)' }}>
                    {[7, 14, 30, 60].map(d => (
                        <button key={d} onClick={() => setDays(d)} style={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: 'none', background: days === d ? 'var(--crm-btn-primary-bg)' : 'transparent', color: days === d ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-secondary)', fontSize: '0.8rem', fontWeight: days === d ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s' }}>{d}d</button>
                    ))}
                </div>
            </div>

            {/* Stat cards — compact row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {statCards.map(({ label, value, icon: Icon, color, sub, isText }) => (
                    <div key={label} style={{ background: 'var(--crm-surface)', borderRadius: '0.75rem', border: '1px solid var(--crm-border)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={16} style={{ color }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</div>
                            {loading
                                ? <div className={styles.skeleton} style={{ width: 52, height: 22, borderRadius: 5, marginTop: 3 }} />
                                : <div style={{ fontSize: isText ? '1rem' : '1.375rem', fontWeight: 700, color: 'var(--crm-text-primary)', lineHeight: 1.2, marginTop: 1 }}>
                                    {isText ? value : Number(value).toLocaleString('en-IN')}
                                </div>
                            }
                            <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)' }}>{sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* User drill-down selector — overflow:visible so dropdown isn't clipped */}
            <div style={{ background: 'var(--crm-surface)', borderRadius: '0.875rem', border: '1px solid var(--crm-border)', marginBottom: '1.25rem', position: 'relative', zIndex: 20 }}>
                <div style={{ padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={14} style={{ color: 'var(--crm-accent)' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>User Profile</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>Select a user to drill into their pages, time spent, and bookmarks</span>
                    <div style={{ marginLeft: 'auto' }}>
                        <UserPicker users={data?.topUsers || []} selected={selectedUser} onSelect={u => setSelectedUser(u)} />
                    </div>
                </div>
            </div>

            {/* User detail panel */}
            {selectedUser && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <UserDetailPanel user={selectedUser} detail={userDetail} loading={detailLoading} days={days} />
                </div>
            )}

            {/* Chart + Most Viewed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
                <SectionCard>
                    <SectionHeader
                        icon={<TrendingUp size={14} style={{ color: 'var(--crm-accent)' }} />}
                        title="Activity Trend"
                        right={
                            <div style={{ display: 'flex', gap: '0.875rem' }}>
                                {[{ color: '#3b82f6', label: 'Views' }, { color: '#8b5cf6', label: 'Users' }].map(({ color, label }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--crm-text-faint)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />{label}
                                    </div>
                                ))}
                            </div>
                        }
                    />
                    <div style={{ padding: '0.875rem' }}>
                        {loading ? (
                            <div className={styles.skeleton} style={{ height: 150, borderRadius: 8 }} />
                        ) : data?.dailyTrend?.length ? (
                            <div style={{ height: 150 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.dailyTrend} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barCategoryGap="35%">
                                        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 9, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: 8, fontSize: 11 }} labelFormatter={v => fmtDate(v as string)} />
                                        <Bar dataKey="views" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Views" />
                                        <Bar dataKey="users" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Users" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crm-text-faint)', fontSize: '0.8rem', textAlign: 'center' }}>
                                No data yet — tracking starts once users visit the site.
                            </div>
                        )}
                    </div>
                </SectionCard>

                <SectionCard>
                    <SectionHeader icon={<Eye size={14} style={{ color: '#f59e0b' }} />} title="Most Viewed Listings" subtitle="by page views" />
                    <div style={{ padding: '0.75rem', maxHeight: 222, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} style={{ height: 38, borderRadius: 8 }} />)
                        ) : (
                            [...(data?.mostViewedProperties || []).map(p => ({ ...p, _t: 'property' as const })),
                             ...(data?.mostViewedProjects || []).map(p => ({ ...p, _t: 'project' as const }))]
                                .sort((a, b) => b.views - a.views).slice(0, 7)
                                .map((item, i) => (
                                    <div key={item.id + item._t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '0.5rem', background: 'var(--crm-bg)' }}>
                                        <span style={{ fontSize: '0.85rem', width: 18, textAlign: 'center', flexShrink: 0 }}>
                                            {rankBadge(i) ?? <span style={{ color: 'var(--crm-text-faint)', fontSize: '0.7rem', fontWeight: 600 }}>{i + 1}</span>}
                                        </span>
                                        {item.images?.[0]
                                            // eslint-disable-next-line @next/next/no-img-element
                                            ? <img src={proxyUrl(item.images[0])} alt="" style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                                            : <div style={{ width: 30, height: 30, borderRadius: 4, background: 'var(--crm-surface-alt)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{item._t === 'property' ? '🏠' : '🏗️'}</div>
                                        }
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title || item.name}</div>
                                            <div style={{ fontSize: '0.62rem', color: 'var(--crm-text-faint)' }}>{item.city || item.location}</div>
                                        </div>
                                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>{item.views}v</div>
                                            <div style={{ fontSize: '0.62rem', color: 'var(--crm-text-faint)' }}>{item.uniqueUsers}u</div>
                                        </div>
                                    </div>
                                ))
                        )}
                        {!loading && !data?.mostViewedProperties?.length && !data?.mostViewedProjects?.length && (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.78rem' }}>No listing views tracked yet.</div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* Main tabs */}
            <SectionCard>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--crm-border)', padding: '0 0.5rem' }}>
                    {([
                        { key: 'users', label: 'Top Users', Icon: Users, count: data?.topUsers?.length },
                        { key: 'pages', label: 'Top Pages', Icon: Globe, count: data?.topPages?.length },
                        { key: 'bookmarks', label: 'Bookmarks', Icon: Bookmark, count: bmData?.totalBookmarks },
                    ] as const).map(({ key, label, Icon, count }) => (
                        <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '0.8rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? 'var(--crm-accent)' : 'var(--crm-text-secondary)', borderBottom: activeTab === key ? '2px solid var(--crm-accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                            <Icon size={13} />{label}
                            {count != null && count > 0 && <span style={{ padding: '1px 6px', borderRadius: 999, background: activeTab === key ? 'var(--crm-accent)' : 'var(--crm-border)', color: activeTab === key ? '#fff' : 'var(--crm-text-faint)', fontSize: '0.68rem', fontWeight: 600 }}>{count}</span>}
                        </button>
                    ))}
                </div>
                {activeTab === 'users' && <TopUsersTab data={data} loading={loading} onSelectUser={u => { setSelectedUser(u); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
                {activeTab === 'pages' && <TopPagesTab data={data} loading={loading} />}
                {activeTab === 'bookmarks' && <BookmarksTab bmData={bmData} bmLoading={bmLoading} days={days} />}
            </SectionCard>
        </div>
    )
}

// ─── Top Users Tab ────────────────────────────────────────────────────────────
function TopUsersTab({ data, loading, onSelectUser }: { data: Analytics | null; loading: boolean; onSelectUser: (u: UserRow) => void }) {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const PAGE = 10

    const filtered = useMemo(() => {
        if (!data?.topUsers) return []
        const q = search.toLowerCase()
        return data.topUsers.filter(u => (u.user_name || '').toLowerCase().includes(q) || (u.user_email || '').toLowerCase().includes(q))
    }, [data, search])

    useEffect(() => { setPage(1) }, [search])

    const shown = filtered.slice((page - 1) * PAGE, page * PAGE)

    if (loading) return <SkeletonRows />

    return (
        <div>
            <div style={{ padding: '0.75rem 1.125rem', borderBottom: '1px solid var(--crm-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''} · sorted by time on site</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-faint)' }}>Click a row to drill down →</span>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
                </div>
            </div>
            {filtered.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>
                    {search ? 'No users match.' : 'No user sessions recorded yet.'}
                </div>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                    {['Rank', 'User', 'Page Views', 'Sessions', 'Time on Site', 'Last Seen', ''].map(h => (
                                        <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--crm-text-faint)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map(u => {
                                    const rank = filtered.indexOf(u)
                                    const badge = rankBadge(rank)
                                    return (
                                        <tr key={u.user_id} onClick={() => onSelectUser(u)} style={{ borderBottom: '1px solid var(--crm-border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '0.75rem 1rem', width: 48 }}>
                                                {badge ? <span style={{ fontSize: '1rem' }}>{badge}</span> : <span style={{ color: 'var(--crm-text-faint)', fontWeight: 600, fontSize: '0.75rem' }}>{rank + 1}</span>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Avatar name={u.user_name} email={u.user_email} />
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--crm-text-primary)', fontSize: '0.8125rem' }}>{u.user_name || u.user_email?.split('@')[0] || '—'}</div>
                                                        {u.user_name && <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)' }}>{u.user_email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--crm-text-primary)', fontWeight: 600 }}>
                                                    <Eye size={11} style={{ color: '#3b82f6' }} />{u.views}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{u.sessions}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}><Pill color="#22c55e">{fmtSecs(u.totalSecs)}</Pill></td>
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--crm-text-faint)', fontSize: '0.75rem' }}>{fmtRelative(u.lastSeen)}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--crm-accent)', fontWeight: 500 }}>
                                                    <ExternalLink size={11} /> View
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Paginator page={page} total={filtered.length} perPage={PAGE} onChange={setPage} />
                </>
            )}
        </div>
    )
}

// ─── Top Pages Tab ────────────────────────────────────────────────────────────
function TopPagesTab({ data, loading }: { data: Analytics | null; loading: boolean }) {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const PAGE = 10

    const filtered = useMemo(() => {
        if (!data?.topPages) return []
        const q = search.toLowerCase()
        return data.topPages.filter(p => p.path.toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q))
    }, [data, search])

    useEffect(() => { setPage(1) }, [search])

    const shown = filtered.slice((page - 1) * PAGE, page * PAGE)
    if (loading) return <SkeletonRows />

    return (
        <div>
            <div style={{ padding: '0.75rem 1.125rem', borderBottom: '1px solid var(--crm-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>{filtered.length} pages · sorted by views</span>
                <div style={{ marginLeft: 'auto' }}>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search path or title…" />
                </div>
            </div>
            {filtered.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>
                    {search ? 'No pages match.' : 'No page view data yet.'}
                </div>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                    {['Rank', 'Page', 'Views', 'Unique Users', 'Avg Time'].map(h => (
                                        <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--crm-text-faint)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map(p => {
                                    const rank = filtered.indexOf(p)
                                    const badge = rankBadge(rank)
                                    const maxViews = filtered[0]?.views || 1
                                    return (
                                        <tr key={p.path} style={{ borderBottom: '1px solid var(--crm-border-subtle)', transition: 'background 0.1s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '0.75rem 1rem', width: 48 }}>
                                                {badge ? <span style={{ fontSize: '1rem' }}>{badge}</span> : <span style={{ color: 'var(--crm-text-faint)', fontWeight: 600, fontSize: '0.75rem' }}>{rank + 1}</span>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', maxWidth: 340 }}>
                                                <a href={p.path} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--crm-accent)', fontSize: '0.8125rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        {p.title && p.title !== p.path ? p.title : p.path}
                                                        <ExternalLink size={10} style={{ flexShrink: 0, opacity: 0.6 }} />
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.path}</div>
                                                </a>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', minWidth: 110 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--crm-text-primary)', minWidth: 24 }}>{p.views}</span>
                                                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--crm-border)', overflow: 'hidden', minWidth: 40 }}>
                                                        <div style={{ width: `${Math.round(p.views / maxViews * 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                    <Users size={11} style={{ color: '#8b5cf6' }} />{p.uniqueUsers}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}><Pill color="#3b82f6">{fmtSecs(p.avgSecs)}</Pill></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Paginator page={page} total={filtered.length} perPage={PAGE} onChange={setPage} />
                </>
            )}
        </div>
    )
}

// ─── Bookmarks Tab ────────────────────────────────────────────────────────────
type CategoryFilter = 'all' | 'properties' | 'projects' | 'commercial' | 'warehouse'

function BookmarksTab({ bmData, bmLoading, days }: { bmData: BookmarkAnalytics | null; bmLoading: boolean; days: number }) {
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
    const [cityFilter, setCityFilter] = useState<string>('all')
    const [userPage, setUserPage] = useState(1)
    const PAGE = 10

    const filteredUsers = useMemo(() => {
        if (!bmData?.userBookmarks) return []
        const q = search.toLowerCase()
        return bmData.userBookmarks.filter(u => {
            // Text search
            if (q && !(u.name || '').toLowerCase().includes(q) && !(u.email || '').toLowerCase().includes(q)) return false
            // Category filter
            if (categoryFilter === 'properties' && u.propertyCount === 0) return false
            if (categoryFilter === 'projects' && u.projectCount === 0) return false
            if (categoryFilter === 'commercial' && u.commercialCount === 0) return false
            if (categoryFilter === 'warehouse' && u.warehouseCount === 0) return false
            // City filter
            if (cityFilter !== 'all' && !u.cities.includes(cityFilter)) return false
            return true
        })
    }, [bmData, search, categoryFilter, cityFilter])

    if (bmLoading) return <SkeletonRows />
    if (!bmData || bmData.totalBookmarks === 0) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>No bookmark data in the last {days} days.</div>
    }

    return (
        <div style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                {[
                    { label: 'Total Saves', value: bmData.totalBookmarks, color: '#f59e0b', e: '🔖' },
                    { label: 'Savers', value: bmData.uniqueUsers, color: '#8b5cf6', e: '👤' },
                    { label: 'Properties', value: bmData.userBookmarks.reduce((s, u) => s + u.propertyCount, 0), color: '#3b82f6', e: '🏠' },
                    { label: 'Projects', value: bmData.userBookmarks.reduce((s, u) => s + u.projectCount, 0), color: '#22c55e', e: '🏗️' },
                    { label: 'Commercial', value: bmData.userBookmarks.reduce((s, u) => s + (u.commercialCount || 0), 0), color: '#f97316', e: '🏢' },
                    { label: 'Warehouse', value: bmData.userBookmarks.reduce((s, u) => s + (u.warehouseCount || 0), 0), color: '#06b6d4', e: '🏭' },
                ].map(({ label, value, color, e }) => (
                    <div key={label} style={{ padding: '0.625rem 0.75rem', borderRadius: '0.625rem', border: `1px solid ${color}25`, background: `${color}08`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{e}</span>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color, lineHeight: 1 }}>{value.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--crm-text-faint)' }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trending grid — Properties + Projects + Commercial + Warehouse */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                {[
                    { label: '🏠 Trending Properties', items: bmData.trendingProperties, nameKey: 'title' as const, color: '#f59e0b', bg: '#f59e0b15', href: (id: string) => `/properties/${id}` },
                    { label: '🏗️ Trending Projects', items: bmData.trendingProjects, nameKey: 'name' as const, color: '#22c55e', bg: '#22c55e15', href: (id: string) => `/projects/${id}` },
                    { label: '🏢 Trending Commercial', items: bmData.trendingCommercial || [], nameKey: 'name' as const, color: '#f97316', bg: '#f9731615', href: (id: string) => `/projects/${id}` },
                    { label: '🏭 Trending Warehouses', items: bmData.trendingWarehouse || [], nameKey: 'name' as const, color: '#06b6d4', bg: '#06b6d415', href: (id: string) => `/projects/${id}` },
                ].filter(s => s.items.length > 0).map(({ label, items, nameKey, color, bg, href }) => (
                    <div key={label} style={{ borderRadius: '0.625rem', border: '1px solid var(--crm-border)', overflow: 'hidden' }}>
                        <div style={{ padding: '0.625rem 0.875rem', background: 'var(--crm-bg)', borderBottom: '1px solid var(--crm-border)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{label}</div>
                        {items.map((p, i) => (
                            <a key={p.id} href={href(p.id)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderBottom: i < items.length - 1 ? '1px solid var(--crm-border-subtle)' : 'none', textDecoration: 'none', transition: 'background 0.1s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span style={{ width: 20, textAlign: 'center', flexShrink: 0, fontSize: '0.85rem' }}>
                                    {rankBadge(i) ?? <span style={{ color: 'var(--crm-text-faint)', fontSize: '0.7rem', fontWeight: 600 }}>{i + 1}</span>}
                                </span>
                                {p.images?.[0]
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={proxyUrl(p.images[0])} alt="" style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                                    : <div style={{ width: 30, height: 30, borderRadius: 4, background: 'var(--crm-surface-alt)', flexShrink: 0 }} />
                                }
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(p as Record<string, string>)[nameKey]}</div>
                                    <div style={{ fontSize: '0.62rem', color: 'var(--crm-text-faint)' }}>{p.city || p.location}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                                    <span style={{ padding: '2px 7px', borderRadius: 999, background: bg, color, fontWeight: 700, fontSize: '0.72rem' }}>🔥 {p.bookmarkCount}</span>
                                    <ExternalLink size={10} style={{ color: 'var(--crm-text-faint)' }} />
                                </div>
                            </a>
                        ))
                        }
                    </div>
                ))}
            </div>

            {/* User bookmark table */}
            <div style={{ borderRadius: '0.625rem', border: '1px solid var(--crm-border)', overflow: 'hidden' }}>
                <div style={{ padding: '0.625rem 0.875rem', background: 'var(--crm-bg)', borderBottom: '1px solid var(--crm-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Bookmark size={13} style={{ color: '#8b5cf6' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>User Bookmark Activity</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)' }}>({filteredUsers.length})</span>
                        <div style={{ marginLeft: 'auto' }}>
                            <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
                        </div>
                    </div>
                    {/* Filters row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Category pills */}
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {([
                                { key: 'all', label: 'All', color: '#6b7280' },
                                { key: 'properties', label: '🏠 Properties', color: '#3b82f6' },
                                { key: 'projects', label: '🏗️ Projects', color: '#22c55e' },
                                { key: 'commercial', label: '🏢 Commercial', color: '#f97316' },
                                { key: 'warehouse', label: '🏭 Warehouse', color: '#06b6d4' },
                            ] as { key: CategoryFilter; label: string; color: string }[]).map(({ key, label, color }) => (
                                <button key={key} onClick={() => { setCategoryFilter(key); setUserPage(1) }}
                                    style={{ padding: '3px 10px', borderRadius: 999, border: `1px solid ${categoryFilter === key ? color : 'var(--crm-border)'}`, background: categoryFilter === key ? `${color}18` : 'transparent', color: categoryFilter === key ? color : 'var(--crm-text-faint)', fontSize: '0.72rem', fontWeight: categoryFilter === key ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {/* City dropdown */}
                        {(bmData?.allCities?.length ?? 0) > 0 && (
                            <select
                                value={cityFilter}
                                onChange={e => { setCityFilter(e.target.value); setUserPage(1) }}
                                style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${cityFilter !== 'all' ? 'var(--crm-accent)' : 'var(--crm-border)'}`, background: cityFilter !== 'all' ? 'var(--crm-accent-bg)' : 'var(--crm-bg)', color: cityFilter !== 'all' ? 'var(--crm-accent)' : 'var(--crm-text-secondary)', fontSize: '0.75rem', fontWeight: cityFilter !== 'all' ? 600 : 400, cursor: 'pointer', outline: 'none' }}
                            >
                                <option value="all">All Cities</option>
                                {bmData!.allCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        {(categoryFilter !== 'all' || cityFilter !== 'all' || search) && (
                            <button onClick={() => { setCategoryFilter('all'); setCityFilter('all'); setSearch(''); setUserPage(1) }}
                                style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--crm-border)', background: 'none', color: 'var(--crm-text-faint)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                                <X size={10} /> Clear
                            </button>
                        )}
                    </div>
                </div>
                {filteredUsers.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.8rem' }}>No users found.</div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                        {['Rank', 'User', 'Cities', '🏠', '🏗️', '🏢', '🏭', 'Total', 'Last Saved'].map(h => (
                                            <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--crm-text-faint)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.slice((userPage - 1) * PAGE, userPage * PAGE).map(u => {
                                        const rank = filteredUsers.indexOf(u)
                                        const badge = rankBadge(rank)
                                        return (
                                            <tr key={u.user_id} style={{ borderBottom: '1px solid var(--crm-border-subtle)', transition: 'background 0.1s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <td style={{ padding: '0.75rem 1rem', width: 48 }}>
                                                    {badge ? <span style={{ fontSize: '1rem' }}>{badge}</span> : <span style={{ color: 'var(--crm-text-faint)', fontWeight: 600, fontSize: '0.75rem' }}>{rank + 1}</span>}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Avatar name={u.name} email={u.email || undefined} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--crm-text-primary)', fontSize: '0.8125rem' }}>{u.name || u.email?.split('@')[0] || 'Unknown'}</div>
                                                            {u.name && u.email && <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)' }}>{u.email}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', maxWidth: 140 }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                                        {u.cities.length === 0
                                                            ? <span style={{ fontSize: '0.68rem', color: 'var(--crm-text-faint)' }}>—</span>
                                                            : u.cities.slice(0, 3).map(c => (
                                                                <span key={c} style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 999, background: 'var(--crm-surface-alt)', color: 'var(--crm-text-secondary)', whiteSpace: 'nowrap' }}>{c}</span>
                                                            ))
                                                        }
                                                        {u.cities.length > 3 && <span style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)' }}>+{u.cities.length - 3}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: u.propertyCount > 0 ? '#3b82f6' : 'var(--crm-text-faint)', fontSize: '0.8125rem' }}>{u.propertyCount || '—'}</td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: u.projectCount > 0 ? '#22c55e' : 'var(--crm-text-faint)', fontSize: '0.8125rem' }}>{u.projectCount || '—'}</td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: u.commercialCount > 0 ? '#f97316' : 'var(--crm-text-faint)', fontSize: '0.8125rem' }}>{u.commercialCount || '—'}</td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: u.warehouseCount > 0 ? '#06b6d4' : 'var(--crm-text-faint)', fontSize: '0.8125rem' }}>{u.warehouseCount || '—'}</td>
                                                <td style={{ padding: '0.75rem 1rem' }}><Pill color="#f59e0b">{u.total}</Pill></td>
                                                <td style={{ padding: '0.75rem 1rem', color: 'var(--crm-text-faint)', fontSize: '0.75rem' }}>{fmtRelative(u.lastBookmarked)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Paginator page={userPage} total={filteredUsers.length} perPage={PAGE} onChange={setUserPage} />
                    </>
                )}
            </div>

            {/* Recent activity */}
            {bmData.recentActivity.length > 0 && (
                <div style={{ borderRadius: '0.625rem', border: '1px solid var(--crm-border)', overflow: 'hidden' }}>
                    <div style={{ padding: '0.625rem 0.875rem', background: 'var(--crm-bg)', borderBottom: '1px solid var(--crm-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <TrendingUp size={13} style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>Recent Saves</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {bmData.recentActivity.slice(0, 10).map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.875rem', borderBottom: i < Math.min(bmData.recentActivity.length, 10) - 1 ? '1px solid var(--crm-border-subtle)' : 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span style={{ fontSize: '0.9rem' }}>{a.type === 'property' ? '🏠' : '🏗️'}</span>
                                <div style={{ flex: 1, fontSize: '0.78rem', color: 'var(--crm-text-secondary)' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--crm-text-primary)' }}>{a.user_name}</span>
                                    {' saved a '}<span style={{ color: 'var(--crm-accent)' }}>{a.type}</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--crm-text-faint)', flexShrink: 0 }}>{fmtRelative(a.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-faint)', pointerEvents: 'none' }} />
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Search…'}
                style={{ paddingLeft: 26, paddingRight: 10, paddingTop: 5, paddingBottom: 5, borderRadius: 7, border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', color: 'var(--crm-text-primary)', fontSize: '0.78rem', outline: 'none', width: 210 }}
            />
        </div>
    )
}

function Paginator({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
    const totalPages = Math.ceil(total / perPage)
    if (totalPages <= 1) return null
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)

    // Build page number list: always show first, last, current±1, with ellipsis
    const pages: (number | '…')[] = []
    const add = (n: number) => { if (!pages.includes(n)) pages.push(n) }
    add(1)
    if (page > 3) pages.push('…')
    if (page > 2) add(page - 1)
    add(page)
    if (page < totalPages - 1) add(page + 1)
    if (page < totalPages - 2) pages.push('…')
    add(totalPages)

    const btnStyle = (active: boolean, disabled = false): React.CSSProperties => ({
        minWidth: 30, height: 28, padding: '0 6px', borderRadius: 6,
        border: `1px solid ${active ? 'var(--crm-accent)' : 'var(--crm-border)'}`,
        background: active ? 'var(--crm-accent)' : 'transparent',
        color: active ? '#fff' : disabled ? 'var(--crm-text-faint)' : 'var(--crm-text-secondary)',
        fontSize: '0.75rem', fontWeight: active ? 700 : 400,
        cursor: disabled ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3,
    })

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', borderTop: '1px solid var(--crm-border)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-faint)' }}>{start}–{end} of {total}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button style={btnStyle(false, page === 1)} disabled={page === 1} onClick={() => onChange(page - 1)}>
                    <ChevronDown size={12} style={{ transform: 'rotate(90deg)' }} /> Prev
                </button>
                {pages.map((p, i) =>
                    p === '…'
                        ? <span key={`e${i}`} style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', padding: '0 2px' }}>…</span>
                        : <button key={p} style={btnStyle(p === page)} onClick={() => onChange(p as number)}>{p}</button>
                )}
                <button style={btnStyle(false, page === totalPages)} disabled={page === totalPages} onClick={() => onChange(page + 1)}>
                    Next <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                </button>
            </div>
        </div>
    )
}
