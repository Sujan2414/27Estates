'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCRMUser, isSuperAdmin } from '../../crm-context'
import { Pencil, X, Wand2, RotateCcw, Save, IndianRupee } from 'lucide-react'
import styles from '../../crm.module.css'

/* ── Constants ─────────────────────────────────────────────────── */
const PF_RATE = 0.12
const PF_CAP  = 1800

function autoDistribute(ctc: number) {
    const c = Math.max(0, Math.round(ctc))
    const basic = Math.round(c * 0.40)
    const hra   = Math.round(basic * 0.50)
    const conv  = Math.min(1600, c)
    const med   = Math.min(1250, Math.max(0, c - basic - hra - conv))
    const lta   = Math.round(c * 0.05)
    const special = Math.max(0, c - basic - hra - conv - med - lta)
    const pf    = Math.min(Math.round(basic * PF_RATE), PF_CAP)
    return { ctc_monthly: c, basic, hra, conveyance: conv, medical_allowance: med, travel_allowance: lta, special_allowance: special, bonus: 0, pf_deduction: pf, professional_tax: 0, tax_estimate: 0 }
}

const inr = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

const ROLE_LABELS: Record<string, string> = { agent: 'Employee', admin: 'Admin', manager: 'Manager' }

/* ── Types ─────────────────────────────────────────────────────── */
interface Employee { id: string; full_name: string; role: string; designation?: string | null }

interface Salary {
    employee_id: string
    ctc_monthly: number; basic: number; hra: number
    special_allowance: number; travel_allowance: number
    medical_allowance: number; conveyance: number; bonus: number
    pf_deduction: number; professional_tax: number; tax_estimate: number
    effective_from?: string; notes?: string
}

/* ── Salary modal ──────────────────────────────────────────────── */
function SalaryModal({ employee, existing, onClose, onSaved }: {
    employee: Employee
    existing: Salary | null
    onClose: () => void
    onSaved: (s: Salary) => void
}) {
    const supabase = useMemo(() => createClient(), [])
    const [form, setForm] = useState<Salary>(() =>
        existing ?? {
            employee_id: employee.id,
            ctc_monthly: 0, basic: 0, hra: 0,
            special_allowance: 0, travel_allowance: 0,
            medical_allowance: 0, conveyance: 0, bonus: 0,
            pf_deduction: 0, professional_tax: 0, tax_estimate: 0,
            effective_from: new Date().toISOString().slice(0, 10), notes: '',
        }
    )
    const [saving, setSaving] = useState(false)
    const [toast, setToast]   = useState('')

    const set = (k: keyof Salary, v: number | string) =>
        setForm(f => ({ ...f, [k]: v }))

    const onCtcBlur = () => {
        if (form.ctc_monthly > 0 && !existing) {
            setForm(f => ({ ...f, ...autoDistribute(f.ctc_monthly) }))
        }
    }

    const onEarningChange = (key: keyof Salary, v: number) => {
        const next: Salary = { ...form, [key]: v }
        if (key === 'basic') next.pf_deduction = Math.min(Math.round(v * PF_RATE), PF_CAP)
        if (key !== 'special_allowance') {
            const fixed = next.basic + next.hra + next.travel_allowance + next.medical_allowance + next.conveyance + next.bonus
            next.special_allowance = Math.max(0, next.ctc_monthly - fixed)
        }
        setForm(next)
    }

    const totalEarnings   = form.basic + form.hra + form.special_allowance + form.travel_allowance + form.medical_allowance + form.conveyance + form.bonus
    const totalDeductions = form.pf_deduction + form.professional_tax + form.tax_estimate
    const netSalary       = totalEarnings - totalDeductions

    const save = async () => {
        if (!form.ctc_monthly) { setToast('Enter a monthly CTC first'); return }
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const payload = {
                employee_id: employee.id,
                effective_from: form.effective_from || new Date().toISOString().slice(0, 10),
                ctc_monthly: form.ctc_monthly,
                basic: form.basic, hra: form.hra,
                special_allowance: form.special_allowance,
                travel_allowance: form.travel_allowance,
                medical_allowance: form.medical_allowance,
                conveyance: form.conveyance, bonus: form.bonus,
                pf_deduction: form.pf_deduction,
                professional_tax: form.professional_tax,
                tax_estimate: form.tax_estimate,
                notes: form.notes || null,
                created_by: user?.id ?? null,
            }
            const { error } = await supabase
                .from('hrm_salary_structures')
                .upsert(payload, { onConflict: 'employee_id,effective_from' })
            if (error) throw error
            onSaved({ ...form, employee_id: employee.id })
        } catch (e: any) {
            setToast('Save failed: ' + (e?.message ?? 'unknown error'))
        }
        setSaving(false)
    }

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--crm-surface)', borderRadius: '0.875rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--crm-border)' }}>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                            {existing ? 'Edit' : 'Set'} Salary — {employee.full_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', marginTop: 2 }}>
                            {ROLE_LABELS[employee.role] || employee.role}
                            {employee.designation ? ` · ${employee.designation}` : ''}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--crm-text-muted)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.25rem' }}>
                    {/* CTC */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                            Monthly CTC
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-muted)', fontSize: '0.875rem' }}>₹</span>
                                <input
                                    type="number" min={0}
                                    style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', border: '1px solid var(--crm-border)', borderRadius: '0.5rem', background: 'var(--crm-elevated)', color: 'var(--crm-text-primary)', fontSize: '1rem', fontWeight: 600, boxSizing: 'border-box' }}
                                    value={form.ctc_monthly || ''}
                                    onChange={e => set('ctc_monthly', Number(e.target.value) || 0)}
                                    onBlur={onCtcBlur}
                                    placeholder="50000"
                                />
                            </div>
                            <button
                                onClick={() => setForm(f => ({ ...f, ...autoDistribute(f.ctc_monthly) }))}
                                disabled={!form.ctc_monthly}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 1rem', border: '1px solid var(--crm-border)', borderRadius: '0.5rem', background: 'var(--crm-elevated)', color: 'var(--crm-accent)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', opacity: form.ctc_monthly ? 1 : 0.4 }}
                            >
                                <Wand2 size={14} /> Auto-fill
                            </button>
                            <button
                                onClick={() => setForm(f => ({ ...f, ...autoDistribute(f.ctc_monthly) }))}
                                title="Reset to defaults"
                                disabled={!form.ctc_monthly}
                                style={{ padding: '0 0.75rem', border: '1px solid var(--crm-border)', borderRadius: '0.5rem', background: 'var(--crm-elevated)', color: 'var(--crm-text-muted)', cursor: 'pointer', opacity: form.ctc_monthly ? 1 : 0.4 }}
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: 4 }}>
                            Tab away or click Auto-fill to distribute components automatically
                        </div>
                    </div>

                    {/* Earnings */}
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Earnings</div>
                    <div style={{ border: '1px solid var(--crm-border)', borderRadius: '0.5rem', marginBottom: '1rem', overflow: 'hidden' }}>
                        {([
                            { key: 'basic',             label: 'Basic Salary',       hint: '40% of CTC' },
                            { key: 'hra',               label: 'HRA',                hint: '50% of Basic' },
                            { key: 'conveyance',        label: 'Conveyance',         hint: '₹1,600 fixed' },
                            { key: 'medical_allowance', label: 'Medical Allowance',  hint: '₹1,250 fixed' },
                            { key: 'travel_allowance',  label: 'LTA / Travel',       hint: '5% of CTC' },
                            { key: 'special_allowance', label: 'Special Allowance',  hint: 'Residual (auto-balances)' },
                            { key: 'bonus',             label: 'Bonus',              hint: 'Ad-hoc / performance' },
                        ] as { key: keyof Salary; label: string; hint: string }[]).map((row, i, arr) => (
                            <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem', padding: '0.625rem 0.875rem', borderBottom: i < arr.length - 1 ? '1px solid var(--crm-border)' : 'none', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{row.label}</div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{row.hint}</div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-muted)', fontSize: '0.75rem' }}>₹</span>
                                    <input
                                        type="number" min={0}
                                        style={{ width: '100%', paddingLeft: '1.5rem', paddingRight: '0.5rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', border: '1px solid var(--crm-border)', borderRadius: '0.375rem', background: 'var(--crm-elevated)', color: 'var(--crm-text-primary)', fontSize: '0.8125rem', textAlign: 'right', boxSizing: 'border-box' }}
                                        value={(form[row.key] as number) || ''}
                                        onChange={e => onEarningChange(row.key, Number(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--crm-elevated)', borderTop: '1px solid var(--crm-border)' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Gross</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{inr(totalEarnings)}</span>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Deductions</div>
                    <div style={{ border: '1px solid var(--crm-border)', borderRadius: '0.5rem', marginBottom: '1rem', overflow: 'hidden' }}>
                        {([
                            { key: 'pf_deduction',    label: 'PF',               hint: '12% of Basic, max ₹1,800' },
                            { key: 'professional_tax', label: 'Professional Tax', hint: 'State-specific (e.g. KA ₹200)' },
                            { key: 'tax_estimate',    label: 'TDS / Income Tax',  hint: 'Estimated monthly TDS' },
                        ] as { key: keyof Salary; label: string; hint: string }[]).map((row, i, arr) => (
                            <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem', padding: '0.625rem 0.875rem', borderBottom: i < arr.length - 1 ? '1px solid var(--crm-border)' : 'none', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{row.label}</div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{row.hint}</div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--crm-text-muted)', fontSize: '0.75rem' }}>₹</span>
                                    <input
                                        type="number" min={0}
                                        style={{ width: '100%', paddingLeft: '1.5rem', paddingRight: '0.5rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', border: '1px solid var(--crm-border)', borderRadius: '0.375rem', background: 'var(--crm-elevated)', color: 'var(--crm-text-primary)', fontSize: '0.8125rem', textAlign: 'right', boxSizing: 'border-box' }}
                                        value={(form[row.key] as number) || ''}
                                        onChange={e => setForm(f => ({ ...f, [row.key]: Number(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--crm-elevated)', borderTop: '1px solid var(--crm-border)' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Total Deductions</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444' }}>− {inr(totalDeductions)}</span>
                        </div>
                    </div>

                    {/* Net */}
                    <div style={{ padding: '0.875rem 1rem', background: '#16a34a18', border: '1px solid #16a34a30', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Take-home / Month</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{inr(netSalary)}</div>
                    </div>

                    {/* Effective from */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.375rem' }}>Effective From</label>
                        <input
                            type="date"
                            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--crm-border)', borderRadius: '0.5rem', background: 'var(--crm-elevated)', color: 'var(--crm-text-primary)', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }}
                            value={form.effective_from || ''}
                            onChange={e => set('effective_from', e.target.value)}
                        />
                    </div>

                    {toast && (
                        <div style={{ padding: '0.625rem 0.875rem', background: '#ef444418', border: '1px solid #ef444440', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#ef4444', marginBottom: '1rem' }}>
                            {toast}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--crm-border)', borderRadius: '0.5rem', background: 'none', color: 'var(--crm-text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            disabled={saving || !form.ctc_monthly}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', border: 'none', borderRadius: '0.5rem', background: '#16a34a', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: (saving || !form.ctc_monthly) ? 0.6 : 1 }}
                        >
                            <Save size={14} /> {saving ? 'Saving…' : 'Save Salary'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function PayrollControlPage() {
    const user = useCRMUser()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [salaries,  setSalaries]  = useState<Record<string, Salary>>({})
    const [loading,   setLoading]   = useState(true)
    const [modal,     setModal]     = useState<Employee | null>(null)
    const [toast,     setToast]     = useState('')
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!user || !isSuperAdmin(user)) return
        const load = async () => {
            const { data: emps } = await supabase
                .from('profiles')
                .select('id, full_name, role, designation')
                .in('role', ['agent', 'admin', 'manager'])
                .order('full_name')
            setEmployees(emps || [])
            if (!emps?.length) { setLoading(false); return }

            const { data: structs } = await supabase
                .from('hrm_salary_structures')
                .select('employee_id, ctc_monthly, basic, hra, special_allowance, travel_allowance, medical_allowance, conveyance, bonus, pf_deduction, professional_tax, tax_estimate, effective_from')
                .in('employee_id', emps.map(e => e.id))
                .order('effective_from', { ascending: false })

            const map: Record<string, Salary> = {}
            for (const s of (structs || [])) {
                if (!map[s.employee_id]) map[s.employee_id] = s
            }
            setSalaries(map)
            setLoading(false)
        }
        load()
    }, [user, supabase])

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

    if (!user || !isSuperAdmin(user)) {
        return <div className={styles.pageContent}><div className={styles.emptyState}>Super Admin access only.</div></div>
    }

    const setCount  = employees.filter(e => salaries[e.id]).length
    const totalNet  = employees.reduce((sum, e) => {
        const s = salaries[e.id]; if (!s) return sum
        return sum + s.ctc_monthly - s.pf_deduction - s.professional_tax - s.tax_estimate
    }, 0)

    return (
        <div className={styles.pageContent}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Payroll Control</h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Salary structures · {employees.length} employees · {setCount} configured</p>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Employees',    value: employees.length,                    color: 'var(--crm-accent)' },
                    { label: 'Salary Configured',  value: setCount,                            color: '#16a34a' },
                    { label: 'Pending Setup',       value: employees.length - setCount,         color: '#f59e0b' },
                    { label: 'Monthly Net Payout',  value: totalNet ? inr(totalNet) : '—',     color: '#16a34a' },
                ].map(c => (
                    <div key={c.label} className={styles.statCard} style={{ flex: '1 1 160px', minWidth: 0 }}>
                        <div className={styles.statLabel}>{c.label}</div>
                        <div className={styles.statValue} style={{ color: c.color, fontSize: '1.1rem' }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading…</div>
            ) : (
                <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                {['Employee', 'Role', 'Monthly CTC', 'PF + Tax', 'Net Take-home', 'Status', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const s    = salaries[emp.id]
                                const ded  = s ? s.pf_deduction + s.professional_tax + s.tax_estimate : 0
                                const net  = s ? s.ctc_monthly - ded : 0
                                return (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--crm-border)' }}>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{emp.full_name}</div>
                                            {emp.designation && <div style={{ fontSize: '0.6875rem', color: 'var(--crm-text-faint)', marginTop: 1 }}>{emp.designation}</div>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>{ROLE_LABELS[emp.role] || emp.role}</td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>
                                            {s ? inr(s.ctc_monthly) : <span style={{ color: 'var(--crm-text-faint)' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#ef4444' }}>
                                            {s ? inr(ded) : <span style={{ color: 'var(--crm-text-faint)' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 700, color: '#16a34a' }}>
                                            {s ? inr(net) : <span style={{ color: 'var(--crm-text-faint)', fontWeight: 400 }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: s ? '#16a34a' : '#f59e0b', backgroundColor: s ? '#16a34a18' : '#f59e0b18' }}>
                                                {s ? 'Configured' : 'Not set'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setModal(emp)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--crm-accent)', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--crm-border-subtle)', cursor: 'pointer', background: 'var(--crm-elevated)' }}
                                            >
                                                <Pencil size={12} /> {s ? 'Edit' : 'Set Salary'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {employees.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--crm-text-faint)', fontSize: '0.875rem' }}>No employees found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--crm-text-faint)' }}>
                <IndianRupee size={11} style={{ verticalAlign: -1 }} />{' '}
                Salary structures are the base for monthly auto-calculation. Click "Set Salary" to configure.
            </p>

            {toast && (
                <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 2000 }}>
                    {toast}
                </div>
            )}

            {modal && (
                <SalaryModal
                    employee={modal}
                    existing={salaries[modal.id] || null}
                    onClose={() => setModal(null)}
                    onSaved={(s) => {
                        setSalaries(prev => ({ ...prev, [modal.id]: s }))
                        setModal(null)
                        showToast(`Salary saved for ${modal.full_name}`)
                    }}
                />
            )}
        </div>
    )
}
