'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Plus, Mail, Edit3, Trash2, Eye, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { wrapWithBrandedTemplate, extractInnerContent } from '@/lib/email-template'
import styles from '../crm.module.css'
import type { EmailTemplate } from '@/lib/crm/types'

// Load rich editor client-side only (uses browser APIs)
const RichEmailEditor = dynamic(() => import('@/components/crm/RichEmailEditor'), { ssr: false })

const categoryColors: Record<string, string> = {
    welcome: '#22c55e', follow_up: '#f59e0b', property_alert: '#3b82f6',
    site_visit: '#8b5cf6', general: '#6b7280',
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditor, setShowEditor] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null)
    const [innerContent, setInnerContent] = useState('')   // what the rich editor works with
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    const fetchTemplates = async () => {
        const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false })
        if (data) setTemplates(data)
        setLoading(false)
    }

    useEffect(() => { fetchTemplates() }, [])

    const openNew = () => {
        setEditingTemplate({ name: '', subject: '', body_html: '', category: 'general', variables: [] })
        setInnerContent('')
        setShowEditor(true)
    }

    const openEdit = (t: EmailTemplate) => {
        setEditingTemplate({ ...t })
        setInnerContent(extractInnerContent(t.body_html))
        setShowEditor(true)
    }

    const handleSave = async () => {
        if (!editingTemplate?.name || !editingTemplate?.subject || !innerContent.trim()) return
        setSaving(true)

        const fullHtml = wrapWithBrandedTemplate(innerContent)
        const payload = {
            name: editingTemplate.name,
            subject: editingTemplate.subject,
            body_html: fullHtml,
            category: editingTemplate.category || 'general',
            variables: editingTemplate.variables || [],
        }

        if (editingTemplate.id) {
            await supabase.from('email_templates').update(payload).eq('id', editingTemplate.id)
        } else {
            await supabase.from('email_templates').insert(payload)
        }

        setShowEditor(false)
        setEditingTemplate(null)
        setInnerContent('')
        setSaving(false)
        fetchTemplates()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return
        await supabase.from('email_templates').delete().eq('id', id)
        fetchTemplates()
    }

    const closeEditor = () => { setShowEditor(false); setEditingTemplate(null); setInnerContent('') }

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>Email Templates</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)' }}>Manage automated email templates</p>
                </div>
                <button onClick={openNew} className={styles.btnPrimary}>
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
                                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>{t.name}</span>
                                        <span className={styles.badge} style={{
                                            backgroundColor: `${categoryColors[t.category] || '#6b7280'}20`,
                                            color: categoryColors[t.category] || '#6b7280',
                                        }}>{t.category}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--crm-text-faint)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        <Mail size={12} /> Subject: {t.subject}
                                    </div>
                                    {t.variables.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                            {t.variables.map(v => (
                                                <code key={v} style={{ padding: '0.125rem 0.375rem', backgroundColor: 'var(--crm-elevated)', borderRadius: '4px', fontSize: '0.6875rem', color: 'var(--crm-accent)' }}>{v}</code>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    <button onClick={() => setPreviewHtml(t.body_html)} className={styles.btnIcon} title="Preview"><Eye size={14} /></button>
                                    <button onClick={() => openEdit(t)} className={styles.btnIcon} title="Edit"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete(t.id)} className={styles.btnIcon} style={{ color: '#ef4444' }} title="Delete"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.emptyState}>
                        <p style={{ color: 'var(--crm-text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>No email templates yet</p>
                        <p style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>Create templates for welcome emails, follow-ups, and alerts.</p>
                        <button onClick={openNew} className={styles.btnPrimary}><Plus size={14} /> Create First Template</button>
                    </div>
                </div>
            )}

            {/* Editor Modal */}
            {showEditor && editingTemplate && (
                <div className={styles.modal} onClick={closeEditor}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>
                                {editingTemplate.id ? 'Edit Template' : 'New Template'}
                            </h3>
                            <button onClick={closeEditor} className={styles.btnIcon}><X size={16} /></button>
                        </div>

                        {/* Name + Category */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 2 }}>
                                <label className={styles.formLabel}>Template Name</label>
                                <input type="text" value={editingTemplate.name || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    placeholder="e.g., Welcome Email" className={styles.formInput} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.formLabel}>Category</label>
                                <select value={editingTemplate.category || 'general'}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                                    className={styles.formSelect}>
                                    <option value="welcome">Welcome</option>
                                    <option value="follow_up">Follow Up</option>
                                    <option value="property_alert">Property Alert</option>
                                    <option value="site_visit">Site Visit</option>
                                    <option value="general">General</option>
                                </select>
                            </div>
                        </div>

                        {/* Subject */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Subject Line</label>
                            <input type="text" value={editingTemplate.subject || ''}
                                onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                placeholder="e.g., Welcome to 27 Estates, {{name}}!" className={styles.formInput} />
                        </div>

                        {/* Rich editor */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ marginBottom: '6px' }}>
                                Email Body
                                <span style={{ fontWeight: 400, color: 'var(--crm-text-dim)', marginLeft: '8px', fontSize: '0.75rem' }}>
                                    The 27 Estates header &amp; footer are added automatically
                                </span>
                            </label>
                            <RichEmailEditor value={innerContent} onChange={setInnerContent} />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setPreviewHtml(wrapWithBrandedTemplate(innerContent))}
                                className={styles.btnSecondary}
                            >
                                <Eye size={14} /> Preview
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={closeEditor} className={styles.btnSecondary}>Cancel</button>
                                <button onClick={handleSave} className={styles.btnPrimary} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewHtml && (
                <div className={styles.modal} onClick={() => setPreviewHtml(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--crm-surface)', borderRadius: '1rem', padding: '1.5rem',
                        maxWidth: '680px', width: '100%', maxHeight: '85vh', overflow: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--crm-text-secondary)' }}>Email Preview</h3>
                            <button onClick={() => setPreviewHtml(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--crm-text-muted)' }}><X size={20} /></button>
                        </div>
                        <iframe
                            srcDoc={previewHtml}
                            sandbox=""
                            style={{ width: '100%', height: '500px', border: '1px solid var(--crm-border)', borderRadius: '0.5rem', background: '#fff' }}
                            title="Email preview"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
