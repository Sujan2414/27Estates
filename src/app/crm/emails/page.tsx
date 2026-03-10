'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Mail, Edit3, Trash2, Eye, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../crm.module.css'
import type { EmailTemplate } from '@/lib/crm/types'

const categoryColors: Record<string, string> = {
    welcome: '#22c55e', follow_up: '#f59e0b', property_alert: '#3b82f6',
    site_visit: '#8b5cf6', general: '#6b7280',
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditor, setShowEditor] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null)
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    const fetchTemplates = async () => {
        const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false })
        if (data) setTemplates(data)
        setLoading(false)
    }

    useEffect(() => { fetchTemplates() }, [])

    const handleSave = async () => {
        if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body_html) return
        setSaving(true)
        if (editingTemplate.id) {
            await supabase.from('email_templates').update({
                name: editingTemplate.name, subject: editingTemplate.subject,
                body_html: editingTemplate.body_html, category: editingTemplate.category || 'general',
                variables: editingTemplate.variables || [],
            }).eq('id', editingTemplate.id)
        } else {
            await supabase.from('email_templates').insert({
                name: editingTemplate.name, subject: editingTemplate.subject,
                body_html: editingTemplate.body_html, category: editingTemplate.category || 'general',
                variables: editingTemplate.variables || [],
            })
        }
        setShowEditor(false); setEditingTemplate(null); setSaving(false); fetchTemplates()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return
        await supabase.from('email_templates').delete().eq('id', id)
        fetchTemplates()
    }

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/crm" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Email Templates</h1>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Manage automated email templates</p>
                    </div>
                </div>
                <button onClick={() => { setEditingTemplate({ name: '', subject: '', body_html: '', category: 'general', variables: [] }); setShowEditor(true) }} className={styles.btnPrimary}>
                    <Plus size={14} /> New Template
                </button>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading...</div>
            ) : templates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {templates.map(t => (
                        <div key={t.id} className={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e5e7eb' }}>{t.name}</span>
                                        <span className={styles.badge} style={{
                                            backgroundColor: `${categoryColors[t.category] || '#6b7280'}20`,
                                            color: categoryColors[t.category] || '#6b7280',
                                        }}>{t.category}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        <Mail size={12} /> Subject: {t.subject}
                                    </div>
                                    {t.variables.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                            {t.variables.map(v => (
                                                <code key={v} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#1e2030', borderRadius: '4px', fontSize: '0.6875rem', color: '#BFA270' }}>{v}</code>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    <button onClick={() => setPreviewHtml(t.body_html)} className={styles.btnIcon}><Eye size={14} /></button>
                                    <button onClick={() => { setEditingTemplate({ ...t }); setShowEditor(true) }} className={styles.btnIcon}><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete(t.id)} className={styles.btnIcon} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.emptyState}>
                        <p style={{ color: '#e5e7eb', fontWeight: 500, marginBottom: '0.5rem' }}>No email templates yet</p>
                        <p style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>Create templates for welcome emails, follow-ups, and alerts.</p>
                        <button onClick={() => { setEditingTemplate({ name: '', subject: '', body_html: '', category: 'general', variables: [] }); setShowEditor(true) }} className={styles.btnPrimary}>
                            <Plus size={14} /> Create First Template
                        </button>
                    </div>
                </div>
            )}

            {/* Editor Modal */}
            {showEditor && editingTemplate && (
                <div className={styles.modal} onClick={() => setShowEditor(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e5e7eb' }}>
                                {editingTemplate.id ? 'Edit Template' : 'New Template'}
                            </h3>
                            <button onClick={() => setShowEditor(false)} className={styles.btnIcon}><X size={16} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 2 }}>
                                <label className={styles.formLabel}>Template Name</label>
                                <input type="text" value={editingTemplate.name || ''} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    placeholder="e.g., Welcome Email" className={styles.formInput} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Category</label>
                                <select value={editingTemplate.category || 'general'} onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value })} className={styles.formSelect}>
                                    <option value="welcome">Welcome</option><option value="follow_up">Follow Up</option>
                                    <option value="property_alert">Property Alert</option><option value="site_visit">Site Visit</option>
                                    <option value="general">General</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Subject Line</label>
                            <input type="text" value={editingTemplate.subject || ''} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                placeholder="e.g., Welcome to 27 Estates - {{name}}" className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>HTML Body <span style={{ color: '#4b5563' }}>(use {'{{variable}}'} for dynamic content)</span></label>
                            <textarea value={editingTemplate.body_html || ''} onChange={e => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                                rows={15} className={styles.formInput} style={{ fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setPreviewHtml(editingTemplate.body_html || '')} className={styles.btnSecondary}><Eye size={14} /> Preview</button>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => setShowEditor(false)} className={styles.btnSecondary}>Cancel</button>
                                <button onClick={handleSave} className={styles.btnPrimary} disabled={saving}>{saving ? 'Saving...' : 'Save Template'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewHtml && (
                <div className={styles.modal} onClick={() => setPreviewHtml(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        backgroundColor: '#fff', borderRadius: '1rem', padding: '1.5rem',
                        maxWidth: '650px', width: '100%', maxHeight: '80vh', overflow: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111' }}>Email Preview</h3>
                            <button onClick={() => setPreviewHtml(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                </div>
            )}
        </div>
    )
}
