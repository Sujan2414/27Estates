'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
    UserPlus, Flame, Mail, Target,
    Zap, Plug, AlertTriangle, UserX, Clock, CalendarCheck, ChevronRight,
    PhoneCall, TrendingUp, RefreshCw, Eye,
} from 'lucide-react'
import styles from './crm.module.css'
import { useTheme, useCRMUser, isAdmin, isManager, isAgent } from './crm-context'
import { leadSourceConfig, leadStatusConfig, FALLBACK_CHART_COLORS } from '@/lib/crm-constants'

// Lazy load recharts to avoid SSR issues
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })

interface AttentionLead {
    id: string; name: string; priority?: string; source?: string; status?: string
    created_at?: string; updated_at?: string; next_follow_up_at?: string
}

interface AttentionVisit {
    id: string; lead_id: string; visit_date: string; visit_time?: string
    leads?: { name: string } | null
}

interface AttentionData {
    unassigned: AttentionLead[]
    unassignedCount: number
    stale: AttentionLead[]
    overdueFollowups: AttentionLead[]
    upcomingVisits: AttentionVisit[]
}

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
    attention?: AttentionData
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

interface SmartAlerts {
    readyToCall: Array<{ lead_id: string; lead_name: string; priority: string; score: number; listing_count: number; last_seen: string }>
    returnVisitorsWithoutLead: Array<{ user_id: string; full_name: string; email: string; return_visits: number; top_listing_path: string }>
    reEngageLeads: Array<{ id: string; name: string; priority: string; status: string; score: number; silent_days: number | null }>
    activitySpikes: Array<{ path: string; title: string; today: number; dailyAvg: number; multiplier: number; href: string }>
    freshUncontacted: Array<{ id: string; name: string; source: string; priority: string; created_at: string }>
}

const USD_TO_INR = 83

const formatINR = (usdCost: string | number) => {
    const inr = parseFloat(String(usdCost)) * USD_TO_INR
    if (inr < 1) return `₹${inr.toFixed(2)}`
    return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

const formatIndianNumber = (n: number) => n.toLocaleString('en-IN')

function SkeletonRow() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className={styles.skeleton} style={{ width: '40%', height: '14px' }} />
                    <div className={styles.skeleton} style={{ width: '20%', height: '14px' }} />
                    <div className={styles.skeleton} style={{ width: '15%', height: '14px' }} />
                </div>
            ))}
        </div>
    )
}

export default function CRMDashboard() {
    const [stats, setStats] = useState<CRMStats | null>(null)
    const [apiUsage, setApiUsage] = useState<APIUsage | null>(null)
    const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
    const [smartAlerts, setSmartAlerts] = useState<SmartAlerts | null>(null)
    const [loading, setLoading] = useState(true)
    const { theme } = useTheme()
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)
    const isManagerUser = isManager(crmUser) && !isAdminUser
    const isAgentUser = isAgent(crmUser)

    const tooltipStyle = {
        contentStyle: { backgroundColor: 'var(--crm-tooltip-bg)', border: '1px solid var(--crm-tooltip-border)', borderRadius: '8px', fontSize: '0.75rem' },
        itemStyle: { color: 'var(--crm-text-secondary)' },
        labelStyle: { color: 'var(--crm-text-muted)' },
    }

    useEffect(() => {
        if (!crmUser) return
        async function fetchAll() {
            // Build leads URL based on role:
            // Agent: only their assigned leads
            // Manager: their team's leads
            // Admin/Super Admin: all leads
            const leadsParams = new URLSearchParams({ limit: '8' })
            if (isAgentUser && crmUser?.id) leadsParams.set('assigned_to', crmUser.id)
            else if (isManagerUser && crmUser?.id) leadsParams.set('manager_id', crmUser.id)

            const alertsParams = new URLSearchParams()
            if (isAgentUser && crmUser?.id) alertsParams.set('assigned_to', crmUser.id)
            else if (isManagerUser && crmUser?.id) alertsParams.set('manager_id', crmUser.id)

            const [statsRes, leadsRes, usageRes, alertsRes] = await Promise.all([
                fetch('/api/crm/stats').catch(() => null),
                fetch(`/api/crm/leads?${leadsParams}`).catch(() => null),
                fetch('/api/crm/api-usage').catch(() => null),
                fetch(`/api/crm/smart-alerts?${alertsParams}`).catch(() => null),
            ])
            if (statsRes?.ok) setStats(await statsRes.json())
            if (leadsRes?.ok) { const d = await leadsRes.json(); setRecentLeads(d.leads || []) }
            if (usageRes?.ok) setApiUsage(await usageRes.json())
            if (alertsRes?.ok) setSmartAlerts(await alertsRes.json())
            setLoading(false)
        }
        fetchAll()
    }, [crmUser, isAgentUser, isManagerUser])

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
    const sourceData = stats ? Object.entries(stats.bySource).map(([key, value], i) => ({
        name: leadSourceConfig[key]?.label || key, value,
        fill: leadSourceConfig[key]?.color || FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length],
        color: leadSourceConfig[key]?.color || FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length],
    })) : []

    // Gradient colors for area chart
    const accentColor = '#BFA270'
    const gradientOpacityTop = theme === 'dark' ? 0.3 : 0.2
    const axisTickFill = theme === 'dark' ? '#6b7280' : '#9ca3af'

    // Attention data
    const attention = stats?.attention
    const hasAttention = attention && (
        attention.unassigned.length > 0 ||
        attention.stale.length > 0 ||
        attention.overdueFollowups.length > 0
    )

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.25rem' }}>Dashboard</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Welcome back. Here&apos;s your CRM overview.</p>
                </div>
                <Link href="/crm/leads?new=true" className={styles.btnPrimary}>
                    <UserPlus size={14} /> Add Lead
                </Link>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                {loading ? (
                    <>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={styles.statCard}>
                                <div className={styles.skeleton} style={{ width: '60%', height: '10px', marginBottom: '0.75rem' }} />
                                <div className={styles.skeleton} style={{ width: '40%', height: '24px' }} />
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Total Leads</div>
                            <div className={styles.statValue}>{formatIndianNumber(stats?.total || 0)}</div>
                            <div className={`${styles.statChange} ${styles.statUp}`}>
                                +{stats?.thisWeek || 0} this week
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>New Today</div>
                            <div className={styles.statValue}>{stats?.today || 0}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Hot Leads</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className={styles.statValue} style={{ color: '#ef4444' }}>{stats?.hot || 0}</div>
                                <Flame size={18} style={{ color: '#ef4444' }} />
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Conversion Rate</div>
                            <div className={styles.statValue} style={{ color: '#22c55e' }}>{stats?.conversionRate || 0}%</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Overdue Tasks</div>
                            <div className={styles.statValue} style={{ color: stats?.overdueTasks ? '#ef4444' : 'var(--crm-text-faint)' }}>
                                {stats?.overdueTasks || 0}
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>API Cost (30d)</div>
                            <div className={styles.statValue} style={{ fontSize: '1.25rem' }}>
                                {formatINR(apiUsage?.total?.cost || '0')}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: '0.25rem' }}>
                                {formatIndianNumber(apiUsage?.total?.tokens || 0)} tokens
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Needs Attention Section */}
            {!loading && hasAttention && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.sectionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                            <span className={styles.sectionTitle}>Needs Attention</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {/* Unassigned Leads */}
                        {attention.unassigned.length > 0 && (
                            <div className={styles.attentionCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <UserX size={14} style={{ color: '#ef4444' }} />
                                    <span className={styles.cardTitle}>
                                        Unassigned ({attention.unassignedCount})
                                    </span>
                                </div>
                                {attention.unassigned.map(lead => (
                                    <Link key={lead.id} href={`/crm/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                                        <div className={styles.attentionItem}>
                                            <div className={styles.attentionDot} style={{ backgroundColor: lead.priority === 'hot' ? '#ef4444' : lead.priority === 'warm' ? '#f59e0b' : '#6b7280' }} />
                                            <div className={styles.attentionText}>
                                                <div className={styles.attentionTitle}>{lead.name}</div>
                                                <div className={styles.attentionMeta}>
                                                    {leadSourceConfig[lead.source || '']?.label || lead.source} &middot; {formatRelative(lead.created_at || '')}
                                                </div>
                                            </div>
                                            <ChevronRight size={14} style={{ color: 'var(--crm-text-dim)' }} />
                                        </div>
                                    </Link>
                                ))}
                                {attention.unassignedCount > 5 && (
                                    <Link href="/crm/leads?status=new" style={{ fontSize: '0.75rem', color: 'var(--crm-accent)', textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: '0.5rem' }}>
                                        View all {attention.unassignedCount} unassigned
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Overdue Follow-ups */}
                        {attention.overdueFollowups.length > 0 && (
                            <div className={styles.attentionCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <Clock size={14} style={{ color: '#f59e0b' }} />
                                    <span className={styles.cardTitle}>
                                        Overdue Follow-ups ({attention.overdueFollowups.length})
                                    </span>
                                </div>
                                {attention.overdueFollowups.map(lead => (
                                    <Link key={lead.id} href={`/crm/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                                        <div className={styles.attentionItem}>
                                            <div className={styles.attentionDot} style={{ backgroundColor: '#f59e0b' }} />
                                            <div className={styles.attentionText}>
                                                <div className={styles.attentionTitle}>{lead.name}</div>
                                                <div className={styles.attentionMeta}>
                                                    Follow-up was {formatRelative(lead.next_follow_up_at || '')} ago
                                                </div>
                                            </div>
                                            <ChevronRight size={14} style={{ color: 'var(--crm-text-dim)' }} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Stale Leads */}
                        {attention.stale.length > 0 && (
                            <div className={styles.attentionCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <AlertTriangle size={14} style={{ color: '#6b7280' }} />
                                    <span className={styles.cardTitle}>
                                        Stale Leads (No activity 3+ days)
                                    </span>
                                </div>
                                {attention.stale.map(lead => (
                                    <Link key={lead.id} href={`/crm/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                                        <div className={styles.attentionItem}>
                                            <div className={styles.attentionDot} style={{ backgroundColor: lead.priority === 'hot' ? '#ef4444' : '#6b7280' }} />
                                            <div className={styles.attentionText}>
                                                <div className={styles.attentionTitle}>{lead.name}</div>
                                                <div className={styles.attentionMeta}>
                                                    {leadStatusConfig[lead.status || '']?.label} &middot; Last activity {formatRelative(lead.updated_at || '')}
                                                </div>
                                            </div>
                                            <ChevronRight size={14} style={{ color: 'var(--crm-text-dim)' }} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Upcoming Visits */}
                        {attention.upcomingVisits && attention.upcomingVisits.length > 0 && (
                            <div className={styles.attentionCard} style={{ borderLeftColor: '#22c55e' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <CalendarCheck size={14} style={{ color: '#22c55e' }} />
                                    <span className={styles.cardTitle}>
                                        Upcoming Visits ({attention.upcomingVisits.length})
                                    </span>
                                </div>
                                {attention.upcomingVisits.map(visit => (
                                    <Link key={visit.id} href={`/crm/leads/${visit.lead_id}`} style={{ textDecoration: 'none' }}>
                                        <div className={styles.attentionItem}>
                                            <div className={styles.attentionDot} style={{ backgroundColor: '#22c55e' }} />
                                            <div className={styles.attentionText}>
                                                <div className={styles.attentionTitle}>{visit.leads?.name || 'Unknown'}</div>
                                                <div className={styles.attentionMeta}>
                                                    {new Date(visit.visit_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    {visit.visit_time && ` at ${visit.visit_time}`}
                                                </div>
                                            </div>
                                            <ChevronRight size={14} style={{ color: 'var(--crm-text-dim)' }} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Smart Alerts */}
            {!loading && smartAlerts && (
                smartAlerts.readyToCall.length > 0 ||
                smartAlerts.returnVisitorsWithoutLead.length > 0 ||
                smartAlerts.reEngageLeads.length > 0 ||
                smartAlerts.activitySpikes.length > 0 ||
                smartAlerts.freshUncontacted.length > 0
            ) && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.sectionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={15} style={{ color: '#6366f1' }} />
                            <span className={styles.sectionTitle}>Smart Alerts</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-dim)', fontWeight: 400 }}>live signals from website activity</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>

                        {/* Ready to Call */}
                        {smartAlerts.readyToCall.length > 0 && (
                            <div className={styles.smartAlertCard}>
                                <div className={styles.smartAlertHeader} style={{ background: 'rgba(34,197,94,0.06)' }}>
                                    <PhoneCall size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                                    <span className={styles.smartAlertTitle}>Ready to Call</span>
                                    <span className={styles.smartAlertCount} style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>{smartAlerts.readyToCall.length}</span>
                                </div>
                                <div className={styles.smartAlertBody}>
                                    {smartAlerts.readyToCall.map(l => (
                                        <Link key={l.lead_id} href={`/crm/leads/${l.lead_id}`} className={styles.smartAlertRow}>
                                            <div className={styles.smartAlertDot} style={{ backgroundColor: l.priority === 'hot' ? '#ef4444' : '#f59e0b' }} />
                                            <div className={styles.smartAlertRowText}>
                                                <div className={styles.smartAlertRowName}>{l.lead_name}</div>
                                                <div className={styles.smartAlertRowMeta}>Score {l.score} · {l.listing_count} listing{l.listing_count !== 1 ? 's' : ''} today</div>
                                            </div>
                                            <ChevronRight size={13} style={{ color: 'var(--crm-text-dim)', flexShrink: 0 }} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fresh uncontacted */}
                        {smartAlerts.freshUncontacted.length > 0 && (
                            <div className={styles.smartAlertCard}>
                                <div className={styles.smartAlertHeader} style={{ background: 'rgba(59,130,246,0.06)' }}>
                                    <UserPlus size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                    <span className={styles.smartAlertTitle}>Fresh — Not Contacted</span>
                                    <span className={styles.smartAlertCount} style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb' }}>{smartAlerts.freshUncontacted.length}</span>
                                </div>
                                <div className={styles.smartAlertBody}>
                                    {smartAlerts.freshUncontacted.map(l => (
                                        <Link key={l.id} href={`/crm/leads/${l.id}`} className={styles.smartAlertRow}>
                                            <div className={styles.smartAlertDot} style={{ backgroundColor: '#3b82f6' }} />
                                            <div className={styles.smartAlertRowText}>
                                                <div className={styles.smartAlertRowName}>{l.name}</div>
                                                <div className={styles.smartAlertRowMeta}>{isAdminUser && l.source ? `${l.source} · ` : ''}{formatRelative(l.created_at)}</div>
                                            </div>
                                            <ChevronRight size={13} style={{ color: 'var(--crm-text-dim)', flexShrink: 0 }} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Re-engage */}
                        {smartAlerts.reEngageLeads.length > 0 && (
                            <div className={styles.smartAlertCard}>
                                <div className={styles.smartAlertHeader} style={{ background: 'rgba(245,158,11,0.06)' }}>
                                    <RefreshCw size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                    <span className={styles.smartAlertTitle}>Re-Engage — Gone Silent</span>
                                    <span className={styles.smartAlertCount} style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>{smartAlerts.reEngageLeads.length}</span>
                                </div>
                                <div className={styles.smartAlertBody}>
                                    {smartAlerts.reEngageLeads.map(l => (
                                        <Link key={l.id} href={`/crm/leads/${l.id}`} className={styles.smartAlertRow}>
                                            <div className={styles.smartAlertDot} style={{ backgroundColor: l.priority === 'hot' ? '#ef4444' : '#f59e0b' }} />
                                            <div className={styles.smartAlertRowText}>
                                                <div className={styles.smartAlertRowName}>{l.name}</div>
                                                <div className={styles.smartAlertRowMeta}>{l.priority} · {l.silent_days != null ? `${l.silent_days}d silent` : 'Never contacted'}</div>
                                            </div>
                                            <ChevronRight size={13} style={{ color: 'var(--crm-text-dim)', flexShrink: 0 }} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Listing Spikes — admins/managers only */}
                        {!isAgentUser && smartAlerts.activitySpikes.length > 0 && (
                            <div className={styles.smartAlertCard}>
                                <div className={styles.smartAlertHeader} style={{ background: 'rgba(139,92,246,0.06)' }}>
                                    <TrendingUp size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                                    <span className={styles.smartAlertTitle}>Listing Spikes Today</span>
                                    <span className={styles.smartAlertCount} style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed' }}>{smartAlerts.activitySpikes.length}</span>
                                </div>
                                <div className={styles.smartAlertBody}>
                                    {smartAlerts.activitySpikes.map((s, i) => (
                                        <Link key={i} href={s.href} target="_blank" className={styles.smartAlertRow}>
                                            <div className={styles.smartAlertDot} style={{ backgroundColor: '#8b5cf6' }} />
                                            <div className={styles.smartAlertRowText}>
                                                <div className={styles.smartAlertRowName}>{s.title}</div>
                                                <div className={styles.smartAlertRowMeta}>{s.today} views today · {s.multiplier}× avg</div>
                                            </div>
                                            <Eye size={12} style={{ color: 'var(--crm-text-dim)', flexShrink: 0 }} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Return Visitors — admins/managers only */}
                        {!isAgentUser && smartAlerts.returnVisitorsWithoutLead.length > 0 && (
                            <div className={styles.smartAlertCard}>
                                <div className={styles.smartAlertHeader} style={{ background: 'rgba(16,185,129,0.06)' }}>
                                    <Eye size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                    <span className={styles.smartAlertTitle}>Return Visitors — No Lead</span>
                                    <span className={styles.smartAlertCount} style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>{smartAlerts.returnVisitorsWithoutLead.length}</span>
                                </div>
                                <div className={styles.smartAlertBody}>
                                    {smartAlerts.returnVisitorsWithoutLead.map(u => (
                                        <Link key={u.user_id} href="/crm/warm-audience" className={styles.smartAlertRow}>
                                            <div className={styles.smartAlertDot} style={{ backgroundColor: '#10b981' }} />
                                            <div className={styles.smartAlertRowText}>
                                                <div className={styles.smartAlertRowName}>{u.full_name || u.email}</div>
                                                <div className={styles.smartAlertRowMeta}>Visited {u.return_visits}× — no enquiry yet</div>
                                            </div>
                                            <ChevronRight size={13} style={{ color: 'var(--crm-text-dim)', flexShrink: 0 }} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                    {loading ? <SkeletonRow /> : (
                        <div className={styles.funnel}>
                            {funnelSteps.map(step => {
                                const count = stats?.byStatus[step] || 0
                                const pct = maxFunnel > 0 ? (count / maxFunnel) * 100 : 0
                                return (
                                    <div key={step} className={styles.funnelStep}>
                                        <span className={styles.funnelLabel}>{leadStatusConfig[step]?.label}</span>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                className={styles.funnelBar}
                                                style={{
                                                    width: `${Math.max(pct, 8)}%`,
                                                    backgroundColor: leadStatusConfig[step]?.color,
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
                    )}
                </div>

                {/* Lead Sources - Pie Chart with distinct colors */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.cardTitle}>Lead Sources</div>
                            <div className={styles.cardSubtitle}>Where leads come from</div>
                        </div>
                    </div>
                    {loading ? <SkeletonRow /> : sourceData.length > 0 ? (
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
                                        />
                                        <Tooltip {...tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                {sourceData.map(s => (
                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: 'var(--crm-text-muted)' }}>
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
                                        <stop offset="5%" stopColor={accentColor} stopOpacity={gradientOpacityTop} />
                                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisTickFill }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10, fill: axisTickFill }} tickLine={false} axisLine={false} width={40} />
                                <Tooltip {...tooltipStyle} />
                                <Area type="monotone" dataKey="tokens" stroke={accentColor} fill="url(#tokenGrad)" strokeWidth={2} name="Tokens" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Bottom Grid: Recent Leads + Quick Stats */}
            <div className={styles.bottomGrid}>
                {/* Recent Leads */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>Recent Leads</div>
                        <Link href="/crm/leads" className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                            View All
                        </Link>
                    </div>
                    {loading ? <SkeletonRow /> : recentLeads.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    {isAdminUser && <th>Source</th>}
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>When</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.map(lead => {
                                    const src = leadSourceConfig[lead.source]
                                    return (
                                        <tr key={lead.id} style={{ cursor: 'pointer' }}
                                            onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
                                            <td>
                                                <div style={{ fontWeight: 500, color: 'var(--crm-text-secondary)' }}>{lead.name}</div>
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>
                                                    {lead.phone || lead.email || '—'}
                                                </div>
                                            </td>
                                            {isAdminUser && (
                                                <td>
                                                    <span className={styles.badge} style={{
                                                        backgroundColor: src?.bg || 'var(--crm-elevated)',
                                                        color: src?.color || 'var(--crm-text-muted)',
                                                    }}>
                                                        {src?.label || lead.source}
                                                    </span>
                                                </td>
                                            )}
                                            <td>
                                                <span className={styles.badge} style={{
                                                    backgroundColor: `${leadStatusConfig[lead.status]?.color}20`,
                                                    color: leadStatusConfig[lead.status]?.color,
                                                }}>
                                                    {leadStatusConfig[lead.status]?.label || lead.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem' }}>
                                                {lead.priority === 'hot' ? '🔥' : lead.priority === 'warm' ? '🟡' : '🔵'}
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>
                                                {formatRelative(lead.created_at)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.emptyState}>
                            {isAgentUser
                                ? 'No leads assigned yet. Ask your manager to assign you some leads.'
                                : 'No leads yet. Connect your ad platforms or add leads manually.'
                            }
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
                        {loading ? <SkeletonRow /> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.entries(leadStatusConfig).map(([status, config]) => {
                                    const count = stats?.byStatus[status] || 0
                                    const pct = stats?.total ? ((count / stats.total) * 100).toFixed(0) : '0'
                                    return (
                                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.color, flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', flex: 1 }}>{config.label}</span>
                                            <span style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginRight: '0.25rem' }}>{pct}%</span>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)', minWidth: '24px', textAlign: 'right' }}>{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
