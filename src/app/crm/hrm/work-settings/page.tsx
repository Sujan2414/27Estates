'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Shield, Clock, Bell, Mail, Send, CheckCircle } from 'lucide-react'
import { useCRMUser, isSuperAdmin } from '../../crm-context'
import styles from '../../crm.module.css'

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
}

export default function WorkSettingsPage() {
    const crmUser = useCRMUser()
    const [settings, setSettings] = useState<WorkSettings>(DEFAULT)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState<'checkin' | 'checkout' | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [tableExists, setTableExists] = useState(true)

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    useEffect(() => {
        fetch('/api/crm/hrm/work-settings')
            .then(r => r.json())
            .then(d => {
                if (d.settings) setSettings({ ...DEFAULT, ...d.settings })
                setTableExists(d.tableExists !== false)
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
                body: JSON.stringify({ ...settings, updated_by: crmUser?.id }),
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
            if (res.ok) showToast(`✓ Sent to ${d.sent} employee${d.sent !== 1 ? 's' : ''}${d.failed ? ` (${d.failed} failed)` : ''}`)
            else showToast(d.error || 'Failed to send', false)
        } catch {
            showToast('Failed to send', false)
        } finally {
            setSending(null)
        }
    }

    if (!isSuperAdmin(crmUser)) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Shield size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#6b7280' }}>Only Super Admins can manage work settings.</p>
            </div>
        )
    }

    if (loading) return <div className={styles.emptyState}>Loading...</div>

    return (
        <div className={styles.pageContent} style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Link href="/crm/hrm/attendance" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>Work Settings</h1>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>Configure office hours, shift times, and reminder schedules</p>
                </div>
            </div>

            {!tableExists && (
                <div style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
                    Run <code style={{ background: '#1e2030', padding: '1px 6px', borderRadius: 4 }}>supabase/hrm-checkin.sql</code> migration to enable work settings.
                </div>
            )}

            {/* Working Hours */}
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} style={{ color: '#BFA270' }} /> Working Hours
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.75rem 0' }}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Work Start Time</label>
                        <input
                            type="time"
                            className={styles.formInput}
                            value={settings.work_start_time}
                            onChange={e => setSettings(s => ({ ...s, work_start_time: e.target.value }))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Work End Time</label>
                        <input
                            type="time"
                            className={styles.formInput}
                            value={settings.work_end_time}
                            onChange={e => setSettings(s => ({ ...s, work_end_time: e.target.value }))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Full Day Hours</label>
                        <input
                            type="number"
                            min={1} max={24} step={0.5}
                            className={styles.formInput}
                            value={settings.full_day_hours}
                            onChange={e => setSettings(s => ({ ...s, full_day_hours: parseFloat(e.target.value) || 8 }))}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                            ≥ this = 🟢 green
                        </span>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Half Day Hours</label>
                        <input
                            type="number"
                            min={1} max={24} step={0.5}
                            className={styles.formInput}
                            value={settings.half_day_hours}
                            onChange={e => setSettings(s => ({ ...s, half_day_hours: parseFloat(e.target.value) || 4 }))}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                            ≥ this = 🟠 orange · else 🔴 red
                        </span>
                    </div>
                </div>

                {/* Visual guide */}
                <div style={{ background: '#1e2030', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
                    <strong style={{ color: '#e5e7eb' }}>Colour coding:</strong>{' '}
                    <span style={{ color: '#22c55e' }}>■</span> ≥{settings.full_day_hours}h full day{' · '}
                    <span style={{ color: '#f59e0b' }}>■</span> ≥{settings.half_day_hours}h half day{' · '}
                    <span style={{ color: '#ef4444' }}>■</span> &lt;{settings.half_day_hours}h short day
                </div>
            </div>

            {/* Reminders */}
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={16} style={{ color: '#BFA270' }} /> Email Reminders
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <div
                            onClick={() => setSettings(s => ({ ...s, reminders_enabled: !s.reminders_enabled }))}
                            style={{
                                width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
                                background: settings.reminders_enabled ? '#22c55e' : '#374151', transition: 'background 0.2s',
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: 2, left: settings.reminders_enabled ? 18 : 2,
                                width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                            }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: settings.reminders_enabled ? '#22c55e' : '#6b7280' }}>
                            {settings.reminders_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.75rem 0', opacity: settings.reminders_enabled ? 1 : 0.4, pointerEvents: settings.reminders_enabled ? 'auto' : 'none' }}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Check-In Reminder</label>
                        <input
                            type="time"
                            className={styles.formInput}
                            value={settings.checkin_reminder_time}
                            onChange={e => setSettings(s => ({ ...s, checkin_reminder_time: e.target.value }))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Check-Out Reminder</label>
                        <input
                            type="time"
                            className={styles.formInput}
                            value={settings.checkout_reminder_time}
                            onChange={e => setSettings(s => ({ ...s, checkout_reminder_time: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Manual send buttons */}
                <div style={{ borderTop: '1px solid #1e2030', paddingTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.375rem', flex: '1 1 100%' }}>
                        <Mail size={13} /> Send reminders manually now:
                    </div>
                    <button
                        onClick={() => sendReminder('checkin')}
                        disabled={!!sending}
                        className={styles.btnSecondary}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                    >
                        <Send size={13} />
                        {sending === 'checkin' ? 'Sending...' : 'Send Check-In Reminder'}
                    </button>
                    <button
                        onClick={() => sendReminder('checkout')}
                        disabled={!!sending}
                        className={styles.btnSecondary}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                    >
                        <Send size={13} />
                        {sending === 'checkout' ? 'Sending...' : 'Send Check-Out Reminder'}
                    </button>
                </div>

                {/* Cron setup info */}
                <div style={{ marginTop: '0.75rem', background: '#111827', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    <div style={{ color: '#9ca3af', fontWeight: 600, marginBottom: '0.375rem' }}>⚙ Automate with Supabase pg_cron</div>
                    <code style={{ fontSize: '0.6875rem', color: '#BFA270', display: 'block', lineHeight: 1.8 }}>
                        {`-- Check-in reminder at ${settings.checkin_reminder_time} IST (UTC+5:30)`}<br />
                        SELECT cron.schedule(&apos;hrm-checkin-reminder&apos;, &apos;{adjustForIST(settings.checkin_reminder_time)} * * *&apos;, $$<br />
                        &nbsp;&nbsp;SELECT net.http_post(url:=&apos;{'{SITE_URL}'}/api/crm/hrm/reminders&apos;, body:=&apos;&#123;"type":"checkin"&#125;&apos;);<br />
                        $$);
                    </code>
                </div>
            </div>

            {/* Regularization Quota */}
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem' }}>🔄</span> Regularization Quota
                    </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem', lineHeight: 1.6 }}>
                    Employees can apply for regularization when they work short hours. Set the maximum allowed per month and year.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Max per Month</label>
                        <input
                            type="number"
                            min={0} max={31}
                            className={styles.formInput}
                            value={settings.max_regularizations_per_month}
                            onChange={e => setSettings(s => ({ ...s, max_regularizations_per_month: parseInt(e.target.value) || 0 }))}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                            requests allowed per calendar month
                        </span>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Max per Year</label>
                        <input
                            type="number"
                            min={0} max={365}
                            className={styles.formInput}
                            value={settings.max_regularizations_per_year}
                            onChange={e => setSettings(s => ({ ...s, max_regularizations_per_year: parseInt(e.target.value) || 0 }))}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                            requests allowed per financial year
                        </span>
                    </div>
                </div>
                <div style={{ background: '#1e2030', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
                    When an employee exceeds their quota, they cannot submit more requests until the next month/year.
                </div>
            </div>

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving || !tableExists}
                className={styles.btnPrimary}
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem' }}
            >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Work Settings'}
            </button>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.75rem 1.25rem', background: toast.ok ? '#183C38' : '#dc2626', color: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '0.875rem', fontWeight: 500, zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {toast.ok && <CheckCircle size={16} />}
                    {toast.msg}
                </div>
            )}
        </div>
    )
}

function adjustForIST(time: string): string {
    // Convert IST (UTC+5:30) to UTC for cron
    const [h, m] = time.split(':').map(Number)
    let utcH = h - 5
    let utcM = m - 30
    if (utcM < 0) { utcM += 60; utcH -= 1 }
    if (utcH < 0) utcH += 24
    return `${utcM} ${utcH}`
}
