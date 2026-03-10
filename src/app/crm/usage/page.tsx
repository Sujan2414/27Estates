'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Zap, IndianRupee, Hash, Clock } from 'lucide-react'
import styles from '../crm.module.css'

const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface UsageData {
    total: { tokens: number; cost: string; requests: number }
    today: { tokens: number; cost: string; requests: number }
    week: { tokens: number; cost: string }
    daily: Array<{ date: string; label: string; tokens: number; cost: number; requests: number }>
}

const USD_TO_INR = 83

const formatINR = (usdCost: string | number) => {
    const inr = parseFloat(String(usdCost)) * USD_TO_INR
    if (inr < 1) return `₹${inr.toFixed(2)}`
    return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

const formatIndianNumber = (n: number) => n.toLocaleString('en-IN')

export default function APIUsagePage() {
    const [data, setData] = useState<UsageData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/crm/api-usage')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const tooltipStyle = {
        contentStyle: { backgroundColor: '#1e2030', border: '1px solid #2d3148', borderRadius: '8px', fontSize: '0.75rem' },
        itemStyle: { color: '#e5e7eb' },
        labelStyle: { color: '#9ca3af' },
    }

    // Prepare INR cost data for chart
    const dailyINR = data?.daily.map(d => ({
        ...d,
        costINR: parseFloat((d.cost * USD_TO_INR).toFixed(2)),
    })) || []

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Link href="/crm" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>API Usage & Costs</h1>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Azure OpenAI token usage and estimated costs (INR)</p>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsRow} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className={styles.statCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Zap size={14} style={{ color: '#BFA270' }} />
                        <span className={styles.statLabel} style={{ margin: 0 }}>Total Tokens (30d)</span>
                    </div>
                    <div className={styles.statValue}>{loading ? '—' : formatIndianNumber(data?.total.tokens || 0)}</div>
                </div>
                <div className={styles.statCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <IndianRupee size={14} style={{ color: '#22c55e' }} />
                        <span className={styles.statLabel} style={{ margin: 0 }}>Total Cost (30d)</span>
                    </div>
                    <div className={styles.statValue} style={{ color: '#22c55e' }}>{loading ? '—' : formatINR(data?.total.cost || '0')}</div>
                </div>
                <div className={styles.statCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Hash size={14} style={{ color: '#3b82f6' }} />
                        <span className={styles.statLabel} style={{ margin: 0 }}>Total Requests (30d)</span>
                    </div>
                    <div className={styles.statValue}>{loading ? '—' : formatIndianNumber(data?.total.requests || 0)}</div>
                </div>
                <div className={styles.statCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Clock size={14} style={{ color: '#f59e0b' }} />
                        <span className={styles.statLabel} style={{ margin: 0 }}>Today</span>
                    </div>
                    <div className={styles.statValue}>{loading ? '—' : data?.today.requests || 0}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {formatIndianNumber(data?.today.tokens || 0)} tokens &middot; {formatINR(data?.today.cost || '0')}
                    </div>
                </div>
            </div>

            {/* Token Usage Chart */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Token Usage Over Time</div>
                </div>
                {dailyINR.length > 0 ? (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={dailyINR}>
                                <defs>
                                    <linearGradient id="tokenGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#BFA270" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#BFA270" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={50} />
                                <Tooltip {...tooltipStyle} />
                                <Area type="monotone" dataKey="tokens" stroke="#BFA270" fill="url(#tokenGrad2)" strokeWidth={2} name="Tokens" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className={styles.emptyState}>No usage data yet. Chatbot interactions will appear here.</div>
                )}
            </div>

            {/* Cost Chart in INR */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Daily Cost (₹ INR)</div>
                </div>
                {dailyINR.length > 0 ? (
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={dailyINR}>
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={50} tickFormatter={v => `₹${v}`} />
                                <Tooltip
                                    {...tooltipStyle}
                                    formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Cost']}
                                />
                                <Bar dataKey="costINR" fill="#22c55e" radius={[4, 4, 0, 0]} name="Cost (₹)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className={styles.emptyState}>No cost data yet.</div>
                )}
            </div>

            {/* Requests Chart */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Daily Requests</div>
                </div>
                {dailyINR.length > 0 ? (
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={dailyINR}>
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} />
                                <Tooltip {...tooltipStyle} />
                                <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Requests" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className={styles.emptyState}>No request data yet.</div>
                )}
            </div>
        </div>
    )
}
