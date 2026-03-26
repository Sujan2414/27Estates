'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, Plus, X, RefreshCw } from 'lucide-react'
import styles from '../hrms.module.css'

interface Task {
    id: string; title: string; description?: string | null; status: string
    priority: string; category: string; due_date?: string | null
    assignee?: { id: string; full_name: string } | null
    creator?: { id: string; full_name: string } | null
}

const COLS = [
    { id: 'todo',        label: 'To Do',      color: '#6b7280' },
    { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { id: 'review',      label: 'In Review',   color: '#f59e0b' },
    { id: 'done',        label: 'Done',        color: '#22c55e' },
]
const PRIORITY_COLOR: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#9ca3af' }
const PRIORITY_BG:    Record<string, string> = { urgent: 'rgba(239,68,68,0.1)', high: 'rgba(245,158,11,0.1)', medium: 'rgba(59,130,246,0.1)', low: 'var(--h-elevated)' }

export default function MyTasksPage() {
    const supabase = createClient()
    const [userId, setUserId]       = useState<string | null>(null)
    const [tasks, setTasks]         = useState<Task[]>([])
    const [loading, setLoading]     = useState(true)
    const [view, setView]           = useState<'board' | 'list'>('board')
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSub]      = useState(false)
    const [updating, setUpdating]   = useState<string | null>(null)
    const [form, setForm]           = useState({ title: '', description: '', priority: 'medium', due_date: '' })

    const load = useCallback(async (uid: string) => {
        setLoading(true)
        const res = await fetch(`/api/crm/hrm/tasks?assigned_to=${uid}`)
        if (res.ok) { const d = await res.json(); setTasks(d.tasks || []) }
        setLoading(false)
    }, [])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) { setUserId(user.id); load(user.id) }
        })
    }, [load, supabase])

    const createTask = async () => {
        if (!userId || !form.title.trim()) return
        setSub(true)
        try {
            const res = await fetch('/api/crm/hrm/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: form.title, description: form.description, priority: form.priority, due_date: form.due_date || null, assigned_to: userId, created_by: userId }),
            })
            if (res.ok) { setShowModal(false); setForm({ title: '', description: '', priority: 'medium', due_date: '' }); await load(userId) }
        } finally { setSub(false) }
    }

    const moveTask = async (taskId: string, newStatus: string) => {
        setUpdating(taskId)
        try {
            await fetch('/api/crm/hrm/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status: newStatus }),
            })
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
        } finally { setUpdating(null) }
    }

    const byStatus = (s: string) => tasks.filter(t => t.status === s)

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <div className={styles.pageTitle}>My Tasks</div>
                    <div className={styles.pageSubtitle}>{tasks.filter(t => t.status !== 'done').length} open · {tasks.filter(t => t.status === 'done').length} done</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className={styles.tabs} style={{ margin: 0, padding: '3px', gap: '3px' }}>
                        <button className={`${styles.tab} ${view === 'board' ? styles.tabActive : ''}`} style={{ padding: '5px 10px', minWidth: 60 }} onClick={() => setView('board')}>Board</button>
                        <button className={`${styles.tab} ${view === 'list'  ? styles.tabActive : ''}`} style={{ padding: '5px 10px', minWidth: 60 }} onClick={() => setView('list')}>List</button>
                    </div>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowModal(true)}>
                        <Plus size={15} /> New Task
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={styles.loader} style={{ minHeight: '300px' }}><div className={styles.spinner} /></div>
            ) : view === 'board' ? (
                /* Kanban Board */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {COLS.map(col => {
                        const colTasks = byStatus(col.id)
                        return (
                            <div key={col.id} style={{ background: 'var(--h-elevated)', borderRadius: '14px', border: '1px solid var(--h-border)', minHeight: '200px', overflow: 'hidden' }}>
                                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--h-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--h-text-1)' }}>{col.label}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'var(--h-surface)', border: '1px solid var(--h-border)', borderRadius: '20px', padding: '1px 7px', color: 'var(--h-text-3)', fontWeight: 600 }}>{colTasks.length}</span>
                                </div>
                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {colTasks.map(t => (
                                        <div key={t.id} style={{ background: 'var(--h-surface)', border: '1px solid var(--h-border)', borderRadius: '10px', padding: '0.75rem', borderLeft: `3px solid ${PRIORITY_COLOR[t.priority] || '#ccc'}` }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--h-text-1)', marginBottom: '6px', lineHeight: 1.3 }}>{t.title}</div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority], textTransform: 'capitalize' }}>{t.priority}</span>
                                                {t.due_date && <span style={{ fontSize: '0.65rem', color: 'var(--h-text-4)' }}>Due {new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                                            </div>
                                            {/* Move buttons */}
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                {COLS.filter(c => c.id !== col.id).map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => moveTask(t.id, c.id)}
                                                        disabled={updating === t.id}
                                                        style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: '6px', border: `1px solid ${c.color}40`, background: `${c.color}10`, color: c.color, cursor: 'pointer', fontWeight: 600 }}
                                                    >
                                                        → {c.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.78rem', color: 'var(--h-text-4)' }}>Empty</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* List view */
                <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                    {tasks.length === 0 ? (
                        <div className={styles.empty}>
                            <CheckSquare size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <div className={styles.emptyTitle}>No tasks yet</div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.table}>
                                <thead><tr>
                                    {['Task', 'Priority', 'Status', 'Due Date', 'Move'].map(h => <th key={h} className={styles.th}>{h}</th>)}
                                </tr></thead>
                                <tbody>
                                    {tasks.map(t => (
                                        <tr key={t.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--h-text-1)' }}>{t.title}</div>
                                                {t.description && <div style={{ fontSize: '0.75rem', color: 'var(--h-text-3)', marginTop: '2px' }}>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
                                            </td>
                                            <td className={styles.td}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority], textTransform: 'capitalize' }}>{t.priority}</span>
                                            </td>
                                            <td className={styles.td}>
                                                {(() => {
                                                    const col = COLS.find(c => c.id === t.status)
                                                    return <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: `${col?.color || '#ccc'}15`, color: col?.color || '#ccc' }}>{col?.label || t.status}</span>
                                                })()}
                                            </td>
                                            <td className={styles.td} style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                {t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                            </td>
                                            <td className={styles.td}>
                                                <select
                                                    style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: '7px', border: '1px solid var(--h-border)', background: 'var(--h-elevated)', color: 'var(--h-text-2)', cursor: 'pointer' }}
                                                    value={t.status}
                                                    onChange={e => moveTask(t.id, e.target.value)}
                                                    disabled={updating === t.id}
                                                >
                                                    {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* New Task Modal */}
            {showModal && (
                <div className={styles.modalBack} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <div className={styles.modalTitle} style={{ margin: 0 }}>New Task</div>
                            <button className={styles.btnIcon} onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Title *</label>
                            <input className={styles.input} placeholder="What needs to be done?" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Description</label>
                            <textarea className={styles.textarea} placeholder="Add details…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 60 }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className={styles.field} style={{ margin: 0 }}>
                                <label className={styles.label}>Priority</label>
                                <select className={styles.select} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                                    {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className={styles.field} style={{ margin: 0 }}>
                                <label className={styles.label}>Due Date</label>
                                <input type="date" className={styles.input} value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                            <button className={`${styles.btn} ${styles.btnOutline}`} style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 2 }} onClick={createTask} disabled={submitting || !form.title.trim()}>
                                {submitting ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating…</> : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
