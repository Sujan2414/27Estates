'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Search, Users2, TrendingUp, Star, BarChart2, List } from 'lucide-react'
import styles from '../../crm.module.css'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface Employee {
    id: string; full_name: string; email: string; role: string
    created_at: string; leads_assigned: number; leads_converted: number
    reporting_manager_id?: string | null
    manager?: { id: string; full_name: string } | null
}

const roleColors: Record<string, { color: string; label: string }> = {
    super_admin: { color: '#8b5cf6', label: 'Super Admin' },
    admin: { color: 'var(--crm-accent)', label: 'Admin' },
    agent: { color: '#3b82f6', label: 'Agent' },
}

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--crm-elevated)', border: '1px solid var(--crm-border-subtle)', borderRadius: '8px', fontSize: '0.75rem' },
    itemStyle: { color: 'var(--crm-text-secondary)' }, labelStyle: { color: 'var(--crm-text-muted)' },
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [view, setView] = useState<'list' | 'analytics'>('list')
    const [updatingManager, setUpdatingManager] = useState<string | null>(null)

    const fetchEmployees = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (roleFilter !== 'all') params.set('role', roleFilter)
        const res = await fetch(`/api/crm/hrm/employees?${params}`)
        if (res.ok) { const d = await res.json(); setEmployees(d.employees || []) }
        setLoading(false)
    }, [search, roleFilter])

    useEffect(() => { fetchEmployees() }, [fetchEmployees])

    const handleManagerChange = async (empId: string, managerId: string) => {
        setUpdatingManager(empId)
        await fetch('/api/crm/hrm/employees', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: empId, reporting_manager_id: managerId || null }),
        })
        await fetchEmployees()
        setUpdatingManager(null)
    }

    const performanceData = employees
        .filter(e => e.leads_assigned > 0)
        .map(e => ({
            name: e.full_name.split(' ')[0],
            assigned: e.leads_assigned,
            converted: e.leads_converted,
            rate: Math.round((e.leads_converted / e.leads_assigned) * 100),
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 8)

    const totalLeads = employees.reduce((s, e) => s + e.leads_assigned, 0)
    const totalConverted = employees.reduce((s, e) => s + e.leads_converted, 0)
    const avgConvRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm/hrm" style={{ color: 'var(--crm-text-faint)' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Employees</h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Team members with CRM access · {employees.length} total</p>
                    </div>
                </div>
                <div className={styles.pillTabs}>
                    <button className={`${styles.pillTab} ${view === 'list' ? styles.pillTabActive : ''}`} onClick={() => setView('list')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><List size={13} /> Directory</span>
                    </button>
                    <button className={`${styles.pillTab} ${view === 'analytics' ? styles.pillTabActive : ''}`} onClick={() => setView('analytics')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={13} /> Analytics</span>
                    </button>
                </div>
            </div>

            {view === 'list' ? (
                <>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-dim)' }} />
                            <input className={styles.searchInput} placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className={styles.formSelect}
                            style={{ width: 'auto', minWidth: '130px' }}
                        >
                            <option value="all">All Roles</option>
                            <option value="agent">Agents</option>
                            <option value="admin">Admins</option>
                            <option value="super_admin">Super Admins</option>
                        </select>
                    </div>

                    {/* Employee Grid */}
                    {loading ? (
                        <div className={styles.emptyState}>Loading...</div>
                    ) : employees.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users2 size={40} style={{ color: 'var(--crm-border-subtle)', marginBottom: '0.75rem' }} />
                            <div>No employees found</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {employees.map(emp => {
                                const role = roleColors[emp.role] || { color: 'var(--crm-text-faint)', label: emp.role }
                                const convRate = emp.leads_assigned > 0 ? Math.round((emp.leads_converted / emp.leads_assigned) * 100) : 0
                                const joinDate = new Date(emp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                return (
                                    <div key={emp.id} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {/* Avatar + Name */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${role.color}40, ${role.color}80)`,
                                                border: `2px solid ${role.color}50`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1rem', fontWeight: 700, color: role.color, flexShrink: 0,
                                            }}>
                                                {emp.full_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--crm-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</div>
                                            </div>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: role.color, backgroundColor: `${role.color}15`, padding: '3px 8px', borderRadius: '999px', flexShrink: 0 }}>
                                                {role.label}
                                            </span>
                                        </div>

                                        {/* Stats */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                            {[
                                                { label: 'Leads', value: emp.leads_assigned },
                                                { label: 'Converted', value: emp.leads_converted, color: '#22c55e' },
                                                { label: 'Rate', value: `${convRate}%`, color: convRate >= 30 ? '#22c55e' : convRate >= 15 ? '#f59e0b' : '#6b7280' },
                                            ].map(s => (
                                                <div key={s.label} style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--crm-elevated)', borderRadius: '0.5rem' }}>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color || 'var(--crm-text-primary)' }}>{s.value}</div>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Reporting Manager */}
                                        <div style={{ borderTop: '1px solid var(--crm-border)', paddingTop: '0.75rem' }}>
                                            <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reporting Manager</div>
                                            <select
                                                value={emp.reporting_manager_id || ''}
                                                onChange={e => handleManagerChange(emp.id, e.target.value)}
                                                disabled={updatingManager === emp.id}
                                                style={{ width: '100%', padding: '0.375rem 0.625rem', background: 'var(--crm-bg)', border: '1px solid var(--crm-border-subtle)', borderRadius: '0.375rem', color: emp.reporting_manager_id ? 'var(--crm-text-secondary)' : 'var(--crm-text-muted)', fontSize: '0.75rem', cursor: 'pointer', opacity: updatingManager === emp.id ? 0.5 : 1 }}
                                            >
                                                <option value="">— No Manager —</option>
                                                {employees
                                                    .filter(m => m.id !== emp.id && ['admin', 'super_admin'].includes(m.role))
                                                    .map(m => <option key={m.id} value={m.id}>{m.full_name} ({roleColors[m.role]?.label || m.role})</option>)
                                                }
                                            </select>
                                        </div>

                                        <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)' }}>Joined {joinDate}</div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            ) : (
                /* Analytics View */
                <>
                    {/* Summary stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Employees', value: employees.length, color: 'var(--crm-accent)' },
                            { label: 'Agents', value: employees.filter(e => e.role === 'agent').length, color: '#3b82f6' },
                            { label: 'Total Leads', value: totalLeads, color: 'var(--crm-text-secondary)' },
                            { label: 'Total Converted', value: totalConverted, color: '#22c55e' },
                            { label: 'Avg Conv Rate', value: `${avgConvRate}%`, color: '#8b5cf6' },
                        ].map(s => (
                            <div key={s.label} className={styles.statCard}>
                                <div className={styles.statLabel}>{s.label}</div>
                                <div className={styles.statValue} style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Performance chart */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Agent Performance</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', display: 'inline-block', borderRadius: '2px' }} /> Assigned</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', display: 'inline-block', borderRadius: '2px' }} /> Converted</span>
                            </div>
                        </div>
                        {performanceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={performanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--crm-text-faint)' }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="assigned" name="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="converted" name="Converted" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.emptyState} style={{ padding: '2rem' }}>Assign leads to agents to see performance</div>
                        )}
                    </div>

                    {/* Rankings table */}
                    {performanceData.length > 0 && (
                        <div className={styles.card} style={{ marginTop: '1rem' }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Conversion Rankings</span>
                                <TrendingUp size={14} style={{ color: 'var(--crm-accent)' }} />
                            </div>
                            <table className={styles.table}>
                                <thead><tr><th>#</th><th>Agent</th><th>Leads</th><th>Converted</th><th>Rate</th></tr></thead>
                                <tbody>
                                    {performanceData.map((e, i) => (
                                        <tr key={e.name}>
                                            <td style={{ color: 'var(--crm-text-dim)', fontWeight: 700 }}>#{i + 1}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--crm-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {e.name.charAt(0)}
                                                    </div>
                                                    {e.name}
                                                </div>
                                            </td>
                                            <td>{e.assigned}</td>
                                            <td style={{ color: '#22c55e' }}>{e.converted}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--crm-elevated)', borderRadius: '2px', maxWidth: '80px' }}>
                                                        <div style={{ height: '100%', width: `${e.rate}%`, backgroundColor: e.rate >= 30 ? '#22c55e' : e.rate >= 15 ? '#f59e0b' : '#ef4444', borderRadius: '2px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Star size={10} style={{ color: 'var(--crm-accent)' }} />
                                                        <span style={{ fontWeight: 600, color: e.rate >= 30 ? '#22c55e' : e.rate >= 15 ? '#f59e0b' : '#ef4444' }}>{e.rate}%</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
