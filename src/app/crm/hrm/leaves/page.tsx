'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Plus, X, AlertCircle, BarChart2, List, CheckCircle2, XCircle, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../../crm.module.css'
import { useCRMUser, isAdmin, isSuperAdmin, getCurrentFY } from '../../crm-context'

const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' },
    itemStyle: { color: 'var(--crm-text-secondary)' }, labelStyle: { color: 'var(--crm-text-muted)' },
}

interface Leave {
    id: string; employee_id: string; leave_type: string; start_date: string; end_date: string
    total_days?: number; days_count?: number; reason?: string; status: string; created_at: string
    employee?: { id: string; full_name: string; role: string }
    approver?: { id: string; full_name: string }
}

interface Employee { id: string; full_name: string; role: string }

interface BalanceItem {
    leave_type: string
    allocated_days: number
    used_days: number
    balance_days: number
}

const LEAVE_TYPES = [
    { key: 'casual', label: 'Casual', color: '#3b82f6' },
    { key: 'sick', label: 'Sick', color: '#ef4444' },
    { key: 'annual', label: 'Annual', color: '#22c55e' },
    { key: 'maternity', label: 'Maternity', color: '#ec4899' },
    { key: 'paternity', label: 'Paternity', color: '#8b5cf6' },
]

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending: { color: '#f59e0b', label: 'Pending' },
    approved: { color: '#22c55e', label: 'Approved' },
    rejected: { color: '#ef4444', label: 'Rejected' },
}

export default function LeavesPage() {
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)
    const isSA = isSuperAdmin(crmUser)
    const currentFY = getCurrentFY()

    const [leaves, setLeaves] = useState<Leave[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [balances, setBalances] = useState<BalanceItem[]>([])
    const [loading, setLoading] = useState(true)
    const [tableExists, setTableExists] = useState(true)
    const [view, setView] = useState<'list' | 'analytics'>('list')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [processing, setProcessing] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        employee_id: '',
        leave_type: 'casual',
        start_date: '',
        end_date: '',
        reason: '',
    })

    const supabase = useMemo(() => createClient(), [])

    // Pre-fill employee_id for agents
    useEffect(() => {
        if (!isAdminUser && crmUser?.id) {
            setForm(f => ({ ...f, employee_id: crmUser.id }))
        }
    }, [isAdminUser, crmUser?.id])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.set('status', statusFilter)
            // Agents only see their own leaves
            if (!isAdminUser && crmUser?.id) params.set('employee_id', crmUser.id)

            const requests: Promise<Response>[] = [
                fetch(`/api/crm/hrm/leaves?${params}`),
            ]
            if (isAdminUser) requests.push(fetch('/api/crm/hrm/employees'))
            // Agents: fetch their balance
            if (!isAdminUser && crmUser?.id) {
                requests.push(fetch(`/api/crm/hrm/allocations?financial_year=${currentFY}&employee_id=${crmUser.id}&include_balance=true`))
            }

            const results = await Promise.all(requests)
            const leaveRes = results[0]
            const d = await leaveRes.json()
            setLeaves(d.leaves || [])
            setTableExists(d.tableExists !== false)

            if (isAdminUser && results[1]) {
                const empData = await results[1].json()
                setEmployees(empData.employees || [])
            }
            if (!isAdminUser && results[1]) {
                const allocData = await results[1].json()
                setBalances(allocData.allocations || [])
            }
        } finally {
            setLoading(false)
        }
    }, [statusFilter, isAdminUser, crmUser?.id, currentFY])

    useEffect(() => { fetchData() }, [fetchData])

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        if (!isAdminUser) return
        setProcessing(id)
        await fetch('/api/crm/hrm/leaves', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, approved_by: crmUser?.id }),
        })
        setProcessing(null)
        await fetchData()
    }

    const handleApply = async () => {
        const empId = isAdminUser ? form.employee_id : crmUser?.id
        if (!empId || !form.start_date || !form.end_date) return
        setSubmitting(true)
        const res = await fetch('/api/crm/hrm/leaves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, employee_id: empId }),
        })
        if (res.ok) {
            await fetchData()
            setShowApplyModal(false)
            setForm(f => ({ ...f, leave_type: 'casual', start_date: '', end_date: '', reason: '' }))
        }
        setSubmitting(false)
    }

    const calcDays = (start: string, end: string) => {
        if (!start || !end) return 0
        return Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1)
    }

    // Analytics
    const byType = LEAVE_TYPES.map(lt => ({
        name: lt.label, count: leaves.filter(l => l.leave_type === lt.key).length, color: lt.color,
    })).filter(lt => lt.count > 0)

    const byEmployee = employees.map(e => ({
        name: e.full_name.split(' ')[0],
        approved: leaves.filter(l => l.employee_id === e.id && l.status === 'approved').length,
        pending: leaves.filter(l => l.employee_id === e.id && l.status === 'pending').length,
    })).filter(e => e.approved + e.pending > 0)

    const pendingCount = leaves.filter(l => l.status === 'pending').length
    const approvedCount = leaves.filter(l => l.status === 'approved').length
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm/hrm" style={{ color: 'var(--crm-text-faint)' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                            {isAdminUser ? 'Leave Management' : 'My Leaves'}
                        </h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>
                            {isAdminUser
                                ? `${pendingCount > 0 ? `${pendingCount} pending · ` : ''}${leaves.length} total requests`
                                : `FY ${currentFY} · ${leaves.length} requests`
                            }
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isSA && (
                        <Link
                            href="/crm/hrm/allocations"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', border: '1px solid #BFA270', borderRadius: '0.5rem', color: 'var(--crm-accent)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', background: 'transparent' }}
                        >
                            <Settings size={14} />
                            Set Allocations
                        </Link>
                    )}
                    <div className={styles.pillTabs}>
                        <button className={`${styles.pillTab} ${view === 'list' ? styles.pillTabActive : ''}`} onClick={() => setView('list')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><List size={13} /> {isAdminUser ? 'Requests' : 'My Leaves'}</span>
                        </button>
                        {isAdminUser && (
                            <button className={`${styles.pillTab} ${view === 'analytics' ? styles.pillTabActive : ''}`} onClick={() => setView('analytics')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={13} /> Analytics</span>
                            </button>
                        )}
                    </div>
                    {tableExists && (
                        <button className={styles.btnPrimary} onClick={() => setShowApplyModal(true)}>
                            <Plus size={14} /> Apply Leave
                        </button>
                    )}
                </div>
            </div>

            {!tableExists && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                    <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>
                        Run <code style={{ backgroundColor: 'var(--crm-elevated)', padding: '1px 6px', borderRadius: '4px' }}>supabase/hrm-schema.sql</code> to enable leave management.
                    </span>
                </div>
            )}

            {/* Agent: Balance Cards */}
            {!isAdminUser && balances.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {balances.map(b => {
                        const lt = LEAVE_TYPES.find(l => l.key === b.leave_type)
                        const pct = b.allocated_days > 0 ? Math.max(0, Math.min(100, (b.balance_days / b.allocated_days) * 100)) : 0
                        const barColor = b.balance_days < 0 ? '#ef4444' : b.balance_days <= 2 ? '#f59e0b' : '#22c55e'
                        return (
                            <div key={b.leave_type} className={styles.card} style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: lt?.color || '#9ca3af', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                    {lt?.label || b.leave_type}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-secondary)', lineHeight: 1 }}>
                                    {b.balance_days}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', fontWeight: 400 }}> / {b.allocated_days}</span>
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginBottom: '0.5rem' }}>
                                    {b.used_days} used
                                </div>
                                <div style={{ height: 4, background: 'var(--crm-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.3s' }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {view === 'list' ? (
                <>
                    {/* Status filter tabs */}
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {['all', 'pending', 'approved', 'rejected'].map(s => {
                            const conf = STATUS_CONFIG[s] || { color: 'var(--crm-accent)', label: 'All' }
                            const count = s === 'all' ? leaves.length : leaves.filter(l => l.status === s).length
                            return (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    style={{
                                        padding: '0.5rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer',
                                        border: statusFilter === s ? `1px solid ${conf.color}` : '1px solid var(--crm-border)',
                                        backgroundColor: statusFilter === s ? `${conf.color}15` : 'var(--crm-surface)',
                                        color: statusFilter === s ? conf.color : 'var(--crm-text-muted)',
                                        fontSize: '0.8125rem', fontWeight: statusFilter === s ? 600 : 500,
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    }}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, backgroundColor: statusFilter === s ? `${conf.color}25` : 'var(--crm-elevated)', padding: '1px 6px', borderRadius: '999px', color: statusFilter === s ? conf.color : 'var(--crm-text-dim)' }}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>Loading...</div>
                    ) : leaves.length === 0 ? (
                        <div className={styles.emptyState}>No leave requests</div>
                    ) : (
                        <div className={styles.card}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {isAdminUser && <th>Employee</th>}
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        {isAdminUser && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(leave => {
                                        const typeConf = LEAVE_TYPES.find(lt => lt.key === leave.leave_type)
                                        const statusConf = STATUS_CONFIG[leave.status]
                                        const days = leave.total_days || leave.days_count || calcDays(leave.start_date, leave.end_date)
                                        return (
                                            <tr key={leave.id}>
                                                {isAdminUser && (
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--crm-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                                                {leave.employee?.full_name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 500, color: 'var(--crm-text-secondary)' }}>{leave.employee?.full_name || '—'}</div>
                                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{leave.employee?.role}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                <td>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: typeConf?.color || '#9ca3af', backgroundColor: `${typeConf?.color || '#6b7280'}15`, padding: '2px 8px', borderRadius: '999px' }}>
                                                        {typeConf?.label || leave.leave_type}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(leave.start_date)}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(leave.end_date)}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--crm-text-secondary)', textAlign: 'center' }}>{days}</td>
                                                <td style={{ color: 'var(--crm-text-muted)', maxWidth: '200px' }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                                        {leave.reason || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={styles.leaveStatusBadge} style={{ color: statusConf.color, backgroundColor: `${statusConf.color}15` }}>
                                                        {statusConf.label}
                                                    </span>
                                                </td>
                                                {isAdminUser && (
                                                    <td>
                                                        {leave.status === 'pending' ? (
                                                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                                <button
                                                                    onClick={() => handleAction(leave.id, 'approved')}
                                                                    disabled={processing === leave.id}
                                                                    title="Approve"
                                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#22c55e', padding: '4px', display: 'flex', alignItems: 'center' }}
                                                                >
                                                                    <CheckCircle2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(leave.id, 'rejected')}
                                                                    disabled={processing === leave.id}
                                                                    title="Reject"
                                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', display: 'flex', alignItems: 'center' }}
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            leave.approver && (
                                                                <span style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)' }}>by {leave.approver.full_name}</span>
                                                            )
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                /* Admin Analytics */
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Requests', value: leaves.length, color: 'var(--crm-text-secondary)' },
                            { label: 'Pending', value: pendingCount, color: '#f59e0b' },
                            { label: 'Approved', value: approvedCount, color: '#22c55e' },
                            { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: '#ef4444' },
                            { label: 'Total Days', value: leaves.filter(l => l.status === 'approved').reduce((s, l) => s + (l.total_days || l.days_count || calcDays(l.start_date, l.end_date)), 0), color: 'var(--crm-accent)' },
                        ].map(s => (
                            <div key={s.label} className={styles.statCard}>
                                <div className={styles.statLabel}>{s.label}</div>
                                <div className={styles.statValue} style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.chartsGrid}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>By Leave Type</span></div>
                            {byType.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={byType} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                                            {byType.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip {...tooltipStyle} />
                                        <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No data</div>}
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>Leaves by Employee</span></div>
                            {byEmployee.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={byEmployee} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                        <Tooltip {...tooltipStyle} />
                                        <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No data</div>}
                        </div>
                    </div>
                </>
            )}

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Apply for Leave</h2>
                            <button onClick={() => setShowApplyModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-faint)' }}><X size={18} /></button>
                        </div>

                        {/* Admin can pick any employee; agent applies for themselves */}
                        {isAdminUser && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Employee *</label>
                                <select className={styles.formSelect} value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
                                    <option value="">Select employee...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Leave Type *</label>
                            <select className={styles.formSelect} value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))}>
                                {LEAVE_TYPES.map(lt => (
                                    <option key={lt.key} value={lt.key}>
                                        {lt.label}
                                        {!isAdminUser && balances.find(b => b.leave_type === lt.key)
                                            ? ` (${balances.find(b => b.leave_type === lt.key)!.balance_days} days remaining)`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>From *</label>
                                <input type="date" className={styles.formInput} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>To *</label>
                                <input type="date" className={styles.formInput} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                            </div>
                        </div>

                        {form.start_date && form.end_date && (
                            <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', backgroundColor: '#BFA27010', borderRadius: '0.5rem', fontSize: '0.8125rem', color: 'var(--crm-accent)', fontWeight: 600 }}>
                                {calcDays(form.start_date, form.end_date)} day(s) leave
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Reason</label>
                            <textarea className={styles.formInput} rows={3} placeholder="Reason for leave..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={{ resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => setShowApplyModal(false)}>Cancel</button>
                            <button className={styles.btnPrimary} style={{ flex: 2 }} onClick={handleApply}
                                disabled={submitting || (isAdminUser ? !form.employee_id : false) || !form.start_date || !form.end_date}>
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
