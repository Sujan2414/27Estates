'use client'

/**
 * Salary Structure editor — super-admin only.
 *
 * Workflow:
 *   1. Admin types Monthly CTC → clicks "Auto-distribute" (or it auto-fires
 *      on first input) → component amounts are computed using the Indian
 *      default split: basic 40% of CTC; HRA 50% of basic (metro); statutory
 *      conveyance ₹1,600 + medical ₹1,250; LTA 5% of CTC; special_allowance
 *      = residual so the sum always equals CTC. PF auto-fills as 12% of
 *      basic capped at ₹1,800.
 *   2. Admin can edit any AMOUNT or % field — the row's pair recomputes the
 *      other side, and the residual (special_allowance) re-balances so
 *      sum(earnings) = CTC stays true. Sum-check banner shows green ✓ when
 *      it matches and amber ⚠ with the delta when the admin has overridden
 *      special_allowance directly.
 *   3. Save → upserts hrm_salary_structures with effective_from = today.
 *      Old rows preserved so historical payslips stay locked in.
 *
 * RLS in the migration restricts INSERT/UPDATE/DELETE to super_admin only,
 * but we also gate the page client-side so admins/managers/agents see a
 * clear "no access" message instead of a silent fetch failure.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, RotateCcw, Wand2, AlertTriangle, CheckCircle2, History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../../../hrms.module.css'

/* ──────────────────────────────────────────────────────────────── */
/*  Types                                                           */
/* ──────────────────────────────────────────────────────────────── */

interface Employee {
  id: string
  full_name: string | null
  email: string | null
  role: string
  designation?: string | null
}

interface SalaryStructure {
  id?: string
  employee_id: string
  effective_from: string  // YYYY-MM-DD
  ctc_monthly: number
  // Earnings
  basic: number
  hra: number
  special_allowance: number
  travel_allowance: number     // LTA
  medical_allowance: number
  conveyance: number
  bonus: number
  // Deductions
  pf_deduction: number
  professional_tax: number
  tax_estimate: number
  notes?: string | null
}

/* ──────────────────────────────────────────────────────────────── */
/*  Indian payroll defaults (per product spec)                       */
/* ──────────────────────────────────────────────────────────────── */

const STATUTORY_CONVEYANCE = 1600   // ₹1,600/month statutory exempt
const STATUTORY_MEDICAL    = 1250   // ₹1,250/month (₹15K/yr) statutory exempt
const PF_RATE              = 0.12   // 12% of basic
const PF_CAP               = 1800   // capped at ₹1,800/month

/**
 * Compute the default Indian breakdown given a monthly CTC.
 * 40% basic + 50% of basic HRA (metro) + statutory + 5% LTA + residual special.
 */
function autoDistribute(ctc: number): Omit<SalaryStructure, 'id' | 'employee_id' | 'effective_from' | 'notes'> {
  const safeCtc = Math.max(0, Math.round(ctc))
  const basic = Math.round(safeCtc * 0.40)
  const hra = Math.round(basic * 0.50)
  const conveyance = Math.min(STATUTORY_CONVEYANCE, safeCtc)
  const medical = Math.min(STATUTORY_MEDICAL, Math.max(0, safeCtc - basic - hra - conveyance))
  const lta = Math.round(safeCtc * 0.05)
  // Residual = whatever's left after all other earnings → keeps sum == CTC
  const fixed = basic + hra + conveyance + medical + lta
  const special_allowance = Math.max(0, safeCtc - fixed)
  // PF: 12% of basic capped at ₹1,800. Default; admin can override.
  const pf = Math.min(Math.round(basic * PF_RATE), PF_CAP)
  return {
    ctc_monthly: safeCtc,
    basic,
    hra,
    special_allowance,
    travel_allowance: lta,
    medical_allowance: medical,
    conveyance,
    bonus: 0,
    pf_deduction: pf,
    professional_tax: 0,
    tax_estimate: 0,
  }
}

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(Math.round(n || 0))

/* ──────────────────────────────────────────────────────────────── */
/*  Page                                                            */
/* ──────────────────────────────────────────────────────────────── */

export default function EmployeePayrollPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = String(params?.id ?? '')
  const supabase = useMemo(() => createClient(), [])

  const [employee, setEmployee]   = useState<Employee | null>(null)
  const [currentRole, setRole]    = useState<string>('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [structure, setStructure] = useState<SalaryStructure | null>(null)
  const [history, setHistory]     = useState<SalaryStructure[]>([])
  const [savedAt, setSavedAt]     = useState<string | null>(null)

  /* ── Initial load ─────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Current user's role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: me } = await supabase.from('profiles')
          .select('role').eq('id', user.id).maybeSingle()
        setRole(me?.role || '')
      }

      // 2. Employee being viewed
      const { data: emp } = await supabase.from('profiles')
        .select('id, full_name, email, role, designation')
        .eq('id', employeeId).maybeSingle()
      if (emp) setEmployee(emp as Employee)

      // 3. Salary structure history (newest first)
      const { data: rows } = await supabase
        .from('hrm_salary_structures')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_from', { ascending: false })
      const list = (rows || []) as SalaryStructure[]
      setHistory(list)

      // 4. Default editor state — show latest active row, or a blank canvas
      if (list[0]) {
        setStructure({ ...list[0] })
      } else {
        setStructure({
          employee_id: employeeId,
          effective_from: new Date().toISOString().slice(0, 10),
          ctc_monthly: 0,
          basic: 0, hra: 0, special_allowance: 0, travel_allowance: 0,
          medical_allowance: 0, conveyance: 0, bonus: 0,
          pf_deduction: 0, professional_tax: 0, tax_estimate: 0,
          notes: '',
        })
      }
    } catch (e) {
      console.warn('load payroll error', e)
    }
    setLoading(false)
  }, [employeeId, supabase])

  useEffect(() => { if (employeeId) load() }, [employeeId, load])

  /* ── Derived values ───────────────────────────────────────────── */
  const totalEarnings = useMemo(() => {
    if (!structure) return 0
    return (
      structure.basic + structure.hra + structure.special_allowance +
      structure.travel_allowance + structure.medical_allowance +
      structure.conveyance + structure.bonus
    )
  }, [structure])

  const totalDeductions = useMemo(() => {
    if (!structure) return 0
    return structure.pf_deduction + structure.professional_tax + structure.tax_estimate
  }, [structure])

  const netSalary = totalEarnings - totalDeductions
  const ctcMatchDelta = structure ? totalEarnings - structure.ctc_monthly : 0
  const ctcMatches = structure ? Math.abs(ctcMatchDelta) < 1 : false

  const canEdit = currentRole === 'super_admin'

  /* ── Field handlers ───────────────────────────────────────────── */

  // Set CTC and (if admin clicks "Auto-distribute") rebuild the breakdown.
  const onCtcChange = (v: number) => {
    if (!structure) return
    setStructure(s => s ? { ...s, ctc_monthly: v } : s)
  }

  const onAutoDistribute = () => {
    if (!structure || !structure.ctc_monthly) return
    const d = autoDistribute(structure.ctc_monthly)
    setStructure(s => s ? { ...s, ...d } : s)
  }

  // Editing an earning AMOUNT field. We re-balance special_allowance so that
  // sum(earnings) == ctc_monthly stays true automatically — except when the
  // user is editing special_allowance itself, in which case we leave the
  // total alone (and the sum-check banner will warn if it's now off).
  const onEarningChange = (key: keyof SalaryStructure, v: number) => {
    if (!structure) return
    const next = { ...structure, [key]: v }
    if (key !== 'special_allowance' && key !== 'ctc_monthly') {
      // Keep PF in sync if basic changed (admin can override afterwards)
      if (key === 'basic') {
        next.pf_deduction = Math.min(Math.round(v * PF_RATE), PF_CAP)
      }
      // Auto-rebalance special so sum still equals CTC
      const fixed = next.basic + next.hra + next.travel_allowance +
                    next.medical_allowance + next.conveyance + next.bonus
      next.special_allowance = Math.max(0, next.ctc_monthly - fixed)
    }
    setStructure(next)
  }

  // Editing a percentage of CTC — convert to amount, then run the same flow
  const onPctChange = (key: keyof SalaryStructure, pct: number) => {
    if (!structure || !structure.ctc_monthly) return
    const amount = Math.round(structure.ctc_monthly * pct / 100)
    onEarningChange(key, amount)
  }

  const onDeductionChange = (key: keyof SalaryStructure, v: number) => {
    if (!structure) return
    setStructure(s => s ? { ...s, [key]: v } : s)
  }

  /* ── Save ─────────────────────────────────────────────────────── */
  const onSave = async () => {
    if (!structure || !canEdit) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        employee_id: employeeId,
        effective_from: structure.effective_from,
        ctc_monthly: structure.ctc_monthly,
        basic: structure.basic,
        hra: structure.hra,
        special_allowance: structure.special_allowance,
        travel_allowance: structure.travel_allowance,
        medical_allowance: structure.medical_allowance,
        conveyance: structure.conveyance,
        bonus: structure.bonus,
        pf_deduction: structure.pf_deduction,
        professional_tax: structure.professional_tax,
        tax_estimate: structure.tax_estimate,
        notes: structure.notes || null,
        created_by: user?.id ?? null,
      }
      // Upsert on (employee_id, effective_from) — saving twice on the same
      // day overwrites instead of duplicating. Schema enforces this UNIQUE.
      const { error } = await supabase
        .from('hrm_salary_structures')
        .upsert(payload, { onConflict: 'employee_id,effective_from' })
      if (error) throw error
      setSavedAt(new Date().toLocaleTimeString())
      await load()  // refresh history
    } catch (e: any) {
      alert('Could not save: ' + (e?.message ?? 'unknown error'))
    }
    setSaving(false)
  }

  /* ── Render guards ────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className={styles.content} style={{ padding: '2rem' }}>
        <div className={styles.loader} style={{ minHeight: 200 }}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className={styles.content} style={{ padding: '2rem' }}>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Employee not found</div>
        </div>
      </div>
    )
  }

  if (!canEdit && currentRole !== 'super_admin') {
    return (
      <div className={styles.content} style={{ padding: '2rem' }}>
        <div className={styles.empty}>
          <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <div className={styles.emptyTitle}>Access Restricted</div>
          <div className={styles.emptyText}>
            Salary structures are visible only to Super Admins.
          </div>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────────── */
  /*  Render                                                          */
  /* ──────────────────────────────────────────────────────────────── */

  return (
    <div className={styles.content} style={{ padding: '1.5rem 2rem 4rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => router.back()} className={styles.btnIcon} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--h-text-1)' }}>
            Salary Structure
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--h-text-3)', marginTop: 2 }}>
            {employee.full_name} <span style={{ color: 'var(--h-text-4)' }}>· {employee.email}</span>
          </div>
        </div>
        {savedAt && (
          <span style={{ fontSize: '0.75rem', color: 'var(--h-green)' }}>
            ✓ Saved {savedAt}
          </span>
        )}
      </div>

      {/* CTC Input + Auto-distribute */}
      <div className={styles.card} style={{ marginBottom: '1rem' }}>
        <div className={styles.cardTitle}>Monthly CTC</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--h-text-3)', fontWeight: 600 }}>₹</span>
            <input
              type="number"
              className={styles.input}
              style={{ paddingLeft: '2rem', fontSize: '1.1rem', fontWeight: 600 }}
              value={structure?.ctc_monthly || ''}
              onChange={e => onCtcChange(Number(e.target.value) || 0)}
              placeholder="50,000"
              min={0}
            />
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onAutoDistribute} disabled={!structure?.ctc_monthly}>
            <Wand2 size={14} /> Auto-distribute
          </button>
          <button
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => structure && setStructure({ ...structure, ...autoDistribute(structure.ctc_monthly) })}
            title="Reset to defaults"
            disabled={!structure?.ctc_monthly}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--h-text-4)' }}>
          Default split: 40% Basic · 50% of Basic HRA · ₹1,600 Conveyance · ₹1,250 Medical · 5% LTA · residual to Special Allowance · 12% of Basic PF (capped ₹1,800)
        </div>
      </div>

      {/* Sum-check banner */}
      <div
        className={styles.card}
        style={{
          marginBottom: '1rem',
          background: ctcMatches ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
          borderLeft: `3px solid ${ctcMatches ? 'var(--h-green)' : 'var(--h-yellow)'}`,
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}
      >
        {ctcMatches
          ? <CheckCircle2 size={16} color="var(--h-green)" />
          : <AlertTriangle size={16} color="var(--h-yellow)" />
        }
        <div style={{ fontSize: '0.85rem', color: 'var(--h-text-2)' }}>
          {ctcMatches
            ? <>Earnings sum matches CTC: <strong>{inr(totalEarnings)}</strong></>
            : <>Earnings sum is <strong>{inr(totalEarnings)}</strong> — {ctcMatchDelta > 0 ? 'over' : 'under'} CTC by <strong>{inr(Math.abs(ctcMatchDelta))}</strong>. Adjust special allowance or other components to balance.</>
          }
        </div>
      </div>

      {/* Earnings */}
      <SectionTitle>Earnings</SectionTitle>
      <div className={styles.card} style={{ marginBottom: '1rem' }}>
        <EarningRow label="Basic Salary"        amount={structure?.basic || 0}              onAmount={v => onEarningChange('basic', v)}             onPct={p => onPctChange('basic', p)}             ctc={structure?.ctc_monthly || 0} editable={canEdit} hint="40% of CTC by default" />
        <EarningRow label="HRA"                 amount={structure?.hra || 0}                onAmount={v => onEarningChange('hra', v)}               onPct={p => onPctChange('hra', p)}               ctc={structure?.ctc_monthly || 0} editable={canEdit} hint="Typically 50% of Basic in metros" />
        <EarningRow label="Conveyance"          amount={structure?.conveyance || 0}         onAmount={v => onEarningChange('conveyance', v)}        onPct={p => onPctChange('conveyance', p)}        ctc={structure?.ctc_monthly || 0} editable={canEdit} hint="₹1,600 fixed (statutory exempt)" />
        <EarningRow label="Medical Allowance"   amount={structure?.medical_allowance || 0}  onAmount={v => onEarningChange('medical_allowance', v)} onPct={p => onPctChange('medical_allowance', p)} ctc={structure?.ctc_monthly || 0} editable={canEdit} hint="₹1,250 fixed (statutory exempt)" />
        <EarningRow label="LTA / Travel"        amount={structure?.travel_allowance || 0}   onAmount={v => onEarningChange('travel_allowance', v)}  onPct={p => onPctChange('travel_allowance', p)}  ctc={structure?.ctc_monthly || 0} editable={canEdit} hint="Tax-exempt with travel proofs" />
        <EarningRow label="Special Allowance"   amount={structure?.special_allowance || 0}  onAmount={v => onEarningChange('special_allowance', v)} onPct={p => onPctChange('special_allowance', p)} ctc={structure?.ctc_monthly || 0} editable={canEdit} hint="Auto-balances to make total = CTC" highlight />
        <EarningRow label="Bonus"               amount={structure?.bonus || 0}              onAmount={v => onEarningChange('bonus', v)}             onPct={p => onPctChange('bonus', p)}             ctc={structure?.ctc_monthly || 0} editable={canEdit} hint="Ad-hoc / performance" />

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.25rem 0.25rem', borderTop: '1px solid var(--h-border)', marginTop: '0.5rem' }}>
          <strong style={{ color: 'var(--h-text-1)' }}>Gross</strong>
          <strong style={{ color: 'var(--h-text-1)' }}>{inr(totalEarnings)}</strong>
        </div>
      </div>

      {/* Deductions */}
      <SectionTitle>Deductions</SectionTitle>
      <div className={styles.card} style={{ marginBottom: '1rem' }}>
        <DeductionRow label="PF (12% of Basic, capped ₹1,800)" amount={structure?.pf_deduction || 0}     onAmount={v => onDeductionChange('pf_deduction', v)}     editable={canEdit} />
        <DeductionRow label="Professional Tax (state-specific)" amount={structure?.professional_tax || 0} onAmount={v => onDeductionChange('professional_tax', v)} editable={canEdit} />
        <DeductionRow label="Income Tax / TDS estimate"          amount={structure?.tax_estimate || 0}     onAmount={v => onDeductionChange('tax_estimate', v)}     editable={canEdit} />

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.25rem 0.25rem', borderTop: '1px solid var(--h-border)', marginTop: '0.5rem' }}>
          <strong style={{ color: 'var(--h-text-1)' }}>Total Deductions</strong>
          <strong style={{ color: 'var(--h-red)' }}>− {inr(totalDeductions)}</strong>
        </div>
      </div>

      {/* Net + notes + save */}
      <div className={styles.card} style={{ marginBottom: '1rem', background: 'var(--h-accent-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--h-text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Take-home</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--h-accent)' }}>{inr(netSalary)}</div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--h-text-4)' }}>per month</div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: '1rem' }}>
        <label className={styles.label}>Notes (optional)</label>
        <textarea
          className={styles.textarea}
          value={structure?.notes || ''}
          onChange={e => structure && setStructure({ ...structure, notes: e.target.value })}
          placeholder="e.g. Hike effective April 2026 — sales-incentive override applied separately"
          rows={2}
          disabled={!canEdit}
        />
        <label className={styles.label} style={{ marginTop: '0.75rem' }}>Effective From</label>
        <input
          type="date"
          className={styles.input}
          value={structure?.effective_from || ''}
          onChange={e => structure && setStructure({ ...structure, effective_from: e.target.value })}
          disabled={!canEdit}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => router.back()}>
          Cancel
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onSave}
          disabled={saving || !canEdit || !structure?.ctc_monthly}
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save Salary Structure'}
        </button>
      </div>

      {/* Revision history */}
      {history.length > 0 && (
        <>
          <SectionTitle>
            <History size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            Revision History
          </SectionTitle>
          <div className={styles.card}>
            {history.map(h => (
              <div
                key={h.id}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '0.6rem 0', borderBottom: '1px solid var(--h-border)',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: 'var(--h-text-2)' }}>
                  Effective <strong>{h.effective_from}</strong>
                  {h.notes ? <span style={{ color: 'var(--h-text-4)' }}> · {h.notes}</span> : null}
                </span>
                <span style={{ color: 'var(--h-text-1)', fontWeight: 600 }}>{inr(h.ctc_monthly)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────── */
/*  Sub-components                                                  */
/* ──────────────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: 0.8, color: 'var(--h-text-3)', margin: '1.25rem 0.25rem 0.5rem',
    }}>
      {children}
    </div>
  )
}

interface EarningRowProps {
  label: string
  amount: number
  onAmount: (v: number) => void
  onPct: (p: number) => void
  ctc: number
  editable: boolean
  hint?: string
  highlight?: boolean
}

function EarningRow({ label, amount, onAmount, onPct, ctc, editable, hint, highlight }: EarningRowProps) {
  const pct = ctc > 0 ? (amount / ctc) * 100 : 0
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 130px 90px',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.55rem 0',
        borderBottom: '1px solid var(--h-border)',
      }}
    >
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: highlight ? 'var(--h-accent)' : 'var(--h-text-1)' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.7rem', color: 'var(--h-text-4)', marginTop: 1 }}>{hint}</div>}
        {ctc > 0 && (
          <div style={{ height: 4, background: 'var(--h-elevated)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, pct)}%`,
              height: '100%',
              background: highlight ? 'var(--h-gold)' : 'var(--h-accent)',
            }} />
          </div>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--h-text-4)', fontSize: '0.8rem' }}>₹</span>
        <input
          type="number"
          className={styles.input}
          style={{ paddingLeft: '1.6rem', fontSize: '0.85rem', textAlign: 'right' }}
          value={amount || ''}
          onChange={e => onAmount(Number(e.target.value) || 0)}
          disabled={!editable}
          min={0}
        />
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          className={styles.input}
          style={{ paddingRight: '1.6rem', fontSize: '0.85rem', textAlign: 'right' }}
          value={Number.isFinite(pct) ? Number(pct.toFixed(1)) : 0}
          onChange={e => onPct(Number(e.target.value) || 0)}
          disabled={!editable || ctc === 0}
          step={0.1}
          min={0}
        />
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--h-text-4)', fontSize: '0.8rem' }}>%</span>
      </div>
    </div>
  )
}

interface DeductionRowProps {
  label: string
  amount: number
  onAmount: (v: number) => void
  editable: boolean
}

function DeductionRow({ label, amount, onAmount, editable }: DeductionRowProps) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 130px',
      gap: '0.75rem', alignItems: 'center',
      padding: '0.55rem 0', borderBottom: '1px solid var(--h-border)',
    }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--h-text-1)' }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--h-text-4)', fontSize: '0.8rem' }}>₹</span>
        <input
          type="number"
          className={styles.input}
          style={{ paddingLeft: '1.6rem', fontSize: '0.85rem', textAlign: 'right' }}
          value={amount || ''}
          onChange={e => onAmount(Number(e.target.value) || 0)}
          disabled={!editable}
          min={0}
        />
      </div>
    </div>
  )
}
