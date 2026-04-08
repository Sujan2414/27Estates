'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, X, RefreshCw, ChevronDown } from 'lucide-react'
import styles from '../hrms.module.css'

interface Leave {
    id: string; leave_type: string; start_date: string; end_date: string
    status: string; reason?: string; created_at: string
    approved_by?: string | null; approved_at?: string | null
    approver?: { full_name: string } | null
    requires_approval_from?: string | null
}
interface Balance { leave_type: string; allocated_days: number; used_days: number; balance_days: number }

const LEAVE_TYPES = ['casual', 'sick', 'annual', 'maternity', 'paternity']
const STATUS_STYLE: Record<string, { pill: string; label: string }> = {
    pending:  { pill: styles.pillYellow, label: 'Pending' },
    approved: { pill: styles.pillGreen,  label: 'Approved' },
    rejected: { pill: styles.pillRed,    label: 'Rejected' },
}
const LEAVE_COLORS = ['#183C38', '#BFA270', '#3b82f6', '#8b5cf6', '#ef4444']

function daysBetween(a: string, b: string) {
    const ms = new Date(b).getTime() - new Date(a).getTime()
    return Math.max(1, Math.round(ms / 86400000) + 1)
}
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MyLeavesPage() {
    const supabase = createClient()
    const [userId, setUserId]       = useState<string | null>(null)
    const [userRole, setUserRole]   = useState<string>('agent')
    const [leaves, setLeaves]       = useState<Leave[]>([])
    const [balances, setBalances]   = useState<Balance[]>([])
    const [loading, setLoading]     = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSub]      = useState(false)
    const [form, setForm]           = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' })
    const [error, setError]         = useState('')

    const fy = (() => {
        const now = new Date(); const y = now.getFullYear(); const m = now.getMonth() + 1
        return m >= 4 ? `${y}-${String(y + 1).slice(-2)}` : `${y - 1}-${String(y).slice(-2)}`
    })()

    const load = useCallback(async (uid: string) => {
        setLoading(true)
        const [lRes, bRes] = await Promise.all([
            fetch(`/api/crm/hrm/leaves?employee_id=${uid}`),
            fetch(`/api/crm/hrm/allocations?employee_id=${uid}&financial_year=${fy}&include_balance=true`),
        ])
        if (lRes.ok)  { const d = await lRes.json();  setLeaves(d.leaves || []) }
        if (bRes.ok)  { const d = await bRes.json();  setBalances(d.allocations || []) }
        setLoading(false)
    }, [fy])

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return
            setUserId(user.id)
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (profile) setUserRole(profile.role)
            load(user.id)
        })
    }, [load, supabase])

    const handleApply = async () => {
        if (!form.start_date || !form.end_date || !userId) return
        setSub(true); setError('')
        try {
            const res = await fetch('/api/crm/hrm/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: userId,
                    leave_type: form.leave_type,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    reason: form.reason,
                    requesting_user_id: userId,
                    requesting_user_role: userRole,
                }),
            })
            const d = await res.json()
            if (!res.ok) { setError(d.error || 'Failed to apply'); return }
            setShowModal(false)
            setForm({ leave_type: 'casual', start_date: '', end_date: '', reason: '' })
            await load(userId)
        } finally { setSub(false) }
    }

    const totalBalance = balances.reduce((s, b) => s + b.balance_days, 0)
    const pending      = leaves.filter(l => l.status === 'pending').length

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className={styles.pageHeader} style={{ margin: 0 }}>
                    <div className={styles.pageTitle}>My Leaves</div>
                    <div className={styles.pageSubtitle}>Track your leave requests and remaining balance</div>
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowModal(true)}>
                    <Plus size={15} /> Apply Leave
                </button>
            </div>

            {/* Balances */}
            {balances.length > 0 && (
                <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
                    <div className={styles.cardTitle}>
                        <Calendar size={16} style={{ color: '#22c55e' }} /> Leave Balances — FY {fy}
                        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--h-text-3)', fontWeight: 400 }}>
                            {totalBalance} days total remaining
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        {balances.map((b, i) => (
                            <div key={b.leave_type} style={{ background: 'var(--h-elevated)', borderRadius: '10px', padding: '0.875rem', border: '1px solid var(--h-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: LEAVE_COLORS[i % LEAVE_COLORS.length] }} />
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--h-text-3)', textTransform: 'capitalize' }}>{b.leave_type.replace('_', ' ')}</span>
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--h-text-1)', lineHeight: 1 }}>{b.balance_days}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--h-text-4)', marginTop: '3px' }}>{b.used_days} used / {b.allocated_days} total</div>
                                <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: 'var(--h-border)' }}>
                                    <div style={{ width: `${b.allocated_days > 0 ? (b.balance_days / b.allocated_days) * 100 : 0}%`, height: '100%', borderRadius: '2px', background: LEAVE_COLORS[i % LEAVE_COLORS.length] }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stat summary */}
            <div className={styles.statRow} style={{ marginBottom: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
                {[
                    { label: 'Allocated', value: balances.reduce((s, b) => s + b.allocated_days, 0), color: '#0369a1' },
                    { label: 'Used',      value: balances.reduce((s, b) => s + b.used_days, 0),      color: '#7c3aed' },
                    { label: 'Balance',   value: totalBalance,   color: '#16a34a' },
                    { label: 'Pending',   value: pending,        color: '#d97706' },
                    { label: 'Rejected',  value: leaves.filter(l => l.status === 'rejected').length, color: '#dc2626' },
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statLabel}>{s.label}</div>
                        <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Leaves table */}
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div className={styles.loader} style={{ minHeight: '200px' }}>
                            <div className={styles.spinner} />
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className={styles.empty}>
                            <Calendar size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <div className={styles.emptyTitle}>No leave requests yet</div>
                            <div className={styles.emptyText}>Click &quot;Apply Leave&quot; to submit your first request</div>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {['Type', 'From', 'To', 'Days', 'Reason', 'Approver', 'Status'].map(h => (
                                        <th key={h} className={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(l => {
                                    const st = STATUS_STYLE[l.status] || STATUS_STYLE.pending
                                    const days = daysBetween(l.start_date, l.end_date)
                                    return (
                                        <tr key={l.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--h-text-1)' }}>{l.leave_type.replace('_', ' ')}</span>
                                            </td>
                                            <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.start_date)}</td>
                                            <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.end_date)}</td>
                                            <td className={styles.td} style={{ fontWeight: 700, color: 'var(--h-text-1)' }}>{days}d</td>
                                            <td className={styles.td} style={{ maxWidth: '180px', color: 'var(--h-text-3)', fontSize: '0.8rem' }}>
                                                {l.reason || '—'}
                                            </td>
                                            <td className={styles.td} style={{ fontSize: '0.8rem', color: 'var(--h-text-3)' }}>
                                                {l.approver?.full_name || (l.requires_approval_from ? `${l.requires_approval_from} required` : '—')}
                                            </td>
                                            <td className={styles.td}>
                                                <span className={`${styles.pill} ${st.pill}`}>{st.label}</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Apply Leave Modal */}
            {showModal && (
                <div className={styles.modalBack} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <div className={styles.modalTitle} style={{ margin: 0 }}>Apply for Leave</div>
                            <button className={styles.btnIcon} onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <div className={styles.field}>
                            <label className={styles.label}>Leave Type</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className={styles.select}
                                    value={form.leave_type}
                                    onChange={e => setForm(p => ({ ...p, leave_type: e.target.value }))}
                                    style={{ appearance: 'none', paddingRight: '2rem' }}
                                >
                                    {LEAVE_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--h-text-3)' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className={styles.field} style={{ margin: 0 }}>
                                <label className={styles.label}>From Date</label>
                                <input type="date" className={styles.input} value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className={styles.field} style={{ margin: 0 }}>
                                <label className={styles.label}>To Date</label>
                                <input type="date" className={styles.input} value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} min={form.start_date || new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>

                        {form.start_date && form.end_date && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--h-text-3)' }}>
                                Duration: <strong style={{ color: 'var(--h-text-1)' }}>{daysBetween(form.start_date, form.end_date)} day(s)</strong>
                            </div>
                        )}

                        <div className={styles.field} style={{ marginTop: '0.875rem' }}>
                            <label className={styles.label}>Reason (optional)</label>
                            <textarea className={styles.textarea} placeholder="Briefly describe the reason for your leave…" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                            <button className={`${styles.btn} ${styles.btnOutline}`} style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                style={{ flex: 2 }}
                                onClick={handleApply}
                                disabled={submitting || !form.start_date || !form.end_date}
                            >
                                {submitting ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Submitting…</> : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
