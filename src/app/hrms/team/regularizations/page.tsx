'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import styles from '../../hrms.module.css'

interface Reg { id: string; date: string; reason: string; status: string; actual_hours?: number | null; employee?: { id: string; full_name: string; role: string } | null }

export default function TeamRegularizationsPage() {
    const supabase = createClient()
    const [userId, setUserId]   = useState<string | null>(null)
    const [userRole, setRole]   = useState('manager')
    const [regs, setRegs]       = useState<Reg[]>([])
    const [loading, setLoading] = useState(true)
    const [acting, setActing]   = useState<string | null>(null)
    const [filter, setFilter]   = useState<'pending' | 'all'>('pending')

    const load = useCallback(async (uid: string) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (filter !== 'all') params.set('status', filter)
        const res = await fetch(`/api/crm/hrm/regularizations?${params}`)
        if (res.ok) { const d = await res.json(); setRegs(d.regularizations || []) }
        setLoading(false)
        void uid
    }, [filter])

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return
            setUserId(user.id)
            const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (p) setRole(p.role)
            load(user.id)
        })
    }, [load, supabase])

    const act = async (id: string, status: 'approved' | 'rejected') => {
        if (!userId || acting) return
        setActing(id)
        try {
            await fetch('/api/crm/hrm/regularizations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, approved_by: userId, approver_role: userRole }),
            })
            if (userId) await load(userId)
        } finally { setActing(null) }
    }

    const STATUS_STYLE: Record<string, { pill: string; label: string }> = {
        pending:  { pill: styles.pillYellow, label: 'Pending' },
        approved: { pill: styles.pillGreen,  label: 'Approved' },
        rejected: { pill: styles.pillRed,    label: 'Rejected' },
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div className={styles.pageTitle}>Regularisation Requests</div>
                <div className={styles.pageSubtitle}>Review attendance dispute requests from your team</div>
            </div>
            <div className={styles.tabs} style={{ marginBottom: '1.25rem' }}>
                <button className={`${styles.tab} ${filter === 'pending' ? styles.tabActive : ''}`} onClick={() => setFilter('pending')}>Pending</button>
                <button className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''}`} onClick={() => setFilter('all')}>All</button>
            </div>
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div className={styles.loader} style={{ minHeight: '200px' }}><div className={styles.spinner} /></div>
                : regs.length === 0 ? <div className={styles.empty}><div className={styles.emptyTitle}>No {filter} regularisation requests</div></div>
                : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead><tr>
                                {['Employee', 'Date', 'Reason', 'Status', 'Actions'].map(h => <th key={h} className={styles.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {regs.map(r => {
                                    const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending
                                    return (
                                        <tr key={r.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className={styles.avatar} style={{ width: 30, height: 30, fontSize: '0.75rem' }}>{r.employee?.full_name?.charAt(0) || '?'}</div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--h-text-1)' }}>{r.employee?.full_name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className={styles.td} style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td className={styles.td} style={{ maxWidth: '200px', fontSize: '0.82rem', color: 'var(--h-text-3)' }}>{r.reason}</td>
                                            <td className={styles.td}><span className={`${styles.pill} ${st.pill}`}>{st.label}</span></td>
                                            <td className={styles.td}>
                                                {r.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button className={`${styles.btn} ${styles.btnSm}`} style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }} onClick={() => act(r.id, 'approved')} disabled={acting === r.id}>
                                                            {acting === r.id ? <RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle size={12} />} Approve
                                                        </button>
                                                        <button className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`} onClick={() => act(r.id, 'rejected')} disabled={acting === r.id}>
                                                            <XCircle size={12} /> Reject
                                                        </button>
                                                    </div>
                                                ) : <span style={{ fontSize: '0.75rem', color: 'var(--h-text-4)' }}>Actioned</span>}
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
