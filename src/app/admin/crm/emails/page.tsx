'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Mail, Edit3, Trash2, Eye, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../../admin.module.css'
import type { EmailTemplate } from '@/lib/crm/types'

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditor, setShowEditor] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null)
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    const fetchTemplates = async () => {
        const { data } = await supabase
            .from('email_templates')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setTemplates(data)
        setLoading(false)
    }

    useEffect(() => { fetchTemplates() }, [])

    const handleSave = async () => {
        if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body_html) return
        setSaving(true)

        if (editingTemplate.id) {
            await supabase
                .from('email_templates')
                .update({
                    name: editingTemplate.name,
                    subject: editingTemplate.subject,
                    body_html: editingTemplate.body_html,
                    category: editingTemplate.category || 'general',
                    variables: editingTemplate.variables || [],
                })
                .eq('id', editingTemplate.id)
        } else {
            await supabase
                .from('email_templates')
                .insert({
                    name: editingTemplate.name,
                    subject: editingTemplate.subject,
                    body_html: editingTemplate.body_html,
                    category: editingTemplate.category || 'general',
                    variables: editingTemplate.variables || [],
                })
        }

        setShowEditor(false)
        setEditingTemplate(null)
        setSaving(false)
        fetchTemplates()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return
        await supabase.from('email_templates').delete().eq('id', id)
        fetchTemplates()
    }

    const handleNew = () => {
        setEditingTemplate({ name: '', subject: '', body_html: '', category: 'general', variables: [] })
        setShowEditor(true)
    }

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate({ ...template })
        setShowEditor(true)
    }

    const categoryColors: Record<string, string> = {
        welcome: '#22c55e',
        follow_up: '#f59e0b',
        property_alert: '#3b82f6',
        site_visit: '#8b5cf6',
        general: '#6b7280',
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/crm" style={{ color: '#6b7280' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>Email Templates</h1>
                        <p className={styles.pageSubtitle}>Manage email templates for automated and manual emails</p>
                    </div>
                </div>
                <button onClick={handleNew} className={styles.addButton}>
                    <Plus size={18} /> New Template
                </button>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading templates...</div>
            ) : templates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {templates.map(template => (
                        <div key={template.id} className={styles.sectionCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{template.name}</h3>
                                        <span style={{
                                            padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem',
                                            fontWeight: 500, textTransform: 'capitalize',
                                            backgroundColor: `${categoryColors[template.category] || '#6b7280'}15`,
                                            color: categoryColors[template.category] || '#6b7280',
                                        }}>
                                            {template.category}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                        <Mail size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        Subject: {template.subject}
                                    </div>
                                    {template.variables.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                            {template.variables.map(v => (
                                                <code key={v} style={{
                                                    padding: '0.125rem 0.375rem', backgroundColor: '#f3f4f6',
                                                    borderRadius: '4px', fontSize: '0.6875rem', color: '#6b7280',
                                                }}>
                                                    {v}
                                                </code>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setPreviewHtml(template.body_html)} className={styles.iconBtn}>
                                        <Eye size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(template)} className={styles.iconBtn}>
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(template.id)} className={`${styles.iconBtn} ${styles.deleteIcon}`}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateTitle}>No email templates yet</div>
                    <p className={styles.emptyStateText}>Create templates for welcome emails, follow-ups, and property alerts.</p>
                    <button onClick={handleNew} className={styles.addButton}>
                        <Plus size={16} /> Create First Template
                    </button>
                </div>
            )}

            {/* Editor Modal */}
            {showEditor && editingTemplate && (
                <div className={styles.modal} onClick={() => setShowEditor(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                {editingTemplate.id ? 'Edit Template' : 'New Template'}
                            </h3>
                            <button onClick={() => setShowEditor(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Template Name</label>
                                    <input type="text" value={editingTemplate.name || ''} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        placeholder="e.g., Welcome Email"
                                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Category</label>
                                    <select value={editingTemplate.category || 'general'} onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                        <option value="welcome">Welcome</option>
                                        <option value="follow_up">Follow Up</option>
                                        <option value="property_alert">Property Alert</option>
                                        <option value="site_visit">Site Visit</option>
                                        <option value="general">General</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Subject Line</label>
                                <input type="text" value={editingTemplate.subject || ''} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    placeholder="e.g., Welcome to 27 Estates - {{name}}"
                                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>
                                    HTML Body <span style={{ color: '#9ca3af', fontWeight: 400 }}>(use {'{{variable}}'} for dynamic content)</span>
                                </label>
                                <textarea
                                    value={editingTemplate.body_html || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                                    rows={15}
                                    style={{
                                        width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb',
                                        borderRadius: '0.5rem', fontSize: '0.8125rem', fontFamily: 'monospace',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                                <button onClick={() => setPreviewHtml(editingTemplate.body_html || '')}
                                    className={styles.addButton} style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                                    <Eye size={16} /> Preview
                                </button>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setShowEditor(false)} className={styles.cancelBtn}>Cancel</button>
                                    <button onClick={handleSave} className={styles.addButton} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Template'}
                                    </button>
                                </div>
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
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Email Preview</h3>
                            <button onClick={() => setPreviewHtml(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}
                            dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                </div>
            )}
        </div>
    )
}
