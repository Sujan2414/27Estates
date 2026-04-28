'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCRMUser, isSuperAdmin } from '../../crm-context'
import { Pencil, IndianRupee } from 'lucide-react'
import styles from '../../crm.module.css'

interface Employee {
    id: string
    full_name: string
    role: string
    designation?: string | null
}

interface SalaryRow {
    employee_id: string
    ctc_monthly: number
    pf_deduction: number
    professional_tax: number
    tax_estimate: number
}

const inr = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

const ROLE_LABELS: Record<string, string> = {
    agent: 'Employee', admin: 'Admin', manager: 'Manager',
}

export default function PayrollControlPage() {
    const crmUser = useCRMUser()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [salaries, setSalaries] = useState<Record<string, SalaryRow>>({})
    const [loading, setLoading] = useState(true)
    const [tableExists, setTableExists] = useState(true)

    useEffect(() => {
        if (!crmUser || !isSuperAdmin(crmUser)) return
        const supabase = createClient()

        const load = async () => {
            const { data: emps } = await supabase
                .from('profiles')
                .select('id, full_name, role, designation')
                .neq('role', 'super_admin')
                .order('full_name')

            setEmployees(emps || [])

            if (!emps?.length) { setLoading(false); return }

            const { data: structs, error } = await supabase
                .from('hrm_salary_structures')
                .select('employee_id, ctc_monthly, pf_deduction, professional_tax, tax_estimate, effective_from')
                .in('employee_id', emps.map(e => e.id))
                .order('effective_from', { ascending: false })

            if (error?.code === '42P01') { setTableExists(false); setLoading(false); return }

            // keep latest row per employee
            const map: Record<string, SalaryRow> = {}
            for (const s of (structs || [])) {
                if (!map[s.employee_id]) map[s.employee_id] = s
            }
            setSalaries(map)
            setLoading(false)
        }

        load()
    }, [crmUser])

    if (!crmUser || !isSuperAdmin(crmUser)) {
        return (
            <div className={styles.pageContent}>
                <div className={styles.emptyState}>Access restricted to Super Admins only.</div>
            </div>
        )
    }

    const setCount = employees.filter(e => salaries[e.id]).length
    const totalNet = employees.reduce((sum, e) => {
        const s = salaries[e.id]
        if (!s) return sum
        return sum + s.ctc_monthly - s.pf_deduction - s.professional_tax - s.tax_estimate
    }, 0)

    return (
        <div className={styles.pageContent}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                    Payroll Control
                </h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>
                    Salary structures · {employees.length} employees · {setCount} configured
                </p>
            </div>

            {/* Summary chips */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Employees', value: employees.length, color: 'var(--crm-accent)' },
                    { label: 'Salary Configured', value: setCount, color: '#16a34a' },
                    { label: 'Pending Setup', value: employees.length - setCount, color: '#f59e0b' },
                    { label: 'Monthly Net Payout', value: inr(totalNet), color: '#16a34a' },
                ].map(c => (
                    <div key={c.label} className={styles.statCard} style={{ flex: '1 1 160px', minWidth: 0 }}>
                        <div className={styles.statLabel}>{c.label}</div>
                        <div className={styles.statValue} style={{ color: c.color, fontSize: '1.1rem' }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {!tableExists && (
                <div style={{
                    padding: '0.875rem 1rem', marginBottom: '1rem',
                    backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40',
                    borderRadius: '0.625rem', fontSize: '0.8125rem', color: '#f59e0b',
                }}>
                    Salary structures table not found. Run the HRMS migration in Supabase to enable this feature.
                </div>
            )}

            {loading ? (
                <div className={styles.emptyState}>Loading…</div>
            ) : (
                <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                {['Employee', 'Role', 'Monthly CTC', 'PF + Tax', 'Net Take-home', 'Status', ''].map(h => (
                                    <th key={h} style={{
                                        textAlign: 'left', padding: '0.75rem 1rem',
                                        fontSize: '0.6875rem', fontWeight: 700,
                                        color: 'var(--crm-text-faint)', textTransform: 'uppercase',
                                        letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const s = salaries[emp.id]
                                const deductions = s ? s.pf_deduction + s.professional_tax + s.tax_estimate : 0
                                const netPay = s ? s.ctc_monthly - deductions : 0
                                return (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>
                                                {emp.full_name}
                                            </div>
                                            {emp.designation && (
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: 1 }}>
                                                    {emp.designation}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>
                                            {ROLE_LABELS[emp.role] || emp.role}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>
                                            {s ? inr(s.ctc_monthly) : <span style={{ color: 'var(--crm-text-faint)' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#ef4444' }}>
                                            {s ? inr(deductions) : <span style={{ color: 'var(--crm-text-faint)' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 700, color: '#16a34a' }}>
                                            {s ? inr(netPay) : <span style={{ color: 'var(--crm-text-faint)', fontWeight: 400 }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{
                                                fontSize: '0.6875rem', fontWeight: 700,
                                                padding: '2px 8px', borderRadius: '999px',
                                                color: s ? '#16a34a' : '#f59e0b',
                                                backgroundColor: s ? '#16a34a18' : '#f59e0b18',
                                            }}>
                                                {s ? 'Configured' : 'Not set'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                            <Link
                                                href={`/hrms/employees/${emp.id}/payroll`}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-accent)',
                                                    padding: '0.375rem 0.75rem', borderRadius: '0.375rem',
                                                    border: '1px solid var(--crm-border-subtle)',
                                                    textDecoration: 'none', backgroundColor: 'var(--crm-elevated)',
                                                }}
                                            >
                                                <Pencil size={12} /> {s ? 'Edit' : 'Set Salary'}
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>
                                        No employees found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>
                <IndianRupee size={11} style={{ verticalAlign: -1 }} />{' '}
                Click "Edit" or "Set Salary" to open the full salary structure editor for each employee.
                Auto-calculation from attendance will be applied monthly.
            </p>
        </div>
    )
}
