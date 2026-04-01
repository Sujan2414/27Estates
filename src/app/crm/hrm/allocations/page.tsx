'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCRMUser, isSuperAdmin, getCurrentFY, getFYOptions } from '../../crm-context'
import { Shield, Save, RefreshCw, ChevronDown } from 'lucide-react'

const LEAVE_TYPES = ['casual', 'sick', 'annual', 'maternity', 'paternity'] as const
type LeaveType = typeof LEAVE_TYPES[number]

const LEAVE_LABELS: Record<LeaveType, string> = {
    casual: 'Casual',
    sick: 'Sick',
    annual: 'Annual',
    maternity: 'Maternity',
    paternity: 'Paternity',
}

const DEFAULT_QUOTAS: Record<LeaveType, number> = {
    casual: 12,
    sick: 10,
    annual: 15,
    maternity: 90,
    paternity: 5,
}

interface Employee {
    id: string
    full_name: string
    role: string
}

interface AllocationRow {
    employee_id: string
    leave_type: LeaveType
    allocated_days: number
    used_days: number
    balance_days: number
    notes?: string
}

interface AllocationGrid {
    employee: Employee
    allocations: Record<LeaveType, { allocated: number; used: number; balance: number }>
    dirty: boolean
}

export default function LeaveAllocationsPage() {
    const crmUser = useCRMUser()
    const [fy, setFy] = useState(getCurrentFY())
    const fyOptions = getFYOptions()

    const [employees, setEmployees] = useState<Employee[]>([])
    const [grid, setGrid] = useState<AllocationGrid[]>([])
    const [saving, setSaving] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [editingEmployee, setEditingEmployee] = useState<string | null>(null)

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const buildDefaultRow = (emp: Employee): AllocationGrid => ({
        employee: emp,
        dirty: false,
        allocations: Object.fromEntries(
            LEAVE_TYPES.map((lt) => [lt, { allocated: DEFAULT_QUOTAS[lt], used: 0, balance: DEFAULT_QUOTAS[lt] }])
        ) as Record<LeaveType, { allocated: number; used: number; balance: number }>,
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [empRes, allocRes] = await Promise.all([
                fetch('/api/crm/hrm/employees'),
                fetch(`/api/crm/hrm/allocations?financial_year=${fy}&include_balance=true`),
            ])
            const empData = await empRes.json()
            const allocData = await allocRes.json()

            const emps: Employee[] = empData.employees || []
            setEmployees(emps)

            // Build allocation map from server data
            const serverMap: Record<string, Record<LeaveType, AllocationRow>> = {}
            for (const row of (allocData.allocations || []) as AllocationRow[]) {
                if (!serverMap[row.employee_id]) serverMap[row.employee_id] = {} as Record<LeaveType, AllocationRow>
                serverMap[row.employee_id][row.leave_type as LeaveType] = row
            }

            // Build grid
            const newGrid: AllocationGrid[] = emps.map((emp) => {
                const empAllocs = serverMap[emp.id] || {}
                return {
                    employee: emp,
                    dirty: false,
                    allocations: Object.fromEntries(
                        LEAVE_TYPES.map((lt) => {
                            const row = empAllocs[lt]
                            return [
                                lt,
                                {
                                    allocated: row ? row.allocated_days : DEFAULT_QUOTAS[lt],
                                    used: row ? row.used_days : 0,
                                    balance: row ? row.balance_days : DEFAULT_QUOTAS[lt],
                                },
                            ]
                        })
                    ) as Record<LeaveType, { allocated: number; used: number; balance: number }>,
                }
            })
            setGrid(newGrid)
        } catch {
            showToast('Failed to load data', false)
        } finally {
            setLoading(false)
        }
    }, [fy])

    useEffect(() => { fetchData() }, [fetchData])

    const handleChange = (empId: string, lt: LeaveType, value: number) => {
        setGrid((prev) =>
            prev.map((row) => {
                if (row.employee.id !== empId) return row
                const newAlloc = { ...row.allocations }
                newAlloc[lt] = {
                    ...newAlloc[lt],
                    allocated: value,
                    balance: value - newAlloc[lt].used,
                }
                return { ...row, allocations: newAlloc, dirty: true }
            })
        )
    }

    const applyDefaults = (empId: string) => {
        setGrid((prev) =>
            prev.map((row) => {
                if (row.employee.id !== empId) return row
                const newAlloc = { ...row.allocations }
                for (const lt of LEAVE_TYPES) {
                    newAlloc[lt] = {
                        ...newAlloc[lt],
                        allocated: DEFAULT_QUOTAS[lt],
                        balance: DEFAULT_QUOTAS[lt] - newAlloc[lt].used,
                    }
                }
                return { ...row, allocations: newAlloc, dirty: true }
            })
        )
    }

    const saveRow = async (empId: string) => {
        const row = grid.find((r) => r.employee.id === empId)
        if (!row) return
        setSaving(empId)
        try {
            const allocations = LEAVE_TYPES.map((lt) => ({
                employee_id: empId,
                leave_type: lt,
                allocated_days: row.allocations[lt].allocated,
            }))
            const res = await fetch('/api/crm/hrm/allocations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    financial_year: fy,
                    allocated_by: crmUser?.id,
                    allocations,
                }),
            })
            if (!res.ok) throw new Error('Save failed')
            setGrid((prev) => prev.map((r) => (r.employee.id === empId ? { ...r, dirty: false } : r)))
            showToast(`Saved allocations for ${row.employee.full_name}`)
        } catch {
            showToast('Failed to save', false)
        } finally {
            setSaving(null)
        }
    }

    const saveAll = async () => {
        const dirtyRows = grid.filter((r) => r.dirty)
        if (dirtyRows.length === 0) { showToast('Nothing to save'); return }
        setSaving('__all__')
        try {
            const allAllocations = dirtyRows.flatMap((row) =>
                LEAVE_TYPES.map((lt) => ({
                    employee_id: row.employee.id,
                    leave_type: lt,
                    allocated_days: row.allocations[lt].allocated,
                }))
            )
            const res = await fetch('/api/crm/hrm/allocations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    financial_year: fy,
                    allocated_by: crmUser?.id,
                    allocations: allAllocations,
                }),
            })
            if (!res.ok) throw new Error('Save failed')
            setGrid((prev) => prev.map((r) => ({ ...r, dirty: false })))
            showToast(`Saved ${dirtyRows.length} employees`)
        } catch {
            showToast('Failed to save', false)
        } finally {
            setSaving(null)
        }
    }

    // Access guard
    if (!isSuperAdmin(crmUser)) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Shield size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--crm-text-faint)', fontSize: '1rem' }}>Only Super Admins can manage leave allocations.</p>
            </div>
        )
    }

    return (
        <div style={{ padding: '1.5rem 2rem', maxWidth: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Leave Allocations</h1>
                    <p style={{ color: 'var(--crm-text-faint)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Set annual leave quotas per employee · Financial Year {fy}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* FY picker */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={fy}
                            onChange={(e) => setFy(e.target.value)}
                            style={{ appearance: 'none', paddingRight: '2rem', padding: '0.5rem 2rem 0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white', cursor: 'pointer', color: '#374151', fontWeight: 500 }}
                        >
                            {fyOptions.map((f) => (
                                <option key={f} value={f}>FY {f}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--crm-text-faint)' }} />
                    </div>
                    <button
                        onClick={fetchData}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'white', fontSize: '0.875rem', cursor: 'pointer', color: '#374151' }}
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                    <button
                        onClick={saveAll}
                        disabled={saving === '__all__' || !grid.some((r) => r.dirty)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#183C38', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: saving === '__all__' || !grid.some((r) => r.dirty) ? 0.5 : 1 }}
                    >
                        <Save size={14} />
                        {saving === '__all__' ? 'Saving…' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#dcfce7', borderRadius: 2, marginRight: 4 }} />Balance &gt; 0</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fef9c3', borderRadius: 2, marginRight: 4 }} />Low balance</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fee2e2', borderRadius: 2, marginRight: 4 }} />Over-used</span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--crm-text-muted)' }}>Loading…</div>
            ) : employees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--crm-text-muted)' }}>No employees found</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: 'white', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Employee</th>
                                {LEAVE_TYPES.map((lt) => (
                                    <th key={lt} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#374151', minWidth: 90 }}>
                                        {LEAVE_LABELS[lt]}
                                        <div style={{ fontSize: '0.625rem', color: 'var(--crm-text-muted)', fontWeight: 400 }}>Balance / Used</div>
                                    </th>
                                ))}
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grid.map((row, idx) => (
                                <tr
                                    key={row.employee.id}
                                    style={{
                                        borderBottom: idx < grid.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        background: row.dirty ? '#fffbeb' : 'white',
                                    }}
                                >
                                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                        <div style={{ fontWeight: 600, color: '#111827' }}>{row.employee.full_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', textTransform: 'capitalize' }}>{row.employee.role.replace('_', ' ')}</div>
                                    </td>
                                    {LEAVE_TYPES.map((lt) => {
                                        const a = row.allocations[lt]
                                        const balColor = a.balance < 0 ? '#fee2e2' : a.balance <= 2 ? '#fef9c3' : '#dcfce7'
                                        return (
                                            <td key={lt} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'center' }}>
                                                    <span style={{ background: balColor, borderRadius: '0.375rem', padding: '0.25rem 0.625rem', fontSize: '0.875rem', fontWeight: 700, color: a.balance < 0 ? '#dc2626' : '#374151', minWidth: 32, display: 'inline-block', textAlign: 'center' }}>
                                                        {a.balance}
                                                    </span>
                                                    <span style={{ color: 'var(--crm-text-muted)', fontSize: '0.75rem' }}>/ {a.used} used</span>
                                                </div>
                                            </td>
                                        )
                                    })}
                                    <td style={{ padding: '0.5rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => {
                                                    const row2 = grid.find(r => r.employee.id === row.employee.id)
                                                    if (!row2) return
                                                    // Toggle edit mode — show allocation input
                                                    setEditingEmployee(prev => prev === row.employee.id ? null : row.employee.id)
                                                }}
                                                style={{ padding: '0.375rem 0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: editingEmployee === row.employee.id ? '#f3f4f6' : 'white', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => saveRow(row.employee.id)}
                                                disabled={!row.dirty || saving === row.employee.id}
                                                style={{ padding: '0.375rem 0.75rem', border: 'none', borderRadius: '0.375rem', background: row.dirty ? '#183C38' : '#e5e7eb', color: row.dirty ? 'white' : '#9ca3af', cursor: row.dirty ? 'pointer' : 'default', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                <Save size={12} />
                                                {saving === row.employee.id ? 'Saving…' : 'Save'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Inline edit row — appears below the selected employee */}
                            {editingEmployee && (() => {
                                const row = grid.find(r => r.employee.id === editingEmployee)
                                if (!row) return null
                                return (
                                    <tr style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                                        <td style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                                            Set allocation for {row.employee.full_name}
                                        </td>
                                        {LEAVE_TYPES.map((lt) => {
                                            const a = row.allocations[lt]
                                            return (
                                                <td key={lt} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={365}
                                                        value={a.allocated}
                                                        onChange={(e) => handleChange(row.employee.id, lt, parseInt(e.target.value) || 0)}
                                                        style={{ width: 56, textAlign: 'center', padding: '0.3rem', border: '1.5px solid #22c55e', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, background: '#f0fdf4' }}
                                                    />
                                                </td>
                                            )
                                        })}
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => applyDefaults(row.employee.id)}
                                                title="Apply default quotas"
                                                style={{ padding: '0.375rem 0.625rem', border: '1px solid #bbf7d0', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontSize: '0.7rem', color: '#166534' }}
                                            >
                                                Reset Defaults
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })()}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Defaults info */}
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0', fontSize: '0.8125rem', color: '#166534' }}>
                <strong>Default quotas:</strong>{' '}
                {LEAVE_TYPES.map((lt) => `${LEAVE_LABELS[lt]}: ${DEFAULT_QUOTAS[lt]} days`).join(' · ')}
            </div>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.75rem 1.25rem', background: toast.ok ? '#183C38' : '#dc2626', color: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '0.875rem', fontWeight: 500, zIndex: 9999 }}>
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
