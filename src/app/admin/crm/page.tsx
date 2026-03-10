'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Users, UserPlus, Clock, Flame, AlertTriangle,
    TrendingUp, ArrowRight, Phone, Mail
} from 'lucide-react'
import styles from '../admin.module.css'

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

interface RecentLead {
    id: string
    name: string
    email: string | null
    phone: string | null
    source: string
    status: string
    priority: string
    created_at: string
}

const sourceLabels: Record<string, string> = {
    website: 'Website',
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    '99acres': '99acres',
    magicbricks: 'MagicBricks',
    housing: 'Housing.com',
    justdial: 'JustDial',
    chatbot: 'Chatbot',
    whatsapp: 'WhatsApp',
    manual: 'Manual',
    referral: 'Referral',
}

const statusColors: Record<string, string> = {
    new: '#3b82f6',
    contacted: '#f59e0b',
    qualified: '#8b5cf6',
    negotiation: '#f97316',
    site_visit: '#06b6d4',
    converted: '#22c55e',
    lost: '#ef4444',
}

export default function CRMDashboard() {
    const [stats, setStats] = useState<CRMStats | null>(null)
    const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const [statsRes, leadsRes] = await Promise.all([
                fetch('/api/crm/stats'),
                fetch('/api/crm/leads?limit=10'),
            ])

            if (statsRes.ok) {
                setStats(await statsRes.json())
            }
            if (leadsRes.ok) {
                const data = await leadsRes.json()
                setRecentLeads(data.leads || [])
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>CRM Dashboard</h1>
                    <p className={styles.pageSubtitle}>Lead management and pipeline overview</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/admin/crm/leads" className={styles.addButton} style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                        <Users size={18} />
                        All Leads
                    </Link>
                    <Link href="/admin/crm/leads?new=true" className={styles.addButton}>
                        <UserPlus size={18} />
                        Add Lead
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Total Leads</span>
                        <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats?.total || 0}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>New Today</span>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                            <UserPlus size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats?.today || 0}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Hot Leads</span>
                        <div className={`${styles.statIcon} ${styles.statIconGold}`}>
                            <Flame size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats?.hot || 0}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Overdue Tasks</span>
                        <div className={`${styles.statIcon}`} style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : stats?.overdueTasks || 0}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>Conversion Rate</span>
                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{loading ? '-' : `${stats?.conversionRate || 0}%`}</div>
                </div>
            </div>

            {/* Pipeline Overview */}
            {stats && (
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Pipeline Overview</h2>
                        <Link href="/admin/crm/pipeline" className={styles.viewAllLink}>
                            View Pipeline <ArrowRight size={14} style={{ display: 'inline' }} />
                        </Link>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {Object.entries(statusColors).map(([status, color]) => (
                            <div key={status} style={{
                                flex: '1 1 120px',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                backgroundColor: `${color}10`,
                                borderLeft: `3px solid ${color}`,
                                minWidth: '120px',
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{stats.byStatus[status] || 0}</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'capitalize' }}>
                                    {status.replace('_', ' ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lead Sources */}
            {stats && Object.keys(stats.bySource).length > 0 && (
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Lead Sources</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                            <div key={source} style={{
                                padding: '0.75rem 1.25rem',
                                borderRadius: '0.75rem',
                                backgroundColor: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#183C38' }}>{count}</span>
                                <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{sourceLabels[source] || source}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Leads */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Leads</h2>
                    <Link href="/admin/crm/leads" className={styles.viewAllLink}>
                        View All <ArrowRight size={14} style={{ display: 'inline' }} />
                    </Link>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>Loading...</div>
                ) : recentLeads.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Source</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>When</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLeads.map((lead) => (
                                <tr key={lead.id} style={{ cursor: 'pointer' }}
                                    onClick={() => window.location.href = `/admin/crm/leads/${lead.id}`}>
                                    <td style={{ fontWeight: 500 }}>{lead.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {lead.phone && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                                                    <Phone size={12} /> {lead.phone}
                                                </span>
                                            )}
                                            {lead.email && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
                                                    <Mail size={12} /> {lead.email}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            backgroundColor: '#f3f4f6',
                                            fontWeight: 500,
                                        }}>
                                            {sourceLabels[lead.source] || lead.source}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            backgroundColor: `${statusColors[lead.status]}15`,
                                            color: statusColors[lead.status],
                                            textTransform: 'capitalize',
                                        }}>
                                            {lead.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: lead.priority === 'hot' ? '#ef4444' : lead.priority === 'warm' ? '#f59e0b' : '#9ca3af',
                                        }}>
                                            {lead.priority === 'hot' ? '🔥' : lead.priority === 'warm' ? '🟡' : '🔵'} {lead.priority}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                                        {formatDate(lead.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateTitle}>No leads yet</div>
                        <p className={styles.emptyStateText}>Leads from your ad platforms and website will appear here.</p>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link href="/admin/crm/leads?new=true" className={styles.addButton}>
                        <UserPlus size={16} /> Add Lead Manually
                    </Link>
                    <Link href="/admin/crm/connectors" className={styles.addButton} style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                        <Clock size={16} /> Manage Connectors
                    </Link>
                    <Link href="/admin/crm/emails" className={styles.addButton} style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                        <Mail size={16} /> Email Templates
                    </Link>
                </div>
            </div>
        </div>
    )
}
