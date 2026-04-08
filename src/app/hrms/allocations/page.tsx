'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Save, RefreshCw, ChevronDown } from 'lucide-react'
import styles from '../hrms.module.css'

interface Employee { id: string; full_name: string; role: string }

interface AllocationRow {
    employee: Employee
    totalAllocated: number
    totalUsed: number
    totalBalance: number
    pendingCount: number
    rejectedCount: number
    dirty: boolean
}

function getCurrentFY(): string {
    const now = new Date()
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    return `${year}-${String(year + 1).slice(-2)}`
}

function getFYOptions(): string[] {
    const now = new Date()
    const base = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    return Array.from({ length: 3 }, (_, i) => {
        const y = base - 1 + i
        return `${y}-${String(y + 1).slice(-2)}`
    })
}

export default function HRMSAllocationsPage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [fy, setFy] = useState(getCurrentFY())
    const fyOptions = getFYOptions()

    const [grid, setGrid] = useState<AllocationRow[]>([])
    const [saving, setSaving] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [editingEmployee, setEditingEmployee] = useState<string | null>(null)

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return
            setUserId(user.id)
            supabase.from('profiles').select('role').eq('id', user.id).single()
                .then(({ data }) => { if (data) setUserRole(data.role) })
        })
    }, [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const startYear = parseInt(fy.split('-')[0])
            const fyStart = `${startYear}-04-01`
            const fyEnd = `${startYear + 1}-03-31`

            const [empRes, allocRes, leavesRes] = await Promise.all([
                fetch('/api/crm/hrm/employees'),
                fetch(`/api/crm/hrm/allocations?financial_year=${fy}&include_balance=true`),
                fetch(`/api/crm/hrm/leaves?fy_start=${fyStart}&fy_end=${fyEnd}&all=true`),
            ])
            const empData = await empRes.json()
            const allocData = await allocRes.json()
            const leavesData = leavesRes.ok ? await leavesRes.json() : { leaves: [] }

            const emps: Employee[] = (empData.employees || []).filter((e: Employee) => e.role !== 'super_admin')
            const allocations = allocData.allocations || []
            const allLeaves = leavesData.leaves || []

            // Sum allocations per employee (all types combined)
            const allocMap: Record<string, { allocated: number; used: number }> = {}
            for (const a of allocations) {
                if (!allocMap[a.employee_id]) allocMap[a.employee_id] = { allocated: 0, used: 0 }
                allocMap[a.employee_id].allocated += a.allocated_days || 0
                allocMap[a.employee_id].used += a.used_days || 0
            }

            // Count pending and rejected leaves per employee
            const pendingMap: Record<string, number> = {}
            const rejectedMap: Record<string, number> = {}
            for (const l of allLeaves) {
                if (l.status === 'pending') pendingMap[l.employee_id] = (pendingMap[l.employee_id] || 0) + 1
                if (l.status === 'rejected') rejectedMap[l.employee_id] = (rejectedMap[l.employee_id] || 0) + 1
            }

            const newGrid: AllocationRow[] = emps.map(emp => {
                const a = allocMap[emp.id] || { allocated: 0, used: 0 }
                return {
                    employee: emp,
                    totalAllocated: a.allocated,
                    totalUsed: a.used,
                    totalBalance: a.allocated - a.used,
                    pendingCount: pendingMap[emp.id] || 0,
                    rejectedCount: rejectedMap[emp.id] || 0,
                    dirty: false,
                }
            })
            setGrid(newGrid)
        } catch {
            showToast('Failed to load data', false)
        } finally {
            setLoading(false)
        }
    }, [fy])

    useEffect(() => { if (userRole === 'super_admin') fetchData() }, [fetchData, userRole])

    const handleChange = (empId: string, value: number) => {
        setGrid(prev => prev.map(row => {
            if (row.employee.id !== empId) return row
            return { ...row, totalAllocated: value, totalBalance: value - row.totalUsed, dirty: true }
        }))
    }

    const saveRow = async (empId: string) => {
        const row = grid.find(r => r.employee.id === empId)
        if (!row) return
        setSaving(empId)
        try {
            // Save as a single "general" allocation — all leaves under one type
            const allocations = [{
                employee_id: empId, leave_type: 'general', allocated_days: row.totalAllocated,
            }]
            const res = await fetch('/api/crm/hrm/allocations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ financial_year: fy, allocated_by: userId, allocations }),
            })
            if (!res.ok) throw new Error('Save failed')
            setGrid(prev => prev.map(r => r.employee.id === empId ? { ...r, dirty: false } : r))
            showToast(`Saved allocation for ${row.employee.full_name}`)
        } catch {
            showToast('Failed to save', false)
        } finally {
            setSaving(null)
        }
    }

    const saveAll = async () => {
        const dirtyRows = grid.filter(r => r.dirty)
        if (dirtyRows.length === 0) { showToast('Nothing to save'); return }
        setSaving('__all__')
        try {
            const allAllocations = dirtyRows.map(row => ({
                employee_id: row.employee.id, leave_type: 'general', allocated_days: row.totalAllocated,
            }))
            const res = await fetch('/api/crm/hrm/allocations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ financial_year: fy, allocated_by: userId, allocations: allAllocations }),
            })
            if (!res.ok) throw new Error('Save failed')
            setGrid(prev => prev.map(r => ({ ...r, dirty: false })))
            showToast(`Saved ${dirtyRows.length} employees`)
        } catch {
            showToast('Failed to save', false)
        } finally {
            setSaving(null)
        }
    }

    if (userRole !== null && userRole !== 'super_admin') {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Shield size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--h-text-4)', fontSize: '1rem' }}>Only Super Admins can manage leave allocations.</p>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--h-text-1)', margin: 0 }}>Leave Allocations</h2>
                    <p style={{ color: 'var(--h-text-4)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        Set total leave days per employee · Financial Year {fy}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <select value={fy} onChange={e => setFy(e.target.value)}
                            style={{ appearance: 'none', padding: '0.5rem 2rem 0.5rem 0.75rem', border: '1px solid var(--h-border)', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'var(--h-card)', cursor: 'pointer', color: 'var(--h-text-1)', fontWeight: 500 }}>
                            {fyOptions.map(f => <option key={f} value={f}>FY {f}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--h-text-4)' }} />
                    </div>
                    <button onClick={fetchData}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', border: '1px solid var(--h-border)', borderRadius: '0.5rem', background: 'var(--h-card)', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--h-text-2)' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={saveAll} disabled={saving === '__all__' || !grid.some(r => r.dirty)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#183C38', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: saving === '__all__' || !grid.some(r => r.dirty) ? 0.5 : 1 }}>
                        <Save size={14} /> {saving === '__all__' ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--h-text-3)' }}>Loading...</div>
            ) : grid.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--h-text-3)' }}>No employees found</div>
            ) : (
                <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--h-border)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--h-text-2)', whiteSpace: 'nowrap' }}>Employee</th>
                                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--h-text-2)', minWidth: 90 }}>
                                        Allocated
                                        <div style={{ fontSize: '0.625rem', color: 'var(--h-text-4)', fontWeight: 400 }}>Total days</div>
                                    </th>
                                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--h-text-2)', minWidth: 70 }}>
                                        Used
                                    </th>
                                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--h-text-2)', minWidth: 70 }}>
                                        Balance
                                    </th>
                                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#d97706', minWidth: 70 }}>
                                        Pending
                                    </th>
                                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#dc2626', minWidth: 70 }}>
                                        Rejected
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--h-text-2)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grid.map((row, idx) => {
                                    const isEditing = editingEmployee === row.employee.id
                                    const balColor = row.totalBalance < 0 ? 'rgba(239,68,68,0.15)' : row.totalBalance <= 2 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)'
                                    const balText = row.totalBalance < 0 ? '#ef4444' : row.totalBalance <= 2 ? '#f59e0b' : '#22c55e'
                                    return (
                                        <tr key={row.employee.id} style={{ borderBottom: idx < grid.length - 1 ? '1px solid var(--h-border)' : 'none', background: row.dirty ? 'rgba(245,158,11,0.06)' : undefined }}>
                                            <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--h-text-1)' }}>{row.employee.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--h-text-4)', textTransform: 'capitalize' }}>{row.employee.role.replace('_', ' ')}</div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                {isEditing ? (
                                                    <input type="number" min={0} max={365} value={row.totalAllocated}
                                                        onChange={e => handleChange(row.employee.id, parseInt(e.target.value) || 0)}
                                                        style={{ width: 64, textAlign: 'center', padding: '0.3rem', border: '1.5px solid #22c55e', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, background: '#f0fdf4' }} />
                                                ) : (
                                                    <span style={{ background: '#e0f2fe', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: '#0369a1' }}>
                                                        {row.totalAllocated}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--h-text-2)' }}>
                                                {row.totalUsed}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                <span style={{ background: balColor, borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: balText }}>
                                                    {row.totalBalance}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: row.pendingCount > 0 ? '#d97706' : 'var(--h-text-4)' }}>
                                                {row.pendingCount}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: row.rejectedCount > 0 ? '#dc2626' : 'var(--h-text-4)' }}>
                                                {row.rejectedCount}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button onClick={() => setEditingEmployee(prev => prev === row.employee.id ? null : row.employee.id)}
                                                        style={{ padding: '0.375rem 0.625rem', border: '1px solid var(--h-border)', borderRadius: '0.375rem', background: isEditing ? 'var(--h-hover)' : 'var(--h-card)', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--h-text-3)' }}>
                                                        {isEditing ? 'Done' : 'Edit'}
                                                    </button>
                                                    <button onClick={() => saveRow(row.employee.id)} disabled={!row.dirty || saving === row.employee.id}
                                                        style={{ padding: '0.375rem 0.75rem', border: 'none', borderRadius: '0.375rem', background: row.dirty ? '#183C38' : 'var(--h-border)', color: row.dirty ? 'white' : 'var(--h-text-4)', cursor: row.dirty ? 'pointer' : 'default', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Save size={12} /> {saving === row.employee.id ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.75rem 1.25rem', background: toast.ok ? '#183C38' : '#dc2626', color: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '0.875rem', fontWeight: 500, zIndex: 9999 }}>
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
