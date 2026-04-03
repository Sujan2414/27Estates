'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Clock,
    MessageSquare, PhoneCall, Send, StickyNote, CheckCircle2, Circle,
    Plus, Eye, Tag, IndianRupee, Star, TrendingUp, CalendarCheck,
    Home, Edit3, Save, X, Sliders, Ruler, Banknote,
    Globe, Bookmark, Activity, Trash2, Pencil
} from 'lucide-react'
import styles from '../../crm.module.css'
import type { Lead, LeadActivity, LeadTask } from '@/lib/crm/types'
import { proxyUrl } from '@/lib/proxy-url'
import { useCRMUser, isAdmin } from '../../crm-context'

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

interface SiteVisit {
    id: string; lead_id: string; visit_date: string; visit_time?: string
    status: string; outcome?: string; notes?: string
    properties?: { title: string } | null; projects?: { project_name: string } | null
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#6b7280'
    const label = score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold'
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '999px',
            border: `1px solid ${color}40`, backgroundColor: `${color}15`,
        }}>
            <Star size={13} fill={color} stroke="none" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{score}</span>
            <span style={{ fontSize: '0.75rem', color, opacity: 0.8 }}>{label}</span>
        </div>
    )
}

const formatINR = (n: number | null | undefined) => {
    if (!n) return '—'
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
    return `₹${n.toLocaleString('en-IN')}`
}

export default function LeadDetailPage() {
    const params = useParams()
    const id = params?.id as string
    const router = useRouter()
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)
    const [lead, setLead] = useState<Lead | null>(null)
    const [activities, setActivities] = useState<LeadActivity[]>([])
    const [tasks, setTasks] = useState<LeadTask[]>([])
    const [visits, setVisits] = useState<SiteVisit[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'visits'>('timeline')
    const [showAddActivity, setShowAddActivity] = useState(false)
    const [showAddTask, setShowAddTask] = useState(false)
    const [showAddVisit, setShowAddVisit] = useState(false)
    const [showLostModal, setShowLostModal] = useState(false)
    const [newActivity, setNewActivity] = useState({ type: 'note', title: '', description: '' })
    const [newTask, setNewTask] = useState({ title: '', due_date: '', description: '' })
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [editTaskData, setEditTaskData] = useState({ title: '', description: '', due_date: '' })
    const [newVisit, setNewVisit] = useState({ visit_date: '', visit_time: '', notes: '' })
    const [lostReason, setLostReason] = useState('')
    const [editing, setEditing] = useState(false)
    const [editData, setEditData] = useState<Partial<Lead & { budget_min: number | null; budget_max: number | null; next_follow_up_at: string | null }>>({})
    const [tagInput, setTagInput] = useState('')
    const [saving, setSaving] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserName, setCurrentUserName] = useState<string | null>(null)

    // Website footprint
    const [footprint, setFootprint] = useState<any>(null)
    const [footprintLoading, setFootprintLoading] = useState(false)

    // Property preferences
    const [prefEditing, setPrefEditing] = useState(false)
    const [prefData, setPrefData] = useState({
        property_type: '', preferred_location: '',
        budget_min: '', budget_max: '',
        bhk: '', area_min: '', area_max: '',
        transaction_type: '', furnishing: '', possession: '',
    })
    const [prefSaving, setPrefSaving] = useState(false)

    const fetchLead = async () => {
        const [leadRes, visitsRes] = await Promise.all([
            fetch(`/api/crm/leads/${id}`),
            fetch(`/api/crm/site-visits?lead_id=${id}`),
        ])
        if (leadRes.ok) {
            const d = await leadRes.json()
            setLead(d.lead)
            setActivities(d.activities)
            setTasks(d.tasks)
            const lp = d.lead?.lead_preferences || {}
            setPrefData({
                property_type: d.lead?.property_type || '',
                preferred_location: d.lead?.preferred_location || '',
                budget_min: d.lead?.budget_min?.toString() || '',
                budget_max: d.lead?.budget_max?.toString() || '',
                bhk: lp.bhk || '',
                area_min: lp.area_min?.toString() || '',
                area_max: lp.area_max?.toString() || '',
                transaction_type: lp.transaction_type || '',
                furnishing: lp.furnishing || '',
                possession: lp.possession || '',
            })
        }
        if (visitsRes.ok) { const d = await visitsRes.json(); setVisits(d.visits || []) }
        setLoading(false)
    }
    useEffect(() => { fetchLead() }, [id])
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setCurrentUserId(data.user.id)
                supabase.from('profiles').select('full_name').eq('id', data.user.id).single()
                    .then(({ data: p }) => { if (p?.full_name) setCurrentUserName(p.full_name) })
            }
        })
    }, [])

    useEffect(() => {
        if (!lead?.email) return
        setFootprintLoading(true)
        fetch(`/api/crm/lead-footprint?email=${encodeURIComponent(lead.email)}&days=30`)
            .then(r => r.json()).then(d => { setFootprint(d); setFootprintLoading(false) })
            .catch(() => setFootprintLoading(false))
    }, [lead?.email])

    const patch = async (body: Record<string, unknown>) => {
        await fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        fetchLead()
    }

    const handleStatusChange = (s: string) => { patch({ status: s }) }
    const handleMarkLost = async () => {
        await fetch(`/api/crm/leads/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'lost', lost_reason: lostReason }),
        })
        setShowLostModal(false); fetchLead()
    }
    const handleSaveEdit = async () => {
        setSaving(true)
        const payload = { ...editData }
        if (editData.tags && typeof editData.tags === 'string') {
            payload.tags = (editData.tags as unknown as string).split(',').map((t: string) => t.trim()).filter(Boolean) as unknown as string[]
        }
        await fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        setEditing(false); setSaving(false); fetchLead()
    }
    const handleSavePref = async () => {
        setPrefSaving(true)
        await patch({
            property_type: prefData.property_type || null,
            preferred_location: prefData.preferred_location || null,
            budget_min: prefData.budget_min ? Number(prefData.budget_min) : null,
            budget_max: prefData.budget_max ? Number(prefData.budget_max) : null,
            lead_preferences: {
                bhk: prefData.bhk || null,
                area_min: prefData.area_min ? Number(prefData.area_min) : null,
                area_max: prefData.area_max ? Number(prefData.area_max) : null,
                transaction_type: prefData.transaction_type || null,
                furnishing: prefData.furnishing || null,
                possession: prefData.possession || null,
            }
        })
        setPrefEditing(false); setPrefSaving(false)
    }
    const handleAddTag = async (tag: string) => {
        if (!tag.trim() || !lead) return
        const newTags = [...(lead.tags || []), tag.trim()]
        await patch({ tags: newTags }); setTagInput('')
    }
    const handleRemoveTag = async (tag: string) => {
        if (!lead) return
        await patch({ tags: (lead.tags || []).filter(t => t !== tag) })
    }
    const handleAddActivity = async () => {
        if (!newActivity.title) return
        await fetch('/api/crm/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, ...newActivity }) })
        setShowAddActivity(false); setNewActivity({ type: 'note', title: '', description: '' }); fetchLead()
    }
    const handleAddTask = async () => {
        if (!newTask.title || !newTask.due_date) return
        const due_date = new Date(newTask.due_date).toISOString()
        await fetch('/api/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, ...newTask, due_date, created_by: currentUserId || undefined }) })
        setShowAddTask(false); setNewTask({ title: '', due_date: '', description: '' }); fetchLead()
    }
    const handleToggleTask = async (taskId: string, completed: boolean) => {
        await fetch('/api/crm/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, is_completed: !completed }) }); fetchLead()
    }
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Delete this task?')) return
        await fetch(`/api/crm/tasks?id=${taskId}`, { method: 'DELETE' }); fetchLead()
    }
    const handleStartEditTask = (t: LeadTask) => {
        setEditingTaskId(t.id)
        setEditTaskData({ title: t.title, description: t.description || '', due_date: t.due_date?.slice(0, 16) || '' })
    }
    const handleSaveEditTask = async () => {
        if (!editingTaskId || !editTaskData.title) return
        const due_date = editTaskData.due_date ? new Date(editTaskData.due_date).toISOString() : undefined
        await fetch('/api/crm/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingTaskId, ...editTaskData, ...(due_date ? { due_date } : {}) }) })
        setEditingTaskId(null); fetchLead()
    }
    const handleAddVisit = async () => {
        if (!newVisit.visit_date) return
        await fetch('/api/crm/site-visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, ...newVisit }) })
        setShowAddVisit(false); setNewVisit({ visit_date: '', visit_time: '', notes: '' }); fetchLead()
    }
    const handleVisitStatus = async (visitId: string, status: string, outcome?: string) => {
        await fetch('/api/crm/site-visits', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: visitId, status, outcome }) })
        fetchLead()
    }

    const fmtSecs = (s: number) => { if (!s || s < 1) return '0s'; if (s < 60) return `${s}s`; const m = Math.floor(s / 60); const sec = s % 60; if (m < 60) return sec > 0 ? `${m}m ${sec}s` : `${m}m`; return `${Math.floor(m / 60)}h ${m % 60}m` }
    const fmtRelSec = (d: string) => { const ms = Date.now() - new Date(d).getTime(); const dd = Math.floor(ms / 86400000); if (dd === 0) return 'Today'; if (dd === 1) return 'Yesterday'; return `${dd}d ago` }
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const formatDateTime = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const formatRelative = (d: string) => {
        const ms = Date.now() - new Date(d).getTime(); const m = Math.floor(ms / 60000); const h = Math.floor(ms / 3600000); const dd = Math.floor(ms / 86400000)
        if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; if (dd < 7) return `${dd}d ago`; return formatDate(d)
    }

    if (loading) return <div className={styles.pageContent}><div className={styles.emptyState}>Loading...</div></div>
    if (!lead) return <div className={styles.pageContent}><div className={styles.emptyState}>Lead not found</div></div>

    const currentStep = statusSteps.indexOf(lead.status)
    const score = (lead as any).score || 0
    const lp = (lead as any).lead_preferences || {}

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => router.push('/crm/leads')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-muted)' }}><ArrowLeft size={20} /></button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{lead.name}</h1>
                        <ScoreBadge score={score} />
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>{isAdminUser && <>{sourceLabels[lead.source]} · </>}{formatRelative(lead.created_at)}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {lead.phone && (
                        <a href={`tel:${lead.phone}`} className={styles.btnPrimary} style={{ backgroundColor: '#22c55e' }}>
                            <Phone size={14} /> Call
                        </a>
                    )}
                    {lead.phone && (
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className={styles.btnPrimary} style={{ backgroundColor: '#25D366' }}>
                            <MessageSquare size={14} /> WhatsApp
                        </a>
                    )}
                    {lead.email && (
                        <a href={`mailto:${lead.email}`} className={styles.btnSecondary}><Mail size={14} /> Email</a>
                    )}
                </div>
            </div>

            {/* Status Pipeline */}
            {lead.status !== 'lost' ? (
                <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto' }}>
                        {statusSteps.map((step, i) => (
                            <button key={step} onClick={() => handleStatusChange(step)} className={styles.pipelineBtn} style={{
                                backgroundColor: i <= currentStep ? statusConfig[step]?.color : 'var(--crm-elevated)',
                                color: i <= currentStep ? '#fff' : 'var(--crm-text-muted)',
                            }}>{statusConfig[step]?.label}</button>
                        ))}
                    </div>
                    <button onClick={() => setShowLostModal(true)} style={{
                        marginTop: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.6875rem',
                        fontWeight: 500, cursor: 'pointer', border: '1px solid #ef444440',
                        backgroundColor: 'transparent', color: '#ef4444',
                    }}>Mark as Lost</button>
                </div>
            ) : (
                <div className={styles.card} style={{ marginBottom: '1.5rem', borderColor: '#ef444430', backgroundColor: '#ef444408' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>Lost</span>
                            {lead.lost_reason && <span style={{ color: 'var(--crm-text-muted)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>— {lead.lost_reason}</span>}
                        </div>
                        <button onClick={() => patch({ status: 'new', lost_reason: null })} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>Reopen</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Pre-Call Intelligence Brief */}
                    {lead && (
                        <div className={styles.card} style={{ background: 'linear-gradient(135deg, var(--crm-surface) 0%, var(--crm-accent-bg) 100%)', border: '1px solid var(--crm-accent)30' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                                <PhoneCall size={14} style={{ color: 'var(--crm-accent)' }} />
                                <span className={styles.cardTitle}>Pre-Call Brief</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--crm-text-dim)', fontStyle: 'italic' }}>before you dial</span>
                            </div>

                            {/* Talking points */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {/* Priority + age */}
                                <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--crm-accent)', fontWeight: 700, flexShrink: 0 }}>📌</span>
                                    <span style={{ color: 'var(--crm-text-secondary)' }}>
                                        <strong>{lead.priority?.toUpperCase()}</strong> lead · {Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)}d old{isAdminUser && <> · from <strong>{sourceLabels[lead.source] || lead.source}</strong></>}
                                    </span>
                                </div>

                                {/* Property intent */}
                                {(lead.property_type || lead.preferred_location || lead.budget_min || lead.budget_max) && (
                                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                        <span style={{ color: '#3b82f6', flexShrink: 0 }}>🏠</span>
                                        <span style={{ color: 'var(--crm-text-secondary)' }}>
                                            Looking for{' '}
                                            {lead.property_type ? <strong>{lead.property_type}</strong> : 'a property'}
                                            {lead.preferred_location && <> in <strong>{lead.preferred_location}</strong></>}
                                            {(lead.budget_min || lead.budget_max) && <> · Budget: <strong>{formatINR(lead.budget_min)} – {formatINR(lead.budget_max)}</strong></>}
                                        </span>
                                    </div>
                                )}

                                {/* Property interested in */}
                                {(() => {
                                    const directName = lead.properties?.title || lead.projects?.project_name || lead.property_interest || lead.project_interest
                                    // Fallback: parse from 99acres-style notes "| Project: XYZ" or "for Sale in XYZ,"
                                    const notesName = !directName && lead.notes
                                        ? (lead.notes.match(/\|\s*Project:\s*([^|]+)/i)?.[1]?.trim()
                                            || lead.notes.match(/for (?:Sale|Rent) in ([^,|]+)/i)?.[1]?.trim())
                                        : null
                                    const display = directName || notesName
                                    if (!display) return null
                                    return (
                                        <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                            <span style={{ color: '#f59e0b', flexShrink: 0 }}>🏢</span>
                                            <span style={{ color: 'var(--crm-text-secondary)' }}>
                                                Interested in: <strong>{display}</strong>
                                            </span>
                                        </div>
                                    )
                                })()}

                                {/* Website signals */}
                                {footprint?.linked && (
                                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                        <span style={{ color: '#8b5cf6', flexShrink: 0 }}>🌐</span>
                                        <span style={{ color: 'var(--crm-text-secondary)' }}>
                                            On site: <strong>{footprint.totalViews} views</strong>, <strong>{footprint.totalBookmarks} saved</strong>
                                            {footprint.lastSeen && <> · Last seen <strong>{fmtRelSec(footprint.lastSeen)}</strong></>}
                                        </span>
                                    </div>
                                )}

                                {/* Most viewed listing */}
                                {footprint?.viewedListings?.[0] && (
                                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                        <span style={{ color: '#f59e0b', flexShrink: 0 }}>👁️</span>
                                        <span style={{ color: 'var(--crm-text-secondary)' }}>
                                            Most viewed: <a href={footprint.viewedListings[0].href} target="_blank" rel="noreferrer" style={{ color: 'var(--crm-accent)', fontWeight: 600 }}>{footprint.viewedListings[0].title}</a>
                                            {footprint.viewedListings[0].bookmarked ? ' 🔖' : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Last activity */}
                                {activities.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                        <span style={{ color: '#10b981', flexShrink: 0 }}>🕐</span>
                                        <span style={{ color: 'var(--crm-text-secondary)' }}>
                                            Last activity: <strong>{activities[0].title}</strong>
                                        </span>
                                    </div>
                                )}

                                {/* Overdue follow-up */}
                                {lead.next_follow_up_at && new Date(lead.next_follow_up_at) < new Date() && (
                                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start', backgroundColor: '#fef3c7', padding: '6px 8px', borderRadius: '6px', marginTop: '2px' }}>
                                        <span style={{ color: '#d97706', flexShrink: 0 }}>⏰</span>
                                        <span style={{ color: '#92400e', fontWeight: 600 }}>
                                            Follow-up overdue since {formatDateTime(lead.next_follow_up_at)}
                                        </span>
                                    </div>
                                )}

                                {/* Tags */}
                                {lead.tags && lead.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                                        {lead.tags.map((tag: string) => (
                                            <span key={tag} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', backgroundColor: 'var(--crm-border)', color: 'var(--crm-text-dim)', fontWeight: 500 }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span className={styles.cardTitle}>Contact Info</span>
                            <button onClick={() => { setEditing(!editing); setEditData({ ...lead }) }}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-accent)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {editing ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> Edit</>}
                            </button>
                        </div>
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="Name" className={styles.formInput} />
                                <input type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} placeholder="Email" className={styles.formInput} />
                                <input type="tel" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="Phone" className={styles.formInput} />
                                <input type="datetime-local" value={editData.next_follow_up_at?.slice(0, 16) || ''} onChange={e => setEditData({ ...editData, next_follow_up_at: e.target.value })} className={styles.formInput} />
                                <textarea value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} placeholder="Notes" rows={3} className={styles.formInput} style={{ resize: 'vertical' }} />
                                <button onClick={handleSaveEdit} className={styles.btnPrimary} disabled={saving}>
                                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}><Phone size={12} style={{ color: 'var(--crm-text-muted)' }} /><span style={{ color: 'var(--crm-text-secondary)' }}>{lead.phone}</span></div>}
                                {lead.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}><Mail size={12} style={{ color: 'var(--crm-text-muted)' }} /><span style={{ color: 'var(--crm-text-secondary)' }}>{lead.email}</span></div>}
                                {lead.next_follow_up_at && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#f59e0b' }}>
                                        <CalendarCheck size={12} /> Follow-up: {formatDateTime(lead.next_follow_up_at)}
                                    </div>
                                )}
                                {lead.notes && <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', backgroundColor: 'var(--crm-elevated)', padding: '0.625rem', borderRadius: '0.5rem', marginTop: '0.25rem' }}>{lead.notes}</div>}
                            </div>
                        )}
                    </div>

                    {/* Property Preferences */}
                    <div className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Sliders size={14} /> Property Preference
                            </span>
                            <button onClick={() => setPrefEditing(!prefEditing)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-accent)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {prefEditing ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> Edit</>}
                            </button>
                        </div>
                        {prefEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div>
                                        <label className={styles.formLabel}>Property Type</label>
                                        <select value={prefData.property_type} onChange={e => setPrefData({ ...prefData, property_type: e.target.value })} className={styles.formSelect}>
                                            <option value="">Select...</option>
                                            {['Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Penthouse', 'Studio', 'Duplex', 'Plot', 'Farmhouse', 'Commercial', 'Office', 'Warehouse'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={styles.formLabel}>BHK</label>
                                        <select value={prefData.bhk} onChange={e => setPrefData({ ...prefData, bhk: e.target.value })} className={styles.formSelect}>
                                            <option value="">Any</option>
                                            {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '6+ BHK'].map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={styles.formLabel}>Transaction Type</label>
                                    <select value={prefData.transaction_type} onChange={e => setPrefData({ ...prefData, transaction_type: e.target.value })} className={styles.formSelect}>
                                        <option value="">Any</option>
                                        <option value="Buy">Buy</option>
                                        <option value="Rent">Rent</option>
                                        <option value="Lease">Lease</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={styles.formLabel}>Preferred Location</label>
                                    <input type="text" value={prefData.preferred_location} onChange={e => setPrefData({ ...prefData, preferred_location: e.target.value })} placeholder="e.g. Baner, Pune" className={styles.formInput} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div>
                                        <label className={styles.formLabel}>Budget Min (₹)</label>
                                        <input type="number" value={prefData.budget_min} onChange={e => setPrefData({ ...prefData, budget_min: e.target.value })} placeholder="e.g. 5000000" className={styles.formInput} />
                                    </div>
                                    <div>
                                        <label className={styles.formLabel}>Budget Max (₹)</label>
                                        <input type="number" value={prefData.budget_max} onChange={e => setPrefData({ ...prefData, budget_max: e.target.value })} placeholder="e.g. 10000000" className={styles.formInput} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div>
                                        <label className={styles.formLabel}>Area Min (sqft)</label>
                                        <input type="number" value={prefData.area_min} onChange={e => setPrefData({ ...prefData, area_min: e.target.value })} placeholder="e.g. 800" className={styles.formInput} />
                                    </div>
                                    <div>
                                        <label className={styles.formLabel}>Area Max (sqft)</label>
                                        <input type="number" value={prefData.area_max} onChange={e => setPrefData({ ...prefData, area_max: e.target.value })} placeholder="e.g. 1500" className={styles.formInput} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div>
                                        <label className={styles.formLabel}>Furnishing</label>
                                        <select value={prefData.furnishing} onChange={e => setPrefData({ ...prefData, furnishing: e.target.value })} className={styles.formSelect}>
                                            <option value="">Any</option>
                                            <option value="Furnished">Furnished</option>
                                            <option value="Semi Furnished">Semi Furnished</option>
                                            <option value="Unfurnished">Unfurnished</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={styles.formLabel}>Possession</label>
                                        <select value={prefData.possession} onChange={e => setPrefData({ ...prefData, possession: e.target.value })} className={styles.formSelect}>
                                            <option value="">Any</option>
                                            <option value="Ready to Move">Ready to Move</option>
                                            <option value="Under Construction">Under Construction</option>
                                            <option value="Within 6 months">Within 6 months</option>
                                            <option value="Within 1 year">Within 1 year</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleSavePref} className={styles.btnPrimary} disabled={prefSaving}>
                                    <Save size={14} /> {prefSaving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {!lead.property_type && !lead.preferred_location && !lead.budget_min && !lp.bhk && !lp.transaction_type ? (
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)', fontStyle: 'italic' }}>
                                        No preferences added yet. Click Edit to add.
                                    </div>
                                ) : (
                                    <>
                                        {lead.property_type && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                <Building2 size={12} style={{ color: 'var(--crm-text-muted)', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--crm-text-muted)' }}>Type:</span>
                                                <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 500 }}>
                                                    {lead.property_type}{lp.bhk ? ` · ${lp.bhk}` : ''}
                                                </span>
                                            </div>
                                        )}
                                        {lp.transaction_type && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                <Banknote size={12} style={{ color: 'var(--crm-text-muted)', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--crm-text-muted)' }}>For:</span>
                                                <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 500 }}>{lp.transaction_type}</span>
                                            </div>
                                        )}
                                        {lead.preferred_location && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                <MapPin size={12} style={{ color: 'var(--crm-text-muted)', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--crm-text-muted)' }}>Location:</span>
                                                <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 500 }}>{lead.preferred_location}</span>
                                            </div>
                                        )}
                                        {(lead.budget_min || lead.budget_max) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                <IndianRupee size={12} style={{ color: 'var(--crm-accent)', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--crm-text-muted)' }}>Budget:</span>
                                                <span style={{ color: 'var(--crm-accent)', fontWeight: 600 }}>{formatINR(lead.budget_min)} – {formatINR(lead.budget_max)}</span>
                                            </div>
                                        )}
                                        {(lp.area_min || lp.area_max) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                <Ruler size={12} style={{ color: 'var(--crm-text-muted)', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--crm-text-muted)' }}>Area:</span>
                                                <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 500 }}>{lp.area_min || '—'} – {lp.area_max || '—'} sqft</span>
                                            </div>
                                        )}
                                        {lp.furnishing && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                <Home size={12} style={{ color: 'var(--crm-text-muted)', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--crm-text-muted)' }}>Furnishing:</span>
                                                <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 500 }}>{lp.furnishing}</span>
                                            </div>
                                        )}
                                        {lp.possession && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                <CalendarCheck size={12} style={{ color: 'var(--crm-text-muted)', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--crm-text-muted)' }}>Possession:</span>
                                                <span style={{ color: 'var(--crm-text-secondary)', fontWeight: 500 }}>{lp.possession}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div className={styles.card}>
                        <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.625rem' }}>
                            <Tag size={14} /> Tags
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.625rem' }}>
                            {(lead.tags || []).map(tag => (
                                <span key={tag} style={{
                                    padding: '3px 8px', borderRadius: '999px', fontSize: '0.6875rem',
                                    backgroundColor: 'var(--crm-accent-bg)', color: 'var(--crm-accent)', border: '1px solid #BFA27040',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                }}>
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-muted)', padding: 0, lineHeight: 1 }}><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput) } }}
                                placeholder="Add tag..." className={styles.formInput} style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }} />
                            <button onClick={() => handleAddTag(tagInput)} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>Add</button>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className={styles.card}>
                        <span className={styles.cardTitle} style={{ display: 'block', marginBottom: '0.75rem' }}>Priority</span>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {(['hot', 'warm', 'cold'] as const).map(p => {
                                const pColor = p === 'hot' ? '#ef4444' : p === 'warm' ? '#f59e0b' : '#3b82f6'
                                const isActive = lead.priority === p
                                return (
                                    <button key={p} onClick={() => patch({ priority: p })} style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                                        border: `1px solid ${isActive ? pColor : 'var(--crm-border)'}`,
                                        backgroundColor: isActive ? `${pColor}15` : 'var(--crm-elevated)',
                                        color: pColor,
                                    }}>{p === 'hot' ? '🔥' : p === 'warm' ? '🟡' : '🔵'} {p}</button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    {(lead as any).score_breakdown && (
                        <div className={styles.card}>
                            <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                                <TrendingUp size={14} /> Score Breakdown
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {Object.entries((lead as any).score_breakdown as Record<string, number>).map(([key, val]) => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--crm-text-muted)', textTransform: 'capitalize' }}>{key}</span>
                                        <span style={{ color: (val as number) > 0 ? '#22c55e' : 'var(--crm-text-dim)', fontWeight: 600 }}>+{val as number}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1px solid var(--crm-border)', marginTop: '0.25rem', paddingTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700 }}>
                                    <span style={{ color: 'var(--crm-text-muted)' }}>Total</span>
                                    <span style={{ color: 'var(--crm-text-primary)' }}>{score}/100</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Source — admin only */}
                    {isAdminUser && (
                        <div className={styles.card}>
                            <span className={styles.cardTitle} style={{ display: 'block', marginBottom: '0.75rem' }}>Source</span>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                <div><strong style={{ color: 'var(--crm-text-tertiary)' }}>Platform:</strong> {sourceLabels[lead.source]}</div>
                                {lead.source_campaign && <div><strong style={{ color: 'var(--crm-text-tertiary)' }}>Campaign:</strong> {lead.source_campaign}</div>}
                                {lead.source_form_id && <div><strong style={{ color: 'var(--crm-text-tertiary)' }}>Form ID:</strong> {lead.source_form_id}</div>}
                                {lead.last_contacted_at && <div><strong style={{ color: 'var(--crm-text-tertiary)' }}>Last Contacted:</strong> {formatDate(lead.last_contacted_at)}</div>}
                            </div>
                        </div>
                    )}

                    {/* Website Activity (Digital Footprint) */}
                    {lead.email && (
                        <div className={styles.card} style={{ borderColor: footprint?.linked ? '#BFA27040' : undefined }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                                <Globe size={14} style={{ color: '#BFA270' }} />
                                <span className={styles.cardTitle}>Website Activity</span>
                                {footprint?.linked && (
                                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '2px 7px', borderRadius: 999, background: '#22c55e18', color: '#22c55e', fontWeight: 600, border: '1px solid #22c55e30' }}>● Linked</span>
                                )}
                            </div>

                            {footprintLoading ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--crm-text-faint)', textAlign: 'center', padding: '1rem 0' }}>Checking website activity…</div>
                            ) : !footprint?.linked ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--crm-text-faint)', fontStyle: 'italic' }}>
                                    No website account found for <strong>{lead.email}</strong>. They may have browsed as a guest.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {/* Summary stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        {[
                                            { icon: Eye, label: 'Page Views', value: footprint.totalViews, color: '#3b82f6' },
                                            { icon: Activity, label: 'Sessions', value: footprint.uniqueSessions, color: '#f59e0b' },
                                            { icon: Clock, label: 'Time Spent', value: fmtSecs(footprint.totalSecs), color: '#22c55e', text: true },
                                            { icon: Bookmark, label: 'Bookmarks', value: footprint.totalBookmarks, color: '#8b5cf6' },
                                        ].map(({ icon: Icon, label, value, color, text }) => (
                                            <div key={label} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: `1px solid ${color}20`, background: `${color}08`, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Icon size={12} style={{ color, flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: text ? '0.8rem' : '1rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--crm-text-faint)', marginTop: 1 }}>{label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {footprint.lastSeen && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={11} /> Last seen: <strong style={{ color: 'var(--crm-text-primary)' }}>{fmtRelSec(footprint.lastSeen)}</strong>
                                        </div>
                                    )}

                                    {/* Viewed / Bookmarked listings */}
                                    {footprint.viewedListings?.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Viewed Listings</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                {footprint.viewedListings.slice(0, 5).map((item: any) => (
                                                    <a key={item.id} href={item.href} target="_blank" rel="noreferrer"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', border: '1px solid var(--crm-border)', background: 'var(--crm-elevated)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                                                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#BFA270')}
                                                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--crm-border)')}
                                                    >
                                                        {item.image
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            ? <img src={proxyUrl(item.image)} alt="" style={{ width: 36, height: 36, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                                                            : <div style={{ width: 36, height: 36, borderRadius: 5, background: 'var(--crm-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                                                {item.type === 'property' ? '🏠' : '🏗️'}
                                                            </div>
                                                        }
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)' }}>{item.location}</div>
                                                        </div>
                                                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6' }}>{item.views}×</div>
                                                            {item.bookmarked && <div style={{ fontSize: '0.6rem', color: '#8b5cf6' }}>🔖 saved</div>}
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Saved but not viewed in listings above */}
                                    {footprint.savedListings?.filter((s: any) => !footprint.viewedListings?.find((v: any) => v.id === s.id)).length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Bookmarked</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                {footprint.savedListings.filter((s: any) => !footprint.viewedListings?.find((v: any) => v.id === s.id)).slice(0, 3).map((item: any) => (
                                                    <a key={item.id} href={item.href} target="_blank" rel="noreferrer"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #8b5cf620', background: '#8b5cf608', textDecoration: 'none' }}>
                                                        {item.image
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            ? <img src={proxyUrl(item.image)} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                                                            : <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--crm-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>🔖</div>
                                                        }
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)' }}>Saved {fmtRelSec(item.savedAt)}</div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Top pages (non-listing) */}
                                    {footprint.topPages?.filter((p: any) => !p.path.match(/\/(properties|projects)\/[a-f0-9-]{36}/)).length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Top Pages</div>
                                            {footprint.topPages.filter((p: any) => !p.path.match(/\/(properties|projects)\/[a-f0-9-]{36}/)).slice(0, 4).map((p: any) => (
                                                <div key={p.path} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.25rem 0', borderBottom: '1px solid var(--crm-border-subtle)' }}>
                                                    <span style={{ color: 'var(--crm-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                                                        {p.title !== p.path ? p.title : p.path}
                                                    </span>
                                                    <span style={{ color: 'var(--crm-text-faint)', flexShrink: 0 }}>{p.visits}× · {fmtSecs(p.totalSecs)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column — Timeline + Tasks + Visits */}
                <div>
                    <div className={styles.pillTabs} style={{ marginBottom: '1rem' }}>
                        <button className={`${styles.pillTab} ${activeTab === 'timeline' ? styles.pillTabActive : ''}`} onClick={() => setActiveTab('timeline')}>
                            Timeline ({activities.length})
                        </button>
                        <button className={`${styles.pillTab} ${activeTab === 'tasks' ? styles.pillTabActive : ''}`} onClick={() => setActiveTab('tasks')}>
                            Tasks ({tasks.filter(t => !t.is_completed).length})
                        </button>
                        <button className={`${styles.pillTab} ${activeTab === 'visits' ? styles.pillTabActive : ''}`} onClick={() => setActiveTab('visits')}>
                            Site Visits ({visits.length})
                        </button>
                    </div>

                    {/* Timeline */}
                    {activeTab === 'timeline' && (
                        <div className={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={styles.cardTitle}>Activity</span>
                                <button onClick={() => setShowAddActivity(!showAddActivity)} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}><Plus size={12} /> Log</button>
                            </div>
                            {showAddActivity && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--crm-elevated)', borderRadius: '0.5rem', border: '1px solid var(--crm-border)' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <select value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value })} className={styles.formSelect} style={{ width: 'auto' }}>
                                            <option value="note">Note</option>
                                            <option value="call">Call</option>
                                            <option value="email_sent">Email</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="site_visit">Site Visit</option>
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
                                <div key={a.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < activities.length - 1 ? '1px solid var(--crm-border)' : 'none' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crm-text-muted)', flexShrink: 0 }}>
                                        {activityIcons[a.type] || <Clock size={14} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--crm-text-secondary)' }}>{a.title}</div>
                                        {a.description && <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', marginTop: '0.125rem' }}>{a.description}</div>}
                                        <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: '0.25rem' }}>{formatRelative(a.created_at)} · {a.creator_name || a.created_by}</div>
                                    </div>
                                </div>
                            )) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No activity yet</div>}
                        </div>
                    )}

                    {/* Tasks */}
                    {activeTab === 'tasks' && (
                        <div className={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={styles.cardTitle}>Tasks</span>
                                <button onClick={() => setShowAddTask(!showAddTask)} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}><Plus size={12} /> Add</button>
                            </div>
                            {showAddTask && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--crm-elevated)', borderRadius: '0.5rem', border: '1px solid var(--crm-border)' }}>
                                    <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" className={styles.formInput} style={{ marginBottom: '0.5rem' }} />
                                    <input type="datetime-local" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className={styles.formInput} style={{ marginBottom: '0.5rem' }} />
                                    <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Notes (optional)" rows={2} className={styles.formInput} style={{ resize: 'vertical', marginBottom: '0.5rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddTask(false)} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>Cancel</button>
                                        <button onClick={handleAddTask} className={styles.btnPrimary} style={{ fontSize: '0.75rem' }} disabled={!newTask.title || !newTask.due_date}>Save</button>
                                    </div>
                                </div>
                            )}
                            {tasks.length > 0 ? tasks.map(t => {
                                const overdue = !t.is_completed && new Date(t.due_date) < new Date()
                                const isEditing = editingTaskId === t.id
                                return (
                                    <div key={t.id} style={{
                                        borderRadius: '0.375rem', marginBottom: '0.375rem',
                                        backgroundColor: overdue ? '#ef444410' : 'var(--crm-elevated)', border: `1px solid ${overdue ? '#ef444430' : 'var(--crm-border)'}`, opacity: t.is_completed ? 0.55 : 1,
                                    }}>
                                        {isEditing ? (
                                            <div style={{ padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                <input type="text" value={editTaskData.title} onChange={e => setEditTaskData({ ...editTaskData, title: e.target.value })} className={styles.formInput} placeholder="Task title" />
                                                <input type="datetime-local" value={editTaskData.due_date} onChange={e => setEditTaskData({ ...editTaskData, due_date: e.target.value })} className={styles.formInput} />
                                                <textarea value={editTaskData.description} onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })} placeholder="Notes (optional)" rows={2} className={styles.formInput} style={{ resize: 'vertical' }} />
                                                <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setEditingTaskId(null)} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>Cancel</button>
                                                    <button onClick={handleSaveEditTask} className={styles.btnPrimary} style={{ fontSize: '0.75rem' }} disabled={!editTaskData.title}>Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem' }}>
                                                <button onClick={() => handleToggleTask(t.id, t.is_completed)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: t.is_completed ? '#22c55e' : 'var(--crm-text-muted)', marginTop: '2px', flexShrink: 0 }}>
                                                    {t.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                </button>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--crm-text-secondary)', textDecoration: t.is_completed ? 'line-through' : 'none' }}>{t.title}</div>
                                                    {t.description && <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', marginTop: '2px' }}>{t.description}</div>}
                                                    <div style={{ fontSize: '0.6875rem', color: overdue ? '#ef4444' : 'var(--crm-text-faint)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={10} />{formatDateTime(t.due_date)} {overdue && '· Overdue'}
                                                    </div>
                                                    {t.creator_name && (
                                                        <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: '2px' }}>
                                                            Added by {t.creator_name}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                    <button onClick={() => handleStartEditTask(t)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-muted)', padding: '2px 4px', borderRadius: '4px' }} title="Edit">
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button onClick={() => handleDeleteTask(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', borderRadius: '4px' }} title="Delete">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No tasks</div>}
                        </div>
                    )}

                    {/* Site Visits */}
                    {activeTab === 'visits' && (
                        <div className={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={styles.cardTitle}>Site Visits</span>
                                <button onClick={() => setShowAddVisit(!showAddVisit)} className={styles.btnSecondary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}><Plus size={12} /> Schedule</button>
                            </div>
                            {showAddVisit && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--crm-elevated)', borderRadius: '0.5rem', border: '1px solid var(--crm-border)' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className={styles.formLabel}>Date *</label>
                                            <input type="date" value={newVisit.visit_date} onChange={e => setNewVisit({ ...newVisit, visit_date: e.target.value })} className={styles.formInput} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className={styles.formLabel}>Time</label>
                                            <input type="time" value={newVisit.visit_time} onChange={e => setNewVisit({ ...newVisit, visit_time: e.target.value })} className={styles.formInput} />
                                        </div>
                                    </div>
                                    <textarea value={newVisit.notes} onChange={e => setNewVisit({ ...newVisit, notes: e.target.value })} placeholder="Notes" rows={2} className={styles.formInput} style={{ resize: 'vertical', marginBottom: '0.5rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddVisit(false)} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>Cancel</button>
                                        <button onClick={handleAddVisit} className={styles.btnPrimary} style={{ fontSize: '0.75rem' }} disabled={!newVisit.visit_date}>Schedule</button>
                                    </div>
                                </div>
                            )}
                            {visits.length > 0 ? visits.map(v => {
                                const isPast = new Date(v.visit_date) < new Date()
                                const statusColor = v.status === 'completed' ? '#22c55e' : v.status === 'no_show' ? '#ef4444' : v.status === 'cancelled' ? '#6b7280' : '#f59e0b'
                                return (
                                    <div key={v.id} style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border)', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Home size={14} style={{ color: 'var(--crm-text-muted)' }} />
                                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>
                                                        {v.properties?.title || v.projects?.project_name || 'Site Visit'}
                                                    </span>
                                                    <span style={{ fontSize: '0.6875rem', color: statusColor, backgroundColor: `${statusColor}20`, padding: '2px 6px', borderRadius: '999px' }}>
                                                        {v.status}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={10} /> {formatDate(v.visit_date)}
                                                    {v.visit_time && <><Clock size={10} style={{ marginLeft: '6px' }} /> {v.visit_time}</>}
                                                </div>
                                                {v.notes && <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', marginTop: '4px' }}>{v.notes}</div>}
                                                {v.outcome && <div style={{ fontSize: '0.75rem', color: 'var(--crm-accent)', marginTop: '4px' }}>Outcome: {v.outcome}</div>}
                                            </div>
                                            {v.status === 'scheduled' && isPast && (
                                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                    <button onClick={() => handleVisitStatus(v.id, 'completed', 'interested')} className={styles.btnPrimary} style={{ fontSize: '0.6875rem', padding: '4px 8px', backgroundColor: '#22c55e' }}>Visited</button>
                                                    <button onClick={() => handleVisitStatus(v.id, 'no_show')} className={styles.btnSecondary} style={{ fontSize: '0.6875rem', padding: '4px 8px', color: '#ef4444' }}>No Show</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No site visits scheduled</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Lost Reason Modal */}
            {showLostModal && (
                <div className={styles.modal} onClick={() => setShowLostModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ef4444' }}>Mark as Lost</h3>
                            <button onClick={() => setShowLostModal(false)} className={styles.btnIcon}><X size={16} /></button>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Reason for losing (optional)</label>
                            <select value={lostReason} onChange={e => setLostReason(e.target.value)} className={styles.formSelect} style={{ marginBottom: '0.5rem' }}>
                                <option value="">Select reason...</option>
                                <option value="Budget constraints">Budget constraints</option>
                                <option value="Chose competitor">Chose competitor</option>
                                <option value="Not interested anymore">Not interested anymore</option>
                                <option value="No response">No response</option>
                                <option value="Requirement changed">Requirement changed</option>
                                <option value="Price too high">Price too high</option>
                                <option value="Other">Other</option>
                            </select>
                            {lostReason === 'Other' && (
                                <textarea value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Describe reason..." rows={2} className={styles.formInput} style={{ resize: 'vertical' }} />
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowLostModal(false)} className={styles.btnSecondary}>Cancel</button>
                            <button onClick={handleMarkLost} className={styles.btnPrimary} style={{ backgroundColor: '#ef4444' }}>Confirm Lost</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
