'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import {
    Search, UserPlus, Phone, ChevronLeft, ChevronRight, X, Trash2,
    Filter, Download, Star, Calendar, BarChart2, List, Users, AlertTriangle,
    CheckCircle2, PhoneOff, Clock, RefreshCw, UserCheck, Check, Upload, FileText,
} from 'lucide-react'
import styles from '../crm.module.css'
import { useCRMUser, isAdmin, isManager, isAgent, isSuperAdmin } from '../crm-context'
import { leadSourceConfig, leadStatusConfig, FALLBACK_CHART_COLORS } from '@/lib/crm-constants'

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

interface Lead {
    id: string; name: string; email: string | null; phone: string | null
    source: string; status: string; priority: string; created_at: string
    score?: number
    assigned_to?: string | null
    assigned_at?: string | null
    scheduled_call_at?: string | null
    last_activity_at?: string | null
    escalated_at?: string | null
    escalation_count?: number
    properties?: { title: string } | null
    projects?: { project_name: string } | null
    assignee?: { id: string; full_name: string } | null
}

interface Schedule {
    id: string; lead_id: string; agent_id: string; scheduled_at: string; status: string
    outcome?: string | null; notes?: string | null
    postpone_requested_at?: string | null
    postpone_approved_by?: string | null
    actual_called_at?: string | null
    lead?: { id: string; name: string; phone: string | null; email: string | null; status: string; priority: string; score?: number; source: string }
    agent?: { id: string; full_name: string; role: string }
}

interface Employee { id: string; full_name: string; role: string }

// Removed local color configs
const scheduleStatusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: '#3b82f6', label: 'Pending' },
    called: { color: '#22c55e', label: 'Called' },
    no_answer: { color: 'var(--crm-text-faint)', label: 'No Answer' },
    postpone_requested: { color: '#f59e0b', label: 'Postpone Requested' },
    postponed: { color: '#8b5cf6', label: 'Postponed' },
    escalated: { color: '#ef4444', label: 'Escalated' },
    reassigned: { color: '#06b6d4', label: 'Reassigned' },
}
const statuses = ['all', 'new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted', 'lost']
const sources = ['all', 'website', 'meta_ads', 'google_ads', '99acres', 'magicbricks', 'housing', 'justdial', 'chatbot', 'manual', 'referral']
const priorities = ['all', 'hot', 'warm', 'cold']

function ScoreDot({ score }: { score: number }) {
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#6b7280'
    return (
        <span title={`Score: ${score}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.6875rem', color, fontWeight: 600 }}>
            <Star size={10} fill={color} stroke="none" />{score}
        </span>
    )
}

function formatRelative(d: string) {
    const ms = Date.now() - new Date(d).getTime()
    const h = Math.floor(ms / 3600000); const dd = Math.floor(ms / 86400000)
    if (h < 1) return 'Just now'; if (h < 24) return `${h}h`; if (dd < 7) return `${dd}d`
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + formatTime(iso)
}

export default function LeadsPage() {
    const searchParams = useSearchParams()
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)
    const isManagerUser = isManager(crmUser)
    const isAgentUser = isAgent(crmUser)
    const isSA = isSuperAdmin(crmUser)

    const [view, setView] = useState<'list' | 'schedule' | 'analytics'>('list')
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [statusFilter, setStatusFilter] = useState('all')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [agentFilter, setAgentFilter] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [showAddModal, setShowAddModal] = useState(searchParams?.get('new') === 'true')
    const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', source: 'manual', notes: '', priority: 'warm', preferred_location: '', property_type: '', budget_min: '', budget_max: '' })
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [addModalTab, setAddModalTab] = useState<'single' | 'bulk'>('single')
    const [bulkRows, setBulkRows] = useState<Record<string, string>[]>([])
    const [bulkImporting, setBulkImporting] = useState(false)
    const [bulkResult, setBulkResult] = useState<{ success: number; failed: number } | null>(null)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [assigning, setAssigning] = useState<string | null>(null)
    const [escalating, setEscalating] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Schedule state
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [schedulesLoading, setSchedulesLoading] = useState(false)
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
    const [scheduleAgentFilter, setScheduleAgentFilter] = useState('all')
    const [showOutcomeModal, setShowOutcomeModal] = useState(false)
    const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null)
    const [outcomeForm, setOutcomeForm] = useState({ outcome: 'interested', notes: '' })
    const [outcomeSubmitting, setOutcomeSubmitting] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [assignLeadId, setAssignLeadId] = useState('')
    const [assignAgentId, setAssignAgentId] = useState('')

    // Bulk selection state
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
    const [bulkAction, setBulkAction] = useState('')
    const [bulkProcessing, setBulkProcessing] = useState(false)

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedLeads.size === leads.length) setSelectedLeads(new Set())
        else setSelectedLeads(new Set(leads.map(l => l.id)))
    }

    const handleBulkStatusChange = async (newStatus: string) => {
        if (selectedLeads.size === 0) return
        setBulkProcessing(true)
        const promises = Array.from(selectedLeads).map(id =>
            fetch(`/api/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
        )
        await Promise.all(promises)
        showToast(`Updated ${selectedLeads.size} leads to ${leadStatusConfig[newStatus]?.label || newStatus}`)
        setSelectedLeads(new Set())
        setBulkProcessing(false)
        fetchLeads()
    }

    const handleBulkAssign = async (agentId: string) => {
        if (selectedLeads.size === 0) return
        setBulkProcessing(true)
        const promises = Array.from(selectedLeads).map(id =>
            fetch('/api/crm/leads/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, agent_id: agentId }) })
        )
        await Promise.all(promises)
        showToast(`Assigned ${selectedLeads.size} leads`)
        setSelectedLeads(new Set())
        setBulkProcessing(false)
        fetchLeads()
    }

    const handleBulkDelete = async () => {
        if (selectedLeads.size === 0) return
        if (!confirm(`Delete ${selectedLeads.size} leads? This cannot be undone.`)) return
        setBulkProcessing(true)
        const promises = Array.from(selectedLeads).map(id =>
            fetch(`/api/crm/leads/${id}`, { method: 'DELETE' })
        )
        await Promise.all(promises)
        showToast(`Deleted ${selectedLeads.size} leads`)
        setSelectedLeads(new Set())
        setBulkProcessing(false)
        fetchLeads()
    }

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        const p = new URLSearchParams({ page: String(page), limit: '25' })
        if (statusFilter !== 'all') p.set('status', statusFilter)
        if (sourceFilter !== 'all') p.set('source', sourceFilter)
        if (priorityFilter !== 'all') p.set('priority', priorityFilter)
        if (agentFilter !== 'all') p.set('assigned_to', agentFilter)
        else if (isAgentUser && crmUser?.id) p.set('assigned_to', crmUser.id)
        else if (!isAdminUser && isManagerUser && crmUser?.id) p.set('manager_id', crmUser.id)
        if (search) p.set('search', search)
        const res = await fetch(`/api/crm/leads?${p}`)
        if (res.ok) { const d = await res.json(); setLeads(d.leads || []); setTotal(d.total || 0) }
        setLoading(false)
    }, [page, statusFilter, sourceFilter, priorityFilter, agentFilter, search, isAdminUser, isManagerUser, isAgentUser, crmUser?.id])

    const fetchSchedules = useCallback(async () => {
        setSchedulesLoading(true)
        const p = new URLSearchParams({ date: scheduleDate, all: 'true' })
        if (isAgentUser && crmUser?.id) p.set('agent_id', crmUser.id)
        else if (scheduleAgentFilter !== 'all') p.set('agent_id', scheduleAgentFilter)
        const res = await fetch(`/api/crm/leads/schedule?${p}`)
        if (res.ok) { const d = await res.json(); setSchedules(d.schedules || []) }
        setSchedulesLoading(false)
    }, [scheduleDate, scheduleAgentFilter, isAgentUser, crmUser?.id])

    const fetchEmployees = useCallback(async () => {
        if (!isManagerUser) return
        const res = await fetch('/api/crm/hrm/employees')
        if (res.ok) { const d = await res.json(); setEmployees(d.employees || []) }
    }, [isManagerUser])

    useEffect(() => { fetchLeads() }, [fetchLeads])
    useEffect(() => { if (view === 'schedule') fetchSchedules() }, [view, fetchSchedules])
    useEffect(() => { fetchEmployees() }, [fetchEmployees])

    const CSV_TEMPLATE = `name,email,phone,source,priority,preferred_location,property_type,budget_min,budget_max,property_interest,project_interest,notes
John Doe,john@example.com,9876543210,manual,warm,Whitefield,2BHK Flat,5000000,8000000,Lumina Heights,,Interested in ready-to-move`

    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'leads_template.csv'; a.click()
        URL.revokeObjectURL(url)
    }

    const parseCSV = (text: string): Record<string, string>[] => {
        const lines = text.trim().split('\n')
        if (lines.length < 2) return []
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        return lines.slice(1).filter(l => l.trim()).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']))
        })
    }

    const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            const rows = parseCSV(ev.target?.result as string)
            setBulkRows(rows); setBulkResult(null)
        }
        reader.readAsText(file)
    }

    const handleBulkImport = async () => {
        if (!bulkRows.length) return
        setBulkImporting(true); setBulkResult(null)
        let success = 0; let failed = 0
        for (const row of bulkRows) {
            if (!row.name) { failed++; continue }
            const payload = {
                name: row.name, email: row.email || undefined, phone: row.phone || undefined,
                source: row.source || 'manual', priority: row.priority || 'warm',
                preferred_location: row.preferred_location || undefined,
                property_type: row.property_type || undefined,
                budget_min: row.budget_min ? Number(row.budget_min) : undefined,
                budget_max: row.budget_max ? Number(row.budget_max) : undefined,
                property_interest: row.property_interest || undefined,
                project_interest: row.project_interest || undefined,
                notes: row.notes || undefined,
            }
            const res = await fetch('/api/crm/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (res.ok) success++; else failed++
        }
        setBulkImporting(false); setBulkResult({ success, failed })
        if (success > 0) { fetchLeads(); showToast(`${success} lead${success > 1 ? 's' : ''} imported`) }
    }

    const handleAddLead = async () => {
        if (!newLead.name) return; setSaving(true)
        const payload = { ...newLead, budget_min: newLead.budget_min ? Number(newLead.budget_min) : undefined, budget_max: newLead.budget_max ? Number(newLead.budget_max) : undefined }
        const res = await fetch('/api/crm/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.ok) {
            setShowAddModal(false)
            setNewLead({ name: '', email: '', phone: '', source: 'manual', notes: '', priority: 'warm', preferred_location: '', property_type: '', budget_min: '', budget_max: '' })
            fetchLeads()
            showToast('Lead added & assigned automatically')
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
        if (search) p.set('search', search)
        const res = await fetch(`/api/crm/export?${p}`)
        if (res.ok) {
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
        }
        setExporting(false)
    }

    const handleManualAssign = async () => {
        if (!assignLeadId || !assignAgentId) return
        setAssigning(assignLeadId)
        const res = await fetch('/api/crm/leads/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: assignLeadId, agent_id: assignAgentId }) })
        const d = await res.json()
        if (res.ok) { showToast('Lead assigned'); setShowAssignModal(false); fetchLeads() }
        else showToast(d.error || 'Failed', false)
        setAssigning(null)
    }

    const handleEscalationCheck = async () => {
        setEscalating(true)
        const res = await fetch('/api/crm/leads/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_unattended' }) })
        const d = await res.json()
        showToast(`Escalated ${d.escalated || 0} unattended leads`)
        fetchLeads()
        setEscalating(false)
    }

    const handleScheduleAction = async (id: string, action: string, extra: Record<string, unknown> = {}) => {
        const res = await fetch('/api/crm/leads/schedule', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, ...extra }) })
        const d = await res.json()
        if (res.ok) { showToast('Updated'); fetchSchedules() }
        else showToast(d.error || 'Failed', false)
    }

    const handleLogOutcome = async () => {
        if (!activeSchedule) return
        setOutcomeSubmitting(true)
        const res = await fetch('/api/crm/leads/schedule', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeSchedule.id, status: 'called', outcome: outcomeForm.outcome, notes: outcomeForm.notes }),
        })
        const d = await res.json()
        if (res.ok) { showToast('Call logged'); setShowOutcomeModal(false); fetchSchedules() }
        else showToast(d.error || 'Failed', false)
        setOutcomeSubmitting(false)
    }

    const totalPages = Math.ceil(total / 25)

    // Analytics computed
    const statusCounts = Object.entries(leadStatusConfig).map(([k, v]) => ({
        name: v.label, count: leads.filter(l => l.status === k).length, color: v.color,
    }))
    const sourceCounts = Object.entries(leadSourceConfig).map(([k, v]) => ({
        name: v.label, count: leads.filter(l => l.source === k).length, color: v.color,
    })).filter(s => s.count > 0).sort((a, b) => b.count - a.count)
    const agentPerf = employees.map(e => {
        const assigned = leads.filter(l => l.assigned_to === e.id)
        return {
            name: e.full_name.split(' ')[0],
            assigned: assigned.length,
            contacted: assigned.filter(l => !['new'].includes(l.status)).length,
            converted: assigned.filter(l => l.status === 'converted').length,
        }
    }).filter(e => e.assigned > 0)

    const escalatedLeads = leads.filter(l => l.escalated_at)
    const unassignedLeads = leads.filter(l => !l.assigned_to && !['converted', 'lost'].includes(l.status))

    const filteredSchedules = schedules.filter(s => {
        if (isAgentUser) return s.agent_id === crmUser?.id
        if (scheduleAgentFilter !== 'all') return s.agent_id === scheduleAgentFilter
        return true
    })

    const todayScheduleByAgent = isManagerUser
        ? employees.reduce((acc, e) => {
            acc[e.id] = { name: e.full_name, slots: filteredSchedules.filter(s => s.agent_id === e.id) }
            return acc
        }, {} as Record<string, { name: string; slots: Schedule[] }>)
        : {}

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                        Leads
                        {escalatedLeads.length > 0 && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', background: '#ef4444', color: 'white', borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>
                                ⚠ {escalatedLeads.length} escalated
                            </span>
                        )}
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>{total} leads · {unassignedLeads.length} unassigned</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isManagerUser && (
                        <button onClick={handleEscalationCheck} disabled={escalating} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>
                            <AlertTriangle size={12} /> {escalating ? '...' : 'Check Escalations'}
                        </button>
                    )}
                    <button onClick={handleExport} disabled={exporting} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}>
                        <Download size={12} /> Export
                    </button>
                    <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}><UserPlus size={14} /> Add Lead</button>
                </div>
            </div>

            {/* View Tabs */}
            <div className={styles.pillTabs} style={{ marginBottom: '1.25rem' }}>
                <button className={`${styles.pillTab} ${view === 'list' ? styles.pillTabActive : ''}`} onClick={() => setView('list')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><List size={13} /> All Leads</span>
                </button>
                <button className={`${styles.pillTab} ${view === 'schedule' ? styles.pillTabActive : ''}`} onClick={() => setView('schedule')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> Schedule</span>
                </button>
                <button className={`${styles.pillTab} ${view === 'analytics' ? styles.pillTabActive : ''}`} onClick={() => setView('analytics')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={13} /> Analytics</span>
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ALL LEADS VIEW */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {view === 'list' && (
                <>
                    {/* Search + Filters */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-dim)' }} />
                            <input type="text" placeholder="Search name, email, phone..." value={searchInput}
                                onChange={e => {
                                    const val = e.target.value
                                    setSearchInput(val)
                                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                    searchTimerRef.current = setTimeout(() => { setSearch(val); setPage(1) }, 350)
                                }} className={styles.searchInput} />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className={showFilters ? styles.btnPrimary : styles.btnSecondary}><Filter size={14} /> Filters</button>
                    </div>

                    {showFilters && (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--crm-surface)', borderRadius: '0.5rem', border: '1px solid var(--crm-border)', flexWrap: 'wrap' }}>
                            <div>
                                <label className={styles.formLabel}>Source</label>
                                <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1) }} className={styles.formSelect} style={{ minWidth: '140px' }}>
                                    {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : leadSourceConfig[s]?.label || s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={styles.formLabel}>Priority</label>
                                <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1) }} className={styles.formSelect} style={{ minWidth: '120px' }}>
                                    {priorities.map(p => <option key={p} value={p}>{p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                            </div>
                            {isManagerUser && (
                                <div>
                                    <label className={styles.formLabel}>Agent</label>
                                    <select value={agentFilter} onChange={e => { setAgentFilter(e.target.value); setPage(1) }} className={styles.formSelect} style={{ minWidth: '160px' }}>
                                        <option value="all">All Agents</option>
                                        <option value="unassigned">Unassigned</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                    </select>
                                </div>
                            )}
                            <button onClick={() => { setSourceFilter('all'); setPriorityFilter('all'); setAgentFilter('all'); setSearch(''); setSearchInput(''); setPage(1) }}
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
                                {s === 'all' ? 'All' : leadStatusConfig[s]?.label || s}
                            </button>
                        ))}
                    </div>

                    {/* Bulk Action Bar */}
                    {selectedLeads.size > 0 && (
                        <div className={styles.bulkBar}>
                            <span className={styles.bulkBarCount}>{selectedLeads.size} selected</span>
                            <select
                                value=""
                                onChange={e => { if (e.target.value) handleBulkStatusChange(e.target.value) }}
                                disabled={bulkProcessing}
                                className={styles.formSelect}
                                style={{ width: 'auto', minWidth: 140, fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                            >
                                <option value="">Change Status...</option>
                                {Object.entries(leadStatusConfig).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                            {isManagerUser && employees.length > 0 && (
                                <select
                                    value=""
                                    onChange={e => { if (e.target.value) handleBulkAssign(e.target.value) }}
                                    disabled={bulkProcessing}
                                    className={styles.formSelect}
                                    style={{ width: 'auto', minWidth: 150, fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                                >
                                    <option value="">Assign to...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                </select>
                            )}
                            {isSA && (
                                <button onClick={handleBulkDelete} disabled={bulkProcessing} className={styles.btnSecondary}
                                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', color: '#ef4444', borderColor: '#ef444430' }}>
                                    <Trash2 size={12} /> Delete
                                </button>
                            )}
                            <button onClick={() => setSelectedLeads(new Set())} className={styles.btnSecondary}
                                style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', marginLeft: 'auto' }}>
                                <X size={12} /> Clear
                            </button>
                        </div>
                    )}

                    {/* Leads Table */}
                    {loading ? (
                        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 1rem', borderBottom: '1px solid var(--crm-border)' }}>
                                    <div className={styles.skeleton} style={{ width: '25%', height: '14px' }} />
                                    <div className={styles.skeleton} style={{ width: '15%', height: '14px' }} />
                                    <div className={styles.skeleton} style={{ width: '12%', height: '14px' }} />
                                    <div className={styles.skeleton} style={{ width: '10%', height: '14px' }} />
                                    <div className={styles.skeleton} style={{ width: '8%', height: '14px' }} />
                                </div>
                            ))}
                        </div>
                    ) : leads.length > 0 ? (
                        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '36px' }}>
                                                <button
                                                    className={selectedLeads.size === leads.length && leads.length > 0 ? styles.checkboxChecked : styles.checkbox}
                                                    onClick={toggleSelectAll}
                                                >
                                                    {selectedLeads.size === leads.length && leads.length > 0 && <Check size={10} />}
                                                </button>
                                            </th>
                                            <th>Name</th>
                                            <th>Contact</th>
                                            <th>Source</th>
                                            <th>Status</th>
                                            <th>Score</th>
                                            <th>Assigned To</th>
                                            <th>Next Call</th>
                                            <th>Added</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.map(lead => {
                                            const isEscalated = !!lead.escalated_at
                                            const isOverdue = lead.scheduled_call_at && new Date(lead.scheduled_call_at) < new Date() && !['contacted', 'qualified', 'negotiation', 'site_visit', 'converted'].includes(lead.status)

                                            // Row highlight logic
                                            const rowBg = selectedLeads.has(lead.id)
                                                ? 'var(--crm-accent-bg)'
                                                : isEscalated
                                                ? 'rgba(239,68,68,0.07)'
                                                : isOverdue
                                                ? 'rgba(245,158,11,0.06)'
                                                : lead.priority === 'hot'
                                                ? 'rgba(239,68,68,0.04)'
                                                : lead.priority === 'warm'
                                                ? 'rgba(245,158,11,0.04)'
                                                : undefined

                                            const rowBorderLeft = isEscalated
                                                ? '3px solid #ef4444'
                                                : isOverdue
                                                ? '3px solid #f59e0b'
                                                : lead.priority === 'hot'
                                                ? '3px solid #ef444460'
                                                : lead.priority === 'warm'
                                                ? '3px solid #f59e0b50'
                                                : '3px solid transparent'

                                            return (
                                                <tr key={lead.id} style={{ cursor: 'pointer', background: rowBg, borderLeft: rowBorderLeft }}
                                                    onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
                                                    <td onClick={e => e.stopPropagation()}>
                                                        <button
                                                            className={selectedLeads.has(lead.id) ? styles.checkboxChecked : styles.checkbox}
                                                            onClick={() => toggleSelectLead(lead.id)}
                                                        >
                                                            {selectedLeads.has(lead.id) && <Check size={10} />}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {isEscalated && <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                                            <div>
                                                                <div style={{ fontWeight: 500, color: 'var(--crm-text-secondary)' }}>{lead.name}</div>
                                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)' }}>
                                                                    {lead.priority === 'hot' ? '🔥' : lead.priority === 'warm' ? '🟡' : '🔵'} {lead.priority}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}><Phone size={10} /> {lead.phone}</div>}
                                                        {lead.email && <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)' }}>{lead.email}</div>}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: leadSourceConfig[lead.source]?.color || 'var(--crm-text-faint)' }} />
                                                            {leadSourceConfig[lead.source]?.label || lead.source}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <select value={lead.status} onClick={e => e.stopPropagation()} onChange={e => handleStatusChange(lead.id, e.target.value)}
                                                            style={{ padding: '0.2rem 0.4rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 600, border: '1px solid var(--crm-border-subtle)', cursor: 'pointer', backgroundColor: `${leadStatusConfig[lead.status]?.color}20`, color: leadStatusConfig[lead.status]?.color }}>
                                                            {Object.keys(leadStatusConfig).filter(s => s !== 'all').map(s => <option key={s} value={s}>{leadStatusConfig[s]?.label || s}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>{lead.score != null ? <ScoreDot score={lead.score} /> : <span style={{ color: 'var(--crm-text-dim)', fontSize: '0.75rem' }}>—</span>}</td>
                                                    <td onClick={e => e.stopPropagation()}>
                                                        {lead.assignee ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--crm-accent)', color: 'var(--crm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>
                                                                    {lead.assignee.full_name.charAt(0)}
                                                                </div>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>{lead.assignee.full_name.split(' ')[0]}</span>
                                                                {isManagerUser && (
                                                                    <button onClick={() => { setAssignLeadId(lead.id); setAssignAgentId(lead.assigned_to || ''); setShowAssignModal(true) }}
                                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-dim)', padding: '0 2px' }}>
                                                                        <RefreshCw size={10} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            isManagerUser ? (
                                                                <button onClick={() => { setAssignLeadId(lead.id); setAssignAgentId(''); setShowAssignModal(true) }}
                                                                    style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#f59e0b', background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: '0.375rem', padding: '2px 8px', cursor: 'pointer' }}>
                                                                    <Users size={10} style={{ display: 'inline', marginRight: 3 }} /> Assign
                                                                </button>
                                                            ) : <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-dim)' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : '#6b7280' }}>
                                                        {lead.scheduled_call_at ? (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                {isOverdue && <Clock size={10} />}
                                                                {formatDateTime(lead.scheduled_call_at)}
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td style={{ fontSize: '0.75rem', color: 'var(--crm-text-dim)' }}>{formatRelative(lead.created_at)}</td>
                                                    <td><button onClick={e => handleDelete(lead.id, e)} className={styles.btnIcon} style={{ color: '#ef4444' }}><Trash2 size={12} /></button></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--crm-border)' }}>
                                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={styles.btnIcon}><ChevronLeft size={16} /></button>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Page {page} of {totalPages} · {total} leads</span>
                                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={styles.btnIcon}><ChevronRight size={16} /></button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.card}><div className={styles.emptyState}>
                            <p style={{ color: 'var(--crm-text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>No leads found</p>
                            <p style={{ fontSize: '0.8125rem' }}>{search ? 'Try adjusting your search.' : 'Add leads manually or connect ad platforms.'}</p>
                        </div></div>
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SCHEDULE VIEW */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {view === 'schedule' && (
                <>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={styles.formInput} style={{ width: 'auto' }} />
                        {isManagerUser && (
                            <select className={styles.formSelect} style={{ width: 'auto', minWidth: 160 }} value={scheduleAgentFilter} onChange={e => setScheduleAgentFilter(e.target.value)}>
                                <option value="all">All Agents</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                            </select>
                        )}
                        <button onClick={fetchSchedules} className={styles.btnSecondary} style={{ fontSize: '0.75rem' }}><RefreshCw size={12} /> Refresh</button>
                        {schedules.filter(s => s.status === 'postpone_requested').length > 0 && (
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f59e0b', background: '#f59e0b15', padding: '4px 10px', borderRadius: '0.5rem', border: '1px solid #f59e0b30' }}>
                                {schedules.filter(s => s.status === 'postpone_requested').length} postpone requests pending
                            </span>
                        )}
                    </div>

                    {schedulesLoading ? (
                        <div className={styles.emptyState}>Loading schedule...</div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className={styles.emptyState}>No calls scheduled for {scheduleDate}</div>
                    ) : isManagerUser && scheduleAgentFilter === 'all' ? (
                        // Admin: grouped by agent
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {Object.entries(todayScheduleByAgent).filter(([, v]) => v.slots.length > 0).map(([agentId, { name, slots }]) => (
                                <div key={agentId}>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--crm-accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <UserCheck size={14} /> {name}
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', fontWeight: 400 }}>· {slots.length} calls</span>
                                    </div>
                                    <ScheduleSlotList slots={slots} isAdmin={isManagerUser} isSA={isSA} crmUserId={crmUser?.id}
                                        onAction={handleScheduleAction}
                                        onLogOutcome={s => { setActiveSchedule(s); setOutcomeForm({ outcome: 'interested', notes: '' }); setShowOutcomeModal(true) }}
                                        employees={employees}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Agent view or filtered
                        <ScheduleSlotList slots={filteredSchedules} isAdmin={isAdminUser} isSA={isSA} crmUserId={crmUser?.id}
                            onAction={handleScheduleAction}
                            onLogOutcome={s => { setActiveSchedule(s); setOutcomeForm({ outcome: 'interested', notes: '' }); setShowOutcomeModal(true) }}
                            employees={employees}
                        />
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ANALYTICS VIEW */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {view === 'analytics' && (
                <>
                    {/* Stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {Object.entries(leadStatusConfig).map(([k, v]) => (
                            <div key={k} className={styles.statCard}>
                                <div className={styles.statLabel}>{v.label}</div>
                                <div className={styles.statValue} style={{ color: v.color, fontSize: '1.5rem' }}>{leads.filter(l => l.status === k).length}</div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.chartsGrid}>
                        {/* Status distribution */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>Status Distribution</span></div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={statusCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                                        {statusCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Source breakdown */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>Lead Sources</span></div>
                            {sourceCounts.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {sourceCounts.slice(0, 8).map(s => {
                                        const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
                                        return (
                                            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', width: '90px', flexShrink: 0 }}>{s.name}</span>
                                                <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--crm-elevated)', borderRadius: '3px' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: s.color, borderRadius: '3px' }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-accent)', width: '36px', textAlign: 'right' }}>{s.count}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : <div className={styles.emptyState}>No data</div>}
                        </div>

                        {/* Agent performance (managers and admins) */}
                        {isManagerUser && agentPerf.length > 0 && (
                            <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.cardHeader}><span className={styles.cardTitle}>Agent Performance</span></div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Agent</th>
                                                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Assigned</th>
                                                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Contacted</th>
                                                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Converted</th>
                                                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Conv. Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {agentPerf.map(a => {
                                                const convRate = a.assigned > 0 ? Math.round((a.converted / a.assigned) * 100) : 0
                                                return (
                                                    <tr key={a.name} style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: 'var(--crm-text-secondary)' }}>{a.name}</td>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-muted)' }}>{a.assigned}</td>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem', color: '#f59e0b' }}>{a.contacted}</td>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem', color: '#22c55e', fontWeight: 700 }}>{a.converted}</td>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 700, color: convRate >= 20 ? '#22c55e' : convRate >= 10 ? '#f59e0b' : '#ef4444' }}>
                                                            {convRate}%
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Escalation summary */}
                    {escalatedLeads.length > 0 && (
                        <div className={styles.card} style={{ marginTop: '1rem', borderLeft: '3px solid #ef4444' }}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle} style={{ color: '#ef4444' }}>⚠ Escalated Leads ({escalatedLeads.length})</span></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {escalatedLeads.slice(0, 5).map(l => (
                                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--crm-elevated)', borderRadius: '0.5rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 600, color: 'var(--crm-text-secondary)', fontSize: '0.875rem' }}>{l.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginLeft: '0.5rem' }}>{l.phone}</span>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: `${leadStatusConfig[l.status]?.color}20`, color: leadStatusConfig[l.status]?.color }}>
                                                {leadStatusConfig[l.status]?.label || l.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.6875rem', color: '#ef4444' }}>Escalated {l.escalated_at ? formatRelative(l.escalated_at) : ''} ago · #{l.escalation_count || 1}</span>
                                            <Link href={`/crm/leads/${l.id}`} style={{ fontSize: '0.75rem', color: 'var(--crm-accent)' }}>View →</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MODALS */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className={styles.modal} onClick={() => { setShowAddModal(false); setAddModalTab('single'); setBulkRows([]); setBulkResult(null) }}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: addModalTab === 'bulk' ? 560 : undefined }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>Add Lead</h3>
                            <button onClick={() => { setShowAddModal(false); setAddModalTab('single'); setBulkRows([]); setBulkResult(null) }} className={styles.btnIcon}><X size={16} /></button>
                        </div>

                        {/* Tab switcher */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', background: 'var(--crm-elevated)', padding: 4, borderRadius: 8 }}>
                            <button onClick={() => setAddModalTab('single')} style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, background: addModalTab === 'single' ? 'var(--crm-surface)' : 'transparent', color: addModalTab === 'single' ? 'var(--crm-text-secondary)' : 'var(--crm-text-muted)', boxShadow: addModalTab === 'single' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                                <UserPlus size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Single Lead
                            </button>
                            <button onClick={() => setAddModalTab('bulk')} style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, background: addModalTab === 'bulk' ? 'var(--crm-surface)' : 'transparent', color: addModalTab === 'bulk' ? 'var(--crm-text-secondary)' : 'var(--crm-text-muted)', boxShadow: addModalTab === 'bulk' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                                <Upload size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Bulk CSV Upload
                            </button>
                        </div>
                        {/* ── Single Lead ── */}
                        {addModalTab === 'single' && (
                            <>
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
                                            {sources.filter(s => s !== 'all').map(s => <option key={s} value={s}>{leadSourceConfig[s]?.label || s}</option>)}
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
                                        <input type="text" value={newLead.preferred_location} onChange={e => setNewLead({ ...newLead, preferred_location: e.target.value })} placeholder="e.g. Whitefield" className={styles.formInput} />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.formLabel}>Property Type</label>
                                        <input type="text" value={newLead.property_type} onChange={e => setNewLead({ ...newLead, property_type: e.target.value })} placeholder="e.g. 2BHK Flat" className={styles.formInput} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.formLabel}>Budget Min (₹)</label>
                                        <input type="number" value={newLead.budget_min} onChange={e => setNewLead({ ...newLead, budget_min: e.target.value })} className={styles.formInput} />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.formLabel}>Budget Max (₹)</label>
                                        <input type="number" value={newLead.budget_max} onChange={e => setNewLead({ ...newLead, budget_max: e.target.value })} className={styles.formInput} />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Notes</label>
                                    <textarea value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} rows={3} className={styles.formInput} style={{ resize: 'vertical' }} />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'var(--crm-elevated)', borderRadius: '0.5rem' }}>
                                    ⚡ Lead will be auto-assigned via round-robin after creation
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setShowAddModal(false)} className={styles.btnSecondary}>Cancel</button>
                                    <button onClick={handleAddLead} className={styles.btnPrimary} disabled={saving || !newLead.name}>{saving ? 'Saving...' : 'Add & Assign Lead'}</button>
                                </div>
                            </>
                        )}

                        {/* ── Bulk CSV Upload ── */}
                        {addModalTab === 'bulk' && (
                            <>
                                {/* Template download */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--crm-elevated)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--crm-text-muted)' }}>
                                        <FileText size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                                        Download the CSV template, fill it in, then upload below.
                                    </div>
                                    <button onClick={downloadTemplate} className={styles.btnSecondary} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        <Download size={12} /> Template
                                    </button>
                                </div>

                                {/* CSV columns reference */}
                                <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-faint)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                                    <strong>Columns:</strong> name* · email · phone · source · priority · preferred_location · property_type · budget_min · budget_max · property_interest · project_interest · notes
                                </div>

                                {/* File upload */}
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', border: '2px dashed var(--crm-border)', borderRadius: '0.75rem', cursor: 'pointer', marginBottom: '1rem', background: 'var(--crm-bg)' }}>
                                    <Upload size={22} style={{ color: 'var(--crm-text-muted)' }} />
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>{bulkRows.length > 0 ? `${bulkRows.length} leads loaded — click to change file` : 'Click to upload CSV file'}</span>
                                    <input type="file" accept=".csv" onChange={handleBulkFile} style={{ display: 'none' }} />
                                </label>

                                {/* Preview table */}
                                {bulkRows.length > 0 && (
                                    <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: '0.5rem', border: '1px solid var(--crm-border)', marginBottom: '1rem', fontSize: '0.75rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--crm-elevated)', position: 'sticky', top: 0 }}>
                                                    {['#', 'Name', 'Phone', 'Email', 'Source', 'Priority'].map(h => (
                                                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--crm-text-muted)', borderBottom: '1px solid var(--crm-border)' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkRows.map((row, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--crm-border)', background: !row.name ? '#fef2f230' : undefined }}>
                                                        <td style={{ padding: '5px 8px', color: 'var(--crm-text-faint)' }}>{i + 1}</td>
                                                        <td style={{ padding: '5px 8px', color: row.name ? 'var(--crm-text-secondary)' : '#ef4444', fontWeight: 500 }}>{row.name || '⚠ missing'}</td>
                                                        <td style={{ padding: '5px 8px', color: 'var(--crm-text-muted)' }}>{row.phone || '—'}</td>
                                                        <td style={{ padding: '5px 8px', color: 'var(--crm-text-muted)' }}>{row.email || '—'}</td>
                                                        <td style={{ padding: '5px 8px', color: 'var(--crm-text-muted)' }}>{row.source || 'manual'}</td>
                                                        <td style={{ padding: '5px 8px', color: 'var(--crm-text-muted)' }}>{row.priority || 'warm'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Result */}
                                {bulkResult && (
                                    <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.5rem', marginBottom: '0.75rem', background: bulkResult.failed === 0 ? '#f0fdf4' : '#fefce8', border: `1px solid ${bulkResult.failed === 0 ? '#bbf7d0' : '#fde68a'}`, fontSize: '0.8rem', color: bulkResult.failed === 0 ? '#166534' : '#92400e' }}>
                                        ✅ {bulkResult.success} imported{bulkResult.failed > 0 ? ` · ⚠ ${bulkResult.failed} failed (missing name)` : ''}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => { setBulkRows([]); setBulkResult(null) }} className={styles.btnSecondary} disabled={bulkImporting}>Clear</button>
                                    <button onClick={handleBulkImport} className={styles.btnPrimary} disabled={bulkImporting || bulkRows.length === 0}>
                                        {bulkImporting ? `Importing… (${bulkRows.length})` : `Import ${bulkRows.length} Lead${bulkRows.length !== 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Manual Assign Modal */}
            {showAssignModal && (
                <div className={styles.modal} onClick={() => setShowAssignModal(false)}>
                    <div className={styles.modalContent} style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>Assign Lead</h3>
                            <button onClick={() => setShowAssignModal(false)} className={styles.btnIcon}><X size={16} /></button>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Assign to Agent</label>
                            <select value={assignAgentId} onChange={e => setAssignAgentId(e.target.value)} className={styles.formSelect}>
                                <option value="">— Round-robin (auto) —</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button onClick={() => setShowAssignModal(false)} className={styles.btnSecondary}>Cancel</button>
                            <button onClick={handleManualAssign} className={styles.btnPrimary} disabled={!!assigning}>
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Call Outcome Modal */}
            {showOutcomeModal && activeSchedule && (
                <div className={styles.modal} onClick={() => setShowOutcomeModal(false)}>
                    <div className={styles.modalContent} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>Log Call — {activeSchedule.lead?.name}</h3>
                            <button onClick={() => setShowOutcomeModal(false)} className={styles.btnIcon}><X size={16} /></button>
                        </div>
                        <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'var(--crm-elevated)', borderRadius: '0.5rem', fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>
                            Scheduled: {formatDateTime(activeSchedule.scheduled_at)}
                            {activeSchedule.lead?.phone && <div style={{ marginTop: '0.25rem' }}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />{activeSchedule.lead.phone}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Outcome *</label>
                            <select value={outcomeForm.outcome} onChange={e => setOutcomeForm({ ...outcomeForm, outcome: e.target.value })} className={styles.formSelect}>
                                <option value="interested">Interested</option>
                                <option value="not_interested">Not Interested</option>
                                <option value="callback">Callback Requested</option>
                                <option value="no_answer">No Answer</option>
                                <option value="converted">Converted</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Notes</label>
                            <textarea value={outcomeForm.notes} onChange={e => setOutcomeForm({ ...outcomeForm, notes: e.target.value })} rows={3} className={styles.formInput} style={{ resize: 'vertical' }} placeholder="What did the lead say? Next steps?" />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className={styles.btnSecondary} onClick={() => setShowOutcomeModal(false)}>Cancel</button>
                            <button className={styles.btnPrimary} onClick={handleLogOutcome} disabled={outcomeSubmitting}>
                                {outcomeSubmitting ? 'Saving...' : 'Log Call'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.75rem 1.25rem', background: toast.ok ? '#183C38' : '#dc2626', color: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '0.875rem', fontWeight: 500, zIndex: 9999 }}>
                    {toast.msg}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Schedule Slot List Component
// ─────────────────────────────────────────────────────────────────
function ScheduleSlotList({
    slots, isAdmin, isSA, crmUserId, onAction, onLogOutcome, employees,
}: {
    slots: Schedule[]; isAdmin: boolean; isSA: boolean; crmUserId?: string
    onAction: (id: string, action: string, extra?: Record<string, unknown>) => void
    onLogOutcome: (s: Schedule) => void
    employees: Employee[]
}) {
    const [reassignId, setReassignId] = useState<string | null>(null)
    const [reassignAgentId, setReassignAgentId] = useState('')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {slots.map(slot => {
                const sConf = scheduleStatusConfig[slot.status] || { color: 'var(--crm-text-faint)', label: slot.status }
                const isPending = slot.status === 'pending'
                const isPostponeReq = slot.status === 'postpone_requested'
                const isOverdue = new Date(slot.scheduled_at) < new Date() && isPending
                const canAct = !isAdmin ? slot.agent_id === crmUserId : true

                return (
                    <div key={slot.id} className={styles.card} style={{
                        padding: '1rem 1.25rem',
                        borderLeft: `3px solid ${isPostponeReq ? '#f59e0b' : isOverdue ? '#ef4444' : sConf.color}`,
                        background: isPostponeReq ? '#f59e0b08' : isOverdue ? '#ef444408' : 'var(--crm-surface)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {/* Left: lead info */}
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--crm-text-secondary)' }}>{slot.lead?.name || '—'}</span>
                                    {slot.lead?.priority === 'hot' && <span style={{ fontSize: '0.6875rem' }}>🔥</span>}
                                    {slot.lead?.priority === 'warm' && <span style={{ fontSize: '0.6875rem' }}>🟡</span>}
                                    {isOverdue && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#ef4444', background: '#ef444415', padding: '2px 6px', borderRadius: '4px' }}>OVERDUE</span>}
                                    {isPostponeReq && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f59e0b', background: '#f59e0b15', padding: '2px 6px', borderRadius: '4px' }}>POSTPONE REQUESTED</span>}
                                </div>
                                {slot.lead?.phone && (
                                    <a href={`tel:${slot.lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#22c55e', fontWeight: 600, textDecoration: 'none', marginBottom: '0.25rem' }}>
                                        <Phone size={13} /> {slot.lead.phone}
                                    </a>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={11} /> {new Date(slot.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                    {isAdmin && slot.agent && (
                                        <span style={{ color: 'var(--crm-accent)' }}>Agent: {slot.agent.full_name.split(' ')[0]}</span>
                                    )}
                                    {slot.outcome && <span style={{ color: '#22c55e' }}>✓ {slot.outcome}</span>}
                                    {slot.notes && <span style={{ fontStyle: 'italic', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{slot.notes}"</span>}
                                </div>
                            </div>

                            {/* Right: actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: sConf.color, background: `${sConf.color}15`, padding: '3px 10px', borderRadius: '999px' }}>
                                    {sConf.label}
                                </span>

                                {/* Pending actions for own slots or admin */}
                                {isPending && canAct && (
                                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <button onClick={() => onLogOutcome(slot)}
                                            style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <CheckCircle2 size={11} /> Called
                                        </button>
                                        <button onClick={() => onAction(slot.id, null as unknown as string, { status: 'no_answer' })}
                                            style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', background: '#6b728020', color: 'var(--crm-text-muted)', border: '1px solid #6b728040', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <PhoneOff size={11} /> No Answer
                                        </button>
                                        {!isAdmin && (
                                            <button onClick={() => onAction(slot.id, 'request_postpone')}
                                                style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', background: '#f59e0b10', color: '#f59e0b', border: '1px solid #f59e0b30', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                                Postpone Request
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Admin: approve/reject postpone */}
                                {isPostponeReq && isAdmin && (
                                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                                        <button onClick={() => onAction(slot.id, 'approve_postpone', { approved_by: crmUserId })}
                                            style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                            ✓ Approve Postpone
                                        </button>
                                        <button onClick={() => onAction(slot.id, 'reject_postpone')}
                                            style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                            ✗ Reject
                                        </button>
                                    </div>
                                )}

                                {/* Admin: reassign */}
                                {isAdmin && (isPending || isPostponeReq) && (
                                    reassignId === slot.id ? (
                                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                            <select value={reassignAgentId} onChange={e => setReassignAgentId(e.target.value)}
                                                style={{ fontSize: '0.75rem', background: 'var(--crm-bg)', border: '1px solid var(--crm-border-subtle)', borderRadius: '0.375rem', color: 'var(--crm-text-secondary)', padding: '3px 6px' }}>
                                                <option value="">Select agent...</option>
                                                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name.split(' ')[0]}</option>)}
                                            </select>
                                            <button onClick={() => { if (reassignAgentId) { onAction(slot.id, 'reassign', { new_agent_id: reassignAgentId }); setReassignId(null) } }}
                                                style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'var(--crm-accent)', color: 'var(--crm-bg)', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 700 }}>
                                                Go
                                            </button>
                                            <button onClick={() => setReassignId(null)} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--crm-text-faint)', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setReassignId(slot.id); setReassignAgentId('') }}
                                            style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', background: 'none', border: '1px solid var(--crm-border-subtle)', padding: '2px 8px', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                            Reassign
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
