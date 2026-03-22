'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Clock, Shield, AlertCircle, ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react'
import styles from '../../crm.module.css'
import { useCRMUser, isSuperAdmin, isAdmin } from '../../crm-context'

interface Regularization {
    id: string
    employee_id: string
    date: string
    reason: string
    actual_hours: number | null
    status: 'pending' | 'approved' | 'rejected'
    admin_notes: string | null
    approved_at: string | null
    created_at: string
    employee?: { id: string; full_name: string; role: string }
    approver?: { id: string; full_name: string } | null
}

interface AttendanceRecord {
    id: string
    employee_id: string
    date: string
    status: string
    check_in_time?: string
    check_out_time?: string
    hours_worked?: number
}

const STATUS_CONFIG = {
    pending:  { color: '#f59e0b', label: 'Pending' },
    approved: { color: '#22c55e', label: 'Approved' },
    rejected: { color: '#ef4444', label: 'Rejected' },
}

const ATTENDANCE_COLORS: Record<string, string> = {
    present: '#22c55e',
    absent: '#ef4444',
    late: '#f59e0b',
    half_day: '#f97316',
    work_from_home: '#3b82f6',
}

function getMonthDates(year: number, month: number) {
    const dates: string[] = []
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return dates
}

function formatTime(iso?: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function RegularizationsPage() {
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)
    const isSA = isSuperAdmin(crmUser)

    const [activeTab, setActiveTab] = useState<'calendar' | 'requests'>('calendar')

    // Calendar state
    const now = new Date()
    const [calYear, setCalYear] = useState(now.getFullYear())
    const [calMonth, setCalMonth] = useState(now.getMonth() + 1) // 1-based
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [attendanceLoading, setAttendanceLoading] = useState(false)
    const [regMap, setRegMap] = useState<Record<string, Regularization>>({}) // date -> reg
    const [applyModal, setApplyModal] = useState<{ date: string; attRecord?: AttendanceRecord } | null>(null)
    const [applyReason, setApplyReason] = useState('')
    const [applying, setApplying] = useState(false)

    // Requests state
    const [regs, setRegs] = useState<Regularization[]>([])
    const [reqLoading, setReqLoading] = useState(true)
    const [tableExists, setTableExists] = useState(true)
    const [statusFilter, setStatusFilter] = useState('pending')
    const [processing, setProcessing] = useState<string | null>(null)
    const [notesMap, setNotesMap] = useState<Record<string, string>>({})
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const monthKey = `${calYear}-${String(calMonth).padStart(2, '0')}`

    // Fetch attendance for calendar
    const fetchAttendance = useCallback(async () => {
        if (!crmUser) return
        setAttendanceLoading(true)
        try {
            const params = new URLSearchParams({ month: monthKey })
            if (!isAdminUser) params.set('employee_id', crmUser.id)
            const res = await fetch(`/api/crm/hrm/attendance?${params}`)
            if (res.ok) {
                const d = await res.json()
                setAttendance(d.attendance || [])
            }
        } finally {
            setAttendanceLoading(false)
        }
    }, [crmUser, isAdminUser, monthKey])

    // Fetch regularizations for the month (to overlay on calendar)
    const fetchMonthRegs = useCallback(async () => {
        if (!crmUser) return
        try {
            const params = new URLSearchParams({ month: monthKey })
            if (!isAdminUser) params.set('employee_id', crmUser.id)
            const res = await fetch(`/api/crm/hrm/regularizations?${params}`)
            if (res.ok) {
                const d = await res.json()
                const map: Record<string, Regularization> = {}
                for (const r of d.regularizations || []) map[r.date] = r
                setRegMap(map)
            }
        } catch { /* silent */ }
    }, [crmUser, isAdminUser, monthKey])

    // Fetch request list
    const fetchRequests = useCallback(async () => {
        if (!crmUser) return
        setReqLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (!isAdminUser) params.set('employee_id', crmUser.id)
            const res = await fetch(`/api/crm/hrm/regularizations?${params}`)
            if (res.ok) {
                const d = await res.json()
                setRegs(d.regularizations || [])
                setTableExists(d.tableExists !== false)
            }
        } finally {
            setReqLoading(false)
        }
    }, [statusFilter, isAdminUser, crmUser])

    useEffect(() => { fetchAttendance(); fetchMonthRegs() }, [fetchAttendance, fetchMonthRegs])
    useEffect(() => { fetchRequests() }, [fetchRequests])

    const handleApply = async () => {
        if (!applyModal || !crmUser || !applyReason.trim()) return
        setApplying(true)
        try {
            const res = await fetch('/api/crm/hrm/regularizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: crmUser.id,
                    date: applyModal.date,
                    reason: applyReason.trim(),
                    actual_hours: applyModal.attRecord?.hours_worked || null,
                }),
            })
            const d = await res.json()
            if (res.ok) {
                showToast('Regularisation submitted!')
                setApplyModal(null)
                setApplyReason('')
                fetchMonthRegs()
                fetchRequests()
            } else {
                showToast(d.error || 'Failed', false)
            }
        } finally {
            setApplying(false)
        }
    }

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        if (!isSA) return
        setProcessing(id)
        try {
            const res = await fetch('/api/crm/hrm/regularizations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, approved_by: crmUser?.id, admin_notes: notesMap[id] || null }),
            })
            if (res.ok) {
                showToast(`Regularisation ${status}`)
                await fetchRequests()
                await fetchMonthRegs()
            } else {
                const d = await res.json()
                showToast(d.error || 'Failed', false)
            }
        } finally {
            setProcessing(null)
        }
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

    const formatTs = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
        ' ' + new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    const pendingCount = regs.filter(r => r.status === 'pending').length

    // Build calendar grid: days in month grouped by week
    const monthDates = getMonthDates(calYear, calMonth - 1)
    const firstDayOfWeek = new Date(`${monthKey}-01`).getDay() // 0=Sun
    const attendanceByDate = Object.fromEntries(attendance.map(a => [a.date, a]))
    const today = new Date().toISOString().split('T')[0]

    const prevMonth = () => {
        if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12) }
        else setCalMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1) }
        else setCalMonth(m => m + 1)
    }

    const monthLabel = new Date(`${monthKey}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                        Regularisations
                        {pendingCount > 0 && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', background: '#f59e0b', color: 'var(--crm-bg)', borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>
                                {pendingCount} pending
                            </span>
                        )}
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)', marginTop: '0.125rem' }}>
                        {isAdminUser ? 'Manage employee attendance regularisation requests' : 'View your attendance and submit regularisation requests'}
                    </p>
                </div>
            </div>

            {!tableExists && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                    <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>
                        Run <code style={{ background: 'var(--crm-elevated)', padding: '1px 6px', borderRadius: 4 }}>supabase/hrm-regularizations.sql</code> to enable regularisations.
                    </span>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--crm-border)', paddingBottom: '0' }}>
                {[
                    { id: 'calendar', label: 'Attendance Calendar', icon: Calendar },
                    { id: 'requests', label: 'Requests', icon: List },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'calendar' | 'requests')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 600 : 500,
                            color: activeTab === tab.id ? 'var(--crm-btn-primary-bg)' : '#6b7280',
                            borderBottom: activeTab === tab.id ? '2px solid var(--crm-btn-primary-bg)' : '2px solid transparent',
                            marginBottom: '-1px',
                        }}
                    >
                        <tab.icon size={15} />
                        {tab.label}
                        {tab.id === 'requests' && pendingCount > 0 && (
                            <span style={{ fontSize: '0.6875rem', background: '#f59e0b', color: 'var(--crm-bg)', borderRadius: '999px', padding: '1px 6px', fontWeight: 700 }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── CALENDAR TAB ── */}
            {activeTab === 'calendar' && (
                <div>
                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <button onClick={prevMonth} className={styles.btnSecondary} style={{ padding: '0.375rem 0.625rem', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontWeight: 600, color: 'var(--crm-text-secondary)', fontSize: '1rem' }}>{monthLabel}</span>
                        <button onClick={nextMonth} className={styles.btnSecondary} style={{ padding: '0.375rem 0.625rem', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>
                        {[
                            { color: '#22c55e', label: 'Present' },
                            { color: '#ef4444', label: 'Absent' },
                            { color: '#f59e0b', label: 'Late' },
                            { color: '#f97316', label: 'Half Day' },
                            { color: '#3b82f6', label: 'WFH' },
                            { color: 'var(--crm-border-subtle)', label: 'No Record' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                                {s.label}
                            </div>
                        ))}
                        {!isAdminUser && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--crm-accent)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#BFA27040', border: '1px solid #BFA270' }} />
                                Click absent/no-record day to apply regularisation
                            </div>
                        )}
                    </div>

                    {attendanceLoading ? (
                        <div className={styles.emptyState}>Loading...</div>
                    ) : (
                        <div className={styles.card} style={{ padding: '1rem', overflowX: 'auto' }}>
                            {/* Day-of-week headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 600, color: d === 'Sun' || d === 'Sat' ? '#3d3f54' : '#6b7280', padding: '4px 0' }}>
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                                {/* Empty cells before first day */}
                                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}

                                {monthDates.map(dateStr => {
                                    const dayOfWeek = new Date(dateStr).getDay()
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                    const att = attendanceByDate[dateStr]
                                    const reg = regMap[dateStr]
                                    const isToday = dateStr === today
                                    const isFuture = dateStr > today
                                    const dayNum = parseInt(dateStr.split('-')[2])

                                    const attColor = att ? (ATTENDANCE_COLORS[att.status] || '#6b7280') : null
                                    const isAbsent = att?.status === 'absent'
                                    const canApply = !isAdminUser && !isWeekend && !isFuture && (isAbsent || !att)

                                    let bgColor = 'var(--crm-surface)'
                                    if (isWeekend) bgColor = 'var(--crm-bg)'
                                    else if (isToday && !att) bgColor = '#BFA27015'
                                    else if (attColor) bgColor = `${attColor}15`

                                    let borderColor = isWeekend ? 'var(--crm-border)' : (attColor || (isToday ? '#BFA270' : 'var(--crm-border)'))
                                    if (reg) borderColor = STATUS_CONFIG[reg.status].color

                                    return (
                                        <div
                                            key={dateStr}
                                            onClick={() => canApply ? setApplyModal({ date: dateStr, attRecord: att }) : undefined}
                                            title={att ? `${att.status}${att.hours_worked != null ? ` · ${att.hours_worked.toFixed(1)}h` : ''}${att.check_in_time ? ` · In: ${formatTime(att.check_in_time)}` : ''}${att.check_out_time ? ` · Out: ${formatTime(att.check_out_time)}` : ''}${reg ? `\n📋 Reg: ${reg.status}` : ''}` : (isFuture ? '' : 'No record')}
                                            style={{
                                                borderRadius: '0.5rem',
                                                border: `1px solid ${borderColor}`,
                                                backgroundColor: bgColor,
                                                padding: '6px 4px',
                                                minHeight: '52px',
                                                cursor: canApply ? 'pointer' : 'default',
                                                transition: 'border-color 0.15s',
                                                opacity: isWeekend ? 0.4 : 1,
                                                position: 'relative',
                                            }}
                                            onMouseEnter={e => { if (canApply) (e.currentTarget as HTMLDivElement).style.borderColor = '#BFA270' }}
                                            onMouseLeave={e => { if (canApply) (e.currentTarget as HTMLDivElement).style.borderColor = borderColor }}
                                        >
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: isToday ? '#BFA270' : '#9ca3af', marginBottom: '4px' }}>
                                                {dayNum}
                                            </div>
                                            {att && (
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: attColor || '#6b7280', margin: '0 auto' }} />
                                            )}
                                            {!att && !isWeekend && !isFuture && (
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--crm-border-subtle)', margin: '0 auto' }} />
                                            )}
                                            {reg && (
                                                <div style={{ position: 'absolute', top: 2, right: 3, fontSize: '0.5rem', color: STATUS_CONFIG[reg.status].color, fontWeight: 700 }}>
                                                    {reg.status === 'approved' ? '✓' : reg.status === 'rejected' ? '✗' : '…'}
                                                </div>
                                            )}
                                            {canApply && !reg && (
                                                <div style={{ position: 'absolute', bottom: 2, right: 3, fontSize: '0.5rem', color: '#BFA27070' }}>+</div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* This month's regularisation status summary */}
                    {Object.keys(regMap).length > 0 && (
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-muted)', marginBottom: '0.25rem' }}>
                                Regularisation Requests This Month
                            </div>
                            {Object.values(regMap).map(reg => {
                                const sConf = STATUS_CONFIG[reg.status]
                                return (
                                    <div key={reg.id} className={styles.card} style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div>
                                            <span style={{ fontWeight: 600, color: 'var(--crm-text-secondary)', fontSize: '0.875rem' }}>
                                                {new Date(reg.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                            <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>{reg.reason}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sConf.color, background: `${sConf.color}15`, padding: '2px 10px', borderRadius: '999px' }}>
                                            {sConf.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── REQUESTS TAB ── */}
            {activeTab === 'requests' && (
                <div>
                    {isSA && pendingCount > 0 && statusFilter === 'pending' && (
                        <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8125rem', color: '#d97706', fontWeight: 600 }}>
                                {pendingCount} regularisation{pendingCount !== 1 ? 's' : ''} awaiting your approval
                            </span>
                        </div>
                    )}

                    {/* Status filter tabs */}
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {['pending', 'approved', 'rejected', 'all'].map(s => {
                            const conf = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] || { color: 'var(--crm-accent)', label: 'All' }
                            const count = s === 'all' ? regs.length : regs.filter(r => r.status === s).length
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

                    {reqLoading ? (
                        <div className={styles.emptyState}>Loading...</div>
                    ) : regs.length === 0 ? (
                        <div className={styles.emptyState}>
                            {statusFilter === 'pending' ? 'No pending regularisations 🎉' : `No ${statusFilter} requests`}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {regs.map(reg => {
                                const sConf = STATUS_CONFIG[reg.status]
                                const isPending = reg.status === 'pending'
                                return (
                                    <div
                                        key={reg.id}
                                        className={styles.card}
                                        style={{ padding: '1.25rem', borderLeft: `3px solid ${sConf.color}`, background: isPending ? 'var(--crm-accent-bg)' : 'var(--crm-surface)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            <div style={{ flex: 1, minWidth: 200 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                    {isAdminUser && reg.employee && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--crm-accent)', color: 'var(--crm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                                                {reg.employee.full_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: 'var(--crm-text-secondary)', fontSize: '0.875rem' }}>{reg.employee.full_name}</div>
                                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', textTransform: 'capitalize' }}>{reg.employee.role.replace('_', ' ')}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-secondary)' }}>{formatDate(reg.date)}</span>
                                                        {reg.actual_hours != null && (
                                                            <span style={{ fontSize: '0.75rem', color: '#ef4444', background: '#ef444415', padding: '1px 8px', borderRadius: '999px', fontWeight: 600 }}>
                                                                {reg.actual_hours.toFixed(1)}h logged
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', margin: '0 0 0.5rem', lineHeight: 1.6, maxWidth: 500 }}>
                                                    {reg.reason}
                                                </p>

                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span>Submitted {formatTs(reg.created_at)}</span>
                                                    {reg.status !== 'pending' && reg.approver && (
                                                        <span style={{ color: sConf.color }}>
                                                            {reg.status === 'approved' ? '✓' : '✗'} {reg.status} by {reg.approver.full_name}
                                                            {reg.approved_at ? ` · ${formatTs(reg.approved_at)}` : ''}
                                                        </span>
                                                    )}
                                                    {reg.admin_notes && (
                                                        <span style={{ color: 'var(--crm-text-faint)', fontStyle: 'italic' }}>Note: {reg.admin_notes}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                {!isPending || !isSA ? (
                                                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: sConf.color, background: `${sConf.color}15`, padding: '4px 12px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                        {reg.status === 'approved' && <CheckCircle2 size={14} />}
                                                        {reg.status === 'rejected' && <XCircle size={14} />}
                                                        {reg.status === 'pending' && <Clock size={14} />}
                                                        {sConf.label}
                                                    </span>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 200 }}>
                                                        <input
                                                            placeholder="Admin notes (optional)..."
                                                            value={notesMap[reg.id] || ''}
                                                            onChange={e => setNotesMap(m => ({ ...m, [reg.id]: e.target.value }))}
                                                            style={{ padding: '0.375rem 0.625rem', background: 'var(--crm-bg)', border: '1px solid var(--crm-border-subtle)', borderRadius: '0.375rem', color: 'var(--crm-text-secondary)', fontSize: '0.75rem', outline: 'none' }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => handleAction(reg.id, 'approved')}
                                                                disabled={processing === reg.id}
                                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: processing === reg.id ? 0.6 : 1 }}
                                                            >
                                                                <CheckCircle2 size={14} />
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(reg.id, 'rejected')}
                                                                disabled={processing === reg.id}
                                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: processing === reg.id ? 0.6 : 1 }}
                                                            >
                                                                <XCircle size={14} />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {isAdminUser && !isSA && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--crm-elevated)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>
                            <Shield size={14} />
                            Only Super Admins can approve or reject regularisation requests.
                        </div>
                    )}
                </div>
            )}

            {/* ── Apply Regularisation Modal ── */}
            {applyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className={styles.card} style={{ width: '100%', maxWidth: 440, padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.25rem' }}>
                            Apply Regularisation
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)', marginBottom: '1.25rem' }}>
                            {new Date(applyModal.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {applyModal.attRecord && (
                                <span style={{ marginLeft: '0.5rem', color: ATTENDANCE_COLORS[applyModal.attRecord.status] || '#6b7280' }}>
                                    · {applyModal.attRecord.status.replace('_', ' ')}
                                    {applyModal.attRecord.hours_worked != null && ` · ${applyModal.attRecord.hours_worked.toFixed(1)}h`}
                                </span>
                            )}
                            {!applyModal.attRecord && <span style={{ marginLeft: '0.5rem', color: '#ef4444' }}>· No attendance record</span>}
                        </p>

                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                            Reason for Regularisation *
                        </label>
                        <textarea
                            value={applyReason}
                            onChange={e => setApplyReason(e.target.value)}
                            placeholder="Explain why you were absent or unable to complete required hours..."
                            rows={4}
                            style={{
                                width: '100%', padding: '0.75rem', background: 'var(--crm-bg)', border: '1px solid var(--crm-border-subtle)',
                                borderRadius: '0.5rem', color: 'var(--crm-text-secondary)', fontSize: '0.875rem', outline: 'none',
                                resize: 'vertical', boxSizing: 'border-box',
                            }}
                        />

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                            <button
                                onClick={() => { setApplyModal(null); setApplyReason('') }}
                                className={styles.btnSecondary}
                                style={{ flex: 1 }}
                                disabled={applying}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={applying || !applyReason.trim()}
                                style={{
                                    flex: 2, padding: '0.625rem 1rem', background: applyReason.trim() ? '#BFA270' : 'var(--crm-border-subtle)',
                                    color: applyReason.trim() ? 'var(--crm-bg)' : '#4b5563',
                                    border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
                                    cursor: applyReason.trim() && !applying ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.15s',
                                }}
                            >
                                {applying ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.75rem 1.25rem', background: toast.ok ? '#183C38' : '#dc2626', color: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '0.875rem', fontWeight: 500, zIndex: 9999 }}>
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
