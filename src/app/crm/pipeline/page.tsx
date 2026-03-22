'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, BarChart2, Columns3, Phone, Mail } from 'lucide-react'
import styles from '../crm.module.css'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })

interface Lead {
    id: string; name: string; email: string | null; phone: string | null
    source: string; status: string; priority: string; created_at: string
    projects?: { project_name: string } | null
}

const STAGES = [
    { key: 'new', label: 'New', color: '#3b82f6' },
    { key: 'contacted', label: 'Contacted', color: '#f59e0b' },
    { key: 'qualified', label: 'Qualified', color: '#8b5cf6' },
    { key: 'negotiation', label: 'Negotiation', color: '#f97316' },
    { key: 'site_visit', label: 'Site Visit', color: '#06b6d4' },
    { key: 'converted', label: 'Converted', color: '#22c55e' },
    { key: 'lost', label: 'Lost', color: '#ef4444' },
]

const sourceConfig: Record<string, { label: string; color: string }> = {
    website: { label: 'Web', color: '#3b82f6' },
    meta_ads: { label: 'Meta', color: '#ec4899' },
    google_ads: { label: 'Google', color: '#f59e0b' },
    '99acres': { label: '99ac', color: '#ef4444' },
    magicbricks: { label: 'MB', color: '#f97316' },
    housing: { label: 'Hsg', color: '#06b6d4' },
    justdial: { label: 'JD', color: '#8b5cf6' },
    chatbot: { label: 'Bot', color: '#22c55e' },
    whatsapp: { label: 'WA', color: '#25D366' },
    manual: { label: 'Manual', color: 'var(--crm-text-faint)' },
    referral: { label: 'Ref', color: 'var(--crm-accent)' },
}

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' },
    itemStyle: { color: 'var(--crm-text-secondary)' }, labelStyle: { color: 'var(--crm-text-muted)' },
}

export default function PipelinePage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'kanban' | 'analytics'>('kanban')
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverCol, setDragOverCol] = useState<string | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        // fetch up to 500 leads for kanban
        const res = await fetch('/api/crm/leads?limit=500').catch(() => null)
        if (res?.ok) {
            const d = await res.json()
            setLeads(d.leads || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    // Group leads by status into kanban columns
    const columns = STAGES.reduce((acc, stage) => {
        acc[stage.key] = leads.filter(l => l.status === stage.key)
        return acc
    }, {} as Record<string, Lead[]>)

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggingId(leadId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault()
        if (!draggingId) return
        const lead = leads.find(l => l.id === draggingId)
        if (!lead || lead.status === targetStatus) { setDraggingId(null); setDragOverCol(null); return }

        // Optimistic update
        setLeads(prev => prev.map(l => l.id === draggingId ? { ...l, status: targetStatus } : l))
        const movedId = draggingId
        setDraggingId(null)
        setDragOverCol(null)
        setUpdating(movedId)

        await fetch(`/api/crm/leads/${movedId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus }),
        }).catch(() => {})
        setUpdating(null)
    }

    const formatAge = (d: string) => {
        const ms = Date.now() - new Date(d).getTime()
        const dd = Math.floor(ms / 86400000)
        if (dd < 1) return 'Today'
        if (dd === 1) return '1d'
        if (dd < 30) return `${dd}d`
        return `${Math.floor(dd / 30)}mo`
    }

    const totalLeads = leads.length
    const convertedCount = columns['converted']?.length || 0
    const lostCount = columns['lost']?.length || 0
    const activeCount = ['new', 'contacted', 'qualified', 'negotiation', 'site_visit'].reduce((s, k) => s + (columns[k]?.length || 0), 0)
    const winRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0

    const funnelData = STAGES.map(s => ({ name: s.label, count: columns[s.key]?.length || 0, color: s.color }))

    // Source distribution for pie chart
    const sourceData = Object.entries(
        leads.reduce((acc: Record<string, number>, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc }, {})
    ).map(([key, value]) => ({ name: sourceConfig[key]?.label || key, value, color: sourceConfig[key]?.color || '#6b7280' }))
        .sort((a, b) => b.value - a.value).slice(0, 7)

    return (
        <div className={styles.pageContent} style={{ maxWidth: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm" style={{ color: 'var(--crm-text-faint)' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Pipeline</h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>
                            Drag leads between stages · {totalLeads.toLocaleString('en-IN')} total
                        </p>
                    </div>
                </div>
                <div className={styles.pillTabs}>
                    <button
                        className={`${styles.pillTab} ${view === 'kanban' ? styles.pillTabActive : ''}`}
                        onClick={() => setView('kanban')}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Columns3 size={13} /> Kanban
                        </span>
                    </button>
                    <button
                        className={`${styles.pillTab} ${view === 'analytics' ? styles.pillTabActive : ''}`}
                        onClick={() => setView('analytics')}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <BarChart2 size={13} /> Analytics
                        </span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading pipeline...</div>
            ) : view === 'kanban' ? (
                /* ── KANBAN BOARD ─────────────────────────────────── */
                <div className={styles.kanbanBoard}>
                    {STAGES.map(stage => {
                        const cards = columns[stage.key] || []
                        const isDragOver = dragOverCol === stage.key
                        return (
                            <div
                                key={stage.key}
                                className={`${styles.kanbanColumn} ${isDragOver ? styles.kanbanColumnDragOver : ''}`}
                                onDragOver={e => { e.preventDefault(); setDragOverCol(stage.key) }}
                                onDragLeave={e => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null)
                                }}
                                onDrop={e => handleDrop(e, stage.key)}
                            >
                                {/* Column Header */}
                                <div className={styles.kanbanColumnHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{stage.label}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.6875rem', fontWeight: 700,
                                        backgroundColor: `${stage.color}20`, color: stage.color,
                                        padding: '2px 8px', borderRadius: '999px',
                                    }}>{cards.length}</span>
                                </div>

                                {/* Cards */}
                                <div className={styles.kanbanColumnBody}>
                                    {cards.map(lead => (
                                        <div
                                            key={lead.id}
                                            draggable
                                            onDragStart={e => handleDragStart(e, lead.id)}
                                            onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
                                            className={`${styles.kanbanCard} ${draggingId === lead.id ? styles.kanbanCardDragging : ''}`}
                                            onClick={() => { if (!draggingId) window.location.href = `/crm/leads/${lead.id}` }}
                                            style={{ opacity: updating === lead.id ? 0.5 : 1 }}
                                        >
                                            {/* Priority + Source row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    color: lead.priority === 'hot' ? '#ef4444' : lead.priority === 'warm' ? '#f59e0b' : '#6b7280',
                                                }}>
                                                    {lead.priority === 'hot' ? '🔥' : lead.priority === 'warm' ? '🟡' : '🔵'} {lead.priority}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.625rem', fontWeight: 600,
                                                    backgroundColor: `${sourceConfig[lead.source]?.color || '#6b7280'}20`,
                                                    color: sourceConfig[lead.source]?.color || '#9ca3af',
                                                    padding: '1px 6px', borderRadius: '999px',
                                                }}>
                                                    {sourceConfig[lead.source]?.label || lead.source}
                                                </span>
                                            </div>

                                            {/* Name */}
                                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '0.375rem', lineHeight: 1.3 }}>
                                                {lead.name}
                                            </div>

                                            {/* Contact info */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '0.5rem' }}>
                                                {lead.phone && (
                                                    <span style={{ fontSize: '0.6875rem', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Phone size={9} /> {lead.phone}
                                                    </span>
                                                )}
                                                {lead.email && (
                                                    <span style={{ fontSize: '0.6875rem', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        <Mail size={9} /> {lead.email}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Footer: project + age */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                {lead.projects?.project_name ? (
                                                    <span style={{ fontSize: '0.625rem', color: 'var(--crm-accent)', fontWeight: 500 }}>
                                                        {lead.projects.project_name}
                                                    </span>
                                                ) : <span />}
                                                <span style={{ fontSize: '0.625rem', color: 'var(--crm-text-dim)' }}>{formatAge(lead.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {cards.length === 0 && (
                                        <div style={{
                                            padding: '1.5rem 0.75rem', textAlign: 'center',
                                            color: '#374151', fontSize: '0.75rem',
                                            border: '1px dashed #2d3148', borderRadius: '0.5rem',
                                            marginTop: '0.25rem',
                                        }}>
                                            Drop leads here
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* ── ANALYTICS VIEW ───────────────────────────────── */
                <div>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Leads', value: totalLeads, color: 'var(--crm-text-secondary)' },
                            { label: 'Active', value: activeCount, color: 'var(--crm-accent)' },
                            { label: 'Converted', value: convertedCount, color: '#22c55e' },
                            { label: 'Lost', value: lostCount, color: '#ef4444' },
                            { label: 'Win Rate', value: `${winRate}%`, color: '#8b5cf6' },
                        ].map(s => (
                            <div key={s.label} className={styles.statCard}>
                                <div className={styles.statLabel}>{s.label}</div>
                                <div className={styles.statValue} style={{ color: s.color, fontSize: '1.75rem' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.chartsGrid}>
                        {/* Funnel */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Pipeline Funnel</span>
                                <span className={styles.cardSubtitle}>Stage conversion breakdown</span>
                            </div>
                            <div className={styles.funnel}>
                                {funnelData.map(d => {
                                    const maxCount = Math.max(...funnelData.map(x => x.count), 1)
                                    const pct = Math.round((d.count / maxCount) * 100)
                                    const convPct = totalLeads > 0 ? Math.round((d.count / totalLeads) * 100) : 0
                                    return (
                                        <div key={d.name} className={styles.funnelStep}>
                                            <span className={styles.funnelLabel}>{d.name}</span>
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    className={styles.funnelBar}
                                                    style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: d.color }}
                                                >
                                                    {d.count}
                                                </div>
                                            </div>
                                            <span className={styles.funnelCount}>{convPct}%</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Stage bar chart */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Leads by Stage</span>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={funnelData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                                        {funnelData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Source breakdown pie */}
                    <div className={styles.card} style={{ marginTop: '1rem' }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Lead Sources</span>
                            <span className={styles.cardSubtitle}>Where pipeline leads come from</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                                        {sourceData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip {...tooltipStyle} />
                                    <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {sourceData.map(s => (
                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>{s.name}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
