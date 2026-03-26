'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock } from 'lucide-react'
import styles from '../../hrms.module.css'

interface AttRecord { id?: string; date: string; status: string; check_in?: string | null; check_out?: string | null; hours_worked?: number | null; employee?: { id: string; full_name: string } | null }

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    present:        { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', label: 'Present' },
    work_from_home: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: 'WFH' },
    absent:         { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', label: 'Absent' },
    late:           { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'Late' },
    half_day:       { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', label: 'Half Day' },
}

export default function TeamAttendancePage() {
    const supabase = createClient()
    const [records, setRecords] = useState<AttRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate]       = useState(new Date().toISOString().split('T')[0])

    const load = useCallback(async () => {
        setLoading(true)
        const res = await fetch(`/api/crm/hrm/attendance?date=${date}`)
        if (res.ok) { const d = await res.json(); setRecords(d.attendance || d.records || []) }
        setLoading(false)
    }, [date])

    useEffect(() => { load() }, [load])

    const present = records.filter(r => r.status === 'present' || r.status === 'work_from_home').length

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <div className={styles.pageTitle}>Team Attendance</div>
                    <div className={styles.pageSubtitle}>{present}/{records.length} present today</div>
                </div>
                <input type="date" className={styles.input} style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>

            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className={styles.loader} style={{ minHeight: '200px' }}><div className={styles.spinner} /></div>
                ) : records.length === 0 ? (
                    <div className={styles.empty}>
                        <Clock size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        <div className={styles.emptyTitle}>No attendance records for this date</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead><tr>
                                {['Employee', 'Status', 'Check In', 'Check Out', 'Hours'].map(h => <th key={h} className={styles.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {records.map((r, i) => {
                                    const st = STATUS_STYLE[r.status]
                                    return (
                                        <tr key={r.id || i} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className={styles.avatar} style={{ width: 30, height: 30, fontSize: '0.75rem' }}>{r.employee?.full_name?.charAt(0) || '?'}</div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--h-text-1)' }}>{r.employee?.full_name || r.id}</span>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                {st ? <span className={styles.pill} style={{ background: st.bg, color: st.color, fontSize: '0.72rem' }}>{st.label}</span> : <span className={`${styles.pill} ${styles.pillGray}`}>{r.status}</span>}
                                            </td>
                                            <td className={styles.td} style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{r.check_in ? new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
                                            <td className={styles.td} style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{r.check_out ? new Date(r.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
                                            <td className={styles.td} style={{ fontWeight: 600 }}>{r.hours_worked ? `${Math.floor(r.hours_worked)}h ${Math.round((r.hours_worked - Math.floor(r.hours_worked)) * 60)}m` : '—'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
