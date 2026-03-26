'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, TrendingUp, CheckCircle, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'
import styles from '../hrms.module.css'

interface TeamMember {
    id: string; full_name: string; email: string; role: string
    leads_assigned?: number; leads_converted?: number
}
interface AttendanceToday {
    employee_id: string; status: string; check_in?: string | null
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    present:        { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', label: 'Present' },
    work_from_home: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: 'WFH' },
    absent:         { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', label: 'Absent' },
    late:           { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'Late' },
    half_day:       { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', label: 'Half Day' },
}

function fmt12(ts: string | null | undefined) {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function TeamOverviewPage() {
    const supabase = createClient()
    const [userId, setUserId]           = useState<string | null>(null)
    const [team, setTeam]               = useState<TeamMember[]>([])
    const [attendance, setAttendance]   = useState<AttendanceToday[]>([])
    const [pendingLeaves, setPending]   = useState(0)
    const [loading, setLoading]         = useState(true)

    const load = useCallback(async (uid: string) => {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const [empRes, attRes, lvRes] = await Promise.all([
            fetch(`/api/crm/hrm/employees?reporting_manager_id=${uid}`),
            fetch(`/api/crm/hrm/attendance?today=true`),
            fetch(`/api/crm/hrm/leaves?team_only=true&approver_id=${uid}&status=pending`),
        ])
        if (empRes.ok) { const d = await empRes.json(); setTeam(d.employees || []) }
        if (attRes.ok) { const d = await attRes.json(); setAttendance(d.attendance || d.records || []) }
        if (lvRes.ok)  { const d = await lvRes.json();  setPending((d.leaves || []).length) }
        setLoading(false)
        void today
    }, [])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) { setUserId(user.id); load(user.id) }
        })
    }, [load, supabase])

    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'work_from_home').length
    const teamSize     = team.length

    const quickLinks = [
        { label: 'Attendance',    href: '/hrms/team/attendance',      icon: Clock,       color: '#3b82f6', badge: undefined },
        { label: 'Leave Approvals', href: '/hrms/team/leaves',        icon: Calendar,    color: '#f59e0b', badge: pendingLeaves > 0 ? pendingLeaves : undefined },
        { label: 'Regularisations', href: '/hrms/team/regularizations', icon: TrendingUp, color: '#8b5cf6', badge: undefined },
    ]

    if (loading) return <div className={styles.loader} style={{ minHeight: '50vh' }}><div className={styles.spinner} /></div>

    return (
        <div>
            {/* Stats */}
            <div className={styles.statRow} style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                {[
                    { label: 'Team Size',     value: teamSize,     color: 'var(--h-text-1)', icon: <Users size={16} /> },
                    { label: 'Present Today', value: presentCount, color: '#16a34a',         icon: <CheckCircle size={16} /> },
                    { label: 'Pending Leaves',value: pendingLeaves,color: '#d97706',         icon: <Calendar size={16} /> },
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: s.color, marginBottom: '0.4rem' }}>
                            {s.icon}
                            <span className={styles.statLabel}>{s.label}</span>
                        </div>
                        <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
                {quickLinks.map(q => {
                    const Icon = q.icon
                    return (
                        <Link key={q.href} href={q.href} style={{ textDecoration: 'none' }}>
                            <div style={{ background: 'var(--h-surface)', border: `1px solid var(--h-border)`, borderRadius: '14px', padding: '1.125rem', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = q.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${q.color}20` }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--h-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${q.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                    <Icon size={18} style={{ color: q.color }} />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--h-text-1)', marginBottom: '2px' }}>{q.label}</div>
                                {q.badge !== undefined && (
                                    <div style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', minWidth: 20, textAlign: 'center' }}>{q.badge}</div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Team member list */}
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--h-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} style={{ color: '#3b82f6' }} />
                    <span className={styles.cardTitle} style={{ margin: 0 }}>Your Team</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--h-text-3)' }}>{teamSize} members</span>
                </div>
                {team.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyTitle}>No team members yet</div>
                        <div className={styles.emptyText}>Ask an admin to assign employees under your management</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {['Member', 'Role', 'Check In', 'Status', 'Leads', 'Conversions'].map(h => (
                                        <th key={h} className={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {team.map(m => {
                                    const att = attendance.find(a => a.employee_id === m.id)
                                    const st  = att ? (STATUS_STYLE[att.status] || null) : null
                                    return (
                                        <tr key={m.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className={styles.avatar} style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{m.full_name.charAt(0).toUpperCase()}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--h-text-1)' }}>{m.full_name}</div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--h-text-4)' }}>{m.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--h-text-2)' }}>{m.role}</span>
                                            </td>
                                            <td className={styles.td} style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmt12(att?.check_in)}</td>
                                            <td className={styles.td}>
                                                {st ? (
                                                    <span className={styles.pill} style={{ background: st.bg, color: st.color, fontSize: '0.7rem' }}>{st.label}</span>
                                                ) : (
                                                    <span className={`${styles.pill} ${styles.pillGray}`} style={{ fontSize: '0.7rem' }}>Not marked</span>
                                                )}
                                            </td>
                                            <td className={styles.td} style={{ textAlign: 'center', fontWeight: 700, color: 'var(--h-text-1)' }}>{m.leads_assigned ?? '—'}</td>
                                            <td className={styles.td} style={{ textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{m.leads_converted ?? '—'}</td>
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
