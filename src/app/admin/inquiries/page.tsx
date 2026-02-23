'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { MessageSquare, Mail, Phone, Calendar, Building2 } from 'lucide-react'
import styles from '../admin.module.css'

interface Inquiry {
    id: string
    name: string
    email: string
    phone: string
    message: string
    status: 'new' | 'read' | 'replied' | 'closed'
    created_at: string
    property_id: string | null
    properties?: {
        title: string
        property_id: string
    }
}

export default function InquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const supabase = createAdminBrowserClient()

    useEffect(() => {
        fetchInquiries()
    }, [])

    const fetchInquiries = async () => {
        const { data, error } = await supabase
            .from('inquiries')
            .select(`
        *,
        properties (title, property_id)
      `)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setInquiries(data)
        }
        setLoading(false)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('inquiries')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            setInquiries(inquiries.map(i =>
                i.id === id ? { ...i, status: newStatus as Inquiry['status'] } : i
            ))
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const filteredInquiries = filter === 'all'
        ? inquiries
        : inquiries.filter(i => i.status === filter)

    const statusColors: Record<string, string> = {
        new: '#ef4444',
        read: '#f59e0b',
        replied: '#3b82f6',
        closed: '#22c55e'
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Inquiries</h1>
                    <p className={styles.pageSubtitle}>Manage customer inquiries and messages</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                {['all', 'new', 'read', 'replied', 'closed'].map(status => (
                    <button
                        key={status}
                        className={`${styles.filterTab} ${filter === status ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== 'all' && (
                            <span className={styles.filterCount}>
                                {inquiries.filter(i => i.status === status).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading inquiries...</div>
            ) : filteredInquiries.length > 0 ? (
                <div className={styles.inquiriesList}>
                    {filteredInquiries.map((inquiry) => (
                        <div key={inquiry.id} className={styles.inquiryCard}>
                            <div className={styles.inquiryHeader}>
                                <div className={styles.inquiryInfo}>
                                    <h3 className={styles.inquiryName}>{inquiry.name}</h3>
                                    <div className={styles.inquiryContact}>
                                        <a href={`mailto:${inquiry.email}`}>
                                            <Mail size={14} />
                                            {inquiry.email}
                                        </a>
                                        {inquiry.phone && (
                                            <a href={`tel:${inquiry.phone}`}>
                                                <Phone size={14} />
                                                {inquiry.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.inquiryMeta}>
                                    <span
                                        className={styles.statusDot}
                                        style={{ backgroundColor: statusColors[inquiry.status] }}
                                    />
                                    <select
                                        value={inquiry.status}
                                        onChange={(e) => updateStatus(inquiry.id, e.target.value)}
                                        className={styles.statusSelect}
                                    >
                                        <option value="new">New</option>
                                        <option value="read">Read</option>
                                        <option value="replied">Replied</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            {inquiry.properties && (
                                <div className={styles.propertyLink}>
                                    <Building2 size={14} />
                                    <Link href={`/properties/${inquiry.property_id}`}>
                                        {inquiry.properties.title} ({inquiry.properties.property_id})
                                    </Link>
                                </div>
                            )}

                            <p className={styles.inquiryMessage}>
                                <MessageSquare size={14} />
                                {inquiry.message}
                            </p>

                            <div className={styles.inquiryFooter}>
                                <span className={styles.inquiryDate}>
                                    <Calendar size={14} />
                                    {formatDate(inquiry.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    {filter === 'all' ? 'No inquiries yet.' : `No ${filter} inquiries.`}
                </div>
            )}
        </div>
    )
}
