'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Mail, RefreshCw, CheckCircle, ChevronRight, Users } from 'lucide-react'

interface TriggerDef {
    id: string; name: string; description: string; icon: string; emailCategory: string; color: string
}

interface TriggerLead {
    lead_id: string; name: string; email: string | null; phone: string | null
    priority: string; status: string; score: number; meta: string
}

interface NurtureData {
    triggers: TriggerDef[]
    results: Record<string, TriggerLead[]>
}

const PRIORITY: Record<string, { bg: string; color: string }> = {
    hot:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
    warm: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    cold: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
}

export default function NurturePage() {
    const [data, setData] = useState<NurtureData | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState<string | null>(null)
    const [sent, setSent] = useState<Set<string>>(new Set())
    const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/crm/nurture-triggers')
            if (res.ok) {
                const d = await res.json()
                setData(d)
                if (d.triggers.length > 0) setSelectedTrigger(d.triggers[0].id)
            }
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const sendEmail = async (triggerId: string, leadId: string) => {
        const key = `${triggerId}-${leadId}`
        setSending(key)
        try {
            const res = await fetch('/api/crm/nurture-triggers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger_id: triggerId, lead_id: leadId }),
            })
            if (res.ok) setSent(prev => new Set(prev).add(key))
        } finally { setSending(null) }
    }

    const totalQueued = data ? Object.values(data.results).reduce((s, arr) => s + arr.length, 0) : 0
    const activeTrigger = data?.triggers.find(t => t.id === selectedTrigger)
    const activeLeads = selectedTrigger && data ? (data.results[selectedTrigger] || []) : []

    const thS: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', color: 'var(--crm-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} style={{ color: '#f59e0b' }} /> Nurture Triggers
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--crm-text-muted)' }}>
                        Smart rules that surface leads needing outreach — send emails in one click
                    </p>
                </div>
                <button
                    onClick={load}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-surface)', cursor: 'pointer', color: 'var(--crm-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                >
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--crm-text-muted)' }}>
                    <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ fontSize: '0.875rem' }}>Evaluating nurture triggers…</div>
                </div>
            ) : !data ? null : (
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', alignItems: 'start' }}>

                    {/* Trigger sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {data.triggers.map(t => {
                            const count = (data.results[t.id] || []).length
                            const isActive = selectedTrigger === t.id
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTrigger(t.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '11px 13px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                                        border: isActive ? `1px solid ${t.color}60` : '1px solid var(--crm-border)',
                                        backgroundColor: isActive ? `${t.color}12` : 'var(--crm-surface)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{t.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isActive ? t.color : 'var(--crm-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {t.name}
                                        </div>
                                    </div>
                                    {count > 0 && (
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', backgroundColor: t.color, color: '#fff', flexShrink: 0 }}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}

                        {/* Total queued */}
                        <div style={{ marginTop: '4px', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--crm-accent-bg)', border: '1px solid var(--crm-accent)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)', marginBottom: '6px', fontWeight: 500 }}>Total queued</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={14} style={{ color: 'var(--crm-accent)' }} />
                                <span style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--crm-accent)' }}>{totalQueued}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>leads need outreach</span>
                            </div>
                        </div>
                    </div>

                    {/* Lead list */}
                    <div>
                        {activeTrigger && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', marginBottom: '1rem', backgroundColor: `${activeTrigger.color}10`, border: `1px solid ${activeTrigger.color}40`, borderRadius: '10px' }}>
                                <span style={{ fontSize: '1.25rem' }}>{activeTrigger.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--crm-text-primary)', fontSize: '0.9375rem' }}>{activeTrigger.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--crm-text-muted)' }}>{activeTrigger.description}</div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: activeTrigger.color, flexShrink: 0 }}>
                                    {activeLeads.length} matched
                                </span>
                            </div>
                        )}

                        {activeLeads.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--crm-text-muted)', backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px' }}>
                                <CheckCircle size={28} style={{ margin: '0 auto 0.75rem', color: '#22c55e' }} />
                                <div style={{ fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '4px' }}>All clear!</div>
                                <div style={{ fontSize: '0.85rem' }}>No leads match this trigger right now.</div>
                            </div>
                        ) : (
                            <div style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)' }}>
                                            {['Lead', 'Contact', 'Priority', 'Score', 'Trigger Reason', 'Action'].map(h => (
                                                <th key={h} style={thS}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeLeads.map((l, i) => {
                                            const emailKey = `${selectedTrigger}-${l.lead_id}`
                                            const isSent = sent.has(emailKey)
                                            const isSending = sending === emailKey
                                            const ps = PRIORITY[l.priority] || { bg: 'var(--crm-elevated)', color: 'var(--crm-text-muted)' }
                                            return (
                                                <tr
                                                    key={l.lead_id}
                                                    style={{ borderBottom: i < activeLeads.length - 1 ? '1px solid var(--crm-border)' : 'none' }}
                                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                >
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <Link href={`/crm/leads/${l.lead_id}`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--crm-text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            {l.name} <ChevronRight size={11} style={{ color: 'var(--crm-text-muted)' }} />
                                                        </Link>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)' }}>
                                                            {l.email && <div>{l.email}</div>}
                                                            {l.phone && <div>{l.phone}</div>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ps.color, backgroundColor: ps.bg, padding: '2px 9px', borderRadius: '999px' }}>
                                                            {l.priority}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: l.score >= 70 ? '#22c55e' : l.score >= 40 ? '#f59e0b' : 'var(--crm-text-muted)' }}>
                                                            {l.score || '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--crm-text-muted)' }}>{l.meta}</td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        {isSent ? (
                                                            <span style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                                <CheckCircle size={13} /> Sent
                                                            </span>
                                                        ) : l.email ? (
                                                            <button
                                                                onClick={() => sendEmail(selectedTrigger!, l.lead_id)}
                                                                disabled={isSending}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--crm-btn-primary-bg)', backgroundColor: 'var(--crm-btn-primary-bg)', color: 'var(--crm-btn-primary-text)', cursor: isSending ? 'default' : 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: isSending ? 0.6 : 1 }}
                                                            >
                                                                <Mail size={12} /> {isSending ? 'Sending…' : 'Send Email'}
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>No email</span>
                                                        )}
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
            )}
        </div>
    )
}
