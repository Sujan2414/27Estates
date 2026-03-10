'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Clock, MessageSquare, PhoneCall, Send, StickyNote, CheckCircle2, Circle, Plus, Eye, X } from 'lucide-react'
import styles from '../../crm.module.css'
import type { Lead, LeadActivity, LeadTask } from '@/lib/crm/types'

const sourceLabels: Record<string, string> = {
    website: 'Website', meta_ads: 'Meta Ads', google_ads: 'Google Ads', '99acres': '99acres',
    magicbricks: 'MagicBricks', housing: 'Housing.com', justdial: 'JustDial', chatbot: 'Chatbot',
    whatsapp: 'WhatsApp', manual: 'Manual', referral: 'Referral',
}
const statusConfig: Record<string, { color: string; label: string }> = {
    new: { color: '#3b82f6', label: 'New' }, contacted: { color: '#f59e0b', label: 'Contacted' },
    qualified: { color: '#8b5cf6', label: 'Qualified' }, negotiation: { color: '#f97316', label: 'Negotiation' },
    site_visit: { color: '#06b6d4', label: 'Site Visit' }, converted: { color: '#22c55e', label: 'Converted' },
    lost: { color: '#ef4444', label: 'Lost' },
}
const activityIcons: Record<string, React.ReactNode> = {
    call: <PhoneCall size={14} />, email_sent: <Send size={14} />, email_received: <Mail size={14} />,
    whatsapp: <MessageSquare size={14} />, site_visit: <Eye size={14} />, note: <StickyNote size={14} />,
    status_change: <Clock size={14} />, chatbot: <MessageSquare size={14} />, system: <Clock size={14} />,
}
const statusSteps = ['new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted']

export default function LeadDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [lead, setLead] = useState<Lead | null>(null)
    const [activities, setActivities] = useState<LeadActivity[]>([])
    const [tasks, setTasks] = useState<LeadTask[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'timeline' | 'tasks'>('timeline')
    const [showAddActivity, setShowAddActivity] = useState(false)
    const [showAddTask, setShowAddTask] = useState(false)
    const [newActivity, setNewActivity] = useState({ type: 'note', title: '', description: '' })
    const [newTask, setNewTask] = useState({ title: '', due_date: '', description: '' })
    const [editing, setEditing] = useState(false)
    const [editData, setEditData] = useState<Partial<Lead>>({})

    const fetchLead = async () => {
        const res = await fetch(`/api/crm/leads/${id}`)
        if (res.ok) { const d = await res.json(); setLead(d.lead); setActivities(d.activities); setTasks(d.tasks) }
        setLoading(false)
    }
    useEffect(() => { fetchLead() }, [id])

    const handleStatusChange = async (s: string) => {
        await fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) }); fetchLead()
    }
    const handlePriorityChange = async (p: string) => {
        await fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priority: p }) }); fetchLead()
    }
    const handleSaveEdit = async () => {
        await fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) }); setEditing(false); fetchLead()
    }
    const handleAddActivity = async () => {
        if (!newActivity.title) return
        await fetch('/api/crm/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, ...newActivity }) })
        setShowAddActivity(false); setNewActivity({ type: 'note', title: '', description: '' }); fetchLead()
    }
    const handleAddTask = async () => {
        if (!newTask.title || !newTask.due_date) return
        await fetch('/api/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, ...newTask }) })
        setShowAddTask(false); setNewTask({ title: '', due_date: '', description: '' }); fetchLead()
    }
    const handleToggleTask = async (taskId: string, completed: boolean) => {
        await fetch('/api/crm/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, is_completed: !completed }) }); fetchLead()
    }

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const formatRelative = (d: string) => {
        const ms = Date.now() - new Date(d).getTime(); const m = Math.floor(ms / 60000); const h = Math.floor(ms / 3600000); const dd = Math.floor(ms / 86400000)
        if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; if (dd < 7) return `${dd}d ago`; return formatDate(d)
    }

    if (loading) return <div className={styles.pageContent}><div className={styles.emptyState}>Loading...</div></div>
    if (!lead) return <div className={styles.pageContent}><div className={styles.emptyState}>Lead not found</div></div>

    const currentStep = statusSteps.indexOf(lead.status)

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => router.push('/crm/leads')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><ArrowLeft size={20} /></button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{lead.name}</h1>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{sourceLabels[lead.source]} &middot; {formatRelative(lead.created_at)}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {lead.phone && <a href={`tel:${lead.phone}`} className={styles.btnPrimary} style={{ backgroundColor: '#22c55e' }}><Phone size={14} /> Call</a>}
                    {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary} style={{ backgroundColor: '#25D366' }}><MessageSquare size={14} /> WhatsApp</a>}
                    {lead.email && <a href={`mailto:${lead.email}`} className={styles.btnSecondary}><Mail size={14} /> Email</a>}
                </div>
            </div>

            {/* Status Pipeline */}
            {lead.status !== 'lost' && (
                <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto' }}>
                        {statusSteps.map((step, i) => (
                            <button key={step} onClick={() => handleStatusChange(step)} style={{
                                flex: 1, padding: '0.625rem 0.375rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                                fontSize: '0.6875rem', fontWeight: 600, minWidth: '80px', transition: 'all 0.2s',
                                backgroundColor: i <= currentStep ? statusConfig[step]?.color : '#1e2030',
                                color: i <= currentStep ? '#fff' : '#4b5563',
                            }}>{statusConfig[step]?.label}</button>
                        ))}
                    </div>
                    <button onClick={() => handleStatusChange('lost')} style={{
                        marginTop: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer',
                        border: '1px solid #ef444440', backgroundColor: lead.status === 'lost' ? '#ef4444' : 'transparent', color: lead.status === 'lost' ? '#fff' : '#ef4444',
                    }}>Mark as Lost</button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Left - Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span className={styles.cardTitle}>Contact Info</span>
                            <button onClick={() => { setEditing(!editing); setEditData(lead) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#BFA270', fontSize: '0.75rem' }}>{editing ? 'Cancel' : 'Edit'}</button>
                        </div>
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="Name" className={styles.formInput} />
                                <input type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} placeholder="Email" className={styles.formInput} />
                                <input type="tel" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="Phone" className={styles.formInput} />
                                <input type="text" value={editData.preferred_location || ''} onChange={e => setEditData({ ...editData, preferred_location: e.target.value })} placeholder="Location" className={styles.formInput} />
                                <input type="text" value={editData.property_type || ''} onChange={e => setEditData({ ...editData, property_type: e.target.value })} placeholder="Property Type" className={styles.formInput} />
                                <textarea value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} placeholder="Notes" rows={3} className={styles.formInput} style={{ resize: 'vertical' }} />
                                <button onClick={handleSaveEdit} className={styles.btnPrimary}>Save</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}><Phone size={12} style={{ color: '#4b5563' }} /> <span style={{ color: '#e5e7eb' }}>{lead.phone}</span></div>}
                                {lead.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}><Mail size={12} style={{ color: '#4b5563' }} /> <span style={{ color: '#e5e7eb' }}>{lead.email}</span></div>}
                                {lead.preferred_location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}><MapPin size={12} /> {lead.preferred_location}</div>}
                                {lead.property_type && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}><Building2 size={12} /> {lead.property_type}</div>}
                                {lead.notes && <div style={{ fontSize: '0.8125rem', color: '#9ca3af', backgroundColor: '#0f1117', padding: '0.625rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>{lead.notes}</div>}
                            </div>
                        )}
                    </div>

                    <div className={styles.card}>
                        <span className={styles.cardTitle} style={{ display: 'block', marginBottom: '0.75rem' }}>Priority</span>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {(['hot', 'warm', 'cold'] as const).map(p => (
                                <button key={p} onClick={() => handlePriorityChange(p)} style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                                    border: `1px solid ${lead.priority === p ? (p === 'hot' ? '#ef4444' : p === 'warm' ? '#f59e0b' : '#3b82f6') : '#1e2030'}`,
                                    backgroundColor: lead.priority === p ? (p === 'hot' ? '#ef444415' : p === 'warm' ? '#f59e0b15' : '#3b82f615') : '#0f1117',
                                    color: p === 'hot' ? '#ef4444' : p === 'warm' ? '#f59e0b' : '#3b82f6',
                                }}>{p === 'hot' ? '🔥' : p === 'warm' ? '🟡' : '🔵'} {p}</button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <span className={styles.cardTitle} style={{ display: 'block', marginBottom: '0.75rem' }}>Source</span>
                        <div style={{ fontSize: '0.8125rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <div><strong style={{ color: '#6b7280' }}>Platform:</strong> {sourceLabels[lead.source]}</div>
                            {lead.source_campaign && <div><strong style={{ color: '#6b7280' }}>Campaign:</strong> {lead.source_campaign}</div>}
                            {lead.source_form_id && <div><strong style={{ color: '#6b7280' }}>Form:</strong> {lead.source_form_id}</div>}
                        </div>
                    </div>
                </div>

                {/* Right - Timeline + Tasks */}
                <div>
                    <div className={styles.pillTabs} style={{ marginBottom: '1rem' }}>
                        <button className={`${styles.pillTab} ${activeTab === 'timeline' ? styles.pillTabActive : ''}`} onClick={() => setActiveTab('timeline')}>Timeline ({activities.length})</button>
                        <button className={`${styles.pillTab} ${activeTab === 'tasks' ? styles.pillTabActive : ''}`} onClick={() => setActiveTab('tasks')}>Tasks ({tasks.filter(t => !t.is_completed).length})</button>
                    </div>

                    {activeTab === 'timeline' ? (
                        <div className={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={styles.cardTitle}>Activity</span>
                                <button onClick={() => setShowAddActivity(!showAddActivity)} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}><Plus size={12} /> Log</button>
                            </div>

                            {showAddActivity && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#0f1117', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <select value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value })} className={styles.formSelect} style={{ width: 'auto' }}>
                                            <option value="note">Note</option><option value="call">Call</option><option value="email_sent">Email</option><option value="whatsapp">WhatsApp</option><option value="site_visit">Site Visit</option>
                                        </select>
                                        <input type="text" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} placeholder="Title" className={styles.formInput} />
                                    </div>
                                    <textarea value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} placeholder="Details..." rows={2} className={styles.formInput} style={{ resize: 'vertical', marginBottom: '0.5rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddActivity(false)} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>Cancel</button>
                                        <button onClick={handleAddActivity} className={styles.btnPrimary} style={{ fontSize: '0.75rem' }} disabled={!newActivity.title}>Save</button>
                                    </div>
                                </div>
                            )}

                            {activities.length > 0 ? activities.map((a, i) => (
                                <div key={a.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < activities.length - 1 ? '1px solid #1e2030' : 'none' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1e2030', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
                                        {activityIcons[a.type] || <Clock size={14} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#e5e7eb' }}>{a.title}</div>
                                        {a.description && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>{a.description}</div>}
                                        <div style={{ fontSize: '0.6875rem', color: '#4b5563', marginTop: '0.25rem' }}>{formatRelative(a.created_at)} &middot; {a.created_by}</div>
                                    </div>
                                </div>
                            )) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No activity yet</div>}
                        </div>
                    ) : (
                        <div className={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={styles.cardTitle}>Tasks</span>
                                <button onClick={() => setShowAddTask(!showAddTask)} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}><Plus size={12} /> Add</button>
                            </div>

                            {showAddTask && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#0f1117', borderRadius: '0.5rem' }}>
                                    <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" className={styles.formInput} style={{ marginBottom: '0.5rem' }} />
                                    <input type="datetime-local" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className={styles.formInput} style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddTask(false)} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>Cancel</button>
                                        <button onClick={handleAddTask} className={styles.btnPrimary} style={{ fontSize: '0.75rem' }} disabled={!newTask.title || !newTask.due_date}>Save</button>
                                    </div>
                                </div>
                            )}

                            {tasks.length > 0 ? tasks.map(t => {
                                const overdue = !t.is_completed && new Date(t.due_date) < new Date()
                                return (
                                    <div key={t.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '0.375rem',
                                        backgroundColor: overdue ? '#ef444410' : '#0f1117', border: `1px solid ${overdue ? '#ef444430' : '#1e2030'}`,
                                        opacity: t.is_completed ? 0.5 : 1,
                                    }}>
                                        <button onClick={() => handleToggleTask(t.id, t.is_completed)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: t.is_completed ? '#22c55e' : '#4b5563' }}>
                                            {t.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                        </button>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#e5e7eb', textDecoration: t.is_completed ? 'line-through' : 'none' }}>{t.title}</div>
                                            <div style={{ fontSize: '0.6875rem', color: overdue ? '#ef4444' : '#4b5563' }}>
                                                <Calendar size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                {formatDate(t.due_date)} {overdue && '(Overdue)'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No tasks</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
