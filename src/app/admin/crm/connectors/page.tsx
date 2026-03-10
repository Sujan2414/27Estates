'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plug, Copy, Check, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from '../../admin.module.css'
import type { AdConnector } from '@/lib/crm/types'

const platformIcons: Record<string, string> = {
    meta_ads: '📘',
    google_ads: '🔍',
    '99acres': '🏠',
    magicbricks: '🧱',
    housing: '🏡',
    justdial: '📞',
}

const platformDocs: Record<string, string> = {
    meta_ads: 'https://developers.facebook.com/docs/marketing-api/guides/lead-ads/',
    google_ads: 'https://developers.google.com/google-ads/api/docs/leads/overview',
}

export default function ConnectorsPage() {
    const [connectors, setConnectors] = useState<AdConnector[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState<string | null>(null)
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
    }, [])

    const getWebhookUrl = (platform: string) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        return `${baseUrl}/api/crm/webhook/${platform}`
    }

    const copyToClipboard = async (text: string, platform: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(platform)
        setTimeout(() => setCopied(null), 2000)
    }

    const toggleConnector = async (id: string, currentState: boolean) => {
        await supabase
            .from('ad_connectors')
            .update({ is_active: !currentState })
            .eq('id', id)

        setConnectors(connectors.map(c =>
            c.id === id ? { ...c, is_active: !currentState } : c
        ))
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/crm" style={{ color: '#6b7280' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>Ad Platform Connectors</h1>
                        <p className={styles.pageSubtitle}>Connect your ad platforms to receive leads automatically</p>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className={styles.sectionCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>How it works</h3>
                <p style={{ fontSize: '0.8125rem', color: '#166534', lineHeight: 1.6 }}>
                    Each platform has a unique webhook URL. When a lead submits a form on your ad, the platform sends the data to this URL,
                    and it automatically appears in your CRM. Copy the webhook URL below and paste it in your ad platform settings.
                </p>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading connectors...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {connectors.map(connector => (
                        <div key={connector.id} className={styles.sectionCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{platformIcons[connector.platform] || '🔗'}</span>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{connector.display_name}</h3>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            {connector.leads_count} leads received
                                            {connector.last_synced_at && ` · Last: ${new Date(connector.last_synced_at).toLocaleDateString('en-IN')}`}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleConnector(connector.id, connector.is_active)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: connector.is_active ? '#22c55e' : '#9ca3af' }}
                                >
                                    {connector.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>

                            {/* Webhook URL */}
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                                    Webhook URL
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <code style={{
                                        flex: 1, padding: '0.5rem 0.75rem', backgroundColor: '#f3f4f6',
                                        borderRadius: '0.375rem', fontSize: '0.75rem', color: '#374151',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {getWebhookUrl(connector.platform)}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(getWebhookUrl(connector.platform), connector.platform)}
                                        className={styles.iconBtn}
                                        style={{ color: copied === connector.platform ? '#22c55e' : '#6b7280' }}
                                    >
                                        {copied === connector.platform ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Setup Instructions */}
                            {connector.platform === 'meta_ads' && (
                                <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.6 }}>
                                    <strong>Setup:</strong> Go to Meta Business Suite → Settings → Webhooks → Subscribe to &quot;leadgen&quot; events.
                                    Paste the webhook URL above. Set verify token to your <code>META_WEBHOOK_VERIFY_TOKEN</code> env var.
                                    {platformDocs[connector.platform] && (
                                        <a href={platformDocs[connector.platform]} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem', color: '#183C38' }}>
                                            Docs <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            )}
                            {connector.platform === 'google_ads' && (
                                <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.6 }}>
                                    <strong>Setup:</strong> In Google Ads, go to Lead Form Extensions → Webhook delivery → paste the URL above.
                                    Set the webhook key in your <code>GOOGLE_ADS_WEBHOOK_SECRET</code> env var.
                                </div>
                            )}
                            {['99acres', 'magicbricks', 'housing', 'justdial'].includes(connector.platform) && (
                                <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.6 }}>
                                    <strong>Setup:</strong> Contact your {connector.display_name} account manager and provide this webhook URL for lead notifications.
                                    If they send leads via email instead, you can manually add them or use a Zapier integration.
                                </div>
                            )}

                            {/* Environment Variables Needed */}
                            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fffbeb', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#92400e' }}>
                                <strong>Env vars needed:</strong>{' '}
                                {connector.platform === 'meta_ads' && 'META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN'}
                                {connector.platform === 'google_ads' && 'GOOGLE_ADS_WEBHOOK_SECRET'}
                                {['99acres', 'magicbricks', 'housing', 'justdial'].includes(connector.platform) &&
                                    `${connector.platform.toUpperCase().replace(/[^A-Z]/g, '_')}_WEBHOOK_SECRET (optional)`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
