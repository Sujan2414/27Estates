'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react'
import styles from '../../hrms.module.css'

interface Leave {
    id: string; leave_type: string; start_date: string; end_date: string
    status: string; reason?: string; created_at: string
    requires_approval_from?: string | null
    employee?: { id: string; full_name: string; role: string } | null
    approver?: { full_name: string } | null
}

const STATUS_STYLE: Record<string, { pill: string; label: string }> = {
    pending:  { pill: styles.pillYellow, label: 'Pending' },
    approved: { pill: styles.pillGreen,  label: 'Approved' },
    rejected: { pill: styles.pillRed,    label: 'Rejected' },
}

function daysBetween(a: string, b: string) {
    return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1)
}
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TeamLeavesPage() {
    const supabase = createClient()
    const [userId, setUserId]     = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string>('manager')
    const [leaves, setLeaves]     = useState<Leave[]>([])
    const [loading, setLoading]   = useState(true)
    const [acting, setActing]     = useState<string | null>(null)
    const [filter, setFilter]     = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

    const load = useCallback(async (uid: string) => {
        setLoading(true)
        const params = new URLSearchParams({ team_only: 'true', approver_id: uid })
        if (filter !== 'all') params.set('status', filter)
        const res = await fetch(`/api/crm/hrm/leaves?${params}`)
        if (res.ok) { const d = await res.json(); setLeaves(d.leaves || []) }
        setLoading(false)
    }, [filter])

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return
            setUserId(user.id)
            const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (p) setUserRole(p.role)
            load(user.id)
        })
    }, [load, supabase])

    const act = async (id: string, status: 'approved' | 'rejected') => {
        if (!userId || acting) return
        setActing(id)
        try {
            const res = await fetch('/api/crm/hrm/leaves', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, approved_by: userId, approver_role: userRole }),
            })
            if (res.ok) await load(userId)
        } finally { setActing(null) }
    }

    const pending  = leaves.filter(l => l.status === 'pending').length
    const approved = leaves.filter(l => l.status === 'approved').length

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <div className={styles.pageTitle}>Leave Approvals</div>
                    <div className={styles.pageSubtitle}>Review and action your team&apos;s leave requests</div>
                </div>
                {pending > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', fontSize: '0.825rem', color: '#d97706', fontWeight: 600 }}>
                        <Calendar size={14} /> {pending} pending approval
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className={styles.statRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Pending',  value: pending,  color: '#d97706' },
                    { label: 'Approved', value: approved, color: '#16a34a' },
                    { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: '#dc2626' },
                    { label: 'Total',    value: leaves.length, color: 'var(--h-text-1)' },
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statLabel}>{s.label}</div>
                        <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className={styles.tabs}>
                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                    <button key={f} className={`${styles.tab} ${filter === f ? styles.tabActive : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className={styles.loader} style={{ minHeight: '200px' }}><div className={styles.spinner} /></div>
                ) : leaves.length === 0 ? (
                    <div className={styles.empty}>
                        <Filter size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        <div className={styles.emptyTitle}>No {filter === 'all' ? '' : filter} leave requests</div>
                        <div className={styles.emptyText}>Your team has no {filter} leave requests right now</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                                        <th key={h} className={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(l => {
                                    const st   = STATUS_STYLE[l.status] || STATUS_STYLE.pending
                                    const days = daysBetween(l.start_date, l.end_date)
                                    const emp  = l.employee
                                    return (
                                        <tr key={l.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className={styles.avatar} style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                                                        {emp?.full_name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--h-text-1)', whiteSpace: 'nowrap' }}>{emp?.full_name || 'Unknown'}</div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--h-text-4)', textTransform: 'capitalize' }}>{emp?.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td} style={{ fontWeight: 600, textTransform: 'capitalize' }}>{l.leave_type.replace('_', ' ')}</td>
                                            <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.start_date)}</td>
                                            <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.end_date)}</td>
                                            <td className={styles.td} style={{ fontWeight: 700, color: 'var(--h-text-1)' }}>{days}d</td>
                                            <td className={styles.td} style={{ maxWidth: '160px', fontSize: '0.8rem', color: 'var(--h-text-3)' }}>{l.reason || '—'}</td>
                                            <td className={styles.td}><span className={`${styles.pill} ${st.pill}`}>{st.label}</span></td>
                                            <td className={styles.td}>
                                                {l.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            className={`${styles.btn} ${styles.btnSm}`}
                                                            style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }}
                                                            onClick={() => act(l.id, 'approved')}
                                                            disabled={acting === l.id}
                                                            title="Approve"
                                                        >
                                                            {acting === l.id ? <RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle size={12} />}
                                                            Approve
                                                        </button>
                                                        <button
                                                            className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                                                            onClick={() => act(l.id, 'rejected')}
                                                            disabled={acting === l.id}
                                                            title="Reject"
                                                        >
                                                            <XCircle size={12} /> Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--h-text-4)' }}>
                                                        {l.approver ? `by ${l.approver.full_name}` : 'Actioned'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
