'use client'

import { useState, useEffect } from 'react'
import { Save, Clock, Bell, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react'
import styles from '../hrms.module.css'

interface WorkSettings {
    work_start_time: string
    work_end_time: string
    full_day_hours: number
    half_day_hours: number
    checkin_reminder_time: string
    checkout_reminder_time: string
    reminders_enabled: boolean
    max_regularizations_per_month: number
    max_regularizations_per_year: number
    auto_assign_enabled?: boolean
}

const DEFAULT: WorkSettings = {
    work_start_time: '09:00',
    work_end_time: '18:00',
    full_day_hours: 8,
    half_day_hours: 4,
    checkin_reminder_time: '09:00',
    checkout_reminder_time: '18:00',
    reminders_enabled: true,
    max_regularizations_per_month: 2,
    max_regularizations_per_year: 10,
    auto_assign_enabled: true,
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1.5px solid var(--h-border, #e4e7ec)',
    borderRadius: '0.625rem',
    fontSize: '0.875rem',
    background: 'var(--h-surface, #fff)',
    color: 'var(--h-text-1, #111)',
    outline: 'none',
    boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--h-text-2, #374151)',
    marginBottom: '0.375rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
}

const hintStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--h-text-4, #9ca3af)',
    marginTop: '0.25rem',
    display: 'block',
}

export default function WorkSettingsPage() {
    const [settings, setSettings] = useState<WorkSettings>(DEFAULT)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState<'checkin' | 'checkout' | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    useEffect(() => {
        fetch('/api/crm/hrm/work-settings')
            .then(r => r.json())
            .then(d => {
                if (d.settings) setSettings({ ...DEFAULT, ...d.settings })
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/crm/hrm/work-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            if (res.ok) showToast('Settings saved')
            else showToast('Failed to save', false)
        } catch {
            showToast('Failed to save', false)
        } finally {
            setSaving(false)
        }
    }

    const sendReminder = async (type: 'checkin' | 'checkout') => {
        setSending(type)
        try {
            const res = await fetch('/api/crm/hrm/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            })
            const d = await res.json()
            if (res.ok) showToast(`Sent to ${d.sent} employee${d.sent !== 1 ? 's' : ''}${d.failed ? ` (${d.failed} failed)` : ''}`)
            else showToast(d.error || 'Failed to send', false)
        } catch {
            showToast('Failed to send', false)
        } finally {
            setSending(null)
        }
    }

    if (loading) return <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>

    return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

            {/* Working Hours */}
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--h-text-1)', marginBottom: '1rem' }}>
                    <Clock size={16} style={{ color: 'var(--h-accent, #183C38)' }} /> Working Hours
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Work Start Time</label>
                        <input type="time" style={inputStyle} value={settings.work_start_time}
                            onChange={e => setSettings(s => ({ ...s, work_start_time: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Work End Time</label>
                        <input type="time" style={inputStyle} value={settings.work_end_time}
                            onChange={e => setSettings(s => ({ ...s, work_end_time: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Full Day Hours</label>
                        <input type="number" min={1} max={24} step={0.5} style={inputStyle} value={settings.full_day_hours}
                            onChange={e => setSettings(s => ({ ...s, full_day_hours: parseFloat(e.target.value) || 8 }))} />
                        <span style={hintStyle}>{'>'}= this = <span style={{ color: '#22c55e' }}>green</span></span>
                    </div>
                    <div>
                        <label style={labelStyle}>Half Day Hours</label>
                        <input type="number" min={1} max={24} step={0.5} style={inputStyle} value={settings.half_day_hours}
                            onChange={e => setSettings(s => ({ ...s, half_day_hours: parseFloat(e.target.value) || 4 }))} />
                        <span style={hintStyle}>{'>'}= this = <span style={{ color: '#f59e0b' }}>orange</span> · else <span style={{ color: '#ef4444' }}>red</span></span>
                    </div>
                </div>

                <div style={{ background: 'var(--h-elevated, #f9fafb)', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--h-text-3, #6b7280)', marginTop: '1rem' }}>
                    <strong>Colour coding:</strong>{' '}
                    <span style={{ color: '#22c55e' }}>{'\u25A0'}</span> {'>'}={settings.full_day_hours}h full day{' · '}
                    <span style={{ color: '#f59e0b' }}>{'\u25A0'}</span> {'>'}={settings.half_day_hours}h half day{' · '}
                    <span style={{ color: '#ef4444' }}>{'\u25A0'}</span> {'<'}{settings.half_day_hours}h short day
                </div>
            </div>

            {/* Email Reminders */}
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--h-text-1)' }}>
                        <Bell size={16} style={{ color: 'var(--h-accent, #183C38)' }} /> Email Reminders
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <div
                            onClick={() => setSettings(s => ({ ...s, reminders_enabled: !s.reminders_enabled }))}
                            style={{
                                width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
                                background: settings.reminders_enabled ? '#22c55e' : '#d1d5db', transition: 'background 0.2s',
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: 2, left: settings.reminders_enabled ? 18 : 2,
                                width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: settings.reminders_enabled ? '#22c55e' : '#9ca3af' }}>
                            {settings.reminders_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', opacity: settings.reminders_enabled ? 1 : 0.4, pointerEvents: settings.reminders_enabled ? 'auto' : 'none' }}>
                    <div>
                        <label style={labelStyle}>Check-In Reminder</label>
                        <input type="time" style={inputStyle} value={settings.checkin_reminder_time}
                            onChange={e => setSettings(s => ({ ...s, checkin_reminder_time: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Check-Out Reminder</label>
                        <input type="time" style={inputStyle} value={settings.checkout_reminder_time}
                            onChange={e => setSettings(s => ({ ...s, checkout_reminder_time: e.target.value }))} />
                    </div>
                </div>

                {/* Manual send */}
                <div style={{ borderTop: '1px solid var(--h-border, #e4e7ec)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--h-text-4, #9ca3af)', display: 'flex', alignItems: 'center', gap: '0.375rem', flex: '1 1 100%' }}>
                        <Mail size={13} /> Send reminders manually now:
                    </div>
                    <button onClick={() => sendReminder('checkin')} disabled={!!sending}
                        className={`${styles.btn} ${styles.btnOutline}`}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                        <Send size={13} /> {sending === 'checkin' ? 'Sending...' : 'Send Check-In Reminder'}
                    </button>
                    <button onClick={() => sendReminder('checkout')} disabled={!!sending}
                        className={`${styles.btn} ${styles.btnOutline}`}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                        <Send size={13} /> {sending === 'checkout' ? 'Sending...' : 'Send Check-Out Reminder'}
                    </button>
                </div>
            </div>

            {/* Regularization Quota */}
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--h-text-1)', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>&#x1F504;</span> Regularization Quota
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--h-text-4, #9ca3af)', margin: '0 0 1rem', lineHeight: 1.6 }}>
                    Employees can apply for regularization when they work short hours. Set the maximum allowed per month and year.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Max per Month</label>
                        <input type="number" min={0} max={31} style={inputStyle} value={settings.max_regularizations_per_month}
                            onChange={e => setSettings(s => ({ ...s, max_regularizations_per_month: parseInt(e.target.value) || 0 }))} />
                        <span style={hintStyle}>requests allowed per calendar month</span>
                    </div>
                    <div>
                        <label style={labelStyle}>Max per Year</label>
                        <input type="number" min={0} max={365} style={inputStyle} value={settings.max_regularizations_per_year}
                            onChange={e => setSettings(s => ({ ...s, max_regularizations_per_year: parseInt(e.target.value) || 0 }))} />
                        <span style={hintStyle}>requests allowed per financial year</span>
                    </div>
                </div>
            </div>

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem' }}
            >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Work Settings'}
            </button>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.75rem 1.25rem',
                    background: toast.ok ? '#183C38' : '#dc2626', color: 'white', borderRadius: '0.625rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '0.875rem', fontWeight: 500, zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
