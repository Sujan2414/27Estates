'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, Clock, GripVertical } from 'lucide-react'
import styles from '../../admin.module.css'

interface PipelineLead {
    id: string
    name: string
    phone: string | null
    email: string | null
    source: string
    status: string
    priority: string
    created_at: string
    properties?: { title: string } | null
}

const columns = [
    { key: 'new', label: 'New', color: '#3b82f6' },
    { key: 'contacted', label: 'Contacted', color: '#f59e0b' },
    { key: 'qualified', label: 'Qualified', color: '#8b5cf6' },
    { key: 'negotiation', label: 'Negotiation', color: '#f97316' },
    { key: 'site_visit', label: 'Site Visit', color: '#06b6d4' },
    { key: 'converted', label: 'Converted', color: '#22c55e' },
]

const sourceLabels: Record<string, string> = {
    website: 'Web', meta_ads: 'Meta', google_ads: 'Google',
    '99acres': '99ac', magicbricks: 'MB', housing: 'Hsg',
    justdial: 'JD', chatbot: 'Chat', manual: 'Manual',
}

export default function PipelinePage() {
    const [leads, setLeads] = useState<PipelineLead[]>([])
    const [loading, setLoading] = useState(true)
    const [dragging, setDragging] = useState<string | null>(null)

    const fetchLeads = async () => {
        const res = await fetch('/api/crm/leads?limit=200')
        if (res.ok) {
            const data = await res.json()
            setLeads(data.leads || [])
        }
        setLoading(false)
    }

    useEffect(() => { fetchLeads() }, [])

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData('text/plain', leadId)
        setDragging(leadId)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault()
        const leadId = e.dataTransfer.getData('text/plain')
        setDragging(null)

        const lead = leads.find(l => l.id === leadId)
        if (!lead || lead.status === newStatus) return

        // Optimistic update
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l))

        await fetch(`/api/crm/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        })
    }

    const daysInStage = (createdAt: string) => {
        return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/crm" style={{ color: '#6b7280' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>Pipeline View</h1>
                        <p className={styles.pageSubtitle}>Drag and drop leads between stages</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading pipeline...</div>
            ) : (
                <div style={{
                    display: 'flex', gap: '1rem', overflowX: 'auto',
                    paddingBottom: '1rem', minHeight: '70vh',
                }}>
                    {columns.map(col => {
                        const colLeads = leads.filter(l => l.status === col.key)
                        return (
                            <div
                                key={col.key}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.key)}
                                style={{
                                    flex: '1 0 220px',
                                    minWidth: '220px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '0.75rem',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {/* Column Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: '0.75rem', padding: '0.5rem',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
                                            {col.label}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '0.125rem 0.5rem', borderRadius: '9999px',
                                        backgroundColor: `${col.color}20`, color: col.color,
                                        fontSize: '0.75rem', fontWeight: 600,
                                    }}>
                                        {colLeads.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    {colLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead.id)}
                                            onClick={() => window.location.href = `/admin/crm/leads/${lead.id}`}
                                            style={{
                                                backgroundColor: '#fff',
                                                borderRadius: '0.5rem',
                                                padding: '0.75rem',
                                                border: '1px solid #e5e7eb',
                                                cursor: 'grab',
                                                opacity: dragging === lead.id ? 0.5 : 1,
                                                transition: 'box-shadow 0.2s',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>{lead.name}</span>
                                                <span style={{ fontSize: '0.625rem', fontWeight: 500, color: '#9ca3af' }}>
                                                    {lead.priority === 'hot' ? '🔥' : lead.priority === 'warm' ? '🟡' : '🔵'}
                                                </span>
                                            </div>
                                            {lead.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                                    <Phone size={10} /> {lead.phone}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                <span style={{
                                                    padding: '0.125rem 0.375rem', borderRadius: '4px',
                                                    fontSize: '0.625rem', backgroundColor: '#f3f4f6', color: '#6b7280',
                                                }}>
                                                    {sourceLabels[lead.source] || lead.source}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', color: '#9ca3af' }}>
                                                    <Clock size={10} /> {daysInStage(lead.created_at)}d
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
