'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Download, Calendar, Mail, Phone, Building2 } from 'lucide-react';
import styles from '../../admin.module.css';

interface CareerApplication {
    id: string;
    opening_id: string;
    full_name: string;
    email: string;
    phone: string;
    resume_url: string | null;
    cover_letter: string | null;
    current_company: string | null;
    experience_years: string | null;
    status: string;
    created_at: string;
    opening_title?: string;
}

interface CareerOpening {
    id: string;
    title: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    new: { bg: '#eff6ff', text: '#2563eb' },
    reviewed: { bg: '#fefce8', text: '#ca8a04' },
    shortlisted: { bg: '#f0fdf4', text: '#16a34a' },
    rejected: { bg: '#fef2f2', text: '#dc2626' },
};

export default function AdminApplicationsPage() {
    const [applications, setApplications] = useState<CareerApplication[]>([]);
    const [openings, setOpenings] = useState<CareerOpening[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterOpening, setFilterOpening] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Fetch openings for filter + display
        const { data: openingsData } = await supabase
            .from('career_openings')
            .select('id, title')
            .order('created_at', { ascending: false });

        if (openingsData) setOpenings(openingsData);

        // Fetch all applications
        const { data: appsData, error } = await supabase
            .from('career_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && appsData && openingsData) {
            const titleMap: Record<string, string> = {};
            openingsData.forEach(o => { titleMap[o.id] = o.title; });

            setApplications(appsData.map(a => ({
                ...a,
                opening_title: titleMap[a.opening_id] || 'Unknown Position',
            })));
        }

        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('career_applications')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setApplications(applications.map(a =>
                a.id === id ? { ...a, status: newStatus } : a
            ));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const filtered = applications.filter(a => {
        if (filterOpening !== 'all' && a.opening_id !== filterOpening) return false;
        if (filterStatus !== 'all' && a.status !== filterStatus) return false;
        return true;
    });

    const selectStyle: React.CSSProperties = {
        padding: '0.5rem 0.75rem',
        border: '1px solid #d4d0c9',
        borderRadius: '8px',
        fontSize: '0.85rem',
        background: '#fff',
        color: '#183C38',
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/careers" style={{ color: '#BFA270' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>Applications</h1>
                        <p className={styles.pageSubtitle}>{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <select value={filterOpening} onChange={(e) => setFilterOpening(e.target.value)} style={selectStyle}>
                    <option value="all">All Positions</option>
                    {openings.map(o => (
                        <option key={o.id} value={o.id}>{o.title}</option>
                    ))}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading applications...</div>
            ) : filtered.length > 0 ? (
                <div className={styles.table}>
                    <div className={styles.tableHeader}>
                        <div className={styles.tableCell} style={{ flex: 1.5 }}>Applicant</div>
                        <div className={styles.tableCell} style={{ flex: 1.5 }}>Position</div>
                        <div className={styles.tableCell}>Experience</div>
                        <div className={styles.tableCell}>Date</div>
                        <div className={styles.tableCell}>Status</div>
                        <div className={styles.tableCell}>Resume</div>
                    </div>
                    {filtered.map((app) => {
                        const statusColor = STATUS_COLORS[app.status] || STATUS_COLORS.new;
                        return (
                            <div key={app.id} className={styles.tableRow}>
                                <div className={styles.tableCell} style={{ flex: 1.5 }}>
                                    <div>
                                        <strong>{app.full_name}</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.2rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Mail size={11} /> {app.email}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Phone size={11} /> {app.phone}
                                            </span>
                                            {app.current_company && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Building2 size={11} /> {app.current_company}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.tableCell} style={{ flex: 1.5 }}>
                                    {app.opening_title}
                                </div>
                                <div className={styles.tableCell}>
                                    {app.experience_years || '—'}
                                </div>
                                <div className={styles.tableCell}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Calendar size={13} />
                                        {formatDate(app.created_at)}
                                    </span>
                                </div>
                                <div className={styles.tableCell}>
                                    <select
                                        value={app.status}
                                        onChange={(e) => updateStatus(app.id, e.target.value)}
                                        style={{
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '6px',
                                            border: 'none',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            background: statusColor.bg,
                                            color: statusColor.text,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="new">New</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="shortlisted">Shortlisted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className={styles.tableCell}>
                                    {app.resume_url ? (
                                        <a
                                            href={app.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.iconBtn}
                                            title="Download Resume"
                                        >
                                            <Download size={16} />
                                        </a>
                                    ) : (
                                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>—</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    {applications.length > 0 ? 'No applications match the current filters.' : 'No applications received yet.'}
                </div>
            )}
        </div>
    );
}
