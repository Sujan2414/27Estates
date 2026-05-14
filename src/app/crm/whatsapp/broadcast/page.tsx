'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Send, AlertCircle, CheckCircle2 } from 'lucide-react'

// ─── Types ──────────────────────────────────────────
interface TemplateComponent {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    text?: string
    format?: string
    buttons?: Array<{ type: string; text: string }>
}

interface Template {
    id: string
    name: string
    language: string
    status: string
    category: string
    components?: TemplateComponent[]
}

interface SendResult {
    phone: string
    ok: boolean
    wamid?: string
    error?: string
}

// ─── Helpers ────────────────────────────────────────
function countBodyVariables(t: Template | null): number {
    if (!t) return 0
    const body = t.components?.find(c => c.type === 'BODY')
    if (!body?.text) return 0
    const matches = body.text.match(/\{\{(\d+)\}\}/g)
    if (!matches) return 0
    const nums = matches.map(m => parseInt(m.replace(/\D/g, ''), 10))
    return Math.max(...nums)
}

function bodyPreview(t: Template | null): string {
    if (!t) return ''
    const body = t.components?.find(c => c.type === 'BODY')
    return body?.text || ''
}

// ─── Component ──────────────────────────────────────
export default function BroadcastPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [templatesError, setTemplatesError] = useState<string | null>(null)
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')

    const [recipientsText, setRecipientsText] = useState('')
    const [testMode, setTestMode] = useState(true)
    const [sending, setSending] = useState(false)
    const [results, setResults] = useState<{ sent: number; failed: number; results: SendResult[] } | null>(null)

    const fetchTemplates = useCallback(async () => {
        setLoadingTemplates(true)
        setTemplatesError(null)
        try {
            const res = await fetch('/api/whatsapp/templates', { cache: 'no-store' })
            const j = await res.json()
            if (!res.ok) {
                setTemplatesError(j.error || 'Failed to load templates')
                setTemplates([])
            } else {
                setTemplates(j.templates || [])
            }
        } catch (e) {
            setTemplatesError(e instanceof Error ? e.message : 'Fetch failed')
        } finally {
            setLoadingTemplates(false)
        }
    }, [])

    useEffect(() => { fetchTemplates() }, [fetchTemplates])

    const tpl = templates.find(t => `${t.name}|${t.language}` === selectedTemplate) || null
    const varCount = countBodyVariables(tpl)

    // Parse recipients — supports "918618907491" or "918618907491,Sujan,Hyderabad" per line
    function parseRecipients() {
        return recipientsText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const cells = line.split(/[,\t|]/).map(c => c.trim()).filter(Boolean)
                const phone = cells[0]
                const name = cells.length > 1 ? cells[1] : undefined
                const variables = cells.slice(varCount > 0 && cells.length > 1 ? 1 : 0, 1 + varCount)
                    .filter((_, i) => i < varCount)
                return { phone, name, variables: varCount > 0 ? variables : undefined }
            })
            .filter(r => r.phone && /\d{10,15}/.test(r.phone.replace(/\D/g, '')))
    }

    async function handleSend() {
        if (!tpl) return alert('Select a template first')
        const recipients = parseRecipients()
        if (recipients.length === 0) return alert('Add at least one valid recipient')

        if (!testMode) {
            const ok = confirm(`Send "${tpl.name}" to ${recipients.length} recipients?\nThis is NOT test mode — messages will be billed by Meta.`)
            if (!ok) return
        }

        setSending(true)
        setResults(null)
        try {
            const res = await fetch('/api/whatsapp/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_name: tpl.name,
                    language: tpl.language,
                    recipients,
                    test_mode: testMode,
                }),
            })
            const j = await res.json()
            if (!res.ok) {
                alert(`Broadcast failed: ${j.error || res.statusText}`)
            } else {
                setResults(j)
            }
        } finally {
            setSending(false)
        }
    }

    const recipientCount = parseRecipients().length

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', color: 'var(--crm-text-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Link
                    href="/crm/whatsapp"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--crm-text-secondary)',
                        textDecoration: 'none', fontSize: '0.85rem',
                    }}
                >
                    <ArrowLeft size={14} /> Back
                </Link>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>WhatsApp Broadcast</h1>
            </div>

            <div style={{
                padding: 14, backgroundColor: 'var(--crm-elevated)', borderRadius: 8,
                fontSize: '0.8rem', color: 'var(--crm-text-secondary)', marginBottom: 24,
                border: '1px solid var(--crm-border-subtle)',
            }}>
                💡 You can only send <strong>approved templates</strong> as broadcasts. To start a chat with a user
                outside their 24-hour window, this is the only path. Templates must be created and approved in
                Meta Business Manager first.
            </div>

            {/* Template picker */}
            <Section title="1. Choose template">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <select
                        value={selectedTemplate}
                        onChange={e => setSelectedTemplate(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">— Select an approved template —</option>
                        {templates.map(t => (
                            <option key={t.id} value={`${t.name}|${t.language}`}>
                                {t.name} ({t.language}) · {t.category}
                            </option>
                        ))}
                    </select>
                    <button onClick={fetchTemplates} disabled={loadingTemplates} style={iconBtnStyle} title="Refresh">
                        <RefreshCw size={14} style={{ animation: loadingTemplates ? 'spin 1s linear infinite' : undefined }} />
                    </button>
                </div>

                {templatesError && (
                    <div style={errorBoxStyle}>
                        <AlertCircle size={14} /> {templatesError}
                    </div>
                )}

                {tpl && (
                    <div style={{
                        padding: 12, backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border-subtle)',
                        borderRadius: 6, fontSize: '0.85rem', whiteSpace: 'pre-wrap', marginTop: 8,
                    }}>
                        <div style={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--crm-text-muted)', marginBottom: 6 }}>
                            Preview
                        </div>
                        {bodyPreview(tpl)}
                        {varCount > 0 && (
                            <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--crm-text-muted)' }}>
                                This template has <strong>{varCount}</strong> variable{varCount > 1 ? 's' : ''} —
                                add them after the phone in each line, separated by commas.
                            </div>
                        )}
                    </div>
                )}
            </Section>

            {/* Recipients */}
            <Section title={`2. Add recipients${recipientCount > 0 ? ` (${recipientCount} valid)` : ''}`}>
                <textarea
                    value={recipientsText}
                    onChange={e => setRecipientsText(e.target.value)}
                    placeholder={
                        varCount > 0
                            ? `Format: phone, name, var1, var2…\n918618907491, Sujan, 3BHK, Hyderabad\n918765432109, Priya, 2BHK, Bangalore`
                            : `One phone per line (with or without country code):\n918618907491\n8765432109\n+91 8765432109`
                    }
                    rows={8}
                    style={{
                        width: '100%', padding: 10, fontSize: '0.85rem', fontFamily: 'monospace',
                        border: '1px solid var(--crm-border-subtle)', borderRadius: 6,
                        backgroundColor: 'var(--crm-surface)', color: 'var(--crm-text-primary)',
                        resize: 'vertical',
                    }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)', marginTop: 4 }}>
                    Numbers without country code are assumed to be Indian (+91 prefixed automatically).
                </div>
            </Section>

            {/* Send controls */}
            <Section title="3. Send">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 12 }}>
                    <input
                        type="checkbox"
                        checked={testMode}
                        onChange={e => setTestMode(e.target.checked)}
                        style={{ accentColor: '#25D366' }}
                    />
                    Test mode (sends to first recipient only)
                </label>
                <div>
                    <button
                        onClick={handleSend}
                        disabled={!tpl || recipientCount === 0 || sending}
                        style={{
                            padding: '10px 20px', borderRadius: 8, border: 'none',
                            backgroundColor: tpl && recipientCount > 0 && !sending ? '#25D366' : 'var(--crm-border-subtle)',
                            color: 'white', cursor: tpl && recipientCount > 0 && !sending ? 'pointer' : 'not-allowed',
                            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600,
                        }}
                    >
                        <Send size={14} />
                        {sending ? 'Sending…' : testMode ? 'Send test (1)' : `Send broadcast (${recipientCount})`}
                    </button>
                </div>
            </Section>

            {/* Results */}
            {results && (
                <Section title="Results">
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <Stat label="Sent" value={results.sent} color="#22c55e" icon={<CheckCircle2 size={14} />} />
                        <Stat label="Failed" value={results.failed} color="#ef4444" icon={<AlertCircle size={14} />} />
                    </div>
                    <div style={{
                        maxHeight: 300, overflowY: 'auto', border: '1px solid var(--crm-border-subtle)', borderRadius: 6,
                        backgroundColor: 'var(--crm-surface)',
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--crm-elevated)' }}>
                                    <th style={thStyle}>Phone</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.results.map((r, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid var(--crm-border-subtle)' }}>
                                        <td style={tdStyle}>{r.phone}</td>
                                        <td style={{ ...tdStyle, color: r.ok ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                                            {r.ok ? 'OK' : 'FAILED'}
                                        </td>
                                        <td style={tdStyle}>
                                            {r.ok ? <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', opacity: 0.7 }}>{r.wamid}</span> : r.error}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

// ─── Inline styled helpers ──────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 10, color: 'var(--crm-text-primary)' }}>
                {title}
            </h2>
            {children}
        </div>
    )
}

function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
    return (
        <div style={{
            padding: '10px 16px', borderRadius: 8, border: '1px solid var(--crm-border-subtle)',
            backgroundColor: 'var(--crm-elevated)', minWidth: 100,
        }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{value}</div>
        </div>
    )
}

const selectStyle: React.CSSProperties = {
    flex: 1, padding: '8px 10px', fontSize: '0.85rem',
    border: '1px solid var(--crm-border-subtle)', borderRadius: 6,
    backgroundColor: 'var(--crm-surface)', color: 'var(--crm-text-primary)',
}

const iconBtnStyle: React.CSSProperties = {
    padding: 8, border: '1px solid var(--crm-border-subtle)', borderRadius: 6,
    background: 'transparent', cursor: 'pointer', color: 'var(--crm-text-secondary)',
}

const errorBoxStyle: React.CSSProperties = {
    padding: '8px 12px', backgroundColor: '#ef444422', color: '#ef4444',
    borderRadius: 6, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6,
}

const thStyle: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'left', fontSize: '0.7rem',
    color: 'var(--crm-text-muted)', textTransform: 'uppercase', fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
}
