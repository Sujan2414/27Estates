'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, ChevronLeft, ChevronRight, Plus, Check, X,
    Download, Users, DollarSign, Clock, FileText,
} from 'lucide-react'
import { useCRMUser, isSuperAdmin } from '../../crm-context'
import styles from '../../crm.module.css'
import { format, addMonths, subMonths } from 'date-fns'

interface Employee { id: string; full_name: string; role: string }
interface PayrollRecord {
    id: string; employee_id: string; employee_name: string; designation: string
    month: string; basic_salary: number; hra: number; conveyance: number
    special_allowance: number; travel_allowance: number; medical_allowance: number
    bonus: number; gross_salary: number; pf_deduction: number; tax: number
    professional_tax: number; lop_deduction: number; deductions: number
    total_deductions: number; net_salary: number
    total_working_days: number; days_present: number; paid_leaves: number; unpaid_leaves: number
    status: string; notes?: string
}

const EMPTY_FORM = {
    basic_salary: '', hra: '', conveyance: '', special_allowance: '', travel_allowance: '',
    medical_allowance: '', bonus: '', pf_deduction: '', tax: '', professional_tax: '',
    lop_deduction: '', deductions: '', total_working_days: '', days_present: '',
    paid_leaves: '', unpaid_leaves: '', notes: '',
}

const n = (v: string) => Number(v) || 0
const fmt = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: '#FEF3C710', color: '#D97706', label: 'Pending' },
    approved: { bg: '#ECFDF510', color: '#16A34A', label: 'Approved' },
    rejected: { bg: '#FEF2F210', color: '#DC2626', label: 'Rejected' },
}

export default function PayrollControlPage() {
    const crmUser = useCRMUser()
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [employees, setEmployees] = useState<Employee[]>([])
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modalEmp, setModalEmp] = useState<Employee | null>(null)
    const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
    const [editId, setEditId] = useState<string | null>(null)
    const [editStatus, setEditStatus] = useState<string>('pending')
    const [toast, setToast] = useState('')

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

    const load = useCallback(async () => {
        setLoading(true)
        const res = await fetch(`/api/crm/hrm/payroll?month=${month}`)
        if (res.ok) {
            const d = await res.json()
            setEmployees(d.employees || [])
            setPayrolls(d.payrolls || [])
        }
        setLoading(false)
    }, [month])

    useEffect(() => { load() }, [load])

    if (!isSuperAdmin(crmUser)) {
        return (
            <div className={styles.pageContent}>
                <div className={styles.emptyState}>Super admin access required to manage payroll.</div>
            </div>
        )
    }

    const openModal = (emp: Employee) => {
        const existing = payrolls.find(p => p.employee_id === emp.id)
        if (existing) {
            setForm({
                basic_salary: String(existing.basic_salary || ''),
                hra: String(existing.hra || ''),
                conveyance: String(existing.conveyance || ''),
                special_allowance: String(existing.special_allowance || ''),
                travel_allowance: String(existing.travel_allowance || ''),
                medical_allowance: String(existing.medical_allowance || ''),
                bonus: String(existing.bonus || ''),
                pf_deduction: String(existing.pf_deduction || ''),
                tax: String(existing.tax || ''),
                professional_tax: String(existing.professional_tax || ''),
                lop_deduction: String(existing.lop_deduction || ''),
                deductions: String(existing.deductions || ''),
                total_working_days: String(existing.total_working_days || ''),
                days_present: String(existing.days_present || ''),
                paid_leaves: String(existing.paid_leaves || ''),
                unpaid_leaves: String(existing.unpaid_leaves || ''),
                notes: existing.notes || '',
            })
            setEditId(existing.id)
            setEditStatus(existing.status)
        } else {
            setForm(EMPTY_FORM)
            setEditId(null)
            setEditStatus('pending')
        }
        setModalEmp(emp)
    }

    const gross = n(form.basic_salary) + n(form.hra) + n(form.conveyance) +
        n(form.special_allowance) + n(form.travel_allowance) + n(form.medical_allowance) + n(form.bonus)
    const totalDed = n(form.pf_deduction) + n(form.tax) + n(form.professional_tax) +
        n(form.lop_deduction) + n(form.deductions)
    const net = gross - totalDed

    const handleSave = async () => {
        if (!modalEmp) return
        setSaving(true)
        const body = {
            id: editId,
            employee_id: modalEmp.id,
            employee_name: modalEmp.full_name,
            designation: modalEmp.role,
            month,
            ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? 0 : v])),
        }
        const res = await fetch('/api/crm/hrm/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        setSaving(false)
        if (res.ok) { showToast('Saved'); setModalEmp(null); load() }
        else { const d = await res.json(); showToast(d.error || 'Save failed') }
    }

    const handleApproveReject = async (id: string, status: 'approved' | 'rejected') => {
        const res = await fetch('/api/crm/hrm/payroll', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, approved_by: crmUser?.id }),
        })
        if (res.ok) { showToast(status === 'approved' ? 'Approved' : 'Rejected'); load() }
    }

    const pendingCount = payrolls.filter(p => p.status === 'pending').length
    const approvedCount = payrolls.filter(p => p.status === 'approved').length
    const totalPayout = payrolls.filter(p => p.status === 'approved').reduce((s, p) => s + p.net_salary, 0)

    const navigateMonth = (dir: -1 | 1) => {
        const d = new Date(month + '-01')
        setMonth(format(dir === 1 ? addMonths(d, 1) : subMonths(d, 1), 'yyyy-MM'))
    }

    const fmtMonth = (m: string) => {
        try { return format(new Date(m + '-01'), 'MMMM yyyy') } catch { return m }
    }

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Link href="/crm/hrm" style={{ display: 'flex', alignItems: 'center', color: 'var(--crm-text-faint)', textDecoration: 'none' }}>
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--crm-text-primary)', margin: 0 }}>Payroll Control</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)', margin: 0 }}>Create and approve employee payroll · super admin only</p>
                </div>
            </div>

            {/* Month Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button onClick={() => navigateMonth(-1)} style={btnIconStyle}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--crm-text-primary)', minWidth: '10rem', textAlign: 'center' }}>
                    {fmtMonth(month)}
                </span>
                <button onClick={() => navigateMonth(1)} style={btnIconStyle}>
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Summary chips */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <SummaryChip icon={<Users size={14} />} label="Employees" value={employees.length} color="#6366F1" />
                <SummaryChip icon={<Clock size={14} />} label="Pending" value={pendingCount} color="#D97706" />
                <SummaryChip icon={<Check size={14} />} label="Approved" value={approvedCount} color="#16A34A" />
                <SummaryChip icon={<DollarSign size={14} />} label="Total Payout" value={fmt(totalPayout)} color="#183C38" />
            </div>

            {/* Employee list */}
            {loading ? (
                <div className={styles.emptyState}>Loading payroll data…</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {employees.map(emp => {
                        const pr = payrolls.find(p => p.employee_id === emp.id)
                        const pill = STATUS_PILL[pr?.status || 'none']
                        const initials = emp.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                        return (
                            <div key={emp.id} className={styles.card} style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#183C38', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{initials}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{emp.full_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', textTransform: 'capitalize' }}>{emp.role.replace('_', ' ')}</div>
                                </div>
                                {pr ? (
                                    <>
                                        <div style={{ textAlign: 'right', marginRight: '0.75rem' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{fmt(pr.net_salary)}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-faint)' }}>net salary</div>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100, backgroundColor: pill?.bg, color: pill?.color, border: `1px solid ${pill?.color}30` }}>
                                            {pill?.label || pr.status}
                                        </span>
                                        {pr.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '0.375rem', marginLeft: '0.25rem' }}>
                                                <button onClick={() => handleApproveReject(pr.id, 'approved')} style={{ ...actionBtnStyle, borderColor: '#16A34A', color: '#16A34A' }} title="Approve">
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => handleApproveReject(pr.id, 'rejected')} style={{ ...actionBtnStyle, borderColor: '#DC2626', color: '#DC2626' }} title="Reject">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        <button onClick={() => openModal(emp)} style={{ ...actionBtnStyle, marginLeft: '0.25rem' }} title="Edit">
                                            <FileText size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => openModal(emp)} className={styles.btnPrimary} style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', gap: '0.375rem', display: 'flex', alignItems: 'center' }}>
                                        <Plus size={13} /> Add
                                    </button>
                                )}
                            </div>
                        )
                    })}
                    {employees.length === 0 && (
                        <div className={styles.emptyState}>No employees found.</div>
                    )}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1a1a1a', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                    {toast}
                </div>
            )}

            {/* Payroll Modal */}
            {modalEmp && (
                <div className={styles.modal} onClick={() => setModalEmp(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{modalEmp.full_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-faint)', textTransform: 'capitalize' }}>{modalEmp.role.replace('_', ' ')} · {fmtMonth(month)}</div>
                            </div>
                            <button onClick={() => setModalEmp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--crm-text-faint)', padding: 4 }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Attendance */}
                        <SectionLabel>Attendance</SectionLabel>
                        <div style={gridStyle}>
                            <Field label="Working Days" value={form.total_working_days} onChange={v => setForm(f => ({ ...f, total_working_days: v }))} />
                            <Field label="Days Present"  value={form.days_present}       onChange={v => setForm(f => ({ ...f, days_present: v }))} />
                            <Field label="Paid Leaves"   value={form.paid_leaves}         onChange={v => setForm(f => ({ ...f, paid_leaves: v }))} />
                            <Field label="Unpaid (LOP)"  value={form.unpaid_leaves}       onChange={v => setForm(f => ({ ...f, unpaid_leaves: v }))} />
                        </div>

                        {/* Earnings */}
                        <SectionLabel>Earnings</SectionLabel>
                        <div style={gridStyle}>
                            <Field label="Basic Salary"       value={form.basic_salary}       onChange={v => setForm(f => ({ ...f, basic_salary: v }))} />
                            <Field label="HRA"                value={form.hra}                 onChange={v => setForm(f => ({ ...f, hra: v }))} />
                            <Field label="Conveyance"         value={form.conveyance}          onChange={v => setForm(f => ({ ...f, conveyance: v }))} />
                            <Field label="Special Allowance"  value={form.special_allowance}   onChange={v => setForm(f => ({ ...f, special_allowance: v }))} />
                            <Field label="Travel Allowance"   value={form.travel_allowance}    onChange={v => setForm(f => ({ ...f, travel_allowance: v }))} />
                            <Field label="Medical Allowance"  value={form.medical_allowance}   onChange={v => setForm(f => ({ ...f, medical_allowance: v }))} />
                            <Field label="Bonus"              value={form.bonus}               onChange={v => setForm(f => ({ ...f, bonus: v }))} />
                        </div>
                        <CalcRow label="Gross Salary" value={gross} highlight />

                        {/* Deductions */}
                        <SectionLabel>Deductions</SectionLabel>
                        <div style={gridStyle}>
                            <Field label="Provident Fund (PF)" value={form.pf_deduction}       onChange={v => setForm(f => ({ ...f, pf_deduction: v }))} />
                            <Field label="Income Tax (TDS)"    value={form.tax}                 onChange={v => setForm(f => ({ ...f, tax: v }))} />
                            <Field label="Professional Tax"    value={form.professional_tax}    onChange={v => setForm(f => ({ ...f, professional_tax: v }))} />
                            <Field label="LOP Deduction"       value={form.lop_deduction}       onChange={v => setForm(f => ({ ...f, lop_deduction: v }))} />
                            <Field label="Other Deductions"    value={form.deductions}          onChange={v => setForm(f => ({ ...f, deductions: v }))} />
                        </div>
                        <CalcRow label="Total Deductions" value={totalDed} />

                        {/* Net */}
                        <div style={{ backgroundColor: '#183C38', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Net Salary (Take Home)</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{fmt(net)}</span>
                        </div>

                        {/* Notes */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Notes (optional)</label>
                            <input
                                className={styles.formInput}
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="e.g. includes annual bonus"
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                            <button onClick={() => setModalEmp(null)} className={styles.btnSecondary} style={{ flex: 1 }}>Cancel</button>
                            <button onClick={handleSave} className={styles.btnPrimary} style={{ flex: 2 }} disabled={saving}>
                                {saving ? 'Saving…' : editId ? 'Update Payroll' : 'Create Payroll'}
                            </button>
                        </div>
                        {editId && editStatus === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.625rem' }}>
                                <button
                                    onClick={() => { handleApproveReject(editId, 'rejected'); setModalEmp(null) }}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1.5px solid #DC2626', color: '#DC2626', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem' }}
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => { handleApproveReject(editId, 'approved'); setModalEmp(null) }}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', backgroundColor: '#16A34A', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem' }}
                                >
                                    Approve
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── Sub-components ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1rem 0 0.5rem' }}>{children}</div>
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className={styles.formGroup} style={{ margin: 0 }}>
            <label className={styles.formLabel} style={{ marginBottom: 3 }}>{label}</label>
            <input
                type="number"
                min="0"
                className={styles.formInput}
                style={{ padding: '0.4rem 0.625rem' }}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="0"
            />
        </div>
    )
}

function CalcRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: highlight ? '#183C3812' : '#F3F4F6', borderRadius: 8, marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: highlight ? '#183C38' : 'var(--crm-text-secondary)' }}>{label}</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: highlight ? '#183C38' : 'var(--crm-text-primary)' }}>{fmt(value)}</span>
        </div>
    )
}

function SummaryChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border-subtle)', borderRadius: 10 }}>
            <span style={{ color }}>{icon}</span>
            <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{value}</div>
            </div>
        </div>
    )
}

const gridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem',
}
const btnIconStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8, border: '1px solid var(--crm-border-subtle)',
    backgroundColor: 'var(--crm-surface)', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'var(--crm-text-secondary)',
}
const actionBtnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 6, border: '1.5px solid var(--crm-border-subtle)',
    backgroundColor: 'transparent', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'var(--crm-text-faint)',
}
