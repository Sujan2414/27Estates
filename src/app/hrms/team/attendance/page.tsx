'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Clock } from 'lucide-react'
import styles from '../../hrms.module.css'

interface AttRecord {
    id?: string
    date: string
    status: string
    check_in?: string | null
    check_out?: string | null
    hours_worked?: number | null
    employee?: { id: string; full_name: string } | null
}

interface Employee {
    id: string
    full_name: string
    role?: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    present:        { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', label: 'Present' },
    work_from_home: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: 'WFH' },
    absent:         { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', label: 'Absent' },
    late:           { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'Late' },
    half_day:       { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', label: 'Half Day' },
}

// Order absent first so the CEO sees who's missing before who showed up
const STATUS_PRIORITY: Record<string, number> = {
    absent: 0, late: 1, half_day: 2, work_from_home: 3, present: 4,
}

// Mon–Sat work week (default Indian office). Sunday (0) = day off, no absence
// recorded. Adjust here if hrm_work_settings ever exposes a working-days array.
function isWorkingDay(dateStr: string): boolean {
    const d = new Date(dateStr + 'T00:00:00')
    return d.getDay() !== 0
}

export default function TeamAttendancePage() {
    const [records, setRecords] = useState<AttRecord[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [attRes, empRes] = await Promise.all([
                fetch(`/api/crm/hrm/attendance?date=${date}`),
                fetch('/api/crm/hrm/employees'),
            ])
            if (attRes.ok) {
                const d = await attRes.json()
                setRecords(d.attendance || d.records || [])
            }
            if (empRes.ok) {
                const d = await empRes.json()
                setEmployees(d.employees || [])
            }
        } catch (e) {
            console.warn('TeamAttendance load failed', e)
        }
        setLoading(false)
    }, [date])

    useEffect(() => { load() }, [load])

    // Merge attendance records with the full employee roster. Anyone on the
    // roster without an attendance row for this working day is synthesised as
    // 'absent' so the CEO sees who is actually missing — the previous build
    // hid them entirely, which made the "present today" count silently lie.
    const merged: AttRecord[] = useMemo(() => {
        const workingDay = isWorkingDay(date)
        const byEmpId = new Map<string, AttRecord>()
        records.forEach(r => {
            const empId = r.employee?.id
            if (empId) byEmpId.set(empId, r)
        })

        return employees
            .map((emp): AttRecord => {
                const existing = byEmpId.get(emp.id)
                if (existing) return existing
                // No record for this employee on this day:
                //   working day → mark absent so it shows up in the audit
                //   non-working day → mark with a neutral 'off' status
                return {
                    date,
                    status: workingDay ? 'absent' : 'off',
                    check_in: null,
                    check_out: null,
                    hours_worked: null,
                    employee: { id: emp.id, full_name: emp.full_name },
                }
            })
            .sort((a, b) => {
                const pa = STATUS_PRIORITY[a.status] ?? 99
                const pb = STATUS_PRIORITY[b.status] ?? 99
                if (pa !== pb) return pa - pb
                return (a.employee?.full_name ?? '').localeCompare(b.employee?.full_name ?? '')
            })
    }, [records, employees, date])

    const presentCount = merged.filter(r => ['present', 'work_from_home', 'late', 'half_day'].includes(r.status)).length
    const absentCount = merged.filter(r => r.status === 'absent').length
    const totalCount = merged.length

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <div className={styles.pageTitle}>Team Attendance</div>
                    <div className={styles.pageSubtitle}>
                        {presentCount}/{totalCount} present
                        {absentCount > 0 && (
                            <span style={{ marginLeft: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                · {absentCount} absent
                            </span>
                        )}
                    </div>
                </div>
                <input
                    type="date"
                    className={styles.input}
                    style={{ width: 'auto' }}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className={styles.loader} style={{ minHeight: '200px' }}><div className={styles.spinner} /></div>
                ) : merged.length === 0 ? (
                    <div className={styles.empty}>
                        <Clock size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        <div className={styles.emptyTitle}>No employees found</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead><tr>
                                {['Employee', 'Status', 'Check In', 'Check Out', 'Hours'].map(h => <th key={h} className={styles.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {merged.map((r, i) => {
                                    const st = STATUS_STYLE[r.status]
                                    const isOff = r.status === 'off'
                                    return (
                                        <tr key={r.id || `synth-${r.employee?.id}-${i}`} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className={styles.avatar} style={{ width: 30, height: 30, fontSize: '0.75rem' }}>{r.employee?.full_name?.charAt(0) || '?'}</div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--h-text-1)' }}>{r.employee?.full_name || r.id}</span>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                {isOff ? (
                                                    <span className={`${styles.pill} ${styles.pillGray}`} style={{ fontSize: '0.72rem' }}>Off</span>
                                                ) : st ? (
                                                    <span className={styles.pill} style={{ background: st.bg, color: st.color, fontSize: '0.72rem' }}>{st.label}</span>
                                                ) : (
                                                    <span className={`${styles.pill} ${styles.pillGray}`}>{r.status}</span>
                                                )}
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
