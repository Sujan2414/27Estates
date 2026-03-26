'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
    Clock, CheckSquare, Calendar, MapPin,
    TrendingUp, Zap, ChevronRight, RefreshCw,
    LogIn, LogOut as LogOutIcon, Coffee, Wifi
} from 'lucide-react'
import styles from './hrms.module.css'

interface AttendanceRecord {
    id?: string; status: string; check_in?: string | null; check_out?: string | null
    hours_worked?: number | null; work_mode?: string; check_in_address?: string | null
}
interface LeaveBalance { leave_type: string; allocated_days: number; used_days: number; balance_days: number }
interface Task { id: string; title: string; status: string; priority: string; due_date?: string | null }

function fmt12(ts: string | null | undefined) {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtHours(h: number | null | undefined) {
    if (!h) return '0h 0m'
    const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60)
    return `${hrs}h ${mins}m`
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    present:       { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', label: 'Present' },
    work_from_home:{ bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: 'WFH' },
    absent:        { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', label: 'Absent' },
    late:          { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'Late' },
    half_day:      { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', label: 'Half Day' },
}
const LEAVE_COLORS = ['#183C38','#BFA270','#3b82f6','#8b5cf6','#ef4444']
const PRIORITY_COLOR: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#9ca3af' }

export default function MyDayPage() {
    const supabase = createClient()
    const [userId, setUserId]         = useState<string | null>(null)
    const [today]                     = useState(new Date().toISOString().split('T')[0])
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
    const [balances, setBalances]     = useState<LeaveBalance[]>([])
    const [tasks, setTasks]           = useState<Task[]>([])
    const [loading, setLoading]       = useState(true)
    const [checking, setChecking]     = useState(false)
    const [workMode, setWorkMode]     = useState<'office' | 'work_from_home'>('office')
    const [locating, setLocating]     = useState(false)
    const [elapsed, setElapsed]       = useState('')

    const load = useCallback(async (uid: string) => {
        const fy = (() => {
            const now = new Date(); const y = now.getFullYear(); const m = now.getMonth() + 1
            return m >= 4 ? `${y}-${String(y + 1).slice(-2)}` : `${y - 1}-${String(y).slice(-2)}`
        })()
        const [attRes, balRes, taskRes] = await Promise.all([
            fetch(`/api/crm/hrm/attendance?employee_id=${uid}&date=${today}`),
            fetch(`/api/crm/hrm/allocations?employee_id=${uid}&financial_year=${fy}&include_balance=true`),
            fetch(`/api/crm/hrm/tasks?assigned_to=${uid}&status=todo,in_progress`),
        ])
        if (attRes.ok)  { const d = await attRes.json();  setAttendance((d.records || d.attendance || [])[0] || null) }
        if (balRes.ok)  { const d = await balRes.json();  setBalances(d.allocations || []) }
        if (taskRes.ok) { const d = await taskRes.json(); setTasks((d.tasks || []).slice(0, 5)) }
        setLoading(false)
    }, [today])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) { setUserId(user.id); load(user.id) }
        })
    }, [load, supabase])

    const getLocation = (): Promise<{ lat: number; lng: number; address: string }> =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) { resolve({ lat: 0, lng: 0, address: 'Location unavailable' }); return }
            setLocating(true)
            navigator.geolocation.getCurrentPosition(
                async pos => {
                    const { latitude: lat, longitude: lng } = pos.coords
                    let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                    try {
                        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
                        const d = await r.json()
                        address = d.display_name?.split(',').slice(0, 3).join(', ') || address
                    } catch { /* silent */ }
                    setLocating(false)
                    resolve({ lat, lng, address })
                },
                () => { setLocating(false); resolve({ lat: 0, lng: 0, address: 'Location unavailable' }) },
                { timeout: 8000 }
            )
        })

    const handleCheckIn = async () => {
        if (!userId || checking) return
        setChecking(true)
        try {
            const loc = await getLocation()
            const res = await fetch('/api/crm/hrm/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'check_in', employee_id: userId, date: today, work_mode: workMode,
                    lat: loc.lat, lng: loc.lng, address: loc.address,
                }),
            })
            if (res.ok) await load(userId)
        } finally { setChecking(false) }
    }

    const handleCheckOut = async () => {
        if (!userId || checking) return
        setChecking(true)
        try {
            const loc = await getLocation()
            const res = await fetch('/api/crm/hrm/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'check_out', employee_id: userId, date: today,
                    lat: loc.lat, lng: loc.lng, address: loc.address,
                }),
            })
            if (res.ok) await load(userId)
        } finally { setChecking(false) }
    }

    // Live elapsed timer — ticks every second while clocked in but not out
    useEffect(() => {
        if (!attendance?.check_in || attendance?.check_out) { setElapsed(''); return }
        const tick = () => {
            const ms = Date.now() - new Date(attendance.check_in!).getTime()
            const h  = Math.floor(ms / 3600000)
            const m  = Math.floor((ms % 3600000) / 60000)
            const s  = Math.floor((ms % 60000) / 1000)
            setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [attendance?.check_in, attendance?.check_out])

    const hasCheckedIn  = !!attendance?.check_in
    const hasCheckedOut = !!attendance?.check_out
    const attStatus     = attendance?.status
    const statusStyle   = attStatus ? (STATUS_STYLES[attStatus] || STATUS_STYLES.present) : null
    const openTasks     = tasks.filter(t => t.status !== 'done')

    if (loading) return (
        <div className={styles.loader}>
            <div className={styles.spinner} />
            <span>Loading your day…</span>
        </div>
    )

    return (
        <div>
            {/* ── Check-in Hero ── */}
            <div style={{
                background: 'linear-gradient(135deg, #183C38 0%, #2d7a6e 100%)',
                borderRadius: '20px', padding: '1.75rem', marginBottom: '1.5rem',
                color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circle */}
                <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', right: 20, bottom: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Today&apos;s Attendance
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        {hasCheckedIn ? (hasCheckedOut ? 'Day Complete 🎉' : 'You\'re clocked in') : 'Good to see you!'}
                    </div>

                    {/* Time pills */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}>
                            <div style={{ opacity: 0.7, fontSize: '0.65rem', marginBottom: '2px' }}>CHECK IN</div>
                            <div style={{ fontWeight: 700 }}>{fmt12(attendance?.check_in)}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}>
                            <div style={{ opacity: 0.7, fontSize: '0.65rem', marginBottom: '2px' }}>CHECK OUT</div>
                            <div style={{ fontWeight: 700 }}>{fmt12(attendance?.check_out)}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.5rem 0.875rem', fontSize: '0.8rem', minWidth: '80px' }}>
                            <div style={{ opacity: 0.7, fontSize: '0.65rem', marginBottom: '2px' }}>
                                {elapsed ? 'ELAPSED' : 'HOURS'}
                            </div>
                            <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: elapsed ? '0.05em' : undefined }}>
                                {elapsed || fmtHours(attendance?.hours_worked)}
                            </div>
                        </div>
                        {statusStyle && (
                            <div style={{ background: statusStyle.bg, borderRadius: '10px', padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}>
                                <div style={{ opacity: 0.7, fontSize: '0.65rem', marginBottom: '2px', color: '#fff' }}>STATUS</div>
                                <div style={{ fontWeight: 700, color: statusStyle.color }}>{statusStyle.label}</div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    {attendance?.check_in_address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.7 }}>
                            <MapPin size={12} />
                            <span>{attendance.check_in_address}</span>
                        </div>
                    )}

                    {/* Action area */}
                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {!hasCheckedIn ? (
                            <>
                                {/* Work mode toggle */}
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                                    <button
                                        onClick={() => setWorkMode('office')}
                                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: workMode === 'office' ? '#fff' : 'transparent', color: workMode === 'office' ? '#183C38' : 'rgba(255,255,255,0.8)', transition: 'all 0.15s' }}
                                    >
                                        🏢 Office
                                    </button>
                                    <button
                                        onClick={() => setWorkMode('work_from_home')}
                                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: workMode === 'work_from_home' ? '#fff' : 'transparent', color: workMode === 'work_from_home' ? '#183C38' : 'rgba(255,255,255,0.8)', transition: 'all 0.15s' }}
                                    >
                                        🏠 WFH
                                    </button>
                                </div>
                                <button
                                    onClick={handleCheckIn}
                                    disabled={checking || locating}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.5rem', borderRadius: '12px', background: '#fff', color: '#183C38', border: 'none', cursor: checking ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.15s' }}
                                >
                                    {checking || locating ? <RefreshCw size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <LogIn size={16} />}
                                    {locating ? 'Getting location…' : checking ? 'Checking in…' : 'Check In'}
                                </button>
                            </>
                        ) : !hasCheckedOut ? (
                            <button
                                onClick={handleCheckOut}
                                disabled={checking || locating}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.5rem', borderRadius: '12px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', cursor: checking ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(239,68,68,0.25)', transition: 'all 0.15s' }}
                            >
                                {checking || locating ? <RefreshCw size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <LogOutIcon size={16} />}
                                {locating ? 'Getting location…' : checking ? 'Checking out…' : 'Check Out'}
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.25rem', borderRadius: '12px', background: 'rgba(34,197,94,0.2)', color: '#86efac', fontWeight: 600, fontSize: '0.875rem' }}>
                                ✓ Day complete — See you tomorrow!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className={styles.statRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                {[
                    { label: 'Open Tasks',    value: openTasks.length,    icon: <CheckSquare size={16} />, color: '#3b82f6', href: '/hrms/tasks' },
                    { label: 'Leave Balance', value: balances.reduce((s, b) => s + b.balance_days, 0), icon: <Calendar size={16} />, color: '#22c55e', href: '/hrms/leaves' },
                    { label: 'Work Mode',     value: attendance?.work_mode === 'work_from_home' ? 'WFH' : 'Office', icon: attendance?.work_mode === 'work_from_home' ? <Wifi size={16} /> : <Coffee size={16} />, color: '#f59e0b', href: '/hrms/attendance' },
                ].map(s => (
                    <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                        <div className={styles.statCard} style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--h-shadow-md)')}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--h-shadow-sm)')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: s.color, marginBottom: '0.4rem' }}>
                                {s.icon}
                                <span className={styles.statLabel}>{s.label}</span>
                            </div>
                            <div className={styles.statValue} style={{ fontSize: '1.35rem' }}>{s.value}</div>
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Leave Balances */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <Calendar size={16} style={{ color: '#22c55e' }} /> Leave Balances
                        <Link href="/hrms/leaves" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--h-text-3)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                            View all <ChevronRight size={12} />
                        </Link>
                    </div>
                    {balances.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyTitle}>No allocation found</div>
                            <div className={styles.emptyText}>Contact HR to set up your leave balance</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {balances.map((b, i) => (
                                <div key={b.leave_type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: LEAVE_COLORS[i % LEAVE_COLORS.length], flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--h-text-2)', textTransform: 'capitalize' }}>{b.leave_type.replace('_', ' ')}</span>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--h-text-3)' }}>{b.balance_days}/{b.allocated_days} left</span>
                                        </div>
                                        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--h-border)' }}>
                                            <div style={{ width: `${b.allocated_days > 0 ? (b.balance_days / b.allocated_days) * 100 : 0}%`, height: '100%', borderRadius: '2px', background: LEAVE_COLORS[i % LEAVE_COLORS.length], transition: 'width 0.3s' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Today's Tasks */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <CheckSquare size={16} style={{ color: '#3b82f6' }} /> My Tasks
                        <Link href="/hrms/tasks" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--h-text-3)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                            View all <ChevronRight size={12} />
                        </Link>
                    </div>
                    {tasks.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyTitle}>All clear! 🎉</div>
                            <div className={styles.emptyText}>No open tasks assigned to you</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tasks.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 0.75rem', background: 'var(--h-elevated)', borderRadius: '10px', border: '1px solid var(--h-border)' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[t.priority] || '#9ca3af', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--h-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                                        {t.due_date && <div style={{ fontSize: '0.68rem', color: 'var(--h-text-4)', marginTop: '2px' }}>Due {new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                                    </div>
                                    <span className={`${styles.pill} ${t.status === 'in_progress' ? styles.pillBlue : styles.pillGray}`} style={{ fontSize: '0.65rem' }}>
                                        {t.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick links */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <Zap size={16} style={{ color: '#f59e0b' }} /> Quick Actions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { label: 'Apply for Leave',   href: '/hrms/leaves',     icon: Calendar,    color: '#22c55e' },
                            { label: 'View Attendance',   href: '/hrms/attendance', icon: Clock,       color: '#3b82f6' },
                            { label: 'My Tasks Board',    href: '/hrms/tasks',      icon: CheckSquare, color: '#8b5cf6' },
                            { label: 'Regularise Attendance', href: '/hrms/attendance', icon: TrendingUp, color: '#f59e0b' },
                        ].map(q => {
                            const Icon = q.icon
                            return (
                                <Link key={q.label} href={q.href} style={{ textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.625rem 0.75rem', background: 'var(--h-elevated)', borderRadius: '10px', border: '1px solid var(--h-border)', cursor: 'pointer', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = q.color; (e.currentTarget as HTMLElement).style.background = `${q.color}10` }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--h-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--h-elevated)' }}
                                    >
                                        <div style={{ width: 30, height: 30, borderRadius: '8px', background: `${q.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={15} style={{ color: q.color }} />
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--h-text-2)' }}>{q.label}</span>
                                        <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--h-text-4)' }} />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
