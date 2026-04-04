'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Users, RefreshCw, ChevronDown } from 'lucide-react'
import styles from '../hrms.module.css'

interface Employee {
    id: string; full_name: string; email: string; role: string
    created_at: string; reporting_manager_id?: string | null
    manager?: { id: string; full_name: string } | null
    leads_assigned?: number; leads_converted?: number
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    super_admin: { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed' },
    admin:       { bg: 'rgba(24,60,56,0.12)',   color: '#183C38' },
    manager:     { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
    agent:       { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
}
const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager', agent: 'Employee'
}

export default function AllEmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading]     = useState(true)
    const [search, setSearch]       = useState('')
    const [roleFilter, setRole]     = useState('all')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string>('')

    // Fetch current user's role
    useEffect(() => {
        fetch('/api/admin/me').then(r => r.json()).then(d => {
            if (d.profile?.role) setCurrentUserRole(d.profile.role)
        }).catch(() => {})
    }, [])

    const canEdit = currentUserRole === 'super_admin' || currentUserRole === 'admin'

    // Get managers/admins that someone can report to
    const getManagerOptions = (empId: string) =>
        employees.filter(e => e.id !== empId && ['super_admin', 'admin', 'manager'].includes(e.role))

    const updateReportsTo = async (empId: string, managerId: string | null) => {
        setEditingId(null)
        const res = await fetch('/api/crm/hrm/employees', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: empId, reporting_manager_id: managerId }),
        })
        if (res.ok) load()
    }

    const load = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (roleFilter !== 'all') params.set('role', roleFilter)
        const res = await fetch(`/api/crm/hrm/employees?${params}`)
        if (res.ok) { const d = await res.json(); setEmployees(d.employees || []) }
        setLoading(false)
    }, [search, roleFilter])

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

    const byRole = (r: string) => employees.filter(e => e.role === r).length

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <div className={styles.pageTitle}>All Employees</div>
                    <div className={styles.pageSubtitle}>{employees.length} people across all roles</div>
                </div>
            </div>

            {/* Role breakdown */}
            <div className={styles.statRow} style={{ marginBottom: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))' }}>
                {[
                    { label: 'Super Admin', value: byRole('super_admin'), color: '#7c3aed' },
                    { label: 'Admin',       value: byRole('admin'),       color: '#183C38' },
                    { label: 'Manager',     value: byRole('manager'),     color: '#d97706' },
                    { label: 'Employee',    value: byRole('agent'),       color: '#2563eb' },
                ].map(s => (
                    <div key={s.label} className={styles.statCard} style={{ cursor: 'pointer', borderLeft: `3px solid ${s.color}` }}
                        onClick={() => setRole(s.label === 'Employee' ? 'agent' : s.label.toLowerCase().replace(' ', '_'))}>
                        <div className={styles.statLabel}>{s.label}</div>
                        <div className={styles.statValue} style={{ color: s.color, fontSize: '1.3rem' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Search + filter */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--h-text-4)', pointerEvents: 'none' }} />
                    <input
                        className={styles.input}
                        style={{ paddingLeft: '2.25rem' }}
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ position: 'relative', minWidth: '140px' }}>
                    <select
                        className={styles.select}
                        style={{ appearance: 'none', paddingRight: '2rem', width: '100%' }}
                        value={roleFilter}
                        onChange={e => setRole(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="agent">Employee</option>
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--h-text-3)' }} />
                </div>
                <button className={`${styles.btnIcon}`} onClick={load} title="Refresh">
                    <RefreshCw size={15} />
                </button>
            </div>

            {/* Table */}
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className={styles.loader} style={{ minHeight: '200px' }}><div className={styles.spinner} /></div>
                ) : employees.length === 0 ? (
                    <div className={styles.empty}>
                        <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        <div className={styles.emptyTitle}>No employees found</div>
                        <div className={styles.emptyText}>Try adjusting your search or filter</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {['Employee', 'Role', 'Reports To', 'Joined', 'Leads', 'Conversions'].map(h => (
                                        <th key={h} className={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => {
                                    const rc = ROLE_COLORS[emp.role] || { bg: 'var(--h-elevated)', color: 'var(--h-text-2)' }
                                    return (
                                        <tr key={emp.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className={styles.avatar} style={{ width: 34, height: 34 }}>
                                                        {emp.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--h-text-1)' }}>{emp.full_name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--h-text-4)' }}>{emp.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <span className={styles.pill} style={{ background: rc.bg, color: rc.color, fontSize: '0.72rem' }}>
                                                    {ROLE_LABELS[emp.role] || emp.role}
                                                </span>
                                            </td>
                                            <td className={styles.td} style={{ fontSize: '0.82rem', color: 'var(--h-text-3)' }}>
                                                {editingId === emp.id ? (
                                                    <select
                                                        autoFocus
                                                        defaultValue={emp.reporting_manager_id || ''}
                                                        onChange={e => updateReportsTo(emp.id, e.target.value || null)}
                                                        onBlur={() => setEditingId(null)}
                                                        className={styles.select}
                                                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', minWidth: '140px' }}
                                                    >
                                                        <option value="">None</option>
                                                        {getManagerOptions(emp.id).map(m => (
                                                            <option key={m.id} value={m.id}>{m.full_name} ({ROLE_LABELS[m.role] || m.role})</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span
                                                        onClick={() => canEdit && setEditingId(emp.id)}
                                                        style={{ cursor: canEdit ? 'pointer' : 'default', borderBottom: canEdit ? '1px dashed var(--h-text-4)' : 'none', paddingBottom: '1px' }}
                                                        title={canEdit ? 'Click to change' : undefined}
                                                    >
                                                        {emp.manager ? emp.manager.full_name : <span style={{ color: 'var(--h-text-4)' }}>—</span>}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={styles.td} style={{ fontSize: '0.78rem', color: 'var(--h-text-3)', whiteSpace: 'nowrap' }}>
                                                {new Date(emp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className={styles.td} style={{ textAlign: 'center', fontWeight: 700, color: 'var(--h-text-1)' }}>
                                                {emp.leads_assigned ?? '—'}
                                            </td>
                                            <td className={styles.td} style={{ textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                                                {emp.leads_converted ?? '—'}
                                            </td>
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
