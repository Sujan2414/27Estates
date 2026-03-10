'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from '../crm.module.css'

interface Lead {
    id: string; name: string; email: string | null; phone: string | null
    source: string; status: string; priority: string; created_at: string
    projects?: { project_name: string } | null
}

const statusTabs = [
    { key: 'all', label: 'All', color: '#BFA270' },
    { key: 'new', label: 'New', color: '#3b82f6' },
    { key: 'contacted', label: 'Contacted', color: '#f59e0b' },
    { key: 'qualified', label: 'Qualified', color: '#8b5cf6' },
    { key: 'negotiation', label: 'Negotiation', color: '#f97316' },
    { key: 'site_visit', label: 'Site Visit', color: '#06b6d4' },
    { key: 'converted', label: 'Converted', color: '#22c55e' },
    { key: 'lost', label: 'Lost', color: '#ef4444' },
]

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

const LIMIT = 25

export default function PipelinePage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [changingStatus, setChangingStatus] = useState<string | null>(null)

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) })
        if (activeTab !== 'all') params.set('status', activeTab)
        if (search.trim()) params.set('search', search.trim())

        const res = await fetch(`/api/crm/leads?${params}`).catch(() => null)
        if (res?.ok) {
            const d = await res.json()
            setLeads(d.leads || [])
            setTotal(d.total || 0)
        }
        setLoading(false)
    }, [activeTab, search, page])

    // Fetch status counts once
    useEffect(() => {
        fetch('/api/crm/stats').then(r => r.ok ? r.json() : null).then(d => {
            if (d?.byStatus) {
                const c: Record<string, number> = { all: d.total || 0 }
                Object.entries(d.byStatus).forEach(([k, v]) => { c[k] = v as number })
                setCounts(c)
            }
        }).catch(() => {})
    }, [])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        setChangingStatus(leadId)
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        await fetch(`/api/crm/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        }).catch(() => {})
        setChangingStatus(null)
        // Refresh counts
        fetch('/api/crm/stats').then(r => r.ok ? r.json() : null).then(d => {
            if (d?.byStatus) {
                const c: Record<string, number> = { all: d.total || 0 }
                Object.entries(d.byStatus).forEach(([k, v]) => { c[k] = v as number })
                setCounts(c)
            }
        }).catch(() => {})
    }

    const totalPages = Math.ceil(total / LIMIT)

    const formatRelative = (d: string) => {
        const ms = Date.now() - new Date(d).getTime()
        const h = Math.floor(ms / 3600000); const dd = Math.floor(ms / 86400000)
        if (h < 1) return 'Just now'; if (h < 24) return `${h}h ago`; if (dd < 7) return `${dd}d ago`
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Link href="/crm" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Pipeline</h1>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                        Manage leads across stages &middot; {total.toLocaleString('en-IN')} leads
                    </p>
                </div>
            </div>

            {/* Status Tabs with counts */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {statusTabs.map(tab => {
                    const count = counts[tab.key] || 0
                    const isActive = activeTab === tab.key
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setPage(1) }}
                            style={{
                                padding: '0.5rem 0.875rem',
                                borderRadius: '0.5rem',
                                border: isActive ? `1px solid ${tab.color}` : '1px solid #1e2030',
                                backgroundColor: isActive ? `${tab.color}15` : '#161822',
                                color: isActive ? tab.color : '#6b7280',
                                fontSize: '0.8125rem',
                                fontWeight: isActive ? 600 : 500,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'all 0.15s',
                            }}
                        >
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: tab.color }} />
                            {tab.label}
                            <span style={{
                                fontSize: '0.6875rem', fontWeight: 600,
                                backgroundColor: isActive ? `${tab.color}25` : '#1e2030',
                                padding: '0.0625rem 0.4375rem', borderRadius: '999px',
                                color: isActive ? tab.color : '#4b5563',
                            }}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '1rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                <input
                    className={styles.searchInput}
                    placeholder="Search by name, email, phone..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
            </div>

            {/* Leads Table */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.emptyState} style={{ padding: '2rem' }}>Loading...</div>
                ) : leads.length > 0 ? (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Lead</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Interest</th>
                                    <th>Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => {
                                    const src = sourceConfig[lead.source]
                                    const statusColor = statusTabs.find(t => t.key === lead.status)?.color || '#6b7280'
                                    return (
                                        <tr key={lead.id} style={{ cursor: 'pointer' }}
                                            onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
                                            <td>
                                                <div style={{ fontWeight: 500, color: '#e5e7eb' }}>{lead.name}</div>
                                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6875rem', color: '#6b7280', marginTop: '2px' }}>
                                                    {lead.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Phone size={9} />{lead.phone}</span>}
                                                    {lead.email && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Mail size={9} />{lead.email}</span>}
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
                                                <select
                                                    value={lead.status}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => handleStatusChange(lead.id, e.target.value)}
                                                    disabled={changingStatus === lead.id}
                                                    style={{
                                                        backgroundColor: `${statusColor}15`,
                                                        color: statusColor,
                                                        border: `1px solid ${statusColor}40`,
                                                        borderRadius: '0.375rem',
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        outline: 'none',
                                                    }}
                                                >
                                                    {statusTabs.filter(t => t.key !== 'all').map(t => (
                                                        <option key={t.key} value={t.key}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ fontSize: '0.8125rem' }}>
                                                {lead.priority === 'hot' ? '🔥 Hot' : lead.priority === 'warm' ? '🟡 Warm' : '🔵 Cold'}
                                            </td>
                                            <td>
                                                {lead.projects?.project_name ? (
                                                    <span style={{ fontSize: '0.75rem', color: '#BFA270' }}>{lead.projects.project_name}</span>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                                {formatRelative(lead.created_at)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.75rem', borderTop: '1px solid #1e2030',
                            }}>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString('en-IN')}
                                </span>
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    <button
                                        className={styles.btnIcon}
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => p - 1)}
                                        style={{ opacity: page <= 1 ? 0.3 : 1 }}
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        className={styles.btnIcon}
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                        style={{ opacity: page >= totalPages ? 0.3 : 1 }}
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        {search ? 'No leads match your search.' : 'No leads in this stage yet.'}
                    </div>
                )}
            </div>
        </div>
    )
}
