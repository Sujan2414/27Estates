'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft } from 'lucide-react'
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

const statusColors: Record<string, string> = {
    new: '#3b82f6', contacted: '#f59e0b', qualified: '#8b5cf6',
    negotiation: '#f97316', site_visit: '#06b6d4', converted: '#22c55e', lost: '#ef4444',
}

const sourceLabels: Record<string, string> = {
    website: 'Website', meta_ads: 'Meta Ads', google_ads: 'Google Ads',
    '99acres': '99acres', magicbricks: 'MagicBricks', housing: 'Housing.com',
    justdial: 'JustDial', chatbot: 'Chatbot', manual: 'Manual', referral: 'Referral',
}

const COLORS = ['#BFA270', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899']

const tooltipStyle = {
    contentStyle: { backgroundColor: '#1e2030', border: '1px solid #2d3148', borderRadius: '8px', fontSize: '0.75rem' },
    itemStyle: { color: '#e5e7eb' }, labelStyle: { color: '#9ca3af' },
}

export default function AnalyticsPage() {
    const [leads, setLeads] = useState<Array<{ source: string; status: string; priority: string; created_at: string }>>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase.from('leads').select('source, status, priority, created_at')
            if (data) setLeads(data)
            setLoading(false)
        }
        fetch()
    }, [])

    // Source breakdown
    const sourceData = Object.entries(
        leads.reduce((acc: Record<string, number>, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc }, {})
    ).map(([name, value], i) => ({ name: sourceLabels[name] || name, value, fill: COLORS[i % COLORS.length] })).sort((a, b) => b.value - a.value)

    // Status breakdown
    const statusData = Object.entries(
        leads.reduce((acc: Record<string, number>, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {})
    ).map(([name, value]) => ({ name, value, fill: statusColors[name] || '#6b7280' }))

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
        leads.reduce((acc: Record<string, { total: number; converted: number }>, l) => {
            const key = sourceLabels[l.source] || l.source
            if (!acc[key]) acc[key] = { total: 0, converted: 0 }
            acc[key].total++
            if (l.status === 'converted') acc[key].converted++
            return acc
        }, {})
    ).map(([name, data]) => ({
        name, total: data.total, converted: data.converted,
        rate: data.total > 0 ? parseFloat(((data.converted / data.total) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.total - a.total)

    if (loading) return <div className={styles.pageContent}><div className={styles.emptyState}>Loading analytics...</div></div>

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Link href="/crm" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Analytics</h1>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Deep dive into your lead data</p>
                </div>
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
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#9ca3af' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: COLORS[i % COLORS.length] }} />
                                            {s.name}
                                        </div>
                                        <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{s.value}</span>
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
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={80} />
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
                                <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{p.name}</div>
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
                                        backgroundColor: '#1e2030', borderRadius: '3px', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${Math.min(row.rate * 2, 100)}%`, height: '100%',
                                            backgroundColor: row.rate > 10 ? '#22c55e' : row.rate > 0 ? '#f59e0b' : '#2d3148',
                                            borderRadius: '3px', transition: 'width 0.6s',
                                        }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
