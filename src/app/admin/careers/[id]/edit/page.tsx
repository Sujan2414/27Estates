'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import styles from '../../../admin.module.css';

interface EditCareerPageProps {
    params: Promise<{ id: string }>;
}

export default function EditCareerOpeningPage({ params }: EditCareerPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const supabase = createClient();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        title: '',
        department: '',
        location: '',
        type: 'Full-Time',
        experience: '',
        description: '',
        is_active: true,
    });

    const [responsibilities, setResponsibilities] = useState<string[]>(['']);
    const [requirements, setRequirements] = useState<string[]>(['']);

    useEffect(() => {
        const fetchOpening = async () => {
            const { data, error } = await supabase
                .from('career_openings')
                .select('*')
                .eq('id', resolvedParams.id)
                .single();

            if (!error && data) {
                setForm({
                    title: data.title || '',
                    department: data.department || '',
                    location: data.location || '',
                    type: data.type || 'Full-Time',
                    experience: data.experience || '',
                    description: data.description || '',
                    is_active: data.is_active,
                });
                setResponsibilities(data.responsibilities?.length > 0 ? data.responsibilities : ['']);
                setRequirements(data.requirements?.length > 0 ? data.requirements : ['']);
            }
            setLoading(false);
        };

        fetchOpening();
    }, [resolvedParams.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleListChange = (list: 'responsibilities' | 'requirements', idx: number, val: string) => {
        const setter = list === 'responsibilities' ? setResponsibilities : setRequirements;
        setter(prev => prev.map((item, i) => i === idx ? val : item));
    };

    const addListItem = (list: 'responsibilities' | 'requirements') => {
        const setter = list === 'responsibilities' ? setResponsibilities : setRequirements;
        setter(prev => [...prev, '']);
    };

    const removeListItem = (list: 'responsibilities' | 'requirements', idx: number) => {
        const setter = list === 'responsibilities' ? setResponsibilities : setRequirements;
        setter(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);

        const payload = {
            ...form,
            responsibilities: responsibilities.filter(r => r.trim() !== ''),
            requirements: requirements.filter(r => r.trim() !== ''),
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('career_openings')
            .update(payload)
            .eq('id', resolvedParams.id);

        if (error) {
            console.error('Error updating opening:', error);
            alert('Failed to update opening. Please try again.');
            setSaving(false);
            return;
        }

        router.push('/admin/careers');
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.65rem 0.85rem',
        border: '1px solid #d4d0c9',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-sans)',
        background: '#fff',
        color: '#183C38',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#183C38',
        marginBottom: '0.35rem',
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
    };

    if (loading) {
        return <div className={styles.dashboard}><div className={styles.emptyState}>Loading...</div></div>;
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/careers" style={{ color: '#BFA270' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>Edit Opening</h1>
                        <p className={styles.pageSubtitle}>{form.title}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Job Title *</label>
                        <input type="text" name="title" value={form.title} onChange={handleChange} required style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Department *</label>
                        <input type="text" name="department" value={form.department} onChange={handleChange} required style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Location *</label>
                        <input type="text" name="location" value={form.location} onChange={handleChange} required style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Employment Type</label>
                        <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Experience Required</label>
                        <input type="text" name="experience" value={form.experience} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} />
                    </div>
                </div>

                {/* Responsibilities */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Responsibilities</label>
                    {responsibilities.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input type="text" value={item} onChange={(e) => handleListChange('responsibilities', idx, e.target.value)} style={inputStyle} />
                            <button type="button" onClick={() => removeListItem('responsibilities', idx)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e54d4d', padding: '0.5rem' }}>
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addListItem('responsibilities')}
                        style={{ background: 'none', border: '1px dashed #d4d0c9', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: '#BFA270', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Plus size={14} /> Add Responsibility
                    </button>
                </div>

                {/* Requirements */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={labelStyle}>Requirements</label>
                    {requirements.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input type="text" value={item} onChange={(e) => handleListChange('requirements', idx, e.target.value)} style={inputStyle} />
                            <button type="button" onClick={() => removeListItem('requirements', idx)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e54d4d', padding: '0.5rem' }}>
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addListItem('requirements')}
                        style={{ background: 'none', border: '1px dashed #d4d0c9', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: '#BFA270', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Plus size={14} /> Add Requirement
                    </button>
                </div>

                {/* Active Toggle */}
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active"
                        style={{ width: '18px', height: '18px', accentColor: '#BFA270' }} />
                    <label htmlFor="is_active" style={{ fontSize: '0.9rem', color: '#183C38', cursor: 'pointer' }}>
                        Active (visible on careers page)
                    </label>
                </div>

                <button type="submit" disabled={saving}
                    style={{
                        padding: '0.75rem 2rem', background: '#183C38', color: '#fff', border: 'none', borderRadius: '8px',
                        fontSize: '0.9rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                    }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
