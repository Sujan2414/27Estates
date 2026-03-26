'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { TrendingUp, Users, CheckCircle, XCircle, CalendarCheck, Download } from 'lucide-react'
import styles from '../crm.module.css'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
import { leadSourceConfig, leadStatusConfig, FALLBACK_CHART_COLORS } from '@/lib/crm-constants'

interface ReportData {
    total: number
    converted: number
    lost: number
    hot: number
    overdueTasks: number
    conversionRate: string
    byStatus: Record<string, number>
    bySource: Record<string, number>
    today: number
    thisWeek: number
}

// Removed local color configs in favor of crm-constants

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetch('/api/crm/stats').then(r => r.ok ? r.json() : null).then(d => {
            setData(d); setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const handleExport = async () => {
        setExporting(true)
        const res = await fetch('/api/crm/export')
        if (res.ok) {
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `all-leads-${new Date().toISOString().split('T')[0]}.csv`
            a.click(); URL.revokeObjectURL(url)
        }
        setExporting(false)
    }

    const statusChartData = data
        ? Object.entries(data.byStatus).map(([key, value]) => ({
            name: key.replace('_', ' '), value, fill: leadStatusConfig[key]?.color || '#6b7280',
        }))
        : []

    const sourceChartData = data
        ? Object.entries(data.bySource)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([key, value], i) => ({
                name: leadSourceConfig[key]?.label || key, value, fill: leadSourceConfig[key]?.color || FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length],
            }))
        : []

    const conversionFunnel = ['new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted'].map(s => ({
        stage: s.replace('_', ' '), count: data?.byStatus[s] || 0,
        pct: data?.total ? (((data.byStatus[s] || 0) / data.total) * 100).toFixed(1) : '0',
    }))

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Reports</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Analytics and performance overview</p>
                </div>
                <button onClick={handleExport} disabled={exporting} className={styles.btnSecondary}>
                    <Download size={14} /> {exporting ? 'Exporting...' : 'Export All Leads'}
                </button>
            </div>

            {loading ? <div className={styles.emptyState}>Loading...</div> : !data ? <div className={styles.emptyState}>Failed to load data</div> : (
                <>
                    {/* KPI Cards */}
                    <div className={styles.statsRow} style={{ marginBottom: '1.5rem' }}>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Total Leads</div>
                            <div className={styles.statValue}>{data.total.toLocaleString('en-IN')}</div>
                            <div className={`${styles.statChange} ${styles.statUp}`}>+{data.thisWeek} this week</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Conversion Rate</div>
                            <div className={styles.statValue} style={{ color: '#22c55e' }}>{data.conversionRate}%</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: '0.25rem' }}>{data.converted} converted</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Hot Leads</div>
                            <div className={styles.statValue} style={{ color: '#ef4444' }}>{data.hot}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Lost Leads</div>
                            <div className={styles.statValue} style={{ color: '#ef4444' }}>{data.lost || data.byStatus.lost || 0}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: '0.25rem' }}>
                                {data.total ? (((data.byStatus.lost || 0) / data.total) * 100).toFixed(1) : 0}% loss rate
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Overdue Tasks</div>
                            <div className={styles.statValue} style={{ color: data.overdueTasks ? '#ef4444' : '#6b7280' }}>{data.overdueTasks}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>New Today</div>
                            <div className={styles.statValue}>{data.today}</div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Lead by Source */}
                        <div className={styles.card}>
                            <div className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Leads by Source</div>
                            <div style={{ width: '100%', height: 240 }}>
                                <ResponsiveContainer>
                                    <BarChart data={sourceChartData} layout="vertical">
                                        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-muted)' }} tickLine={false} axisLine={false} width={80} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' }}
                                            itemStyle={{ color: 'var(--crm-text-secondary)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {sourceChartData.map((entry, i) => (
                                                <rect key={i} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Lead by Status */}
                        <div className={styles.card}>
                            <div className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Leads by Status</div>
                            <div style={{ width: '100%', height: 240 }}>
                                <ResponsiveContainer>
                                    <BarChart data={statusChartData}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} tickLine={false} axisLine={false} width={30} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' }}
                                            itemStyle={{ color: 'var(--crm-text-secondary)' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {statusChartData.map((entry, i) => (
                                                <rect key={i} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Funnel */}
                    <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                        <div className={styles.cardTitle} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={16} /> Conversion Funnel
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '180px', marginTop: '1rem' }}>
                            {conversionFunnel.map((step, i) => {
                                const maxCount = Math.max(...conversionFunnel.map(s => s.count), 1)
                                const height = Math.max((step.count / maxCount) * 140, 20)
                                const color = leadStatusConfig[step.stage.replace(' ', '_')]?.color || '#6b7280'
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-secondary)' }}>{step.count}</span>
                                        <div style={{ width: '100%', height: `${height}px`, backgroundColor: color, borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                                        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-muted)', textTransform: 'capitalize' }}>{step.stage}</div>
                                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)' }}>{step.pct}%</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Source Performance Table */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Source Performance</div>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Source</th><th>Leads</th><th>Share</th><th>Quality</th></tr>
                            </thead>
                            <tbody>
                                {Object.entries(data.bySource).sort((a, b) => b[1] - a[1]).map(([src, count]) => {
                                    const share = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : '0'
                                    const quality = ['referral', 'google_ads', 'whatsapp'].includes(src) ? 'High' : ['meta_ads', 'website', 'magicbricks'].includes(src) ? 'Medium' : 'Standard'
                                    const qColor = quality === 'High' ? '#22c55e' : quality === 'Medium' ? '#f59e0b' : '#6b7280'
                                    return (
                                        <tr key={src}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: leadSourceConfig[src]?.color || '#6b7280' }} />
                                                    <span style={{ color: 'var(--crm-text-secondary)' }}>{leadSourceConfig[src]?.label || src}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{count}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--crm-elevated)', borderRadius: '3px', maxWidth: '80px' }}>
                                                        <div style={{ height: '100%', width: `${share}%`, backgroundColor: leadSourceConfig[src]?.color || '#6b7280', borderRadius: '3px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>{share}%</span>
                                                </div>
                                            </td>
                                            <td><span style={{ fontSize: '0.6875rem', color: qColor, backgroundColor: `${qColor}20`, padding: '2px 8px', borderRadius: '999px' }}>{quality}</span></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}
