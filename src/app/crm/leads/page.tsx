'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, UserPlus, Phone, ChevronLeft, ChevronRight, X, Trash2, ArrowLeft, Filter, Download, Star } from 'lucide-react'
import styles from '../crm.module.css'

interface Lead {
    id: string; name: string; email: string | null; phone: string | null
    source: string; status: string; priority: string; created_at: string
    score?: number
    properties?: { title: string } | null; projects?: { project_name: string } | null
}

const sourceLabels: Record<string, string> = {
    website: 'Website', meta_ads: 'Meta Ads', google_ads: 'Google Ads',
    '99acres': '99acres', magicbricks: 'MagicBricks', housing: 'Housing.com',
    justdial: 'JustDial', chatbot: 'Chatbot', whatsapp: 'WhatsApp', manual: 'Manual', referral: 'Referral',
}
const statusConfig: Record<string, { color: string; label: string }> = {
    new: { color: '#3b82f6', label: 'New' }, contacted: { color: '#f59e0b', label: 'Contacted' },
    qualified: { color: '#8b5cf6', label: 'Qualified' }, negotiation: { color: '#f97316', label: 'Negotiation' },
    site_visit: { color: '#06b6d4', label: 'Site Visit' }, converted: { color: '#22c55e', label: 'Converted' },
    lost: { color: '#ef4444', label: 'Lost' },
}
const statuses = ['all', 'new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted', 'lost']
const sources = ['all', 'website', 'meta_ads', 'google_ads', '99acres', 'magicbricks', 'housing', 'justdial', 'chatbot', 'manual', 'referral']
const priorities = ['all', 'hot', 'warm', 'cold']

function ScoreDot({ score }: { score: number }) {
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#6b7280'
    return (
        <span title={`Score: ${score}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '0.6875rem', color, fontWeight: 600,
        }}>
            <Star size={10} fill={color} stroke="none" />{score}
        </span>
    )
}

export default function LeadsPage() {
    const searchParams = useSearchParams()
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [showAddModal, setShowAddModal] = useState(searchParams?.get('new') === 'true')
    const [newLead, setNewLead] = useState({
        name: '', email: '', phone: '', source: 'manual', notes: '',
        priority: 'warm', preferred_location: '', property_type: '',
        budget_min: '', budget_max: '',
    })
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        const p = new URLSearchParams({ page: String(page), limit: '25' })
        if (statusFilter !== 'all') p.set('status', statusFilter)
        if (sourceFilter !== 'all') p.set('source', sourceFilter)
        if (priorityFilter !== 'all') p.set('priority', priorityFilter)
        if (search) p.set('search', search)
        const res = await fetch(`/api/crm/leads?${p}`)
        if (res.ok) { const d = await res.json(); setLeads(d.leads || []); setTotal(d.total || 0) }
        setLoading(false)
    }, [page, statusFilter, sourceFilter, priorityFilter, search])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    const handleAddLead = async () => {
        if (!newLead.name) return; setSaving(true)
        const payload = {
            ...newLead,
            budget_min: newLead.budget_min ? Number(newLead.budget_min) : undefined,
            budget_max: newLead.budget_max ? Number(newLead.budget_max) : undefined,
        }
        const res = await fetch('/api/crm/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.ok) {
            setShowAddModal(false)
            setNewLead({ name: '', email: '', phone: '', source: 'manual', notes: '', priority: 'warm', preferred_location: '', property_type: '', budget_min: '', budget_max: '' })
            fetchLeads()
        }
        setSaving(false)
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        await fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
        fetchLeads()
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); if (!confirm('Delete this lead?')) return
        await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' }); fetchLeads()
    }

    const handleExport = async () => {
        setExporting(true)
        const p = new URLSearchParams()
        if (statusFilter !== 'all') p.set('status', statusFilter)
        if (sourceFilter !== 'all') p.set('source', sourceFilter)
        if (priorityFilter !== 'all') p.set('priority', priorityFilter)
        if (search) p.set('search', search)
        const res = await fetch(`/api/crm/export?${p}`)
        if (res.ok) {
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
            a.click(); URL.revokeObjectURL(url)
        }
        setExporting(false)
    }

    const formatRelative = (d: string) => {
        const ms = Date.now() - new Date(d).getTime()
        const h = Math.floor(ms / 3600000); const dd = Math.floor(ms / 86400000)
        if (h < 1) return 'Just now'; if (h < 24) return `${h}h`; if (dd < 7) return `${dd}d`
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    const totalPages = Math.ceil(total / 25)

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Leads ({total})</h1>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>All leads from every platform</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExport} disabled={exporting} className={styles.btnSecondary}>
                        <Download size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}><UserPlus size={14} /> Add Lead</button>
                </div>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                    <input type="text" placeholder="Search name, email, phone..." value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }} className={styles.searchInput} />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={showFilters ? styles.btnPrimary : styles.btnSecondary}>
                    <Filter size={14} /> Filters
                </button>
            </div>

            {showFilters && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#161822', borderRadius: '0.5rem', border: '1px solid #1e2030', flexWrap: 'wrap' }}>
                    <div>
                        <label className={styles.formLabel}>Source</label>
                        <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1) }} className={styles.formSelect} style={{ minWidth: '140px' }}>
                            {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : sourceLabels[s] || s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={styles.formLabel}>Priority</label>
                        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1) }} className={styles.formSelect} style={{ minWidth: '120px' }}>
                            {priorities.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                    </div>
                    <button onClick={() => { setSourceFilter('all'); setPriorityFilter('all'); setSearch(''); setPage(1) }}
                        className={styles.btnSecondary} style={{ alignSelf: 'flex-end', fontSize: '0.75rem' }}>
                        <X size={12} /> Clear
                    </button>
                </div>
            )}

            {/* Status Tabs */}
            <div className={styles.pillTabs} style={{ marginBottom: '1rem' }}>
                {statuses.map(s => (
                    <button key={s} className={`${styles.pillTab} ${statusFilter === s ? styles.pillTabActive : ''}`}
                        onClick={() => { setStatusFilter(s); setPage(1) }}>
                        {s === 'all' ? 'All' : statusConfig[s]?.label || s}
                    </button>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className={styles.emptyState}>Loading...</div>
            ) : leads.length > 0 ? (
                <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Name</th><th>Contact</th><th>Source</th><th>Status</th><th>Score</th><th>Interest</th><th>Added</th><th></th></tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
                                        <td>
                                            <div style={{ fontWeight: 500, color: '#e5e7eb' }}>{lead.name}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#4b5563' }}>
                                                {lead.priority === 'hot' ? '🔥' : lead.priority === 'warm' ? '🟡' : '🔵'} {lead.priority}
                                            </div>
                                        </td>
                                        <td>
                                            {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}><Phone size={10} /> {lead.phone}</div>}
                                            {lead.email && <div style={{ fontSize: '0.6875rem', color: '#4b5563' }}>{lead.email}</div>}
                                        </td>
                                        <td><span className={styles.badge} style={{ backgroundColor: '#1e2030', color: '#9ca3af' }}>{sourceLabels[lead.source] || lead.source}</span></td>
                                        <td>
                                            <select value={lead.status} onClick={e => e.stopPropagation()} onChange={e => handleStatusChange(lead.id, e.target.value)}
                                                style={{
                                                    padding: '0.2rem 0.4rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 600,
                                                    border: '1px solid #2d3148', cursor: 'pointer',
                                                    backgroundColor: `${statusConfig[lead.status]?.color}20`, color: statusConfig[lead.status]?.color,
                                                }}>
                                                {statuses.filter(s => s !== 'all').map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
                                            </select>
                                        </td>
                                        <td>{lead.score != null ? <ScoreDot score={lead.score} /> : <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>—</span>}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#6b7280' }}>{lead.properties?.title || lead.projects?.project_name || '—'}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#4b5563' }}>{formatRelative(lead.created_at)}</td>
                                        <td><button onClick={e => handleDelete(lead.id, e)} className={styles.btnIcon} style={{ color: '#ef4444' }}><Trash2 size={12} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid #1e2030' }}>
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={styles.btnIcon}><ChevronLeft size={16} /></button>
                            <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Page {page} of {totalPages} · {total} leads</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={styles.btnIcon}><ChevronRight size={16} /></button>
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.card}><div className={styles.emptyState}>
                    <p style={{ color: '#e5e7eb', fontWeight: 500, marginBottom: '0.5rem' }}>No leads found</p>
                    <p style={{ fontSize: '0.8125rem' }}>{search ? 'Try adjusting your search.' : 'Add leads manually or connect ad platforms.'}</p>
                </div></div>
            )}

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className={styles.modal} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e5e7eb' }}>Add New Lead</h3>
                            <button onClick={() => setShowAddModal(false)} className={styles.btnIcon}><X size={16} /></button>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Name *</label>
                            <input type="text" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} className={styles.formInput} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Email</label>
                                <input type="email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Phone</label>
                                <input type="tel" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} className={styles.formInput} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Source</label>
                                <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })} className={styles.formSelect}>
                                    {sources.filter(s => s !== 'all').map(s => <option key={s} value={s}>{sourceLabels[s] || s}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Priority</label>
                                <select value={newLead.priority} onChange={e => setNewLead({ ...newLead, priority: e.target.value })} className={styles.formSelect}>
                                    <option value="hot">🔥 Hot</option><option value="warm">🟡 Warm</option><option value="cold">🔵 Cold</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Preferred Location</label>
                                <input type="text" value={newLead.preferred_location} onChange={e => setNewLead({ ...newLead, preferred_location: e.target.value })} placeholder="e.g. Whitefield, Bangalore" className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Property Type</label>
                                <input type="text" value={newLead.property_type} onChange={e => setNewLead({ ...newLead, property_type: e.target.value })} placeholder="e.g. 2BHK Flat" className={styles.formInput} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Budget Min (₹)</label>
                                <input type="number" value={newLead.budget_min} onChange={e => setNewLead({ ...newLead, budget_min: e.target.value })} placeholder="e.g. 5000000" className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Budget Max (₹)</label>
                                <input type="number" value={newLead.budget_max} onChange={e => setNewLead({ ...newLead, budget_max: e.target.value })} placeholder="e.g. 12000000" className={styles.formInput} />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Notes</label>
                            <textarea value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} rows={3} className={styles.formInput} style={{ resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddModal(false)} className={styles.btnSecondary}>Cancel</button>
                            <button onClick={handleAddLead} className={styles.btnPrimary} disabled={saving || !newLead.name}>{saving ? 'Saving...' : 'Add Lead'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
