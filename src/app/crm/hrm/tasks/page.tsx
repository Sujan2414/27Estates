'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Plus, X, BarChart2, Columns3, AlertCircle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../../crm.module.css'
import { useCRMUser, isAdmin } from '../../crm-context'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' },
    itemStyle: { color: 'var(--crm-text-secondary)' }, labelStyle: { color: 'var(--crm-text-muted)' },
}

interface Task {
    id: string; title: string; description?: string; status: string; priority: string
    category?: string; due_date?: string; created_at: string
    assignee?: { id: string; full_name: string } | null
    creator?: { id: string; full_name: string } | null
}

interface Employee { id: string; full_name: string; role: string }

const COLUMNS = [
    { key: 'todo', label: 'To Do', color: 'var(--crm-text-faint)' },
    { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { key: 'review', label: 'Review', color: '#8b5cf6' },
    { key: 'done', label: 'Done', color: '#22c55e' },
]

const PRIORITIES = [
    { key: 'low', label: 'Low', color: 'var(--crm-text-faint)' },
    { key: 'medium', label: 'Medium', color: '#f59e0b' },
    { key: 'high', label: 'High', color: '#f97316' },
    { key: 'urgent', label: 'Urgent', color: '#ef4444' },
]

const CATEGORIES = ['general', 'sales', 'admin', 'marketing', 'legal', 'finance', 'operations']

export default function TasksPage() {
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)

    const [tasks, setTasks] = useState<Task[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [tableExists, setTableExists] = useState(true)
    const [view, setView] = useState<'kanban' | 'analytics'>('kanban')
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverCol, setDragOverCol] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    // Agents default to their own tasks; admins see all
    const [filterAssignee, setFilterAssignee] = useState(!isAdminUser && crmUser?.id ? crmUser.id : 'all')
    const [filterPriority, setFilterPriority] = useState('all')
    const [creating, setCreating] = useState(false)

    const [form, setForm] = useState({
        title: '', description: '',
        // Agents can only assign to themselves
        assigned_to: !isAdminUser && crmUser?.id ? crmUser.id : '',
        priority: 'medium', category: 'general', due_date: '',
    })

    const supabase = useMemo(() => createClient(), [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [taskRes, empRes] = await Promise.all([
            fetch('/api/crm/hrm/tasks'),
            fetch('/api/crm/hrm/employees'),
        ])
        if (taskRes.ok) {
            const d = await taskRes.json()
            setTasks(d.tasks || [])
            setTableExists(d.tableExists !== false)
        }
        if (empRes.ok) {
            const d = await empRes.json()
            setEmployees(d.employees || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const filteredTasks = tasks.filter(t => {
        if (filterAssignee !== 'all' && t.assignee?.id !== filterAssignee) return false
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false
        return true
    })

    const columns = COLUMNS.reduce((acc, col) => {
        acc[col.key] = filteredTasks.filter(t => t.status === col.key)
        return acc
    }, {} as Record<string, Task[]>)

    // Agents can only drag tasks assigned to them
    const canDrag = (task: Task) => isAdminUser || task.assignee?.id === crmUser?.id
    // Agents can only delete their own tasks
    const canDelete = (task: Task) => isAdminUser || task.assignee?.id === crmUser?.id

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        if (!canDrag(task)) { e.preventDefault(); return }
        setDraggingId(task.id)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault()
        if (!draggingId) return
        const task = tasks.find(t => t.id === draggingId)
        if (!task || task.status === targetStatus) { setDraggingId(null); setDragOverCol(null); return }

        setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, status: targetStatus } : t))
        const movedId = draggingId
        setDraggingId(null); setDragOverCol(null)

        await fetch('/api/crm/hrm/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: movedId, status: targetStatus }),
        }).catch(() => {})
    }

    const handleCreate = async () => {
        if (!form.title.trim()) return
        setCreating(true)
        const res = await fetch('/api/crm/hrm/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, created_by: crmUser?.id }),
        })
        if (res.ok) {
            const d = await res.json()
            setTasks(prev => [d.task, ...prev])
            setForm({ title: '', description: '', assigned_to: '', priority: 'medium', category: 'general', due_date: '' })
            setShowCreateModal(false)
        }
        setCreating(false)
    }

    const handleDelete = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id))
        await fetch(`/api/crm/hrm/tasks?id=${id}`, { method: 'DELETE' }).catch(() => {})
    }

    const formatDue = (d: string) => {
        const date = new Date(d)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const diff = Math.floor((date.getTime() - today.getTime()) / 86400000)
        if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#ef4444' }
        if (diff === 0) return { label: 'Due today', color: '#f59e0b' }
        if (diff === 1) return { label: 'Due tomorrow', color: '#f59e0b' }
        return { label: `${diff}d left`, color: 'var(--crm-text-faint)' }
    }

    // Analytics data
    const byStatus = COLUMNS.map(c => ({ name: c.label, count: tasks.filter(t => t.status === c.key).length, color: c.color }))
    const byPriority = PRIORITIES.map(p => ({ name: p.label, count: tasks.filter(t => t.priority === p.key).length, color: p.color }))
    const byAssignee = employees.map(e => ({
        name: e.full_name.split(' ')[0],
        open: tasks.filter(t => t.assignee?.id === e.id && t.status !== 'done').length,
        done: tasks.filter(t => t.assignee?.id === e.id && t.status === 'done').length,
    })).filter(e => e.open + e.done > 0)
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')

    return (
        <div className={styles.pageContent} style={{ maxWidth: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm/hrm" style={{ color: 'var(--crm-text-faint)' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Task Board</h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>{tasks.length} tasks · drag to update status</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className={styles.pillTabs}>
                        <button className={`${styles.pillTab} ${view === 'kanban' ? styles.pillTabActive : ''}`} onClick={() => setView('kanban')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Columns3 size={13} /> Board</span>
                        </button>
                        <button className={`${styles.pillTab} ${view === 'analytics' ? styles.pillTabActive : ''}`} onClick={() => setView('analytics')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={13} /> Analytics</span>
                        </button>
                    </div>
                    {tableExists && (
                        <button className={styles.btnPrimary} onClick={() => setShowCreateModal(true)}>
                            <Plus size={14} /> New Task
                        </button>
                    )}
                </div>
            </div>

            {!tableExists && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                    <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>
                        Run <code style={{ backgroundColor: 'var(--crm-elevated)', padding: '1px 6px', borderRadius: '4px' }}>supabase/hrm-schema.sql</code> to enable task management.
                    </div>
                </div>
            )}

            {/* Filters */}
            {view === 'kanban' && tableExists && (
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {isAdminUser ? (
                        <select className={styles.formSelect} style={{ width: 'auto', minWidth: '140px' }} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                            <option value="all">All Assignees</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                        </select>
                    ) : (
                        // Agents: toggle My Tasks / All Tasks
                        <div className={styles.pillTabs}>
                            <button
                                className={`${styles.pillTab} ${filterAssignee === (crmUser?.id || '') ? styles.pillTabActive : ''}`}
                                onClick={() => setFilterAssignee(crmUser?.id || 'all')}
                            >
                                My Tasks
                            </button>
                            <button
                                className={`${styles.pillTab} ${filterAssignee === 'all' ? styles.pillTabActive : ''}`}
                                onClick={() => setFilterAssignee('all')}
                            >
                                All Tasks
                            </button>
                        </div>
                    )}
                    <select className={styles.formSelect} style={{ width: 'auto', minWidth: '130px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                        <option value="all">All Priorities</option>
                        {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                </div>
            )}

            {loading ? (
                <div className={styles.emptyState}>Loading tasks...</div>
            ) : view === 'kanban' ? (
                /* ── KANBAN BOARD ─────────────────────────────── */
                <div className={styles.kanbanBoard}>
                    {COLUMNS.map(col => {
                        const cards = columns[col.key] || []
                        const isDragOver = dragOverCol === col.key
                        return (
                            <div
                                key={col.key}
                                className={`${styles.kanbanColumn} ${isDragOver ? styles.kanbanColumnDragOver : ''}`}
                                onDragOver={e => { e.preventDefault(); setDragOverCol(col.key) }}
                                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null) }}
                                onDrop={e => handleDrop(e, col.key)}
                            >
                                <div className={styles.kanbanColumnHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{col.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: `${col.color}20`, color: col.color, padding: '2px 8px', borderRadius: '999px' }}>{cards.length}</span>
                                </div>

                                <div className={styles.kanbanColumnBody}>
                                    {cards.map(task => {
                                        const pConf = PRIORITIES.find(p => p.key === task.priority)
                                        const due = task.due_date ? formatDue(task.due_date) : null
                                        const draggable = canDrag(task)
                                        return (
                                            <div
                                                key={task.id}
                                                draggable={draggable}
                                                onDragStart={e => handleDragStart(e, task)}
                                                onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
                                                className={`${styles.kanbanCard} ${draggingId === task.id ? styles.kanbanCardDragging : ''}`}
                                                style={{ cursor: draggable ? 'grab' : 'default' }}
                                            >
                                                {/* Priority + Category */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: pConf?.color || '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        {task.priority}
                                                    </span>
                                                    {task.category && task.category !== 'general' && (
                                                        <span style={{ fontSize: '0.625rem', color: 'var(--crm-text-faint)', backgroundColor: 'var(--crm-elevated)', padding: '1px 5px', borderRadius: '3px' }}>
                                                            {task.category}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '0.375rem', lineHeight: 1.4 }}>
                                                    {task.title}
                                                </div>

                                                {task.description && (
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                        {task.description}
                                                    </div>
                                                )}

                                                {/* Footer */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                    {task.assignee ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundcolor: 'var(--crm-accent)', color: 'var(--crm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700 }}>
                                                                {task.assignee.full_name.charAt(0)}
                                                            </div>
                                                            <span style={{ fontSize: '0.6875rem', color: 'var(--crm-text-muted)' }}>{task.assignee.full_name.split(' ')[0]}</span>
                                                        </div>
                                                    ) : <span style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)' }}>Unassigned</span>}

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {due && (
                                                            <span style={{ fontSize: '0.625rem', color: due.color, fontWeight: 600 }}>{due.label}</span>
                                                        )}
                                                        {canDelete(task) && (
                                                            <button
                                                                onClick={e => { e.stopPropagation(); handleDelete(task.id) }}
                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-dim)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                                title="Delete task"
                                                            >
                                                                <Trash2 size={11} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {cards.length === 0 && (
                                        <div style={{ padding: '1.25rem 0.75rem', textAlign: 'center', color: '#374151', fontSize: '0.75rem', border: '1px dashed #2d3148', borderRadius: '0.5rem' }}>
                                            Drop tasks here
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* ── ANALYTICS ─────────────────────────────── */
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Tasks', value: tasks.length, color: 'var(--crm-text-secondary)' },
                            { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
                            { label: 'In Review', value: tasks.filter(t => t.status === 'review').length, color: '#8b5cf6' },
                            { label: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#22c55e' },
                            { label: 'Overdue', value: overdueTasks.length, color: '#ef4444' },
                        ].map(s => (
                            <div key={s.label} className={styles.statCard}>
                                <div className={styles.statLabel}>{s.label}</div>
                                <div className={styles.statValue} style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.chartsGrid} style={{ marginBottom: '1.5rem' }}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>By Status</span></div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={byStatus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                                        {byStatus.map((e, i) => (
                                            <Cell key={i} fill={e.color === 'var(--crm-text-faint)' ? '#9ca3af' : e.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>By Priority</span></div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={byPriority} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                                        {byPriority.map((e, i) => (
                                            <Cell key={i} fill={e.color === 'var(--crm-text-faint)' ? '#9ca3af' : e.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {byAssignee.length > 0 && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>Workload by Employee</span></div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={byAssignee} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="open" name="Open" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="done" name="Done" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {overdueTasks.length > 0 && (
                        <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle} style={{ color: '#ef4444' }}>Overdue Tasks</span>
                                <AlertCircle size={14} style={{ color: '#ef4444' }} />
                            </div>
                            <table className={styles.table}>
                                <thead><tr><th>Task</th><th>Assignee</th><th>Due</th><th>Priority</th></tr></thead>
                                <tbody>
                                    {overdueTasks.map(t => {
                                        const pConf = PRIORITIES.find(p => p.key === t.priority)
                                        const daysOverdue = Math.floor((new Date().getTime() - new Date(t.due_date!).getTime()) / 86400000)
                                        return (
                                            <tr key={t.id}>
                                                <td style={{ fontWeight: 500 }}>{t.title}</td>
                                                <td>{t.assignee?.full_name || '—'}</td>
                                                <td style={{ color: '#ef4444', fontWeight: 600 }}>{daysOverdue}d overdue</td>
                                                <td><span style={{ color: pConf?.color, fontWeight: 600 }}>{t.priority}</span></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>New Task</h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-faint)' }}><X size={18} /></button>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Title *</label>
                            <input className={styles.formInput} placeholder="Task title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea className={styles.formInput} rows={3} placeholder="What needs to be done..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Assign To</label>
                                {isAdminUser ? (
                                    <select className={styles.formSelect} value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                                        <option value="">Unassigned</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                    </select>
                                ) : (
                                    <input className={styles.formInput} value={crmUser?.full_name || 'Me'} disabled style={{ opacity: 0.6 }} />
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Priority</label>
                                <select className={styles.formSelect} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                                    {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Category</label>
                                <select className={styles.formSelect} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Due Date</label>
                                <input type="date" className={styles.formInput} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className={styles.btnPrimary} style={{ flex: 2 }} onClick={handleCreate} disabled={creating || !form.title.trim()}>
                                {creating ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
