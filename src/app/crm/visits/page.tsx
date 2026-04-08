'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { CalendarCheck, Phone, Clock, CheckCircle2, XCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import styles from '../crm.module.css'

interface Visit {
    id: string
    lead_id: string
    visit_date: string
    visit_time?: string
    status: string
    outcome?: string
    notes?: string
    leads?: { name: string; phone: string | null; email: string | null }
    properties?: { title: string } | null
    projects?: { project_name: string } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    scheduled: { label: 'Scheduled', color: '#f59e0b', icon: <Clock size={14} /> },
    completed: { label: 'Completed', color: '#22c55e', icon: <CheckCircle2 size={14} /> },
    no_show: { label: 'No Show', color: '#ef4444', icon: <XCircle size={14} /> },
    cancelled: { label: 'Cancelled', color: 'var(--crm-text-faint)', icon: <AlertCircle size={14} /> },
}

const outcomeConfig: Record<string, { label: string; color: string }> = {
    interested: { label: 'Interested', color: '#22c55e' },
    not_interested: { label: 'Not Interested', color: '#ef4444' },
    closed: { label: 'Closed Deal', color: 'var(--crm-accent)' },
    follow_up: { label: 'Follow Up', color: '#3b82f6' },
}

function getWeekDates(date: Date): Date[] {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start); d.setDate(start.getDate() + i); return d
    })
}

export default function VisitsPage() {
    const [visits, setVisits] = useState<Visit[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'upcoming' | 'week' | 'all'>('upcoming')
    const [weekOffset, setWeekOffset] = useState(0)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [editVisit, setEditVisit] = useState<Visit | null>(null)
    const [editForm, setEditForm] = useState({ visit_date: '', visit_time: '', notes: '', status: '', outcome: '' })
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [outcomeVisitId, setOutcomeVisitId] = useState<string | null>(null)

    const today = new Date()
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7)
    const weekDates = getWeekDates(currentWeekStart)

    const fetchVisits = useCallback(async () => {
        setLoading(true)
        let url = '/api/crm/site-visits?'
        if (viewMode === 'upcoming') url += 'upcoming=true'
        const res = await fetch(url).catch(() => null)
        if (res?.ok) { const d = await res.json(); setVisits(d.visits || []) }
        setLoading(false)
    }, [viewMode])

    useEffect(() => { fetchVisits() }, [fetchVisits])

    const handleUpdateStatus = async (id: string, status: string, outcome?: string) => {
        setUpdatingId(id)
        await fetch('/api/crm/site-visits', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, outcome }),
        })
        setUpdatingId(null)
        fetchVisits()
    }

    const openEdit = (v: Visit) => {
        setEditVisit(v)
        setEditForm({ visit_date: v.visit_date, visit_time: v.visit_time || '', notes: v.notes || '', status: v.status, outcome: v.outcome || '' })
    }

    const handleSaveEdit = async () => {
        if (!editVisit) return
        setSaving(true)
        await fetch('/api/crm/site-visits', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editVisit.id, visit_date: editForm.visit_date, visit_time: editForm.visit_time || null, notes: editForm.notes || null, status: editForm.status, outcome: editForm.outcome || null }),
        })
        setSaving(false)
        setEditVisit(null)
        fetchVisits()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this site visit? This cannot be undone.')) return
        setDeletingId(id)
        await fetch(`/api/crm/site-visits?id=${id}`, { method: 'DELETE' })
        setDeletingId(null)
        fetchVisits()
    }

    const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    const formatTime = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
    }

    const visitsOnDate = (date: Date) => {
        const ds = date.toISOString().split('T')[0]
        return visits.filter(v => v.visit_date === ds)
    }

    const isToday = (date: Date) => date.toDateString() === today.toDateString()
    const isPast = (date: string) => new Date(date + 'T23:59:59') < today

    return (
        <div className={styles.pageContent}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Site Visits</h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Track and manage all scheduled site visits</p>
            </div>

            {/* View Toggle */}
            <div className={styles.pillTabs} style={{ marginBottom: '1.5rem' }}>
                {(['upcoming', 'week', 'all'] as const).map(v => (
                    <button key={v} className={`${styles.pillTab} ${viewMode === v ? styles.pillTabActive : ''}`} onClick={() => setViewMode(v)}>
                        {v === 'upcoming' ? 'Upcoming' : v === 'week' ? 'Week View' : 'All Visits'}
                    </button>
                ))}
            </div>

            {/* Week navigator */}
            {viewMode === 'week' && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <button onClick={() => setWeekOffset(w => w - 1)} className={styles.btnSecondary} style={{ padding: '0.375rem 0.625rem' }}><ChevronLeft size={16} /></button>
                        <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                            {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button onClick={() => setWeekOffset(w => w + 1)} className={styles.btnSecondary} style={{ padding: '0.375rem 0.625rem' }}><ChevronRight size={16} /></button>
                        <button onClick={() => setWeekOffset(0)} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>Today</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                        {weekDates.map((date, i) => {
                            const dayVisits = visitsOnDate(date)
                            const isT = isToday(date)
                            return (
                                <div key={i} style={{
                                    backgroundColor: isT ? 'var(--crm-accent-bg)' : 'var(--crm-surface)',
                                    border: `1px solid ${isT ? 'var(--crm-accent)' : 'var(--crm-border)'}`,
                                    borderRadius: '0.5rem', padding: '0.625rem', minHeight: '100px',
                                }}>
                                    <div style={{ fontSize: '0.6875rem', color: isT ? 'var(--crm-accent)' : 'var(--crm-text-faint)', fontWeight: isT ? 700 : 500, marginBottom: '0.5rem' }}>
                                        {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                                        <span style={{ display: 'block', fontSize: '1rem', color: isT ? 'var(--crm-accent)' : 'var(--crm-text-muted)', lineHeight: 1.2 }}>{date.getDate()}</span>
                                    </div>
                                    {dayVisits.map(v => (
                                        <Link key={v.id} href={`/crm/leads/${v.lead_id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                padding: '4px 6px', borderRadius: '4px', marginBottom: '4px',
                                                backgroundColor: `${statusConfig[v.status]?.color}20`,
                                                borderLeft: `3px solid ${statusConfig[v.status]?.color}`,
                                                fontSize: '0.6875rem',
                                            }}>
                                                <div style={{ color: 'var(--crm-text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {v.leads?.name}
                                                </div>
                                                {v.visit_time && <div style={{ color: 'var(--crm-text-faint)' }}>{formatTime(v.visit_time)}</div>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* List view */}
            {(viewMode === 'upcoming' || viewMode === 'all') && (
                loading ? <div className={styles.emptyState}>Loading...</div> :
                visits.length === 0 ? (
                    <div className={styles.card}><div className={styles.emptyState}>
                        <CalendarCheck size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                        <p style={{ color: 'var(--crm-text-secondary)', fontWeight: 500 }}>No {viewMode === 'upcoming' ? 'upcoming ' : ''}visits</p>
                        <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Schedule visits from a lead&apos;s profile page</p>
                    </div></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {visits.map(v => {
                            const sc = statusConfig[v.status]
                            const oc = v.outcome ? outcomeConfig[v.outcome] : null
                            const past = isPast(v.visit_date)
                            return (
                                <div key={v.id} className={styles.card} style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{v.leads?.name || 'Unknown'}</span>
                                                <span style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', fontWeight: 600,
                                                    color: sc?.color, backgroundColor: `${sc?.color}20`,
                                                    padding: '2px 8px', borderRadius: '999px',
                                                }}>
                                                    {sc?.icon} {sc?.label}
                                                </span>
                                                {oc && <span style={{ fontSize: '0.6875rem', color: oc.color, backgroundColor: `${oc.color}20`, padding: '2px 8px', borderRadius: '999px' }}>{oc.label}</span>}
                                            </div>

                                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CalendarCheck size={12} /> {formatDate(v.visit_date)}
                                                </span>
                                                {v.visit_time && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {formatTime(v.visit_time)}</span>}
                                                {v.leads?.phone && <a href={`tel:${v.leads.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e', textDecoration: 'none' }}><Phone size={12} /> {v.leads.phone}</a>}
                                            </div>

                                            {(v.properties?.title || v.projects?.project_name) && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--crm-accent)', marginTop: '0.25rem' }}>
                                                    📍 {v.properties?.title || v.projects?.project_name}
                                                </div>
                                            )}

                                            {v.notes && <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', marginTop: '0.375rem', fontStyle: 'italic' }}>{v.notes}</div>}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end' }}>
                                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                <Link href={`/crm/leads/${v.lead_id}`} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                                    View Lead
                                                </Link>
                                                <button onClick={() => openEdit(v)} className={styles.btnSecondary} style={{ fontSize: '0.6875rem', padding: '0.375rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Edit">
                                                    <Pencil size={12} />
                                                </button>
                                                <button onClick={() => handleDelete(v.id)} disabled={deletingId === v.id} className={styles.btnSecondary} style={{ fontSize: '0.6875rem', padding: '0.375rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', borderColor: '#ef444430' }} title="Delete">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            {v.status === 'scheduled' && past && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end' }}>
                                                    {outcomeVisitId === v.id ? (
                                                        <>
                                                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-muted)', fontWeight: 600 }}>Select outcome:</div>
                                                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                                <button onClick={() => { handleUpdateStatus(v.id, 'completed', 'interested'); setOutcomeVisitId(null) }} disabled={updatingId === v.id}
                                                                    className={styles.btnPrimary} style={{ fontSize: '0.625rem', padding: '3px 8px', backgroundColor: '#22c55e' }}>Interested</button>
                                                                <button onClick={() => { handleUpdateStatus(v.id, 'completed', 'not_interested'); setOutcomeVisitId(null) }} disabled={updatingId === v.id}
                                                                    className={styles.btnPrimary} style={{ fontSize: '0.625rem', padding: '3px 8px', backgroundColor: '#ef4444' }}>Not Interested</button>
                                                                <button onClick={() => { handleUpdateStatus(v.id, 'completed', 'follow_up'); setOutcomeVisitId(null) }} disabled={updatingId === v.id}
                                                                    className={styles.btnPrimary} style={{ fontSize: '0.625rem', padding: '3px 8px', backgroundColor: '#3b82f6' }}>Follow Up</button>
                                                                <button onClick={() => { handleUpdateStatus(v.id, 'completed', 'closed'); setOutcomeVisitId(null) }} disabled={updatingId === v.id}
                                                                    className={styles.btnPrimary} style={{ fontSize: '0.625rem', padding: '3px 8px', backgroundColor: 'var(--crm-accent)' }}>Closed Deal</button>
                                                            </div>
                                                            <button onClick={() => setOutcomeVisitId(null)} className={styles.btnSecondary} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>Cancel</button>
                                                        </>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                            <button onClick={() => setOutcomeVisitId(v.id)} disabled={updatingId === v.id}
                                                                className={styles.btnPrimary} style={{ fontSize: '0.6875rem', padding: '0.375rem 0.625rem', backgroundColor: '#22c55e' }}>
                                                                <CheckCircle2 size={12} /> Visited
                                                            </button>
                                                            <button onClick={() => handleUpdateStatus(v.id, 'no_show')} disabled={updatingId === v.id}
                                                                className={styles.btnSecondary} style={{ fontSize: '0.6875rem', padding: '0.375rem 0.625rem', color: '#ef4444', borderColor: '#ef444430' }}>
                                                                <XCircle size={12} /> No Show
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {v.status === 'scheduled' && !past && (
                                                <button onClick={() => handleUpdateStatus(v.id, 'cancelled')} disabled={updatingId === v.id}
                                                    className={styles.btnSecondary} style={{ fontSize: '0.6875rem', padding: '0.375rem 0.625rem', color: 'var(--crm-text-faint)' }}>
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}

            {/* Edit Modal */}
            {editVisit && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setEditVisit(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        backgroundColor: 'var(--crm-surface)', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '420px',
                        border: '1px solid var(--crm-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Edit Site Visit</h3>
                            <button onClick={() => setEditVisit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--crm-text-faint)', padding: '4px' }}><X size={18} /></button>
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', marginBottom: '1rem' }}>
                            Lead: <strong style={{ color: 'var(--crm-text-secondary)' }}>{editVisit.leads?.name || 'Unknown'}</strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-faint)', display: 'block', marginBottom: '4px' }}>Visit Date</label>
                                <input type="date" value={editForm.visit_date} onChange={e => setEditForm(f => ({ ...f, visit_date: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', color: 'var(--crm-text-secondary)', fontSize: '0.875rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-faint)', display: 'block', marginBottom: '4px' }}>Visit Time</label>
                                <input type="time" value={editForm.visit_time} onChange={e => setEditForm(f => ({ ...f, visit_time: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', color: 'var(--crm-text-secondary)', fontSize: '0.875rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-faint)', display: 'block', marginBottom: '4px' }}>Status</label>
                                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', color: 'var(--crm-text-secondary)', fontSize: '0.875rem' }}>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="no_show">No Show</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-faint)', display: 'block', marginBottom: '4px' }}>Outcome</label>
                                <select value={editForm.outcome} onChange={e => setEditForm(f => ({ ...f, outcome: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', color: 'var(--crm-text-secondary)', fontSize: '0.875rem' }}>
                                    <option value="">No outcome</option>
                                    <option value="interested">Interested</option>
                                    <option value="not_interested">Not Interested</option>
                                    <option value="follow_up">Follow Up</option>
                                    <option value="closed">Closed Deal</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-faint)', display: 'block', marginBottom: '4px' }}>Notes</label>
                                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--crm-border)', background: 'var(--crm-bg)', color: 'var(--crm-text-secondary)', fontSize: '0.875rem', resize: 'vertical' }}
                                    placeholder="Add notes..." />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditVisit(null)} className={styles.btnSecondary} style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>Cancel</button>
                            <button onClick={handleSaveEdit} disabled={saving || !editForm.visit_date} className={styles.btnPrimary} style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
