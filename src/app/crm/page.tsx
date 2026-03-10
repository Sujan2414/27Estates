'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
    Users, UserPlus, Flame, AlertTriangle, TrendingUp,
    ArrowUpRight, ArrowDownRight, Phone, Mail, Clock, Target,
    Zap, Plug
} from 'lucide-react'
import { Cell } from 'recharts'
import styles from './crm.module.css'

// Lazy load recharts to avoid SSR issues
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })

interface CRMStats {
    total: number
    new: number
    today: number
    thisWeek: number
    hot: number
    overdueTasks: number
    conversionRate: string
    byStatus: Record<string, number>
    bySource: Record<string, number>
}

interface APIUsage {
    total: { tokens: number; cost: string; requests: number }
    today: { tokens: number; cost: string; requests: number }
    daily: Array<{ date: string; label: string; tokens: number; cost: number; requests: number }>
}

interface RecentLead {
    id: string; name: string; email: string | null; phone: string | null
    source: string; status: string; priority: string; created_at: string
}

const sourceConfig: Record<string, { label: string; color: string; bg: string }> = {
    website: { label: 'Website', color: '#3b82f6', bg: '#3b82f620' },
    meta_ads: { label: 'Meta Ads', color: '#ec4899', bg: '#ec489920' },
    google_ads: { label: 'Google Ads', color: '#f59e0b', bg: '#f59e0b20' },
    '99acres': { label: '99acres', color: '#ef4444', bg: '#ef444420' },
    magicbricks: { label: 'MagicBricks', color: '#f97316', bg: '#f9731620' },
    'housing': { label: 'Housing.com', color: '#06b6d4', bg: '#06b6d420' },
    justdial: { label: 'JustDial', color: '#8b5cf6', bg: '#8b5cf620' },
    chatbot: { label: 'Chatbot', color: '#22c55e', bg: '#22c55e20' },
    whatsapp: { label: 'WhatsApp', color: '#25D366', bg: '#25D36620' },
    manual: { label: 'Manual', color: '#6b7280', bg: '#6b728020' },
    referral: { label: 'Referral', color: '#BFA270', bg: '#BFA27020' },
}

const statusConfig: Record<string, { color: string; label: string }> = {
    new: { color: '#3b82f6', label: 'New' },
    contacted: { color: '#f59e0b', label: 'Contacted' },
    qualified: { color: '#8b5cf6', label: 'Qualified' },
    negotiation: { color: '#f97316', label: 'Negotiation' },
    site_visit: { color: '#06b6d4', label: 'Site Visit' },
    converted: { color: '#22c55e', label: 'Converted' },
    lost: { color: '#ef4444', label: 'Lost' },
}

const USD_TO_INR = 83

const formatINR = (usdCost: string | number) => {
    const inr = parseFloat(String(usdCost)) * USD_TO_INR
    if (inr < 1) return `₹${inr.toFixed(2)}`
    return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

const formatIndianNumber = (n: number) => n.toLocaleString('en-IN')

export default function CRMDashboard() {
    const [stats, setStats] = useState<CRMStats | null>(null)
    const [apiUsage, setApiUsage] = useState<APIUsage | null>(null)
    const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAll() {
            const [statsRes, leadsRes, usageRes] = await Promise.all([
                fetch('/api/crm/stats').catch(() => null),
                fetch('/api/crm/leads?limit=8').catch(() => null),
                fetch('/api/crm/api-usage').catch(() => null),
            ])
            if (statsRes?.ok) setStats(await statsRes.json())
            if (leadsRes?.ok) { const d = await leadsRes.json(); setRecentLeads(d.leads || []) }
            if (usageRes?.ok) setApiUsage(await usageRes.json())
            setLoading(false)
        }
        fetchAll()
    }, [])

    const formatRelative = (d: string) => {
        const ms = Date.now() - new Date(d).getTime()
        const m = Math.floor(ms / 60000); const h = Math.floor(ms / 3600000); const dd = Math.floor(ms / 86400000)
        if (m < 1) return 'Just now'; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`; if (dd < 7) return `${dd}d`
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    // Prepare funnel data
    const funnelSteps = ['new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted']
    const maxFunnel = Math.max(...funnelSteps.map(s => stats?.byStatus[s] || 0), 1)

    // Prepare source pie data with consistent colors
    const sourceData = stats ? Object.entries(stats.bySource).map(([key, value]) => ({
        name: sourceConfig[key]?.label || key, value, color: sourceConfig[key]?.color || '#6b7280',
    })) : []

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Dashboard</h1>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                        Welcome back. Here&apos;s your CRM overview.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href="/crm/leads?new=true" className={styles.btnPrimary}>
                        <UserPlus size={14} /> Add Lead
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Leads</div>
                    <div className={styles.statValue}>{loading ? '—' : formatIndianNumber(stats?.total || 0)}</div>
                    <div className={`${styles.statChange} ${styles.statUp}`}>
                        +{stats?.thisWeek || 0} this week
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>New Today</div>
                    <div className={styles.statValue}>{loading ? '—' : stats?.today || 0}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Hot Leads</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className={styles.statValue} style={{ color: '#ef4444' }}>{loading ? '—' : stats?.hot || 0}</div>
                        <Flame size={18} style={{ color: '#ef4444' }} />
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Conversion Rate</div>
                    <div className={styles.statValue} style={{ color: '#22c55e' }}>{loading ? '—' : `${stats?.conversionRate || 0}%`}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Overdue Tasks</div>
                    <div className={styles.statValue} style={{ color: stats?.overdueTasks ? '#ef4444' : '#6b7280' }}>
                        {loading ? '—' : stats?.overdueTasks || 0}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>API Cost (30d)</div>
                    <div className={styles.statValue} style={{ fontSize: '1.25rem' }}>
                        {loading ? '—' : formatINR(apiUsage?.total?.cost || '0')}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {formatIndianNumber(apiUsage?.total?.tokens || 0)} tokens
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className={styles.chartsGrid}>
                {/* Lead Funnel */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.cardTitle}>Lead Funnel</div>
                            <div className={styles.cardSubtitle}>Conversion pipeline</div>
                        </div>
                        <Link href="/crm/pipeline" className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                            View Pipeline
                        </Link>
                    </div>
                    <div className={styles.funnel}>
                        {funnelSteps.map(step => {
                            const count = stats?.byStatus[step] || 0
                            const pct = maxFunnel > 0 ? (count / maxFunnel) * 100 : 0
                            return (
                                <div key={step} className={styles.funnelStep}>
                                    <span className={styles.funnelLabel}>{statusConfig[step]?.label}</span>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            className={styles.funnelBar}
                                            style={{
                                                width: `${Math.max(pct, 8)}%`,
                                                backgroundColor: statusConfig[step]?.color,
                                            }}
                                        >
                                            {count}
                                        </div>
                                    </div>
                                    <span className={styles.funnelCount}>
                                        {maxFunnel > 0 ? `${((count / (stats?.total || 1)) * 100).toFixed(0)}%` : '0%'}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Lead Sources - Pie Chart with distinct colors */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.cardTitle}>Lead Sources</div>
                            <div className={styles.cardSubtitle}>Where leads come from</div>
                        </div>
                    </div>
                    {sourceData.length > 0 ? (
                        <div>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={sourceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {sourceData.map((s, i) => (
                                                <Cell key={i} fill={s.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e2030', border: '1px solid #2d3148', borderRadius: '8px', fontSize: '0.75rem' }}
                                            itemStyle={{ color: '#e5e7eb' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                {sourceData.map(s => (
                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#9ca3af' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: s.color }} />
                                        {s.name} ({s.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState} style={{ padding: '2rem' }}>No data yet</div>
                    )}
                </div>
            </div>

            {/* API Usage Chart */}
            {apiUsage && apiUsage.daily.length > 0 && (
                <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.cardTitle}>API Usage (30 Days)</div>
                            <div className={styles.cardSubtitle}>
                                Today: {apiUsage.today.requests} requests &middot; {formatIndianNumber(apiUsage.today.tokens)} tokens &middot; {formatINR(apiUsage.today.cost)}
                            </div>
                        </div>
                        <Link href="/crm/usage" className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                            <Zap size={12} /> Details
                        </Link>
                    </div>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <AreaChart data={apiUsage.daily}>
                                <defs>
                                    <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#BFA270" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#BFA270" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={40} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e2030', border: '1px solid #2d3148', borderRadius: '8px', fontSize: '0.75rem' }}
                                    itemStyle={{ color: '#e5e7eb' }}
                                    labelStyle={{ color: '#9ca3af' }}
                                />
                                <Area type="monotone" dataKey="tokens" stroke="#BFA270" fill="url(#tokenGrad)" strokeWidth={2} name="Tokens" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Bottom Grid: Recent Leads + Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Recent Leads */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>Recent Leads</div>
                        <Link href="/crm/leads" className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                            View All
                        </Link>
                    </div>
                    {recentLeads.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>When</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.map(lead => {
                                    const src = sourceConfig[lead.source]
                                    return (
                                        <tr key={lead.id} style={{ cursor: 'pointer' }}
                                            onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
                                            <td>
                                                <div style={{ fontWeight: 500, color: '#e5e7eb' }}>{lead.name}</div>
                                                <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
                                                    {lead.phone || lead.email || '—'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.badge} style={{
                                                    backgroundColor: src?.bg || '#1e2030',
                                                    color: src?.color || '#9ca3af',
                                                }}>
                                                    {src?.label || lead.source}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={styles.badge} style={{
                                                    backgroundColor: `${statusConfig[lead.status]?.color}20`,
                                                    color: statusConfig[lead.status]?.color,
                                                }}>
                                                    {statusConfig[lead.status]?.label || lead.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem' }}>
                                                {lead.priority === 'hot' ? '🔥' : lead.priority === 'warm' ? '🟡' : '🔵'}
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                {formatRelative(lead.created_at)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.emptyState}>
                            No leads yet. Connect your ad platforms or add leads manually.
                        </div>
                    )}
                </div>

                {/* Quick Actions + Status Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className={styles.card}>
                        <div className={styles.cardTitle} style={{ marginBottom: '0.75rem' }}>Quick Actions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Link href="/crm/leads?new=true" className={styles.btnSecondary} style={{ justifyContent: 'flex-start' }}>
                                <UserPlus size={14} /> Add Lead Manually
                            </Link>
                            <Link href="/crm/connectors" className={styles.btnSecondary} style={{ justifyContent: 'flex-start' }}>
                                <Plug size={14} /> Connect Ad Platform
                            </Link>
                            <Link href="/crm/emails" className={styles.btnSecondary} style={{ justifyContent: 'flex-start' }}>
                                <Mail size={14} /> Email Templates
                            </Link>
                            <Link href="/crm/pipeline" className={styles.btnSecondary} style={{ justifyContent: 'flex-start' }}>
                                <Target size={14} /> Pipeline View
                            </Link>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle} style={{ marginBottom: '0.75rem' }}>By Status</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Object.entries(statusConfig).map(([status, config]) => {
                                const count = stats?.byStatus[status] || 0
                                const pct = stats?.total ? ((count / stats.total) * 100).toFixed(0) : '0'
                                return (
                                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8125rem', color: '#9ca3af', flex: 1 }}>{config.label}</span>
                                        <span style={{ fontSize: '0.6875rem', color: '#6b7280', marginRight: '0.25rem' }}>{pct}%</span>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e5e7eb', minWidth: '24px', textAlign: 'right' }}>{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
