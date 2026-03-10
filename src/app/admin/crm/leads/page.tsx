'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
    Search, Filter, UserPlus, Phone, Mail, ChevronLeft, ChevronRight,
    X, Trash2, ArrowLeft
} from 'lucide-react'
import styles from '../../admin.module.css'

interface Lead {
    id: string
    name: string
    email: string | null
    phone: string | null
    source: string
    status: string
    priority: string
    assigned_agent_id: string | null
    created_at: string
    last_contacted_at: string | null
    agents?: { name: string } | null
    properties?: { title: string } | null
    projects?: { name: string } | null
}

interface Agent {
    id: string
    name: string
}

const sourceLabels: Record<string, string> = {
    website: 'Website', meta_ads: 'Meta Ads', google_ads: 'Google Ads',
    '99acres': '99acres', magicbricks: 'MagicBricks', housing: 'Housing.com',
    justdial: 'JustDial', chatbot: 'Chatbot', whatsapp: 'WhatsApp',
    manual: 'Manual', referral: 'Referral',
}

const statusColors: Record<string, string> = {
    new: '#3b82f6', contacted: '#f59e0b', qualified: '#8b5cf6',
    negotiation: '#f97316', site_visit: '#06b6d4', converted: '#22c55e', lost: '#ef4444',
}

const statuses = ['all', 'new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted', 'lost']
const sources = ['all', 'website', 'meta_ads', 'google_ads', '99acres', 'magicbricks', 'housing', 'justdial', 'chatbot', 'whatsapp', 'manual', 'referral']
const priorities = ['all', 'hot', 'warm', 'cold']

export default function LeadsPage() {
    const searchParams = useSearchParams()
    const showNewForm = searchParams.get('new') === 'true'

    const [leads, setLeads] = useState<Lead[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [showAddModal, setShowAddModal] = useState(showNewForm)
    const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', source: 'manual', notes: '', priority: 'warm' })
    const [saving, setSaving] = useState(false)

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), limit: '25' })
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (sourceFilter !== 'all') params.set('source', sourceFilter)
        if (priorityFilter !== 'all') params.set('priority', priorityFilter)
        if (search) params.set('search', search)

        const res = await fetch(`/api/crm/leads?${params}`)
        if (res.ok) {
            const data = await res.json()
            setLeads(data.leads || [])
            setTotal(data.total || 0)
        }
        setLoading(false)
    }, [page, statusFilter, sourceFilter, priorityFilter, search])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    useEffect(() => {
        async function fetchAgents() {
            const res = await fetch('/api/crm/leads?limit=0') // just to init
            // Actually fetch agents from supabase client-side
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data } = await supabase.from('agents').select('id, name')
            if (data) setAgents(data)
        }
        fetchAgents()
    }, [])

    const handleAddLead = async () => {
        if (!newLead.name) return
        setSaving(true)
        const res = await fetch('/api/crm/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLead),
        })
        if (res.ok) {
            setShowAddModal(false)
            setNewLead({ name: '', email: '', phone: '', source: 'manual', notes: '', priority: 'warm' })
            fetchLeads()
        }
        setSaving(false)
    }

    const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Delete this lead?')) return
        await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' })
        fetchLeads()
    }

    const handleStatusChange = async (id: string, newStatus: string, e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation()
        await fetch(`/api/crm/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        })
        fetchLeads()
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        if (diffHours < 1) return 'Just now'
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    const totalPages = Math.ceil(total / 25)

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/crm" style={{ color: '#6b7280' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>Leads ({total})</h1>
                        <p className={styles.pageSubtitle}>Manage all your leads from every platform</p>
                    </div>
                </div>
                <button onClick={() => setShowAddModal(true)} className={styles.addButton}>
                    <UserPlus size={18} /> Add Lead
                </button>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        style={{
                            width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                            border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem',
                        }}
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={styles.addButton}
                    style={{ backgroundColor: showFilters ? '#183C38' : '#f3f4f6', color: showFilters ? '#fff' : '#374151' }}
                >
                    <Filter size={16} /> Filters
                </button>
            </div>

            {showFilters && (
                <div style={{
                    display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
                    padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
                }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                            style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                            {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Source</label>
                        <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
                            style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                            {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : sourceLabels[s] || s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Priority</label>
                        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }}
                            style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                            {priorities.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className={styles.filterTabs}>
                {statuses.map(status => (
                    <button
                        key={status}
                        className={`${styles.filterTab} ${statusFilter === status ? styles.filterTabActive : ''}`}
                        onClick={() => { setStatusFilter(status); setPage(1) }}
                    >
                        {status === 'all' ? 'All' : status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Leads Table */}
            {loading ? (
                <div className={styles.emptyState}>Loading leads...</div>
            ) : leads.length > 0 ? (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Interest</th>
                                    <th>Added</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead) => (
                                    <tr key={lead.id} style={{ cursor: 'pointer' }}
                                        onClick={() => window.location.href = `/admin/crm/leads/${lead.id}`}>
                                        <td style={{ fontWeight: 500 }}>{lead.name}</td>
                                        <td>
                                            {lead.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                                                    <Phone size={12} /> {lead.phone}
                                                </div>
                                            )}
                                            {lead.email && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                                                    <Mail size={12} /> {lead.email}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#f3f4f6' }}>
                                                {sourceLabels[lead.source] || lead.source}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value, e)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem',
                                                    border: '1px solid #e5e7eb', backgroundColor: `${statusColors[lead.status]}15`,
                                                    color: statusColors[lead.status], fontWeight: 500, cursor: 'pointer',
                                                }}
                                            >
                                                {statuses.filter(s => s !== 'all').map(s => (
                                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 600,
                                                color: lead.priority === 'hot' ? '#ef4444' : lead.priority === 'warm' ? '#f59e0b' : '#9ca3af',
                                            }}>
                                                {lead.priority === 'hot' ? '🔥 Hot' : lead.priority === 'warm' ? '🟡 Warm' : '🔵 Cold'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                                            {lead.properties?.title || lead.projects?.project_name || '-'}
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                                            {formatDate(lead.created_at)}
                                        </td>
                                        <td>
                                            <button
                                                onClick={(e) => handleDeleteLead(lead.id, e)}
                                                className={styles.iconBtn}
                                                style={{ color: '#dc2626' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                style={{ padding: '0.5rem', cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page > 1 ? 1 : 0.4, border: 'none', background: 'none' }}>
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Page {page} of {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                style={{ padding: '0.5rem', cursor: page < totalPages ? 'pointer' : 'not-allowed', opacity: page < totalPages ? 1 : 0.4, border: 'none', background: 'none' }}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateTitle}>No leads found</div>
                    <p className={styles.emptyStateText}>
                        {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add leads manually or connect your ad platforms.'}
                    </p>
                </div>
            )}

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className={styles.modal} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Add New Lead</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Name *</label>
                                <input type="text" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Email</label>
                                    <input type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Phone</label>
                                    <input type="tel" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Source</label>
                                    <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                        {sources.filter(s => s !== 'all').map(s => (
                                            <option key={s} value={s}>{sourceLabels[s] || s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Priority</label>
                                    <select value={newLead.priority} onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                        <option value="hot">🔥 Hot</option>
                                        <option value="warm">🟡 Warm</option>
                                        <option value="cold">🔵 Cold</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Notes</label>
                                <textarea value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={3}
                                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical' }} />
                            </div>
                        </div>

                        <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                            <button onClick={() => setShowAddModal(false)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleAddLead} className={styles.addButton} disabled={saving || !newLead.name}>
                                {saving ? 'Saving...' : 'Add Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
