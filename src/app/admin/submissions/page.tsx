'use client';

import React, { useEffect, useState } from 'react';
import { createAdminBrowserClient } from '@/lib/supabase/client';
import { Mail, Phone, DollarSign, Home, Calendar, Trash2 } from 'lucide-react';
import Image from 'next/image';
import styles from '../admin.module.css';

interface Submission {
    id: string;
    name: string;
    email: string;
    phone: string;
    property_type: string;
    deal_type: string;
    property_category: string;
    description: string;
    expected_price: number;
    city: string;
    images: string[];
    status: string;
    created_at: string;
}

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [userRole, setUserRole] = useState<string>('');
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);
    const supabase = createAdminBrowserClient();

    useEffect(() => {
        fetchSubmissions();
        fetchUserRole();
    }, []);

    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (profile) setUserRole(profile.role || '');
        }
    };

    const canDelete = userRole === 'admin' || userRole === 'super_admin';

    const fetchSubmissions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('property_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching submissions:', error);
        } else {
            setSubmissions(data || []);
        }
        setIsLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('property_submissions')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: newStatus } : sub));
        }
    };

    const deleteSubmission = async (id: string) => {
        if (!confirm('Are you sure you want to delete this submission?')) return;
        const { error } = await supabase
            .from('property_submissions')
            .delete()
            .eq('id', id);
        if (!error) {
            setSubmissions(prev => prev.filter(sub => sub.id !== id));
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusColors: Record<string, string> = {
        new: '#ef4444',
        contacted: '#f59e0b',
        converted: '#22c55e',
        rejected: '#6b7280'
    };

    const filteredSubmissions = filter === 'all'
        ? submissions
        : submissions.filter(s => s.status === filter);

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Property Submissions</h1>
                    <p className={styles.pageSubtitle}>Manage property submissions from users</p>
                </div>
            </div>

            <div className={styles.filterTabs}>
                {['all', 'new', 'contacted', 'converted', 'rejected'].map(status => (
                    <button
                        key={status}
                        className={`${styles.filterTab} ${filter === status ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== 'all' && (
                            <span className={styles.filterCount}>
                                {submissions.filter(s => s.status === status).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className={styles.emptyState}>Loading submissions...</div>
            ) : filteredSubmissions.length > 0 ? (
                <div className={styles.inquiriesList}>
                    {filteredSubmissions.map((sub) => (
                        <div key={sub.id} className={styles.inquiryCard}>
                            <div className={styles.inquiryHeader}>
                                <div className={styles.inquiryInfo}>
                                    <h3>{sub.property_category || sub.deal_type} &mdash; {sub.property_type === 'Sale' ? 'For Sale' : 'For Rent'}</h3>
                                    <div className={styles.inquiryContact}>
                                        <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                                            {sub.name}
                                        </span>
                                        <a href={`mailto:${sub.email}`}>
                                            <Mail size={14} />
                                            {sub.email}
                                        </a>
                                        {sub.phone && (
                                            <a href={`tel:${sub.phone}`}>
                                                <Phone size={14} />
                                                {sub.phone}
                                            </a>
                                        )}
                                        {sub.expected_price && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#047857', fontWeight: 600 }}>
                                                &#8377;{sub.expected_price.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.inquiryMeta}>
                                    <span
                                        className={styles.statusDot}
                                        style={{ backgroundColor: statusColors[sub.status] || '#6b7280' }}
                                    />
                                    <select
                                        value={sub.status}
                                        onChange={(e) => updateStatus(sub.id, e.target.value)}
                                        className={styles.statusSelect}
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="converted">Converted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            {sub.description && (
                                <p className={styles.inquiryMessage}>
                                    <Home size={14} style={{ flexShrink: 0, marginTop: 3 }} />
                                    {sub.description}
                                </p>
                            )}

                            {sub.images && sub.images.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                                    {sub.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setLightboxImg(img)}
                                            style={{ position: 'relative', width: 64, height: 64, flexShrink: 0, borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                        >
                                            <Image src={img} alt={`Property ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.inquiryFooter} style={{ justifyContent: 'space-between' }}>
                                {canDelete ? (
                                    <button
                                        onClick={() => deleteSubmission(sub.id)}
                                        className={styles.deleteBtn}
                                        style={{ flex: 'none', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                ) : <div />}
                                <span className={styles.inquiryDate}>
                                    <Calendar size={14} />
                                    {formatDate(sub.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    {filter === 'all' ? 'No submissions yet.' : `No ${filter} submissions.`}
                </div>
            )}

            {/* Lightbox Modal */}
            {lightboxImg && (
                <div
                    onClick={() => setLightboxImg(null)}
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out', padding: '2rem' }}
                >
                    <button
                        onClick={() => setLightboxImg(null)}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '1.5rem', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        &times;
                    </button>
                    <img
                        src={lightboxImg}
                        alt="Full view"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '0.5rem', cursor: 'default' }}
                    />
                </div>
            )}
        </div>
    );
}
