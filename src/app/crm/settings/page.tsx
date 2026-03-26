'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key, Globe, Bot, Mail, Shield, Save } from 'lucide-react'
import styles from '../crm.module.css'

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('general')

    const sections = [
        { key: 'general', label: 'General', icon: Globe },
        { key: 'api', label: 'API Keys', icon: Key },
        { key: 'chatbot', label: 'Chatbot', icon: Bot },
        { key: 'email', label: 'Email', icon: Mail },
    ]

    return (
        <div className={styles.pageContent}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Settings</h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>CRM configuration and API keys</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem' }}>
                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {sections.map(s => (
                        <button key={s.key} onClick={() => setActiveSection(s.key)}
                            className={styles.navItem}
                            style={{
                                backgroundColor: activeSection === s.key ? 'var(--crm-elevated)' : 'transparent',
                                color: activeSection === s.key ? 'var(--crm-accent)' : 'var(--crm-text-muted)',
                            }}>
                            <s.icon size={14} /> {s.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={styles.card}>
                    {activeSection === 'general' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '1rem' }}>General Settings</h2>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Company Name</label>
                                <input type="text" defaultValue="27 Estates" className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Company Phone</label>
                                <input type="text" defaultValue="+91 80957 99929" className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Company Email</label>
                                <input type="email" defaultValue="connect@27estates.com" className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Website URL</label>
                                <input type="url" defaultValue="https://27estates.com" className={styles.formInput} />
                            </div>
                        </div>
                    )}

                    {activeSection === 'api' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '0.5rem' }}>API Keys & Secrets</h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)', marginBottom: '1.5rem' }}>
                                These are configured via environment variables. Update them in your <code style={{ color: 'var(--crm-accent)' }}>.env.local</code> file or Vercel dashboard.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { name: 'Azure OpenAI', vars: ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT', 'AZURE_OPENAI_API_VERSION'], status: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
                                    { name: 'Meta Ads', vars: ['META_APP_SECRET', 'META_WEBHOOK_VERIFY_TOKEN'], status: false },
                                    { name: 'Google Ads', vars: ['GOOGLE_ADS_WEBHOOK_SECRET'], status: false },
                                    { name: 'Resend (Email)', vars: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'], status: true },
                                    { name: 'Cron Jobs', vars: ['CRON_SECRET'], status: true },
                                ].map(item => (
                                    <div key={item.name} style={{
                                        padding: '1rem', borderRadius: '0.5rem',
                                        backgroundColor: 'var(--crm-bg)', border: '1px solid var(--crm-border)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{item.name}</span>
                                            <span className={styles.badge} style={{
                                                backgroundColor: item.status ? '#22c55e20' : '#f59e0b20',
                                                color: item.status ? '#22c55e' : '#f59e0b',
                                            }}>
                                                {item.status ? 'Configured' : 'Not Set'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                            {item.vars.map(v => (
                                                <code key={v} style={{ padding: '0.125rem 0.375rem', backgroundColor: 'var(--crm-elevated)', borderRadius: '4px', fontSize: '0.6875rem', color: 'var(--crm-text-faint)' }}>{v}</code>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'chatbot' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '1rem' }}>Chatbot Settings</h2>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Model</label>
                                <input type="text" defaultValue="gpt-5.2-chat" className={styles.formInput} disabled />
                                <p style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)', marginTop: '0.25rem' }}>Set via AZURE_OPENAI_DEPLOYMENT env var</p>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Max Tokens per Response</label>
                                <input type="number" defaultValue="500" className={styles.formInput} disabled />
                                <p style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)', marginTop: '0.25rem' }}>Change in src/app/api/chat/route.ts</p>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Temperature</label>
                                <input type="text" defaultValue="0.7" className={styles.formInput} disabled />
                                <p style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)', marginTop: '0.25rem' }}>0 = deterministic, 1 = creative</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--crm-bg)', borderRadius: '0.5rem', border: '1px solid var(--crm-border)', marginTop: '1rem' }}>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-muted)', lineHeight: 1.6 }}>
                                    The chatbot system prompt is configured in <code style={{ color: 'var(--crm-accent)' }}>src/app/api/chat/route.ts</code>.
                                    It automatically loads property and project data from your database to answer visitor questions.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'email' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '1rem' }}>Email Settings</h2>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>From Name</label>
                                <input type="text" defaultValue="27 Estates" className={styles.formInput} disabled />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>From Email</label>
                                <input type="email" defaultValue="contact@27estates.com" className={styles.formInput} disabled />
                                <p style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)', marginTop: '0.25rem' }}>Set via RESEND_FROM_EMAIL env var</p>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Cron Schedule (Email Queue)</label>
                                <input type="text" defaultValue="Every 15 minutes" className={styles.formInput} disabled />
                                <p style={{ fontSize: '0.6875rem', color: 'var(--crm-text-dim)', marginTop: '0.25rem' }}>
                                    Configure in vercel.json: {`{"crons": [{"path": "/api/cron/email-queue", "schedule": "*/15 * * * *"}]}`}
                                </p>
                            </div>
                            <Link href="/crm/emails" className={styles.btnPrimary} style={{ marginTop: '0.5rem' }}>
                                <Mail size={14} /> Manage Email Templates
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
