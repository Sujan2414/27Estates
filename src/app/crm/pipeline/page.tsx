'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { BarChart2, Columns3, Phone, Mail, Search, IndianRupee } from 'lucide-react'
import styles from '../crm.module.css'
import { useCRMUser, isAdmin, isManager } from '../crm-context'

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
    budget_min?: number | null; budget_max?: number | null
    projects?: { project_name: string } | null
}

// Weighted conversion probability per stage
const STAGE_PROB: Record<string, number> = {
    new: 0.05, contacted: 0.15, qualified: 0.35,
    negotiation: 0.60, site_visit: 0.75, converted: 1.0, lost: 0,
}

const COMMISSION_RATE = 0.02  // 2%

function fmtCr(val: number): string {
    if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)}Cr`
    if (val >= 1e5) return `₹${(val / 1e5).toFixed(1)}L`
    return `₹${val.toLocaleString('en-IN')}`
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
    const crmUser = useCRMUser()
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'kanban' | 'analytics' | 'revenue'>('kanban')
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverCol, setDragOverCol] = useState<string | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)
    const [pipelineSearch, setPipelineSearch] = useState('')

    const fetchLeads = useCallback(async () => {
        if (!crmUser) return
        setLoading(true)
        // Role-based filtering: admin/super_admin see all; manager sees team; agent sees own
        const params = new URLSearchParams({ limit: '500' })
        if (!isAdmin(crmUser) && !isManager(crmUser)) {
            params.set('assigned_to', crmUser.id)
        } else if (isManager(crmUser) && !isAdmin(crmUser)) {
            params.set('manager_id', crmUser.id)
        }
        const res = await fetch(`/api/crm/leads?${params}`).catch(() => null)
        if (res?.ok) {
            const d = await res.json()
            setLeads(d.leads || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => { if (crmUser) fetchLeads() }, [fetchLeads, crmUser])

    // Filter leads by search, then group by status into kanban columns
    const filteredLeads = pipelineSearch
        ? leads.filter(l => {
            const q = pipelineSearch.toLowerCase()
            return l.name.toLowerCase().includes(q) ||
                l.email?.toLowerCase().includes(q) ||
                l.phone?.includes(q) ||
                l.source.toLowerCase().includes(q)
        })
        : leads

    const columns = STAGES.reduce((acc, stage) => {
        acc[stage.key] = filteredLeads.filter(l => l.status === stage.key)
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

        const previousStatus = lead.status
        const movedId = draggingId

        // Optimistic update
        setLeads(prev => prev.map(l => l.id === movedId ? { ...l, status: targetStatus } : l))
        setDraggingId(null)
        setDragOverCol(null)
        setUpdating(movedId)

        try {
            const res = await fetch(`/api/crm/leads/${movedId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus }),
            })
            if (!res.ok) throw new Error('Update failed')
        } catch {
            // Rollback on failure
            setLeads(prev => prev.map(l => l.id === movedId ? { ...l, status: previousStatus } : l))
        }
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

    const totalLeads = filteredLeads.length
    const convertedCount = columns['converted']?.length || 0
    const lostCount = columns['lost']?.length || 0
    const activeCount = ['new', 'contacted', 'qualified', 'negotiation', 'site_visit'].reduce((s, k) => s + (columns[k]?.length || 0), 0)
    const winRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0

    const funnelData = STAGES.map(s => ({ name: s.label, count: columns[s.key]?.length || 0, color: s.color }))

    // Revenue Intelligence
    const leadsWithBudget = filteredLeads.filter(l => l.budget_min || l.budget_max)
    const stageRevenue = STAGES.map(stage => {
        const stageLeads = (columns[stage.key] || []).filter(l => l.budget_min || l.budget_max)
        const totalBudget = stageLeads.reduce((s, l) => {
            const mid = ((l.budget_min || 0) + (l.budget_max || l.budget_min || 0)) / 2
            return s + mid
        }, 0)
        const weighted = totalBudget * (STAGE_PROB[stage.key] || 0)
        return { ...stage, leads: stageLeads.length, totalBudget, weighted }
    })
    const totalPipeline = stageRevenue.reduce((s, r) => s + r.totalBudget, 0)
    const weightedPipeline = stageRevenue.reduce((s, r) => s + r.weighted, 0)
    const estCommission = weightedPipeline * COMMISSION_RATE
    const maxBudget = Math.max(...stageRevenue.map(r => r.totalBudget), 1)
    const topLeadsByValue = [...leadsWithBudget]
        .sort((a, b) => {
            const av = ((a.budget_min || 0) + (a.budget_max || a.budget_min || 0)) / 2
            const bv = ((b.budget_min || 0) + (b.budget_max || b.budget_min || 0)) / 2
            return bv - av
        }).slice(0, 10)

    // Source distribution for pie chart
    const sourceData = Object.entries(
        filteredLeads.reduce((acc: Record<string, number>, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc }, {})
    ).map(([key, value]) => ({ name: sourceConfig[key]?.label || key, value, color: sourceConfig[key]?.color || '#6b7280' }))
        .sort((a, b) => b.value - a.value).slice(0, 7)

    return (
        <div className={styles.pageContent} style={{ maxWidth: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Pipeline</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>
                        Drag leads between stages · {totalLeads.toLocaleString('en-IN')} total
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {view === 'kanban' && (
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-dim)' }} />
                            <input
                                type="text"
                                placeholder="Search pipeline..."
                                value={pipelineSearch}
                                onChange={e => setPipelineSearch(e.target.value)}
                                className={styles.searchInput}
                                style={{ width: '200px', fontSize: '0.75rem' }}
                            />
                        </div>
                    )}
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
                        <button
                            className={`${styles.pillTab} ${view === 'revenue' ? styles.pillTabActive : ''}`}
                            onClick={() => setView('revenue')}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IndianRupee size={13} /> Revenue
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', gap: '0.75rem', overflow: 'hidden', height: 'calc(100vh - 200px)' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ width: '264px', flexShrink: 0, backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '0.75rem', padding: '0.75rem' }}>
                            <div className={styles.skeleton} style={{ width: '60%', height: '14px', marginBottom: '1rem' }} />
                            {[1, 2, 3].map(j => (
                                <div key={j} className={styles.skeleton} style={{ height: '80px', marginBottom: '0.5rem', borderRadius: '0.5rem' }} />
                            ))}
                        </div>
                    ))}
                </div>
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
                                            color: 'var(--crm-text-faint)', fontSize: '0.75rem',
                                            border: '1px dashed var(--crm-border-subtle)', borderRadius: '0.5rem',
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
            ) : view === 'analytics' ? (
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
            ) : (
                /* ── REVENUE INTELLIGENCE ─────────────────────────── */
                <div>
                            {/* Summary cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'Total Pipeline', value: fmtCr(totalPipeline), sub: `${leadsWithBudget.length} leads with budget`, color: '#6366f1' },
                                    { label: 'Weighted Pipeline', value: fmtCr(weightedPipeline), sub: 'probability-adjusted', color: '#3b82f6' },
                                    { label: 'Est. Commission (2%)', value: fmtCr(estCommission), sub: 'on weighted value', color: '#10b981' },
                                    { label: 'Avg Deal Size', value: leadsWithBudget.length > 0 ? fmtCr(totalPipeline / leadsWithBudget.length) : '—', sub: 'across all stages', color: '#f59e0b' },
                                ].map(s => (
                                    <div key={s.label} className={styles.statCard}>
                                        <div className={styles.statLabel} style={{ color: s.color }}>{s.label}</div>
                                        <div className={styles.statValue} style={{ color: s.color, fontSize: '1.4rem' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-dim)', marginTop: '2px' }}>{s.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Stage revenue breakdown */}
                            <div className={styles.card} style={{ marginBottom: '1rem' }}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardTitle}>Weighted Pipeline by Stage</span>
                                    <span className={styles.cardSubtitle}>Budget × conversion probability</span>
                                </div>
                                {stageRevenue.filter(r => r.totalBudget > 0).length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--crm-text-dim)', fontSize: '0.875rem' }}>
                                        Add budget ranges to leads to see revenue intelligence
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {stageRevenue.map(r => {
                                            const barPct = maxBudget > 0 ? (r.totalBudget / maxBudget) * 100 : 0
                                            const prob = STAGE_PROB[r.key] * 100
                                            return (
                                                <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 80px 80px 60px', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color, flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.78rem', color: 'var(--crm-text-secondary)', fontWeight: 500 }}>{r.label}</span>
                                                    </div>
                                                    <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--crm-border)', overflow: 'hidden' }}>
                                                        <div style={{ width: `${barPct}%`, height: '100%', backgroundColor: r.color, borderRadius: '4px' }} />
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--crm-text-primary)', fontWeight: 600, textAlign: 'right' }}>{fmtCr(r.totalBudget)}</div>
                                                    <div style={{ fontSize: '0.78rem', color: r.color, fontWeight: 700, textAlign: 'right' }}>{fmtCr(r.weighted)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-dim)', textAlign: 'right' }}>{prob}% prob</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Top leads by value */}
                            {topLeadsByValue.length > 0 && (
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardTitle}>Top Leads by Deal Value</span>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                                {['Lead', 'Stage', 'Budget Range', 'Weighted Value', 'Commission'].map(h => (
                                                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.68rem', color: 'var(--crm-text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topLeadsByValue.map((l, i) => {
                                                const mid = ((l.budget_min || 0) + (l.budget_max || l.budget_min || 0)) / 2
                                                const weighted = mid * (STAGE_PROB[l.status] || 0)
                                                const commission = weighted * COMMISSION_RATE
                                                const stageInfo = STAGES.find(s => s.key === l.status)
                                                return (
                                                    <tr key={l.id} style={{ borderBottom: i < topLeadsByValue.length - 1 ? '1px solid var(--crm-border)' : 'none' }}
                                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                    >
                                                        <td style={{ padding: '8px 10px' }}>
                                                            <a href={`/crm/leads/${l.id}`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)', textDecoration: 'none' }}>{l.name}</a>
                                                        </td>
                                                        <td style={{ padding: '8px 10px' }}>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: stageInfo?.color || 'var(--crm-text-dim)', backgroundColor: `${stageInfo?.color || '#6b7280'}15`, padding: '2px 8px', borderRadius: '999px' }}>
                                                                {stageInfo?.label || l.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '8px 10px', fontSize: '0.8rem', color: 'var(--crm-text-secondary)' }}>
                                                            {l.budget_min && l.budget_max
                                                                ? `${fmtCr(l.budget_min)} – ${fmtCr(l.budget_max)}`
                                                                : fmtCr(l.budget_min || l.budget_max || 0)
                                                            }
                                                        </td>
                                                        <td style={{ padding: '8px 10px', fontSize: '0.875rem', fontWeight: 700, color: '#6366f1' }}>{fmtCr(weighted)}</td>
                                                        <td style={{ padding: '8px 10px', fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>{fmtCr(commission)}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
            )}
        </div>
    )
}
