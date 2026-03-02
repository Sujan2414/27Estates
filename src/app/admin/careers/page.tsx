'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2, Eye, Calendar, Users } from 'lucide-react';
import styles from '../admin.module.css';

interface CareerOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    is_active: boolean;
    created_at: string;
    application_count?: number;
}

export default function AdminCareersPage() {
    const [openings, setOpenings] = useState<CareerOpening[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchOpenings();
    }, []);

    const fetchOpenings = async () => {
        // Fetch openings
        const { data, error } = await supabase
            .from('career_openings')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Fetch application counts
            const { data: appCounts } = await supabase
                .from('career_applications')
                .select('opening_id');

            const counts: Record<string, number> = {};
            appCounts?.forEach((app: { opening_id: string }) => {
                counts[app.opening_id] = (counts[app.opening_id] || 0) + 1;
            });

            setOpenings(data.map(o => ({
                ...o,
                application_count: counts[o.id] || 0,
            })));
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('career_openings')
            .delete()
            .eq('id', id);

        if (!error) {
            setOpenings(openings.filter(o => o.id !== id));
        }
        setDeleteId(null);
    };

    const toggleActive = async (id: string, currentlyActive: boolean) => {
        const { error } = await supabase
            .from('career_openings')
            .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setOpenings(openings.map(o =>
                o.id === id ? { ...o, is_active: !currentlyActive } : o
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

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Career Openings</h1>
                    <p className={styles.pageSubtitle}>Manage job listings and view applications</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/admin/careers/applications" className={styles.addButton} style={{ background: '#183C38' }}>
                        <Users size={18} />
                        Applications
                    </Link>
                    <Link href="/admin/careers/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Opening
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading openings...</div>
            ) : openings.length > 0 ? (
                <div className={styles.table}>
                    <div className={styles.tableHeader}>
                        <div className={styles.tableCell} style={{ flex: 2 }}>Title</div>
                        <div className={styles.tableCell}>Department</div>
                        <div className={styles.tableCell}>Type</div>
                        <div className={styles.tableCell}>Applications</div>
                        <div className={styles.tableCell}>Status</div>
                        <div className={styles.tableCell}>Date</div>
                        <div className={styles.tableCell}>Actions</div>
                    </div>
                    {openings.map((opening) => (
                        <div key={opening.id} className={styles.tableRow}>
                            <div className={styles.tableCell} style={{ flex: 2 }}>
                                <div>
                                    <strong>{opening.title}</strong>
                                    <p className={styles.blogExcerpt}>{opening.location}</p>
                                </div>
                            </div>
                            <div className={styles.tableCell}>{opening.department}</div>
                            <div className={styles.tableCell}>{opening.type}</div>
                            <div className={styles.tableCell}>
                                <span style={{
                                    background: (opening.application_count || 0) > 0 ? '#f0fdf4' : '#f5f5f5',
                                    color: (opening.application_count || 0) > 0 ? '#16a34a' : '#9ca3af',
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                }}>
                                    {opening.application_count || 0}
                                </span>
                            </div>
                            <div className={styles.tableCell}>
                                <button
                                    className={`${styles.statusBadge} ${opening.is_active ? styles.statusPublished : styles.statusDraft}`}
                                    onClick={() => toggleActive(opening.id, opening.is_active)}
                                >
                                    {opening.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                            <div className={styles.tableCell}>
                                <Calendar size={14} style={{ marginRight: 4 }} />
                                {formatDate(opening.created_at)}
                            </div>
                            <div className={styles.tableCell}>
                                <div className={styles.actionButtons}>
                                    <Link href={`/careers/${opening.id}`} className={styles.iconBtn} title="View">
                                        <Eye size={16} />
                                    </Link>
                                    <Link href={`/admin/careers/${opening.id}/edit`} className={styles.iconBtn} title="Edit">
                                        <Pencil size={16} />
                                    </Link>
                                    <button
                                        className={`${styles.iconBtn} ${styles.deleteIcon}`}
                                        onClick={() => setDeleteId(opening.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    No career openings yet. Create your first opening!
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Delete Career Opening?</h3>
                        <p>This will also delete all associated applications. This action cannot be undone.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>
                                Cancel
                            </button>
                            <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
