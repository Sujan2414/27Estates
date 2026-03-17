'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Shield, AlertCircle } from 'lucide-react'
import styles from '../../crm.module.css'
import { useCRMUser, isSuperAdmin, isAdmin } from '../../crm-context'

interface Regularization {
    id: string
    employee_id: string
    date: string
    reason: string
    actual_hours: number | null
    status: 'pending' | 'approved' | 'rejected'
    admin_notes: string | null
    approved_at: string | null
    created_at: string
    employee?: { id: string; full_name: string; role: string }
    approver?: { id: string; full_name: string } | null
}

const STATUS_CONFIG = {
    pending:  { color: '#f59e0b', label: 'Pending' },
    approved: { color: '#22c55e', label: 'Approved' },
    rejected: { color: '#ef4444', label: 'Rejected' },
}

export default function RegularizationsPage() {
    const crmUser = useCRMUser()
    const isAdminUser = isAdmin(crmUser)
    const isSA = isSuperAdmin(crmUser)

    const [regs, setRegs] = useState<Regularization[]>([])
    const [loading, setLoading] = useState(true)
    const [tableExists, setTableExists] = useState(true)
    const [statusFilter, setStatusFilter] = useState('pending')
    const [processing, setProcessing] = useState<string | null>(null)
    const [notesMap, setNotesMap] = useState<Record<string, string>>({})
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.set('status', statusFilter)
            // Agents only see their own
            if (!isAdminUser && crmUser?.id) params.set('employee_id', crmUser.id)

            const res = await fetch(`/api/crm/hrm/regularizations?${params}`)
            if (res.ok) {
                const d = await res.json()
                setRegs(d.regularizations || [])
                setTableExists(d.tableExists !== false)
            }
        } finally {
            setLoading(false)
        }
    }, [statusFilter, isAdminUser, crmUser?.id])

    useEffect(() => { fetchData() }, [fetchData])

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        if (!isSA) return
        setProcessing(id)
        try {
            const res = await fetch('/api/crm/hrm/regularizations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, approved_by: crmUser?.id, admin_notes: notesMap[id] || null }),
            })
            if (res.ok) {
                showToast(`Regularisation ${status}`)
                await fetchData()
            } else {
                const d = await res.json()
                showToast(d.error || 'Failed', false)
            }
        } finally {
            setProcessing(null)
        }
    }

    const pendingCount = regs.filter(r => r.status === 'pending').length

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

    const formatTs = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
        ' ' + new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    return (
        <div className={styles.pageContent}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm/hrm/attendance" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                            Regularisations
                            {pendingCount > 0 && statusFilter !== 'all' && statusFilter !== 'pending' && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', background: '#f59e0b', color: '#0f1117', borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>
                                    {pendingCount} pending
                                </span>
                            )}
                        </h1>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                            {isAdminUser ? 'Manage employee attendance regularisation requests' : 'Your regularisation requests'}
                        </p>
                    </div>
                </div>
                {!isAdminUser && (
                    <Link href="/crm/hrm/attendance" className={styles.btnSecondary} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
                        Apply via Attendance →
                    </Link>
                )}
            </div>

            {!tableExists && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                    <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                        Run <code style={{ background: '#1e2030', padding: '1px 6px', borderRadius: 4 }}>supabase/hrm-regularizations.sql</code> to enable regularisations.
                    </span>
                </div>
            )}

            {/* Super admin info banner */}
            {isSA && pendingCount > 0 && statusFilter === 'pending' && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: '#d97706', fontWeight: 600 }}>
                        {pendingCount} regularisation{pendingCount !== 1 ? 's' : ''} awaiting your approval
                    </span>
                </div>
            )}

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {['pending', 'approved', 'rejected', 'all'].map(s => {
                    const conf = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] || { color: '#BFA270', label: 'All' }
                    const count = s === 'all' ? regs.length : regs.filter(r => r.status === s).length
                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            style={{
                                padding: '0.5rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer',
                                border: statusFilter === s ? `1px solid ${conf.color}` : '1px solid #1e2030',
                                backgroundColor: statusFilter === s ? `${conf.color}15` : '#161822',
                                color: statusFilter === s ? conf.color : '#6b7280',
                                fontSize: '0.8125rem', fontWeight: statusFilter === s ? 600 : 500,
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, backgroundColor: statusFilter === s ? `${conf.color}25` : '#1e2030', padding: '1px 6px', borderRadius: '999px', color: statusFilter === s ? conf.color : '#4b5563' }}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading...</div>
            ) : regs.length === 0 ? (
                <div className={styles.emptyState}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        {statusFilter === 'pending' ? 'No pending regularisations 🎉' : `No ${statusFilter} requests`}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {regs.map(reg => {
                        const sConf = STATUS_CONFIG[reg.status]
                        const isPending = reg.status === 'pending'
                        return (
                            <div
                                key={reg.id}
                                className={styles.card}
                                style={{
                                    padding: '1.25rem',
                                    borderLeft: `3px solid ${sConf.color}`,
                                    background: isPending ? '#1e203050' : '#161822',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {/* Left */}
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        {/* Employee + date */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            {isAdminUser && reg.employee && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#BFA270', color: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                                        {reg.employee.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#e5e7eb', fontSize: '0.875rem' }}>{reg.employee.full_name}</div>
                                                        <div style={{ fontSize: '0.6875rem', color: '#6b7280', textTransform: 'capitalize' }}>{reg.employee.role.replace('_', ' ')}</div>
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e5e7eb' }}>{formatDate(reg.date)}</span>
                                                {reg.actual_hours != null && (
                                                    <span style={{ fontSize: '0.75rem', color: '#ef4444', background: '#ef444415', padding: '1px 8px', borderRadius: '999px', fontWeight: 600 }}>
                                                        {reg.actual_hours.toFixed(1)}h logged
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 0.5rem', lineHeight: 1.6, maxWidth: 500 }}>
                                            {reg.reason}
                                        </p>

                                        {/* Meta */}
                                        <div style={{ fontSize: '0.6875rem', color: '#4b5563', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span>Submitted {formatTs(reg.created_at)}</span>
                                            {reg.status !== 'pending' && reg.approver && (
                                                <span style={{ color: sConf.color }}>
                                                    {reg.status === 'approved' ? '✓' : '✗'} {reg.status} by {reg.approver.full_name}
                                                    {reg.approved_at ? ` · ${formatTs(reg.approved_at)}` : ''}
                                                </span>
                                            )}
                                            {reg.admin_notes && (
                                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Note: {reg.admin_notes}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: status badge or action buttons */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        {!isPending || !isSA ? (
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: sConf.color, background: `${sConf.color}15`, padding: '4px 12px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                {reg.status === 'approved' && <CheckCircle2 size={14} />}
                                                {reg.status === 'rejected' && <XCircle size={14} />}
                                                {reg.status === 'pending' && <Clock size={14} />}
                                                {sConf.label}
                                            </span>
                                        ) : (
                                            /* Super admin action area */
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 200 }}>
                                                <input
                                                    placeholder="Admin notes (optional)..."
                                                    value={notesMap[reg.id] || ''}
                                                    onChange={e => setNotesMap(m => ({ ...m, [reg.id]: e.target.value }))}
                                                    style={{ padding: '0.375rem 0.625rem', background: '#0f1117', border: '1px solid #2d3148', borderRadius: '0.375rem', color: '#e5e7eb', fontSize: '0.75rem', outline: 'none' }}
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleAction(reg.id, 'approved')}
                                                        disabled={processing === reg.id}
                                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: processing === reg.id ? 0.6 : 1 }}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(reg.id, 'rejected')}
                                                        disabled={processing === reg.id}
                                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: processing === reg.id ? 0.6 : 1 }}
                                                    >
                                                        <XCircle size={14} />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Non-super-admin guard for actions */}
            {isAdminUser && !isSA && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#1e2030', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                    <Shield size={14} />
                    Only Super Admins can approve or reject regularisation requests.
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.75rem 1.25rem', background: toast.ok ? '#183C38' : '#dc2626', color: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '0.875rem', fontWeight: 500, zIndex: 9999 }}>
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
