'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Users, Eye, Clock, MousePointerClick, TrendingUp, Globe } from 'lucide-react'
import styles from '../crm.module.css'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface UserRow { user_id: string; user_email: string; views: number; sessions: number; totalSecs: number; lastSeen: string }
interface PageRow { path: string; title: string; views: number; uniqueUsers: number; avgSecs: number }
interface DayRow { date: string; views: number; users: number; sessions: number }

interface Analytics {
    totalViews: number
    uniqueUsers: number
    uniqueSessions: number
    avgSessionDuration: number
    topUsers: UserRow[]
    topPages: PageRow[]
    dailyTrend: DayRow[]
}

const fmtSecs = (s: number) => {
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60); const sec = s % 60
    if (m < 60) return `${m}m ${sec}s`
    return `${Math.floor(m / 60)}h ${m % 60}m`
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const fmtRelative = (d: string) => {
    const ms = Date.now() - new Date(d).getTime()
    const dd = Math.floor(ms / 86400000)
    if (dd === 0) return 'Today'
    if (dd === 1) return 'Yesterday'
    return `${dd}d ago`
}

export default function UserAnalyticsPage() {
    const [data, setData] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)
    const [activeTab, setActiveTab] = useState<'users' | 'pages'>('users')

    useEffect(() => {
        setLoading(true)
        fetch(`/api/crm/user-analytics?days=${days}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [days])

    const statCards = [
        { label: 'Total Page Views', value: data?.totalViews ?? 0, icon: Eye, color: '#3b82f6' },
        { label: 'Unique Users', value: data?.uniqueUsers ?? 0, icon: Users, color: '#8b5cf6' },
        { label: 'Unique Sessions', value: data?.uniqueSessions ?? 0, icon: MousePointerClick, color: '#f59e0b' },
        { label: 'Avg Session Duration', value: data ? fmtSecs(data.avgSessionDuration) : '—', icon: Clock, color: '#22c55e', isText: true },
    ]

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.25rem' }}>User Analytics</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Track visitor behaviour — pages visited, time spent, and sessions.</p>
                </div>
                {/* Day range selector */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[7, 14, 30, 60].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            style={{
                                padding: '0.375rem 0.875rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--crm-border)',
                                background: days === d ? 'var(--crm-btn-primary-bg)' : 'var(--crm-surface)',
                                color: days === d ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-secondary)',
                                fontSize: '0.8125rem',
                                fontWeight: days === d ? 600 : 400,
                                cursor: 'pointer',
                            }}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat cards */}
            <div className={styles.statsRow} style={{ marginBottom: '1.5rem' }}>
                {statCards.map(({ label, value, icon: Icon, color, isText }) => (
                    <div key={label} className={styles.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div className={styles.statLabel}>{label}</div>
                            <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={16} style={{ color }} />
                            </div>
                        </div>
                        {loading ? (
                            <div className={styles.skeleton} style={{ width: '50%', height: '24px' }} />
                        ) : (
                            <div className={styles.statValue} style={isText ? { fontSize: '1.25rem' } : {}}>
                                {isText ? value : Number(value).toLocaleString('en-IN')}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Daily trend chart */}
            <div style={{ background: 'var(--crm-surface)', borderRadius: '0.875rem', border: '1px solid var(--crm-border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <TrendingUp size={16} style={{ color: 'var(--crm-accent)' }} />
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>Activity Trend</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginLeft: 'auto' }}>Last {days} days</span>
                </div>
                {loading ? (
                    <div className={styles.skeleton} style={{ height: 180, borderRadius: 8 }} />
                ) : data && data.dailyTrend.length > 0 ? (
                    <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.dailyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: 8, fontSize: 12 }}
                                    labelFormatter={(v) => fmtDate(v as string)}
                                />
                                <Bar dataKey="views" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Page Views" />
                                <Bar dataKey="users" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Unique Users" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>
                        No data yet. Tracking starts once the migration is run and users visit the site.
                    </div>
                )}
            </div>

            {/* Tabs: Top Users / Top Pages */}
            <div style={{ background: 'var(--crm-surface)', borderRadius: '0.875rem', border: '1px solid var(--crm-border)', overflow: 'hidden' }}>
                {/* Tab header */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--crm-border)' }}>
                    {(['users', 'pages'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '0.875rem 1rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: activeTab === tab ? 600 : 400,
                                color: activeTab === tab ? 'var(--crm-accent)' : 'var(--crm-text-secondary)',
                                borderBottom: activeTab === tab ? '2px solid var(--crm-accent)' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.15s',
                            }}
                        >
                            {tab === 'users' ? <Users size={14} /> : <Globe size={14} />}
                            {tab === 'users' ? 'Top Users' : 'Top Pages'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={styles.skeleton} style={{ height: 40, borderRadius: 8 }} />
                        ))}
                    </div>
                ) : activeTab === 'users' ? (
                    /* Top Users table */
                    <div style={{ overflowX: 'auto' }}>
                        {data && data.topUsers.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                        {['#', 'User', 'Page Views', 'Sessions', 'Time on Site', 'Last Seen'].map(h => (
                                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--crm-text-faint)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topUsers.map((u, i) => (
                                        <tr key={u.user_id} style={{ borderBottom: '1px solid var(--crm-border-subtle)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '0.875rem 1rem', color: 'var(--crm-text-faint)', width: 40 }}>{i + 1}</td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                    <div style={{
                                                        width: 30, height: 30, borderRadius: '50%',
                                                        background: 'var(--crm-btn-primary-bg)',
                                                        color: 'var(--crm-btn-primary-text)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                                                    }}>
                                                        {(u.user_email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ color: 'var(--crm-text-primary)', fontWeight: 500 }}>{u.user_email || '—'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: 'var(--crm-text-secondary)' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <Eye size={12} /> {u.views}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: 'var(--crm-text-secondary)' }}>{u.sessions}</td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                                                    background: '#22c55e18', color: '#22c55e', fontWeight: 600, fontSize: '0.75rem',
                                                }}>
                                                    {fmtSecs(u.totalSecs)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: 'var(--crm-text-faint)' }}>{fmtRelative(u.lastSeen)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>
                                No authenticated user sessions recorded yet.
                            </div>
                        )}
                    </div>
                ) : (
                    /* Top Pages table */
                    <div style={{ overflowX: 'auto' }}>
                        {data && data.topPages.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                        {['#', 'Page', 'Views', 'Unique Users', 'Avg Time'].map(h => (
                                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--crm-text-faint)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topPages.map((p, i) => (
                                        <tr key={p.path} style={{ borderBottom: '1px solid var(--crm-border-subtle)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--crm-accent-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '0.875rem 1rem', color: 'var(--crm-text-faint)', width: 40 }}>{i + 1}</td>
                                            <td style={{ padding: '0.875rem 1rem', maxWidth: 320 }}>
                                                <div style={{ fontWeight: 500, color: 'var(--crm-text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {p.title && p.title !== p.path ? p.title : p.path}
                                                </div>
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {p.path}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: 'var(--crm-text-secondary)' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <Eye size={12} /> {p.views}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: 'var(--crm-text-secondary)' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <Users size={12} /> {p.uniqueUsers}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                                                    background: '#3b82f618', color: '#3b82f6', fontWeight: 600, fontSize: '0.75rem',
                                                }}>
                                                    {fmtSecs(p.avgSecs)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>
                                No page view data recorded yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
