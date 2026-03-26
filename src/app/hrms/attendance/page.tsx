'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronLeft, ChevronRight, MapPin, RefreshCw, AlertCircle } from 'lucide-react'
import styles from '../hrms.module.css'

interface AttRecord {
    id?: string; date: string; status: string
    check_in?: string | null; check_out?: string | null
    hours_worked?: number | null; work_mode?: string
    check_in_address?: string | null; check_out_address?: string | null
}

const STATUS_META: Record<string, { label: string; bg: string; color: string; short: string }> = {
    present:        { label: 'Present',      bg: '#22c55e', color: '#fff', short: 'P'  },
    work_from_home: { label: 'Work From Home', bg: '#3b82f6', color: '#fff', short: 'W' },
    absent:         { label: 'Absent',       bg: '#ef4444', color: '#fff', short: 'A'  },
    late:           { label: 'Late',         bg: '#f59e0b', color: '#fff', short: 'L'  },
    half_day:       { label: 'Half Day',     bg: '#8b5cf6', color: '#fff', short: 'H'  },
}

function fmt12(ts: string | null | undefined) {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtHours(h: number | null | undefined) {
    if (!h) return '—'
    return `${Math.floor(h)}h ${Math.round((h - Math.floor(h)) * 60)}m`
}

export default function MyAttendancePage() {
    const supabase = createClient()
    const [userId, setUserId]       = useState<string | null>(null)
    const [records, setRecords]     = useState<AttRecord[]>([])
    const [loading, setLoading]     = useState(true)
    const [year, setYear]           = useState(new Date().getFullYear())
    const [month, setMonth]         = useState(new Date().getMonth()) // 0-based
    const [selected, setSelected]   = useState<AttRecord | null>(null)
    const [applying, setApplying]   = useState(false)
    const [regModal, setRegModal]   = useState<{ date: string } | null>(null)
    const [regReason, setRegReason] = useState('')
    const [regError, setRegError]   = useState('')

    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

    const load = useCallback(async (uid: string) => {
        setLoading(true)
        const res = await fetch(`/api/crm/hrm/attendance?employee_id=${uid}&month=${monthStr}`)
        if (res.ok) { const d = await res.json(); setRecords(d.attendance || d.records || []) }
        setLoading(false)
    }, [monthStr])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) { setUserId(user.id); load(user.id) }
        })
    }, [load, supabase])

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

    const submitRegularisation = async () => {
        if (!regModal || !userId || !regReason.trim()) return
        setApplying(true); setRegError('')
        try {
            const res = await fetch('/api/crm/hrm/regularizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: userId, date: regModal.date, reason: regReason, requesting_user_id: userId }),
            })
            const d = await res.json()
            if (!res.ok) { setRegError(d.error || 'Failed to submit'); return }
            setRegModal(null); setRegReason('')
        } finally { setApplying(false) }
    }

    // Build calendar grid
    const daysInMonth  = new Date(year, month + 1, 0).getDate()
    const firstWeekDay = new Date(year, month, 1).getDay() // 0=Sun
    const recordMap    = Object.fromEntries(records.map(r => [r.date, r]))
    const today        = new Date().toISOString().split('T')[0]

    const presentDays = records.filter(r => r.status === 'present' || r.status === 'work_from_home').length
    const absentDays  = records.filter(r => r.status === 'absent').length
    const totalHours  = records.reduce((s, r) => s + (r.hours_worked || 0), 0)

    const monthLabel = new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

    return (
        <div>
            {/* Stats */}
            <div className={styles.statRow} style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))' }}>
                {[
                    { label: 'Present', value: presentDays,          color: '#16a34a' },
                    { label: 'Absent',  value: absentDays,           color: '#dc2626' },
                    { label: 'Total Hours', value: fmtHours(totalHours), color: '#3b82f6' },
                    { label: 'This Month', value: daysInMonth + 'd', color: 'var(--h-text-1)' },
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statLabel}>{s.label}</div>
                        <div className={styles.statValue} style={{ color: s.color, fontSize: '1.2rem' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Calendar Card */}
            <div className={styles.card}>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <button className={styles.btnIcon} onClick={prevMonth}><ChevronLeft size={16} /></button>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--h-text-1)' }}>{monthLabel}</span>
                    <button className={styles.btnIcon} onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>

                {/* Day labels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '4px' }}>
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'var(--h-text-4)', padding: '4px 0' }}>{d}</div>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className={styles.loader} style={{ minHeight: '200px' }}><div className={styles.spinner} /></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                        {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day    = i + 1
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const rec    = recordMap[dateStr]
                            const meta   = rec ? STATUS_META[rec.status] : null
                            const isToday = dateStr === today
                            const isFuture = dateStr > today
                            return (
                                <div
                                    key={day}
                                    onClick={() => { if (rec) setSelected(rec) }}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.78rem', fontWeight: 600,
                                        cursor: rec ? 'pointer' : 'default',
                                        background: meta ? meta.bg : isToday ? 'var(--h-accent-soft)' : 'var(--h-elevated)',
                                        color: meta ? meta.color : isToday ? 'var(--h-accent)' : isFuture ? 'var(--h-text-4)' : 'var(--h-text-2)',
                                        border: isToday && !meta ? '2px solid var(--h-accent)' : '1px solid transparent',
                                        transition: 'transform 0.1s',
                                        opacity: isFuture ? 0.4 : 1,
                                    }}
                                    title={meta ? `${meta.label} — ${dateStr}` : dateStr}
                                >
                                    {day}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Legend */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {Object.entries(STATUS_META).map(([k, m]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--h-text-3)' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '3px', background: m.bg }} />
                            {m.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail panel for selected day */}
            {selected && (
                <div className={styles.card} style={{ borderLeft: `3px solid ${STATUS_META[selected.status]?.bg || '#ccc'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                        <div className={styles.cardTitle} style={{ margin: 0 }}>
                            <Clock size={15} /> {new Date(selected.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <button className={styles.btnIcon} onClick={() => setSelected(null)}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Status',    value: STATUS_META[selected.status]?.label || selected.status },
                            { label: 'Check In',  value: fmt12(selected.check_in) },
                            { label: 'Check Out', value: fmt12(selected.check_out) },
                            { label: 'Hours',     value: fmtHours(selected.hours_worked) },
                        ].map(i => (
                            <div key={i.label} style={{ background: 'var(--h-elevated)', borderRadius: '8px', padding: '0.625rem 0.75rem' }}>
                                <div style={{ fontSize: '0.68rem', color: 'var(--h-text-4)', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase' }}>{i.label}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--h-text-1)' }}>{i.value}</div>
                            </div>
                        ))}
                    </div>
                    {selected.check_in_address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: 'var(--h-text-3)', marginBottom: '0.75rem' }}>
                            <MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>{selected.check_in_address}</span>
                        </div>
                    )}
                    {/* Regularize if absent */}
                    {selected.status === 'absent' && selected.date < today && (
                        <button
                            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setRegModal({ date: selected.date })}
                        >
                            <AlertCircle size={13} /> Apply Regularisation
                        </button>
                    )}
                </div>
            )}

            {/* Regularisation Modal */}
            {regModal && (
                <div className={styles.modalBack} onClick={e => { if (e.target === e.currentTarget) { setRegModal(null); setRegReason('') } }}>
                    <div className={styles.modal}>
                        <div className={styles.modalTitle}>Apply Regularisation</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--h-text-3)', marginBottom: '1rem' }}>
                            Date: <strong style={{ color: 'var(--h-text-1)' }}>{new Date(regModal.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                        {regError && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem', background: 'rgba(239,68,68,0.08)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>{regError}</div>}
                        <div className={styles.field}>
                            <label className={styles.label}>Reason *</label>
                            <textarea className={styles.textarea} placeholder="Explain why your attendance needs to be regularised…" value={regReason} onChange={e => setRegReason(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={`${styles.btn} ${styles.btnOutline}`} style={{ flex: 1 }} onClick={() => { setRegModal(null); setRegReason('') }}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 2 }} onClick={submitRegularisation} disabled={applying || !regReason.trim()}>
                                {applying ? <><RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> Submitting…</> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
