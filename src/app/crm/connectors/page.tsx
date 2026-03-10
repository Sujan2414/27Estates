'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plug, Copy, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../crm.module.css'

interface Connector {
    id: string; platform: string; is_active: boolean
    config: Record<string, string> | null
    leads_received: number; last_webhook_at: string | null
    created_at: string
}

const platformInfo: Record<string, { label: string; color: string; description: string }> = {
    meta_ads: { label: 'Meta Ads', color: '#1877F2', description: 'Facebook & Instagram Lead Ads' },
    google_ads: { label: 'Google Ads', color: '#4285F4', description: 'Google Ads lead form extensions' },
    '99acres': { label: '99acres', color: '#F36C21', description: '99acres property listing leads' },
    magicbricks: { label: 'MagicBricks', color: '#E42529', description: 'MagicBricks property leads' },
    housing: { label: 'Housing.com', color: '#E03C31', description: 'Housing.com property leads' },
    justdial: { label: 'JustDial', color: '#0066CC', description: 'JustDial business leads' },
    website: { label: 'Website', color: '#BFA270', description: 'Direct website inquiries' },
    chatbot: { label: 'Chatbot', color: '#22c55e', description: 'AI chatbot captured leads' },
}

export default function ConnectorsPage() {
    const [connectors, setConnectors] = useState<Connector[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from('ad_connectors')
                .select('*')
                .order('platform')
            if (data) setConnectors(data)
            setLoading(false)
        }
        fetch()
    }, [supabase])

    const toggleConnector = async (id: string, current: boolean) => {
        setConnectors(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
        await supabase.from('ad_connectors').update({ is_active: !current }).eq('id', id)
    }

    const getWebhookUrl = (platform: string) => {
        return `https://www.27estates.com/api/crm/webhook/${platform}`
    }

    const copyUrl = (platform: string) => {
        navigator.clipboard.writeText(getWebhookUrl(platform))
        setCopiedId(platform)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const formatDate = (d: string | null) => {
        if (!d) return 'Never'
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    if (loading) return <div className={styles.pageContent}><div className={styles.emptyState}>Loading connectors...</div></div>

    return (
        <div className={styles.pageContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Link href="/crm" style={{ color: '#6b7280' }}><ArrowLeft size={20} /></Link>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Connectors</h1>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Manage ad platform integrations and webhooks</p>
                </div>
            </div>

            {/* How it works */}
            <div className={styles.card} style={{ marginBottom: '1.5rem', borderLeft: '3px solid #BFA270' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#BFA270', marginBottom: '0.5rem' }}>How Webhooks Work</h3>
                <p style={{ fontSize: '0.8125rem', color: '#9ca3af', lineHeight: 1.6 }}>
                    Each platform gets a unique webhook URL. Configure this URL in your ad platform settings.
                    When a new lead comes in, it&apos;s automatically parsed and added to your CRM.
                    The connector pattern means you can swap platforms without changing any code.
                </p>
            </div>

            {/* Connectors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
                {connectors.map(connector => {
                    const info = platformInfo[connector.platform] || {
                        label: connector.platform, color: '#6b7280',
                        description: 'Custom connector',
                    }
                    return (
                        <div key={connector.id} className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{
                                padding: '1rem',
                                borderBottom: '1px solid #1e2030',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '0.5rem',
                                        backgroundColor: info.color + '20',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Plug size={16} style={{ color: info.color }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>{info.label}</div>
                                        <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{info.description}</div>
                                    </div>
                                </div>

                                {/* Toggle */}
                                <button
                                    onClick={() => toggleConnector(connector.id, connector.is_active)}
                                    style={{
                                        width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                                        backgroundColor: connector.is_active ? '#22c55e' : '#2d3148',
                                        position: 'relative', transition: 'background-color 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        backgroundColor: '#fff',
                                        position: 'absolute', top: '3px',
                                        left: connector.is_active ? '21px' : '3px',
                                        transition: 'left 0.2s',
                                    }} />
                                </button>
                            </div>

                            {/* Stats */}
                            <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e5e7eb' }}>{connector.leads_received}</div>
                                    <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Leads Received</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#9ca3af' }}>{formatDate(connector.last_webhook_at)}</div>
                                    <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Last Webhook</div>
                                </div>
                            </div>

                            {/* Webhook URL */}
                            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1e2030' }}>
                                <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginBottom: '0.375rem' }}>Webhook URL</div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    backgroundColor: '#0f1117', borderRadius: '0.375rem',
                                    padding: '0.5rem 0.75rem', border: '1px solid #1e2030',
                                }}>
                                    <code style={{ flex: 1, fontSize: '0.6875rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {getWebhookUrl(connector.platform)}
                                    </code>
                                    <button
                                        onClick={() => copyUrl(connector.platform)}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: copiedId === connector.platform ? '#22c55e' : '#6b7280', padding: '2px' }}
                                    >
                                        {copiedId === connector.platform ? <CheckCircle size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Setup Instructions */}
                            {(connector.platform === 'meta_ads' || connector.platform === 'google_ads') && (
                                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1e2030' }}>
                                    <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginBottom: '0.375rem' }}>Setup</div>
                                    {connector.platform === 'meta_ads' && (
                                        <ol style={{ fontSize: '0.6875rem', color: '#9ca3af', paddingLeft: '1rem', margin: 0, lineHeight: 1.8 }}>
                                            <li>Go to Meta Business Suite &gt; Integrations &gt; Leads Access</li>
                                            <li>Add webhook URL above under &quot;Webhooks&quot;</li>
                                            <li>Set verify token: <code style={{ color: '#BFA270' }}>META_WEBHOOK_VERIFY_TOKEN</code> env var</li>
                                            <li>Subscribe to <code style={{ color: '#BFA270' }}>leadgen</code> field</li>
                                        </ol>
                                    )}
                                    {connector.platform === 'google_ads' && (
                                        <ol style={{ fontSize: '0.6875rem', color: '#9ca3af', paddingLeft: '1rem', margin: 0, lineHeight: 1.8 }}>
                                            <li>Use Zapier or a relay service to forward lead form data</li>
                                            <li>Set webhook destination to the URL above</li>
                                            <li>Map fields: name, email, phone, campaign</li>
                                        </ol>
                                    )}
                                </div>
                            )}

                            {(connector.platform === '99acres' || connector.platform === 'magicbricks' || connector.platform === 'housing' || connector.platform === 'justdial') && (
                                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1e2030' }}>
                                    <div style={{ fontSize: '0.6875rem', color: '#9ca3af', lineHeight: 1.6 }}>
                                        Configure email forwarding or use their API/webhook to POST lead data to the webhook URL above.
                                        The connector auto-detects common field names (name, email, phone, etc.).
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {connectors.length === 0 && (
                <div className={styles.card}>
                    <div className={styles.emptyState}>
                        <Plug size={32} style={{ color: '#4b5563', marginBottom: '0.5rem' }} />
                        <p style={{ color: '#e5e7eb', fontWeight: 500, marginBottom: '0.5rem' }}>No connectors found</p>
                        <p style={{ fontSize: '0.8125rem' }}>Run the CRM schema SQL in Supabase to seed default connectors.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
