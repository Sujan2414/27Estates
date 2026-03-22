'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Users2, ClipboardList, Clock, Calendar, TrendingUp, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../crm.module.css'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' },
    itemStyle: { color: 'var(--crm-text-secondary)' }, labelStyle: { color: 'var(--crm-text-muted)' },
}

interface Employee { id: string; full_name: string; role: string; leads_assigned: number; leads_converted: number }
interface HRMTask { id: string; title: string; status: string; priority: string; assignee?: { full_name: string } | null; due_date?: string }

export default function HRMOverviewPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [tasks, setTasks] = useState<HRMTask[]>([])
    const [pendingLeaves, setPendingLeaves] = useState(0)
    const [todayAttendance, setTodayAttendance] = useState<{ present: number; absent: number; wfh: number }>({ present: 0, absent: 0, wfh: 0 })
    const [loading, setLoading] = useState(true)
    const [tablesExist, setTablesExist] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            // Employees from profiles
            const empRes = await fetch('/api/crm/hrm/employees')
            const empData = empRes.ok ? await empRes.json() : {}
            setEmployees(empData.employees || [])

            // Tasks
            const taskRes = await fetch('/api/crm/hrm/tasks')
            const taskData = taskRes.ok ? await taskRes.json() : {}
            setTasks(taskData.tasks || [])
            if (taskData.tableExists === false) setTablesExist(false)

            // Pending leaves
            const leaveRes = await fetch('/api/crm/hrm/leaves?status=pending')
            const leaveData = leaveRes.ok ? await leaveRes.json() : {}
            setPendingLeaves((leaveData.leaves || []).length)

            // Today's attendance
            const today = new Date().toISOString().split('T')[0]
            const attRes = await fetch(`/api/crm/hrm/attendance?date=${today}`)
            const attData = attRes.ok ? await attRes.json() : {}
            const att = attData.attendance || []
            setTodayAttendance({
                present: att.filter((a: { status: string }) => ['present', 'late'].includes(a.status)).length,
                absent: att.filter((a: { status: string }) => a.status === 'absent').length,
                wfh: att.filter((a: { status: string }) => a.status === 'work_from_home').length,
            })

            setLoading(false)
        }
        load()
    }, [supabase])

    const tasksByStatus = ['todo', 'in_progress', 'review', 'done'].map(s => ({
        name: s === 'in_progress' ? 'In Progress' : s === 'todo' ? 'To Do' : s.charAt(0).toUpperCase() + s.slice(1),
        count: tasks.filter(t => t.status === s).length,
        color: s === 'done' ? '#22c55e' : s === 'in_progress' ? '#f59e0b' : s === 'review' ? '#8b5cf6' : '#6b7280',
    }))

    const topPerformers = [...employees]
        .filter(e => e.leads_assigned > 0)
        .sort((a, b) => b.leads_converted - a.leads_converted)
        .slice(0, 5)

    const openTasks = tasks.filter(t => t.status !== 'done').length
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length

    const roleDistribution = [
        { name: 'Agents', value: employees.filter(e => e.role === 'agent').length, fill: '#3b82f6' },
        { name: 'Admins', value: employees.filter(e => e.role === 'admin').length, fill: '#BFA270' },
        { name: 'Super Admins', value: employees.filter(e => e.role === 'super_admin').length, fill: '#8b5cf6' },
    ].filter(r => r.value > 0)

    if (loading) return <div className={styles.pageContent}><div className={styles.emptyState}>Loading HRM...</div></div>

    return (
        <div className={styles.pageContent}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>HRM Overview</h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Human Resource Management · {employees.length} employees</p>
            </div>

            {!tablesExist && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
                    <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.25rem' }}>HRM Tables Not Set Up</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)' }}>
                            Run <code style={{ backgroundColor: 'var(--crm-elevated)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>supabase/hrm-schema.sql</code> in your Supabase SQL editor to enable Tasks, Attendance, and Leaves.
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className={styles.hrmStatsGrid}>
                {[
                    { label: 'Total Employees', value: employees.length, color: 'var(--crm-accent)', icon: Users2, href: '/crm/hrm/employees' },
                    { label: 'Present Today', value: todayAttendance.present + todayAttendance.wfh, color: '#22c55e', icon: Clock, href: '/crm/hrm/attendance' },
                    { label: 'Pending Leaves', value: pendingLeaves, color: '#f59e0b', icon: Calendar, href: '/crm/hrm/leaves' },
                    { label: 'Open Tasks', value: openTasks, color: '#8b5cf6', icon: ClipboardList, href: '/crm/hrm/tasks' },
                ].map(s => (
                    <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                        <div className={styles.statCard} style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span className={styles.statLabel}>{s.label}</span>
                                <s.icon size={16} style={{ color: s.color }} />
                            </div>
                            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className={styles.chartsGrid} style={{ marginBottom: '1.5rem' }}>
                {/* Task Status Distribution */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Tasks by Status</span>
                        <Link href="/crm/hrm/tasks" style={{ fontSize: '0.75rem', color: 'var(--crm-accent)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={tasksByStatus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                            <Tooltip {...tooltipStyle} />
                            <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                                {tasksByStatus.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {overdueTasks > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#ef444410', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={14} style={{ color: '#ef4444' }} />
                            <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{overdueTasks} overdue {overdueTasks === 1 ? 'task' : 'tasks'}</span>
                        </div>
                    )}
                </div>

                {/* Employee Role Distribution */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Team Composition</span>
                    </div>
                    {roleDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} />
                                <Tooltip {...tooltipStyle} />
                                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={styles.emptyState} style={{ padding: '2rem' }}>No employees yet</div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Top Performers */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Top Performers</span>
                        <TrendingUp size={14} style={{ color: 'var(--crm-accent)' }} />
                    </div>
                    {topPerformers.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {topPerformers.map((e, i) => {
                                const rate = e.leads_assigned > 0 ? Math.round((e.leads_converted / e.leads_assigned) * 100) : 0
                                return (
                                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ width: '20px', fontSize: '0.75rem', color: 'var(--crm-text-dim)', fontWeight: 700 }}>#{i + 1}</span>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--crm-btn-primary-bg)', color: 'var(--crm-btn-primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                            {e.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{e.full_name}</div>
                                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{e.leads_converted}/{e.leads_assigned} leads converted</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>{rate}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState} style={{ padding: '1.5rem' }}>Assign leads to agents to see performance</div>
                    )}
                </div>

                {/* Recent Tasks */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Recent Tasks</span>
                        <Link href="/crm/hrm/tasks" style={{ fontSize: '0.75rem', color: 'var(--crm-accent)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    {tasks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tasks.slice(0, 6).map(t => {
                                const priorityColor = t.priority === 'urgent' ? '#ef4444' : t.priority === 'high' ? '#f97316' : t.priority === 'medium' ? '#f59e0b' : '#6b7280'
                                const statusColor = t.status === 'done' ? '#22c55e' : t.status === 'in_progress' ? '#f59e0b' : t.status === 'review' ? '#8b5cf6' : '#6b7280'
                                return (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: 'var(--crm-elevated)' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: priorityColor, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                                            {t.assignee && <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{t.assignee.full_name}</div>}
                                        </div>
                                        <span style={{ fontSize: '0.625rem', fontWeight: 600, color: statusColor, backgroundColor: `${statusColor}15`, padding: '2px 6px', borderRadius: '999px', flexShrink: 0 }}>
                                            {t.status === 'in_progress' ? 'Active' : t.status}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState} style={{ padding: '1.5rem' }}>
                            {tablesExist ? 'No tasks yet' : 'Run migration to enable tasks'}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
                {[
                    { href: '/crm/hrm/employees', icon: Users2, label: 'Manage Employees', sub: `${employees.length} total` },
                    { href: '/crm/hrm/tasks', icon: ClipboardList, label: 'Task Kanban', sub: `${openTasks} open` },
                    { href: '/crm/hrm/attendance', icon: Clock, label: 'Attendance', sub: `${todayAttendance.present + todayAttendance.wfh} present today` },
                    { href: '/crm/hrm/leaves', icon: Calendar, label: 'Leaves', sub: `${pendingLeaves} pending` },
                ].map(link => (
                    <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                        <div className={styles.card} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', backgroundColor: 'var(--crm-nav-active-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <link.icon size={18} style={{ color: 'var(--crm-btn-primary-bg)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{link.label}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{link.sub}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
