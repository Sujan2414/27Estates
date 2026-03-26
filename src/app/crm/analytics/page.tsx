'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../crm.module.css'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
import { leadSourceConfig, leadStatusConfig, FALLBACK_CHART_COLORS } from '@/lib/crm-constants'

// Removed local color configs

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' },
    itemStyle: { color: 'var(--crm-text-secondary)' }, labelStyle: { color: 'var(--crm-text-muted)' },
}

export default function AnalyticsPage() {
    const [leads, setLeads] = useState<Array<{ source: string; status: string; priority: string; created_at: string; converted_at?: string | null; score?: number | null }>>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase.from('leads').select('source, status, priority, created_at, converted_at, score')
            if (data) setLeads(data)
            setLoading(false)
        }
        fetch()
    }, [])

    // Source breakdown
    const sourceData = Object.entries(
        leads.reduce((acc: Record<string, number>, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc }, {})
    ).map(([name, value], i) => ({ name: leadSourceConfig[name]?.label || name, value, fill: leadSourceConfig[name]?.color || FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length], colorKey: name })).sort((a, b) => b.value - a.value)

    // Status breakdown
    const statusData = Object.entries(
        leads.reduce((acc: Record<string, number>, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {})
    ).map(([name, value]) => ({ name: leadStatusConfig[name]?.label || name, value, fill: leadStatusConfig[name]?.color || '#6b7280' }))

    // Priority breakdown
    const priorityData = [
        { name: 'Hot', value: leads.filter(l => l.priority === 'hot').length, fill: '#ef4444' },
        { name: 'Warm', value: leads.filter(l => l.priority === 'warm').length, fill: '#f59e0b' },
        { name: 'Cold', value: leads.filter(l => l.priority === 'cold').length, fill: '#3b82f6' },
    ]

    // Leads over time (last 30 days)
    const dailyLeads: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
        dailyLeads[d] = 0
    }
    leads.forEach(l => {
        const d = new Date(l.created_at).toISOString().split('T')[0]
        if (dailyLeads[d] !== undefined) dailyLeads[d]++
    })
    const timeData = Object.entries(dailyLeads).map(([date, count]) => ({
        date, label: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count,
    }))

    // Conversion by source
    const conversionBySource = Object.entries(
        leads.reduce((acc: Record<string, { total: number; converted: number, key: string }>, l) => {
            const label = leadSourceConfig[l.source]?.label || l.source
            if (!acc[label]) acc[label] = { total: 0, converted: 0, key: l.source }
            acc[label].total++
            if (l.status === 'converted') acc[label].converted++
            return acc
        }, {})
    ).map(([name, data]) => ({
        name, key: data.key, total: data.total, converted: data.converted,
        rate: data.total > 0 ? parseFloat(((data.converted / data.total) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.total - a.total)

    // Source Quality Matrix
    const sourceQuality = Object.entries(
        leads.reduce((acc: Record<string, { total: number; converted: number; hot: number; scores: number[]; daysToClose: number[] }>, l) => {
            const key = l.source || 'unknown'
            if (!acc[key]) acc[key] = { total: 0, converted: 0, hot: 0, scores: [], daysToClose: [] }
            acc[key].total++
            if (l.status === 'converted') {
                acc[key].converted++
                if (l.converted_at && l.created_at) {
                    const days = Math.round((new Date(l.converted_at).getTime() - new Date(l.created_at).getTime()) / 86400000)
                    if (days >= 0) acc[key].daysToClose.push(days)
                }
            }
            if (l.priority === 'hot') acc[key].hot++
            if (l.score) acc[key].scores.push(l.score)
            return acc
        }, {})
    ).map(([key, d]) => {
        const convRate = d.total > 0 ? (d.converted / d.total) * 100 : 0
        const avgScore = d.scores.length > 0 ? Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length) : 0
        const avgDays = d.daysToClose.length > 0 ? Math.round(d.daysToClose.reduce((s, v) => s + v, 0) / d.daysToClose.length) : null
        const hotRate = d.total > 0 ? Math.round((d.hot / d.total) * 100) : 0
        // Quality score: weighted combination (conv 40% + score 30% + hot 30%)
        const qualityScore = Math.round((convRate * 0.4) + (avgScore * 0.3) + (hotRate * 3 * 0.3))
        return {
            key, label: leadSourceConfig[key]?.label || key, color: leadSourceConfig[key]?.color || '#6b7280',
            total: d.total, converted: d.converted, convRate: parseFloat(convRate.toFixed(1)),
            avgScore, avgDays, hotRate, hot: d.hot, qualityScore,
        }
    }).filter(s => s.total >= 2).sort((a, b) => b.qualityScore - a.qualityScore)

    if (loading) return <div className={styles.pageContent}><div className={styles.emptyState}>Loading analytics...</div></div>

    return (
        <div className={styles.pageContent}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Analytics</h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Deep dive into your lead data</p>
            </div>

            {/* Leads Over Time */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Leads Over Time (30 Days)</div>
                    <div className={styles.cardSubtitle}>{leads.length} total leads</div>
                </div>
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <BarChart data={timeData}>
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                            <Tooltip {...tooltipStyle} />
                            <Bar dataKey="count" fill="#BFA270" radius={[4, 4, 0, 0]} name="Leads" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Source Pie */}
                <div className={styles.card}>
                    <div className={styles.cardTitle} style={{ marginBottom: '0.75rem' }}>By Source</div>
                    {sourceData.length > 0 ? (
                        <>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" />
                                        <Tooltip {...tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                                {sourceData.map((s, i) => (
                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--crm-text-muted)' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: s.fill }} />
                                            {s.name}
                                        </div>
                                        <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 600 }}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <div className={styles.emptyState}>No data</div>}
                </div>

                {/* Status Bar */}
                <div className={styles.card}>
                    <div className={styles.cardTitle} style={{ marginBottom: '0.75rem' }}>By Status</div>
                    {statusData.length > 0 ? (
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <BarChart data={statusData} layout="vertical">
                                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--crm-text-muted)' }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className={styles.emptyState}>No data</div>}
                </div>

                {/* Priority Pie */}
                <div className={styles.card}>
                    <div className={styles.cardTitle} style={{ marginBottom: '0.75rem' }}>By Priority</div>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" />
                                <Tooltip {...tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                        {priorityData.map(p => (
                            <div key={p.name} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: p.fill }}>{p.value}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{p.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conversion by Source */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Conversion Rate by Source</div>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Source</th>
                            <th>Total Leads</th>
                            <th>Converted</th>
                            <th>Conversion Rate</th>
                            <th>Performance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conversionBySource.map(row => (
                            <tr key={row.name}>
                                <td style={{ fontWeight: 500 }}>{row.name}</td>
                                <td>{row.total}</td>
                                <td style={{ color: '#22c55e' }}>{row.converted}</td>
                                <td style={{ fontWeight: 600, color: row.rate > 10 ? '#22c55e' : row.rate > 0 ? '#f59e0b' : '#6b7280' }}>
                                    {row.rate}%
                                </td>
                                <td>
                                    <div style={{
                                        width: '100%', maxWidth: '120px', height: '6px',
                                        backgroundColor: 'var(--crm-elevated)', borderRadius: '3px', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${Math.min(row.rate * 2, 100)}%`, height: '100%',
                                            backgroundColor: row.rate > 10 ? '#22c55e' : row.rate > 0 ? '#f59e0b' : 'var(--crm-border-subtle)',
                                            borderRadius: '3px', transition: 'width 0.6s',
                                        }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Source Quality Matrix */}
            {sourceQuality.length > 0 && (
                <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                    <div className={styles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Star size={15} style={{ color: '#f59e0b' }} />
                            <div className={styles.cardTitle}>Source Quality Matrix</div>
                        </div>
                        <div className={styles.cardSubtitle}>Quality score = conv rate + avg lead score + hot rate</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                    {['Rank', 'Source', 'Leads', 'Conv%', 'Avg Score', '🔥 Hot%', 'Avg Days to Close', 'Quality Score'].map(h => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', color: 'var(--crm-text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sourceQuality.map((s, i) => (
                                    <tr key={s.key} style={{ borderBottom: i < sourceQuality.length - 1 ? '1px solid var(--crm-border)' : 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-dim)' }}>#{i + 1}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{s.label}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--crm-text-secondary)' }}>{s.total}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 700, color: s.convRate >= 15 ? '#22c55e' : s.convRate >= 5 ? '#f59e0b' : '#6b7280' }}>{s.convRate}%</td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 600, color: s.avgScore >= 60 ? '#22c55e' : s.avgScore >= 40 ? '#f59e0b' : 'var(--crm-text-dim)' }}>{s.avgScore || '—'}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: s.hotRate >= 30 ? '#ef4444' : 'var(--crm-text-secondary)' }}>{s.hotRate}%</td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--crm-text-secondary)' }}>
                                            {s.avgDays != null ? `${s.avgDays}d` : '—'}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: 'var(--crm-border)', overflow: 'hidden', minWidth: '60px' }}>
                                                    <div style={{
                                                        width: `${Math.min(s.qualityScore, 100)}%`, height: '100%', borderRadius: '3px',
                                                        backgroundColor: s.qualityScore >= 70 ? '#22c55e' : s.qualityScore >= 40 ? '#f59e0b' : '#ef4444',
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: s.qualityScore >= 70 ? '#22c55e' : s.qualityScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                                                    {s.qualityScore}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
