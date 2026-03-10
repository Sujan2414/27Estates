'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import styles from '../admin.module.css'

interface MigrationResult {
    id: string
    status: 'applied' | 'failed'
    error?: string
}

export default function MigratePage() {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<MigrationResult[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const runMigrations = async () => {
        setLoading(true)
        setError(null)
        setResults(null)
        try {
            const res = await fetch('/api/admin/migrate', { method: 'POST' })
            const data = await res.json()
            setResults(data.results)
            if (!data.success) {
                setError('Some migrations failed. Check results below.')
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.dashboard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <Link href="/admin" style={{ display: 'flex', alignItems: 'center', color: '#64748b', textDecoration: 'none' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Database Migrations</h1>
                    <p className={styles.pageSubtitle}>Apply pending schema changes to the database</p>
                </div>
            </div>

            <div style={{ maxWidth: '600px', background: '#fff', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={22} color="#3b82f6" />
                    </div>
                    <div>
                        <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>Pending Migrations</p>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                            floor_details · parking_count · blogs.category
                        </p>
                    </div>
                </div>

                <button
                    onClick={runMigrations}
                    disabled={loading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', background: '#3b82f6', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '0.875rem',
                        fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                    {loading ? 'Running…' : 'Run Migrations'}
                </button>

                {error && (
                    <div style={{ marginTop: '1rem', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.8125rem' }}>
                        {error}
                    </div>
                )}

                {results && (
                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {results.map(r => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: r.status === 'applied' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${r.status === 'applied' ? '#bbf7d0' : '#fecaca'}` }}>
                                {r.status === 'applied'
                                    ? <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
                                    : <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                                }
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8125rem', color: r.status === 'applied' ? '#15803d' : '#991b1b' }}>{r.id}</p>
                                    {r.error && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#991b1b' }}>{r.error}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {results && results.some(r => r.status === 'failed') && (
                    <div style={{ marginTop: '1.25rem', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.8125rem', color: '#92400e' }}>Manual fallback</p>
                        <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', color: '#78350f' }}>Run this SQL in your Supabase SQL Editor:</p>
                        <pre style={{ margin: 0, background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto' }}>
{`ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS floor_details jsonb;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS parking_count integer;

ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS category text;`}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}
