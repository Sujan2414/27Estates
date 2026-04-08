'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
    ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Clock,
    MessageSquare, PhoneCall, Eye, StickyNote, CheckCircle2, Circle,
    Plus, Send, ExternalLink, Flame
} from 'lucide-react'
import styles from '../../../admin.module.css'
import type { Lead, LeadActivity, LeadTask } from '@/lib/crm/types'

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

const activityIcons: Record<string, React.ReactNode> = {
    call: <PhoneCall size={16} />,
    email_sent: <Send size={16} />,
    email_received: <Mail size={16} />,
    whatsapp: <MessageSquare size={16} />,
    site_visit: <Eye size={16} />,
    note: <StickyNote size={16} />,
    status_change: <Clock size={16} />,
    chatbot: <MessageSquare size={16} />,
    system: <Clock size={16} />,
}

const statusSteps = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'converted']

export default function LeadDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
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

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => { if (user) setCurrentUserId(user.id) })
    }, [supabase])
    const [editData, setEditData] = useState<Partial<Lead>>({})

    const fetchLead = async () => {
        const res = await fetch(`/api/crm/leads/${id}`)
        if (res.ok) {
            const data = await res.json()
            setLead(data.lead)
            setActivities(data.activities)
            setTasks(data.tasks)
        }
        setLoading(false)
    }

    useEffect(() => { fetchLead() }, [id])

    const handleStatusChange = async (newStatus: string) => {
        await fetch(`/api/crm/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, changed_by: currentUserId || 'admin' }),
        })
        fetchLead()
    }

    const handlePriorityChange = async (newPriority: string) => {
        await fetch(`/api/crm/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority: newPriority }),
        })
        fetchLead()
    }

    const handleSaveEdit = async () => {
        await fetch(`/api/crm/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editData),
        })
        setEditing(false)
        fetchLead()
    }

    const handleAddActivity = async () => {
        if (!newActivity.title) return
        await fetch('/api/crm/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead_id: id, ...newActivity, created_by: currentUserId || undefined }),
        })
        setShowAddActivity(false)
        setNewActivity({ type: 'note', title: '', description: '' })
        fetchLead()
    }

    const handleAddTask = async () => {
        if (!newTask.title || !newTask.due_date) return
        await fetch('/api/crm/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead_id: id, ...newTask }),
        })
        setShowAddTask(false)
        setNewTask({ title: '', due_date: '', description: '' })
        fetchLead()
    }

    const handleToggleTask = async (taskId: string, completed: boolean) => {
        await fetch('/api/crm/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: taskId, is_completed: !completed }),
        })
        fetchLead()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    const formatRelative = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return formatDate(dateString)
    }

    if (loading) return <div className={styles.emptyState}>Loading lead...</div>
    if (!lead) return <div className={styles.emptyState}>Lead not found</div>

    const currentStepIndex = statusSteps.indexOf(lead.status)

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => router.push('/admin/crm/leads')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 className={styles.pageTitle}>{lead.name}</h1>
                    <p className={styles.pageSubtitle}>
                        {sourceLabels[lead.source]} lead &middot; Added {formatRelative(lead.created_at)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {lead.phone && (
                        <a href={`tel:${lead.phone}`} className={styles.addButton} style={{ backgroundColor: '#22c55e' }}>
                            <Phone size={16} /> Call
                        </a>
                    )}
                    {lead.phone && (
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className={styles.addButton} style={{ backgroundColor: '#25D366' }}>
                            <MessageSquare size={16} /> WhatsApp
                        </a>
                    )}
                    {lead.email && (
                        <a href={`mailto:${lead.email}`} className={styles.addButton} style={{ backgroundColor: '#3b82f6' }}>
                            <Mail size={16} /> Email
                        </a>
                    )}
                </div>
            </div>

            {/* Status Pipeline */}
            {lead.status !== 'lost' && (
                <div className={styles.sectionCard}>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                        {statusSteps.map((step, index) => (
                            <button
                                key={step}
                                onClick={() => handleStatusChange(step)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    backgroundColor: index <= currentStepIndex ? statusColors[step] : '#f3f4f6',
                                    color: index <= currentStepIndex ? '#fff' : '#9ca3af',
                                    transition: 'all 0.2s',
                                    minWidth: '90px',
                                }}
                            >
                                {step.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => handleStatusChange('lost')}
                        style={{
                            marginTop: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem',
                            border: '1px solid #fecaca', backgroundColor: lead.status === 'lost' ? '#ef4444' : '#fff',
                            color: lead.status === 'lost' ? '#fff' : '#ef4444', fontSize: '0.75rem',
                            fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        Mark as Lost
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Left Column - Lead Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Contact Info */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Contact Info</h2>
                            <button onClick={() => { setEditing(!editing); setEditData(lead) }}
                                className={styles.viewAllLink} style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
                                {editing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })}
                                    placeholder="Name" style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
                                <input type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })}
                                    placeholder="Email" style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
                                <input type="tel" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                    placeholder="Phone" style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
                                <input type="text" value={editData.preferred_location || ''} onChange={e => setEditData({ ...editData, preferred_location: e.target.value })}
                                    placeholder="Preferred Location" style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
                                <input type="text" value={editData.property_type || ''} onChange={e => setEditData({ ...editData, property_type: e.target.value })}
                                    placeholder="Property Type (2BHK, 3BHK, Villa...)" style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
                                <textarea value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })}
                                    placeholder="Notes" rows={3} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem', resize: 'vertical' }} />
                                <button onClick={handleSaveEdit} className={styles.addButton}>Save Changes</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {lead.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <Phone size={14} style={{ color: '#6b7280' }} />
                                        <a href={`tel:${lead.phone}`} style={{ color: '#183C38', textDecoration: 'none' }}>{lead.phone}</a>
                                    </div>
                                )}
                                {lead.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <Mail size={14} style={{ color: '#6b7280' }} />
                                        <a href={`mailto:${lead.email}`} style={{ color: '#183C38', textDecoration: 'none' }}>{lead.email}</a>
                                    </div>
                                )}
                                {lead.preferred_location && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                        <MapPin size={14} /> {lead.preferred_location}
                                    </div>
                                )}
                                {lead.property_type && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                        <Building2 size={14} /> {lead.property_type}
                                    </div>
                                )}
                                {(lead.budget_min || lead.budget_max) && (
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        Budget: {lead.budget_min ? `₹${(lead.budget_min / 100000).toFixed(0)}L` : ''} - {lead.budget_max ? `₹${(lead.budget_max / 100000).toFixed(0)}L` : ''}
                                    </div>
                                )}
                                {lead.notes && (
                                    <div style={{ fontSize: '0.875rem', color: '#374151', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                                        {lead.notes}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Priority */}
                    <div className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: '0.75rem' }}>Priority</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['hot', 'warm', 'cold'].map(p => (
                                <button key={p} onClick={() => handlePriorityChange(p)}
                                    style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid',
                                        borderColor: lead.priority === p ? (p === 'hot' ? '#ef4444' : p === 'warm' ? '#f59e0b' : '#93c5fd') : '#e5e7eb',
                                        backgroundColor: lead.priority === p ? (p === 'hot' ? '#fef2f2' : p === 'warm' ? '#fffbeb' : '#eff6ff') : '#fff',
                                        color: p === 'hot' ? '#ef4444' : p === 'warm' ? '#f59e0b' : '#3b82f6',
                                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                    }}>
                                    {p === 'hot' ? '🔥' : p === 'warm' ? '🟡' : '🔵'} {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Source Info */}
                    <div className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: '0.75rem' }}>Source Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                            <div><strong>Platform:</strong> {sourceLabels[lead.source]}</div>
                            {lead.source_campaign && <div><strong>Campaign:</strong> {lead.source_campaign}</div>}
                            {lead.source_form_id && <div><strong>Form ID:</strong> {lead.source_form_id}</div>}
                            {lead.source_ad_id && <div><strong>Ad ID:</strong> {lead.source_ad_id}</div>}
                        </div>
                    </div>
                </div>

                {/* Right Column - Timeline & Tasks */}
                <div>
                    {/* Tabs */}
                    <div className={styles.filterTabs} style={{ marginBottom: '1rem' }}>
                        <button className={`${styles.filterTab} ${activeTab === 'timeline' ? styles.filterTabActive : ''}`}
                            onClick={() => setActiveTab('timeline')}>
                            Timeline ({activities.length})
                        </button>
                        <button className={`${styles.filterTab} ${activeTab === 'tasks' ? styles.filterTabActive : ''}`}
                            onClick={() => setActiveTab('tasks')}>
                            Tasks ({tasks.filter(t => !t.is_completed).length})
                        </button>
                    </div>

                    {activeTab === 'timeline' ? (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Activity Timeline</h2>
                                <button onClick={() => setShowAddActivity(!showAddActivity)}
                                    className={styles.addButton} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}>
                                    <Plus size={14} /> Log Activity
                                </button>
                            </div>

                            {showAddActivity && (
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <select value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}
                                            style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
                                            <option value="note">Note</option>
                                            <option value="call">Phone Call</option>
                                            <option value="email_sent">Email Sent</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="site_visit">Site Visit</option>
                                        </select>
                                        <input type="text" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                                            placeholder="Title" style={{ flex: 1, padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8125rem' }} />
                                    </div>
                                    <textarea value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                                        placeholder="Details..." rows={2}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8125rem', resize: 'vertical', marginBottom: '0.75rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddActivity(false)} className={styles.cancelBtn}>Cancel</button>
                                        <button onClick={handleAddActivity} className={styles.addButton} disabled={!newActivity.title}>Save</button>
                                    </div>
                                </div>
                            )}

                            {activities.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {activities.map((activity, i) => (
                                        <div key={activity.id} style={{
                                            display: 'flex', gap: '1rem', padding: '1rem 0',
                                            borderBottom: i < activities.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                backgroundColor: activity.type === 'status_change' ? '#dbeafe' : '#f3f4f6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#6b7280', flexShrink: 0,
                                            }}>
                                                {activityIcons[activity.type] || <Clock size={16} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{activity.title}</div>
                                                {activity.description && (
                                                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>{activity.description}</div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                                    {formatRelative(activity.created_at)} &middot; {(activity as any).creator_name || activity.created_by}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState} style={{ padding: '2rem' }}>No activities yet</div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Tasks & Follow-ups</h2>
                                <button onClick={() => setShowAddTask(!showAddTask)}
                                    className={styles.addButton} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}>
                                    <Plus size={14} /> Add Task
                                </button>
                            </div>

                            {showAddTask && (
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
                                    <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Task title" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8125rem', marginBottom: '0.75rem' }} />
                                    <input type="datetime-local" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8125rem', marginBottom: '0.75rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddTask(false)} className={styles.cancelBtn}>Cancel</button>
                                        <button onClick={handleAddTask} className={styles.addButton} disabled={!newTask.title || !newTask.due_date}>Save</button>
                                    </div>
                                </div>
                            )}

                            {tasks.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {tasks.map(task => {
                                        const isOverdue = !task.is_completed && new Date(task.due_date) < new Date()
                                        return (
                                            <div key={task.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.75rem', borderRadius: '0.5rem',
                                                backgroundColor: isOverdue ? '#fef2f2' : '#f9fafb',
                                                border: isOverdue ? '1px solid #fecaca' : '1px solid #e5e7eb',
                                                opacity: task.is_completed ? 0.6 : 1,
                                            }}>
                                                <button onClick={() => handleToggleTask(task.id, task.is_completed)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: task.is_completed ? '#22c55e' : '#9ca3af' }}>
                                                    {task.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </button>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 500, textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                                                        {task.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : '#9ca3af' }}>
                                                        <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                        {formatDate(task.due_date)}
                                                        {isOverdue && ' (Overdue)'}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className={styles.emptyState} style={{ padding: '2rem' }}>No tasks yet</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
