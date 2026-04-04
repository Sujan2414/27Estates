'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, AlertCircle, BarChart2, List, MapPin, Clock, Settings, CheckCircle, LogIn, LogOut, Wifi } from 'lucide-react'
import styles from '../../crm.module.css'
import { useCRMUser, isAdmin } from '../../crm-context'

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

interface AttendanceRecord {
    id: string; employee_id: string; date: string; status: string
    check_in?: string; check_out?: string; notes?: string
    check_in_time?: string; check_out_time?: string
    check_in_lat?: number; check_in_lng?: number; check_in_address?: string
    check_out_lat?: number; check_out_lng?: number; check_out_address?: string
    hours_worked?: number; work_mode?: string
    employee?: { id: string; full_name: string; role: string }
}

interface Employee { id: string; full_name: string; role: string }

interface WorkSettings {
    full_day_hours: number
    half_day_hours: number
}

const STATUS_OPTIONS = [
    { key: 'present', label: 'Present', color: '#22c55e' },
    { key: 'absent', label: 'Absent', color: '#ef4444' },
    { key: 'late', label: 'Late', color: '#f59e0b' },
    { key: 'half_day', label: 'Half Day', color: '#f97316' },
    { key: 'work_from_home', label: 'WFH', color: '#3b82f6' },
]

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

function formatDuration(hours?: number | null) {
    if (hours == null) return null
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
}

function hoursColor(hours: number | null | undefined, settings: WorkSettings) {
    if (hours == null) return '#6b7280'
    if (hours >= settings.full_day_hours) return '#22c55e'
    if (hours >= settings.half_day_hours) return '#f59e0b'
    return '#ef4444'
}

// GPS geolocation + reverse geocoding
async function getLocation(): Promise<{ lat: number; lng: number; address: string }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude
                const lng = pos.coords.longitude
                let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                try {
                    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
                        headers: { 'Accept-Language': 'en' }
                    })
                    const d = await r.json()
                    address = d.display_name?.split(',').slice(0, 3).join(', ') || address
                } catch { /* use coords */ }
                resolve({ lat, lng, address })
            },
            (err) => reject(new Error(err.message)),
            { timeout: 8000, enableHighAccuracy: true }
        )
    })
}

export default function AttendancePage() {
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)

    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
    const [workSettings, setWorkSettings] = useState<WorkSettings>({ full_day_hours: 8, half_day_hours: 4 })
    const [loading, setLoading] = useState(true)
    const [tableExists, setTableExists] = useState(true)
    const [view, setView] = useState<'list' | 'analytics'>('list')
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [filterEmployee, setFilterEmployee] = useState(isAdminUser ? 'all' : (crmUser?.id || 'all'))

    // Check-in state
    const [checkInLoading, setCheckInLoading] = useState(false)
    const [checkInError, setCheckInError] = useState<string | null>(null)
    const [elapsedDisplay, setElapsedDisplay] = useState('')

    // Analytics employee filter
    const [analyticsEmp, setAnalyticsEmp] = useState('all')
    // Regularizations
    const [regularizations, setRegularizations] = useState<{date: string; status: string}[]>([])
    const [showRegModal, setShowRegModal] = useState(false)
    const [regDate, setRegDate] = useState('')
    const [regReason, setRegReason] = useState('')
    const [regHours, setRegHours] = useState<number | null>(null)
    const [regSubmitting, setRegSubmitting] = useState(false)
    const [regError, setRegError] = useState<string | null>(null)
    const [regQuota, setRegQuota] = useState({ max_regularizations_per_month: 2, max_regularizations_per_year: 10 })

    // Live clock while checked in
    useEffect(() => {
        if (!todayRecord?.check_in_time || todayRecord?.check_out_time) return
        const tick = () => {
            const diffMs = Date.now() - new Date(todayRecord.check_in_time!).getTime()
            const h = Math.floor(diffMs / 3600000)
            const m = Math.floor((diffMs % 3600000) / 60000)
            const s = Math.floor((diffMs % 60000) / 1000)
            setElapsedDisplay(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [todayRecord?.check_in_time, todayRecord?.check_out_time])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const empParam = !isAdminUser && crmUser?.id ? crmUser.id : filterEmployee !== 'all' ? filterEmployee : ''
            const monthParam = selectedMonth
            const todayStr = new Date().toISOString().split('T')[0]

            const requests: Promise<Response>[] = [
                fetch(`/api/crm/hrm/attendance?month=${monthParam}${empParam ? `&employee_id=${empParam}` : ''}`),
                fetch('/api/crm/hrm/work-settings'),
            ]
            if (isAdminUser) requests.push(fetch('/api/crm/hrm/employees'))
            if (crmUser?.id) requests.push(fetch(`/api/crm/hrm/attendance?date=${todayStr}&employee_id=${crmUser.id}`))

            const results = await Promise.all(requests)
            const attData = await results[0].json()
            const settingsData = await results[1].json()

            setRecords(attData.attendance || [])
            setTableExists(attData.tableExists !== false)
            if (settingsData.settings) {
                setWorkSettings({
                    full_day_hours: settingsData.settings.full_day_hours || 8,
                    half_day_hours: settingsData.settings.half_day_hours || 4,
                })
            }

            if (isAdminUser && results[2]) {
                const empData = await results[2].json()
                setEmployees(empData.employees || [])
            }

            // Today's personal record
            const todayIdx = isAdminUser ? 3 : 2
            if (crmUser?.id && results[todayIdx]) {
                const todayData = await results[todayIdx].json()
                const rec = (todayData.attendance || [])[0] || null
                setTodayRecord(rec)
                if (rec?.check_in_time && !rec?.check_out_time) {
                    // Already checked in — start timer immediately
                }
            }

            // Fetch own regularizations for the current month
            if (crmUser?.id) {
                const regRes = await fetch(`/api/crm/hrm/regularizations?employee_id=${crmUser.id}&month=${monthParam}&include_quota=true`)
                if (regRes.ok) {
                    const regData = await regRes.json()
                    setRegularizations((regData.regularizations || []).map((r: {date: string; status: string}) => ({ date: r.date, status: r.status })))
                    if (regData.quota) setRegQuota(regData.quota)
                }
            }
        } finally {
            setLoading(false)
        }
    }, [selectedMonth, filterEmployee, isAdminUser, crmUser?.id])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCheckIn = async () => {
        setCheckInLoading(true)
        setCheckInError(null)
        try {
            let geoData: { lat: number; lng: number; address: string } | null = null
            try {
                geoData = await getLocation()
            } catch (e) {
                setCheckInError(`Location: ${(e as Error).message}. Check-in will proceed without location.`)
            }

            const res = await fetch('/api/crm/hrm/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: crmUser?.id,
                    action: 'check_in',
                    lat: geoData?.lat,
                    lng: geoData?.lng,
                    address: geoData?.address,
                }),
            })
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
            await fetchData()
        } catch (e) {
            setCheckInError((e as Error).message)
        } finally {
            setCheckInLoading(false)
        }
    }

    const handleCheckOut = async () => {
        setCheckInLoading(true)
        setCheckInError(null)
        try {
            let geoData: { lat: number; lng: number; address: string } | null = null
            try {
                geoData = await getLocation()
            } catch { /* proceed without */ }

            const res = await fetch('/api/crm/hrm/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: crmUser?.id,
                    action: 'check_out',
                    lat: geoData?.lat,
                    lng: geoData?.lng,
                    address: geoData?.address,
                }),
            })
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
            await fetchData()
        } catch (e) {
            setCheckInError((e as Error).message)
        } finally {
            setCheckInLoading(false)
        }
    }

    const handleRegularize = async () => {
        if (!regDate || !regReason.trim()) return
        setRegSubmitting(true)
        setRegError(null)
        try {
            const res = await fetch('/api/crm/hrm/regularizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: crmUser?.id, date: regDate, reason: regReason, actual_hours: regHours }),
            })
            const d = await res.json()
            if (!res.ok) { setRegError(d.error || 'Failed'); return }
            setShowRegModal(false)
            setRegReason('')
            setRegDate('')
            setRegHours(null)
            await fetchData()
        } catch { setRegError('Failed to submit') }
        finally { setRegSubmitting(false) }
    }

    // Build attendance map: { employee_id: { date: status } }
    const attMap = records.reduce((acc, r) => {
        if (!acc[r.employee_id]) acc[r.employee_id] = {}
        acc[r.employee_id][r.date] = r.status
        return acc
    }, {} as Record<string, Record<string, string>>)

    const hoursMap = records.reduce((acc, r) => {
        if (!acc[r.employee_id]) acc[r.employee_id] = {}
        acc[r.employee_id][r.date] = r.hours_worked ?? null
        return acc
    }, {} as Record<string, Record<string, number | null>>)

    const [year, month] = selectedMonth.split('-').map(Number)
    const monthDates = getMonthDates(year, month - 1)
    const displayEmployees = isAdminUser ? employees : (crmUser ? [{ id: crmUser.id, full_name: crmUser.full_name, role: crmUser.role }] : [])

    const analyticsRecords = analyticsEmp === 'all' ? records : records.filter(r => r.employee_id === analyticsEmp)
    const statusCounts = STATUS_OPTIONS.map(s => ({
        name: s.label, count: analyticsRecords.filter(r => r.status === s.key).length, color: s.color,
    }))
    const employeeAttPct = displayEmployees.map(e => {
        const empRecs = records.filter(r => r.employee_id === e.id)
        const presentDays = empRecs.filter(r => ['present', 'late', 'work_from_home'].includes(r.status)).length
        const workingDays = monthDates.filter(d => { const day = new Date(d).getDay(); return day !== 0 && day !== 6 }).length
        return { name: (e.full_name || '?').split(' ')[0], present: presentDays, absent: empRecs.filter(r => r.status === 'absent').length, pct: workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0, total: empRecs.length }
    }).filter(e => e.total > 0)

    const todayStr = new Date().toISOString().split('T')[0]
    const todayRecords = records.filter(r => r.date === todayStr)

    // Determine check-in widget state
    const isCheckedIn = !!todayRecord?.check_in_time && !todayRecord?.check_out_time
    const isCheckedOut = !!todayRecord?.check_out_time
    const hoursColor_ = hoursColor(todayRecord?.hours_worked, workSettings)

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm/hrm" style={{ color: 'var(--crm-text-faint)' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                            {isAdminUser ? 'Attendance' : 'My Attendance'}
                        </h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>{records.length} records · {selectedMonth}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isAdminUser && (
                        <Link href="/crm/hrm/work-settings" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', border: '1px solid #374151', borderRadius: '0.5rem', color: 'var(--crm-text-muted)', fontSize: '0.8125rem', textDecoration: 'none' }}>
                            <Settings size={14} /> Work Settings
                        </Link>
                    )}
                    <div className={styles.pillTabs}>
                        <button className={`${styles.pillTab} ${view === 'list' ? styles.pillTabActive : ''}`} onClick={() => setView('list')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><List size={13} /> Records</span>
                        </button>
                        <button className={`${styles.pillTab} ${view === 'analytics' ? styles.pillTabActive : ''}`} onClick={() => setView('analytics')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={13} /> Analytics</span>
                        </button>
                    </div>
                </div>
            </div>

            {!tableExists && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                    <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>
                        Run <code style={{ backgroundColor: 'var(--crm-elevated)', padding: '1px 6px', borderRadius: '4px' }}>supabase/hrm-schema.sql</code> and <code style={{ backgroundColor: 'var(--crm-elevated)', padding: '1px 6px', borderRadius: '4px' }}>supabase/hrm-checkin.sql</code> to enable attendance.
                    </span>
                </div>
            )}

            {/* ── CHECK-IN WIDGET ── */}
            {crmUser && tableExists && (
                <div style={{
                    marginBottom: '1.5rem',
                    background: isCheckedOut
                        ? `linear-gradient(135deg, ${hoursColor_}12, ${hoursColor_}06)`
                        : isCheckedIn
                            ? 'linear-gradient(135deg, #22c55e12, #22c55e06)'
                            : 'var(--crm-elevated)',
                    border: `1px solid ${isCheckedOut ? hoursColor_ + '40' : isCheckedIn ? '#22c55e40' : 'var(--crm-border-subtle)'}`,
                    borderRadius: '1rem',
                    padding: '1.5rem',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        {/* Left: status info */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>

                            {!todayRecord && (
                                <>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--crm-text-muted)', marginBottom: '0.5rem' }}>Not Checked In</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <MapPin size={13} /> Your location will be captured on check-in
                                    </div>
                                </>
                            )}

                            {isCheckedIn && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#22c55e' }}>Checked In</span>
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                                        <Clock size={13} /> Since {formatTime(todayRecord?.check_in_time)}
                                    </div>
                                    {elapsedDisplay && (
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                            {elapsedDisplay}
                                        </div>
                                    )}
                                    {todayRecord?.check_in_address && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginTop: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                                            <MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                                            <span>{todayRecord.check_in_address}</span>
                                        </div>
                                    )}
                                    {todayRecord?.work_mode === 'remote' && (
                                        <div style={{ marginTop: '0.375rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#3b82f620', color: '#3b82f6', borderRadius: '999px', padding: '2px 8px', fontSize: '0.6875rem', fontWeight: 600 }}>
                                            <Wifi size={10} /> Remote
                                        </div>
                                    )}
                                </>
                            )}

                            {isCheckedOut && todayRecord && (
                                <>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: hoursColor_, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={18} />
                                        {formatDuration(todayRecord.hours_worked)} worked
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <LogIn size={12} style={{ color: '#22c55e' }} /> {formatTime(todayRecord.check_in_time)}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <LogOut size={12} style={{ color: '#ef4444' }} /> {formatTime(todayRecord.check_out_time)}
                                        </span>
                                    </div>
                                    {/* Color legend */}
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: hoursColor_, fontWeight: 600 }}>
                                        {todayRecord.hours_worked != null && (
                                            todayRecord.hours_worked >= workSettings.full_day_hours
                                                ? '✓ Full day'
                                                : todayRecord.hours_worked >= workSettings.half_day_hours
                                                    ? '◑ Half day hours'
                                                    : '⚠ Short day'
                                        )}
                                    </div>
                                    {todayRecord.check_out_address && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginTop: '0.375rem', display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                                            <MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                                            <span>{todayRecord.check_out_address}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right: button */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                            {!isCheckedOut && (
                                <button
                                    onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                                    disabled={checkInLoading}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                                        padding: '0.875rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                                        background: isCheckedIn ? '#ef4444' : '#22c55e',
                                        color: 'white', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                                        boxShadow: `0 4px 16px ${isCheckedIn ? '#ef444440' : '#22c55e40'}`,
                                        opacity: checkInLoading ? 0.7 : 1,
                                        minWidth: 160, justifyContent: 'center',
                                    }}
                                >
                                    {checkInLoading
                                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />Working...</span>
                                        : isCheckedIn
                                            ? <><LogOut size={18} /> Check Out</>
                                            : <><LogIn size={18} /> Check In</>
                                    }
                                </button>
                            )}
                            {isCheckedOut && (
                                <div style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', background: `${hoursColor_}15`, border: `1px solid ${hoursColor_}30`, color: hoursColor_, fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={18} /> Done for today
                                </div>
                            )}
                            {todayRecord?.status === 'half_day' && !isCheckedOut && (
                                <Link href="/crm/hrm/leaves" style={{ fontSize: '0.75rem', color: '#f59e0b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    Apply afternoon leave →
                                </Link>
                            )}
                        </div>
                    </div>

                    {checkInError && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#f59e0b15', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                            {checkInError}
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={styles.formInput} style={{ width: 'auto' }} />
                {isAdminUser && (
                    <select className={styles.formSelect} style={{ width: 'auto', minWidth: '160px' }} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                        <option value="all">All Employees</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                )}
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading...</div>
            ) : view === 'list' ? (
                <>
                    {/* Today snapshot (admin) */}
                    {isAdminUser && todayRecords.length > 0 && (
                        <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {STATUS_OPTIONS.map(s => {
                                        const cnt = todayRecords.filter(r => r.status === s.key).length
                                        return cnt > 0 ? (
                                            <span key={s.key} style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.color }} />
                                                {cnt} {s.label}
                                            </span>
                                        ) : null
                                    })}
                                </div>
                            </div>

                            {/* Check-in/out detail table for today */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Employee</th>
                                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Status</th>
                                            <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Check In</th>
                                            <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Check Out</th>
                                            <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Hours</th>
                                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todayRecords.map(r => {
                                            const sConf = STATUS_OPTIONS.find(s => s.key === r.status)
                                            const hColor = hoursColor(r.hours_worked, workSettings)
                                            return (
                                                <tr key={r.id} style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 500, color: 'var(--crm-text-secondary)' }}>{r.employee?.full_name || '—'}</td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: sConf?.color, background: `${sConf?.color}15`, padding: '2px 8px', borderRadius: '999px' }}>
                                                            {sConf?.label || r.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>{formatTime(r.check_in_time)}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{formatTime(r.check_out_time)}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: hColor }}>
                                                        {formatDuration(r.hours_worked) || '—'}
                                                    </td>
                                                    <td style={{ padding: '0.5rem', fontSize: '0.6875rem', color: 'var(--crm-text-faint)', maxWidth: 160 }}>
                                                        {r.check_in_address ? (
                                                            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                                                                <MapPin size={11} style={{ flexShrink: 0, marginTop: 1, color: 'var(--crm-accent)' }} />
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.check_in_address}</span>
                                                            </span>
                                                        ) : r.work_mode === 'remote' ? (
                                                            <span style={{ color: '#3b82f6' }}>Remote (no GPS)</span>
                                                        ) : <span>Office</span>}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Monthly grid */}
                    <div className={styles.card} style={{ overflowX: 'auto' }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Monthly Overview</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>
                                <span style={{ color: '#22c55e' }}>■</span> ≥{workSettings.full_day_hours}h &nbsp;
                                <span style={{ color: '#f59e0b' }}>■</span> ≥{workSettings.half_day_hours}h &nbsp;
                                <span style={{ color: '#ef4444' }}>■</span> Short
                            </span>
                        </div>
                        {displayEmployees.length === 0 ? (
                            <div className={styles.emptyState}>No employees found</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--crm-text-faint)', fontWeight: 600, position: 'sticky', left: 0, backgroundColor: 'var(--crm-surface)', zIndex: 1 }}>Employee</th>
                                        {monthDates.map(d => {
                                            const day = new Date(d).getDay()
                                            const isWeekend = day === 0 || day === 6
                                            return (
                                                <th key={d} style={{ padding: '0.5rem 0.25rem', color: isWeekend ? 'var(--crm-border-subtle)' : '#6b7280', fontWeight: 600, textAlign: 'center', minWidth: '28px' }}>
                                                    {d.split('-')[2]}
                                                </th>
                                            )
                                        })}
                                        <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', color: 'var(--crm-text-faint)', fontWeight: 600 }}>%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayEmployees.map(emp => {
                                        const empAtt = attMap[emp.id] || {}
                                        const empHours = hoursMap[emp.id] || {}
                                        const presentDays = Object.values(empAtt).filter(s => ['present', 'late', 'work_from_home'].includes(s)).length
                                        const workingDays = monthDates.filter(d => { const day = new Date(d).getDay(); return day !== 0 && day !== 6 }).length
                                        const pct = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0
                                        return (
                                            <tr key={emp.id} style={{ borderTop: '1px solid var(--crm-border)' }}>
                                                <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: 'var(--crm-text-secondary)', position: 'sticky', left: 0, backgroundColor: 'var(--crm-surface)', whiteSpace: 'nowrap' }}>
                                                    {(emp.full_name || '?').split(' ')[0]}
                                                </td>
                                                {monthDates.map(d => {
                                                    const status = empAtt[d]
                                                    const hours = empHours[d]
                                                    const day = new Date(d).getDay()
                                                    const isWeekend = day === 0 || day === 6
                                                    const sConf = STATUS_OPTIONS.find(s => s.key === status)
                                                    const isToday = d === todayStr
                                                    // Color by hours if available, else by status
                                                    const dotColor = hours != null
                                                        ? hoursColor(hours, workSettings)
                                                        : sConf?.color

                                                    return (
                                                        <td key={d} style={{ textAlign: 'center', padding: '0.25rem' }}>
                                                            {isWeekend ? (
                                                                <span style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: 'var(--crm-elevated)', display: 'inline-block', opacity: 0.3 }} />
                                                            ) : (
                                                                <span
                                                                    title={status ? `${sConf?.label}${hours != null ? ` · ${formatDuration(hours)}` : ''}` : 'Not marked'}
                                                                    style={{
                                                                        width: '18px', height: '18px', borderRadius: '3px',
                                                                        backgroundColor: status ? `${dotColor}40` : isToday ? '#BFA27020' : 'var(--crm-border)',
                                                                        border: `1px solid ${status ? `${dotColor}60` : isToday ? '#BFA27040' : 'var(--crm-border-subtle)'}`,
                                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                        cursor: 'default',
                                                                    }}
                                                                >
                                                                    {status && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }} />}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                                <td style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 700, color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444' }}>
                                                    {pct}%
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                            {STATUS_OPTIONS.map(s => (
                                <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: s.color + '60', border: `1px solid ${s.color}` }} />
                                    {s.label}
                                </span>
                            ))}
                        </div>

                        {/* Regularization prompts for agent */}
                        {!isAdminUser && (() => {
                            const myAtt = attMap[crmUser?.id || ''] || {}
                            const myHours = hoursMap[crmUser?.id || ''] || {}
                            const shortDays = monthDates.filter(d => {
                                const status = myAtt[d]
                                const hours = myHours[d]
                                const day = new Date(d).getDay()
                                if (day === 0 || day === 6) return false
                                if (!status) return false
                                return (status === 'half_day' || status === 'absent') && (hours != null && hours < workSettings.full_day_hours)
                            })
                            if (shortDays.length === 0) return null
                            return (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--crm-border)', paddingTop: '1rem' }}>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.625rem' }}>
                                        🔄 Short / Absent days — Apply for Regularisation
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {shortDays.map(d => {
                                            const hours = myHours[d]
                                            const status = myAtt[d]
                                            const existing = regularizations.find(r => r.date === d)
                                            const regStatusColor = existing?.status === 'approved' ? '#22c55e' : existing?.status === 'rejected' ? '#ef4444' : '#f59e0b'
                                            return (
                                                <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--crm-elevated)', borderRadius: '0.5rem', gap: '1rem' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>
                                                            {new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginLeft: '0.5rem' }}>
                                                            {hours != null ? `${hours.toFixed(1)}h worked` : status}
                                                        </span>
                                                    </div>
                                                    {existing ? (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: regStatusColor, background: `${regStatusColor}15`, padding: '2px 10px', borderRadius: '999px', textTransform: 'capitalize' }}>
                                                            {existing.status}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setRegDate(d); setRegHours(hours || null); setShowRegModal(true) }}
                                                            style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: '0.375rem', cursor: 'pointer' }}
                                                        >
                                                            Regularise →
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-dim)', marginTop: '0.5rem' }}>
                                        Quota: {regularizations.filter(r => r.status !== 'rejected').length} / {regQuota.max_regularizations_per_month} used this month
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </>
            ) : (
                /* Analytics */
                <>
                    {/* Employee filter for analytics */}
                    {isAdminUser && employees.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <select
                                className={styles.formSelect}
                                style={{ width: 'auto', minWidth: 180 }}
                                value={analyticsEmp}
                                onChange={e => setAnalyticsEmp(e.target.value)}
                            >
                                <option value="all">All Employees</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {STATUS_OPTIONS.map(s => (
                            <div key={s.key} className={styles.statCard}>
                                <div className={styles.statLabel}>{s.label}</div>
                                <div className={styles.statValue} style={{ color: s.color, fontSize: '1.5rem' }}>
                                    {analyticsRecords.filter(r => r.status === s.key).length}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.chartsGrid}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>Status Distribution</span></div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={statusCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="count" name="Records" radius={[4, 4, 0, 0]}>
                                        {statusCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><span className={styles.cardTitle}>Attendance %</span></div>
                            {employeeAttPct.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                    {employeeAttPct.sort((a, b) => b.pct - a.pct).map(e => (
                                        <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', width: '70px', flexShrink: 0 }}>{e.name}</span>
                                            <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--crm-elevated)', borderRadius: '3px' }}>
                                                <div style={{ height: '100%', width: `${e.pct}%`, backgroundColor: e.pct >= 80 ? '#22c55e' : e.pct >= 60 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: e.pct >= 80 ? '#22c55e' : e.pct >= 60 ? '#f59e0b' : '#ef4444', width: '36px', textAlign: 'right' }}>{e.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className={styles.emptyState} style={{ padding: '2rem' }}>No data</div>}
                        </div>
                    </div>
                </>
            )}

            {/* Regularization Apply Modal */}
            {showRegModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Apply for Regularisation</h2>
                            <button onClick={() => { setShowRegModal(false); setRegError(null) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-faint)' }}>✕</button>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Date</label>
                            <input type="date" className={styles.formInput} value={regDate} onChange={e => setRegDate(e.target.value)} />
                        </div>
                        {regHours != null && (
                            <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#f59e0b10', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#f59e0b' }}>
                                Logged hours: <strong>{regHours.toFixed(1)}h</strong> · requesting full-day credit
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Reason *</label>
                            <textarea className={styles.formInput} rows={4} placeholder="Explain why your attendance should be regularised (e.g. worked offline, network issue, client visit)..." value={regReason} onChange={e => setRegReason(e.target.value)} style={{ resize: 'vertical' }} />
                        </div>
                        {regError && (
                            <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#ef444415', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#ef4444' }}>
                                {regError}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => { setShowRegModal(false); setRegError(null) }}>Cancel</button>
                            <button className={styles.btnPrimary} style={{ flex: 2 }} onClick={handleRegularize} disabled={regSubmitting || !regReason.trim()}>
                                {regSubmitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.3); }
                }
            `}</style>
        </div>
    )
}
