'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    MapPin, Briefcase, Clock, ChevronLeft,
    CheckCircle2, Upload, ArrowRight
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { createClient } from '@/lib/supabase/client';
import styles from '../careers.module.css';

interface CareerOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    experience: string | null;
    description: string | null;
    responsibilities: string[];
    requirements: string[];
    is_active: boolean;
    created_at: string;
}

interface CareerDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function CareerDetailPage({ params }: CareerDetailPageProps) {
    const resolvedParams = use(params);
    const supabase = createClient();

    const [opening, setOpening] = useState<CareerOpening | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        cover_letter: '',
        current_company: '',
        experience_years: '',
    });

    useEffect(() => {
        const fetchOpening = async () => {
            const { data, error } = await supabase
                .from('career_openings')
                .select('*')
                .eq('id', resolvedParams.id)
                .eq('is_active', true)
                .single();

            if (!error && data) {
                setOpening(data);
            }
            setLoading(false);
        };

        fetchOpening();
    }, [resolvedParams.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResumeFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opening || submitting) return;

        setSubmitting(true);

        try {
            let resumeUrl = '';

            // Upload resume if provided
            if (resumeFile) {
                const fileExt = resumeFile.name.split('.').pop();
                const fileName = `${Date.now()}-${form.full_name.replace(/\s+/g, '_')}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('career-resumes')
                    .upload(fileName, resumeFile);

                if (uploadError) {
                    console.error('Resume upload error:', uploadError);
                    alert('Failed to upload resume. Please try again.');
                    setSubmitting(false);
                    return;
                }

                const { data: urlData } = supabase.storage
                    .from('career-resumes')
                    .getPublicUrl(uploadData.path);

                resumeUrl = urlData.publicUrl;
            }

            // Submit application
            const { error } = await supabase
                .from('career_applications')
                .insert({
                    opening_id: opening.id,
                    full_name: form.full_name,
                    email: form.email,
                    phone: form.phone,
                    resume_url: resumeUrl || null,
                    cover_letter: form.cover_letter || null,
                    current_company: form.current_company || null,
                    experience_years: form.experience_years || null,
                    status: 'new',
                });

            if (error) {
                console.error('Application submit error:', error);
                alert('Failed to submit application. Please try again.');
            } else {
                setSubmitted(true);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Something went wrong. Please try again.');
        }

        setSubmitting(false);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-light-grey">
                <Navigation alwaysScrolled={false} />
                <div style={{ paddingTop: '120px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
            </main>
        );
    }

    if (!opening) {
        return (
            <main className="min-h-screen bg-light-grey">
                <Navigation alwaysScrolled={false} />
                <div style={{ paddingTop: '120px' }}>
                    <div className={styles.detailContainer}>
                        <div className={styles.emptyState}>
                            <h3 className={styles.emptyStateTitle}>Position Not Found</h3>
                            <p className={styles.emptyStateText}>
                                This position may have been filled or is no longer available.
                            </p>
                            <Link href="/careers" style={{ color: '#BFA270', marginTop: '1rem', display: 'inline-block' }}>
                                ← Back to Careers
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-light-grey">
            <Navigation alwaysScrolled={false} />

            <PageHero
                title={opening.title}
                subtitle={`${opening.department} · ${opening.location}`}
                backgroundImage="https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?auto=format&fit=crop&q=80&w=2070"
            />

            <div style={{
                position: 'relative',
                zIndex: 10,
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                marginTop: '-24px',
                backgroundColor: '#ffffff',
            }}>
                <div className={styles.detailContainer}>
                    <Link href="/careers" className={styles.backLink}>
                        <ChevronLeft size={16} /> Back to all positions
                    </Link>

                    {/* Two-column layout: Form left, Details right */}
                    <div className={styles.detailTwoCol}>

                        {/* LEFT — Application Form (sticky) */}
                        <div className={styles.detailLeft}>
                            <motion.div
                                className={styles.formSection}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                {submitted ? (
                                    <div className={styles.successMessage}>
                                        <CheckCircle2 size={56} className={styles.successIcon} />
                                        <h3 className={styles.successTitle}>Application Submitted!</h3>
                                        <p className={styles.successText}>
                                            Thank you for applying. Our team will review your application and get back to you soon.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className={styles.formTitle}>Apply for this Position</h3>
                                        <p className={styles.formSubtitle}>
                                            Fill in your details below and we&apos;ll get back to you.
                                        </p>

                                        <form onSubmit={handleSubmit} className={styles.formGrid}>
                                            <div className={styles.formGroupFull}>
                                                <label className={styles.formLabel}>
                                                    Full Name <span className={styles.formRequired}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    value={form.full_name}
                                                    onChange={handleChange}
                                                    required
                                                    className={styles.formInput}
                                                    placeholder="Enter your full name"
                                                />
                                            </div>

                                            <div className={styles.formGroupFull}>
                                                <label className={styles.formLabel}>
                                                    Email <span className={styles.formRequired}>*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    required
                                                    className={styles.formInput}
                                                    placeholder="your@email.com"
                                                />
                                            </div>

                                            <div className={styles.formGroupFull}>
                                                <label className={styles.formLabel}>
                                                    Phone <span className={styles.formRequired}>*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    required
                                                    className={styles.formInput}
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>

                                            <div className={styles.formGroupFull}>
                                                <label className={styles.formLabel}>Experience</label>
                                                <select
                                                    name="experience_years"
                                                    value={form.experience_years}
                                                    onChange={handleChange}
                                                    className={styles.formInput}
                                                >
                                                    <option value="">Select experience</option>
                                                    <option value="Fresher">Fresher</option>
                                                    <option value="0-1 years">0-1 years</option>
                                                    <option value="1-3 years">1-3 years</option>
                                                    <option value="3-5 years">3-5 years</option>
                                                    <option value="5-10 years">5-10 years</option>
                                                    <option value="10+ years">10+ years</option>
                                                </select>
                                            </div>

                                            <div className={styles.formGroupFull}>
                                                <label className={styles.formLabel}>Current Company</label>
                                                <input
                                                    type="text"
                                                    name="current_company"
                                                    value={form.current_company}
                                                    onChange={handleChange}
                                                    className={styles.formInput}
                                                    placeholder="Current or latest company"
                                                />
                                            </div>

                                            <div className={styles.formGroupFull}>
                                                <label className={styles.formLabel}>Resume</label>
                                                <label className={styles.formFileLabel}>
                                                    <Upload size={18} />
                                                    {resumeFile ? (
                                                        <span className={styles.formFileName}>{resumeFile.name}</span>
                                                    ) : (
                                                        <span>Upload Resume (PDF, DOC)</span>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={handleFileChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                            </div>

                                            <div className={styles.formGroupFull}>
                                                <label className={styles.formLabel}>Cover Letter</label>
                                                <textarea
                                                    name="cover_letter"
                                                    value={form.cover_letter}
                                                    onChange={handleChange}
                                                    className={styles.formTextarea}
                                                    placeholder="Tell us why you'd be a great fit..."
                                                    rows={4}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className={styles.submitBtn}
                                                disabled={submitting}
                                            >
                                                {submitting ? 'Submitting...' : 'Submit Application'}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        {/* RIGHT — Job Details */}
                        <div className={styles.detailRight}>
                            {/* Badges */}
                            <motion.div
                                className={styles.detailBadges}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                            >
                                <span className={styles.detailBadge}>
                                    <Briefcase size={14} /> {opening.department}
                                </span>
                                <span className={styles.detailBadge}>
                                    <MapPin size={14} /> {opening.location}
                                </span>
                                <span className={styles.detailBadge}>
                                    <Clock size={14} /> {opening.type}
                                </span>
                                {opening.experience && (
                                    <span className={styles.detailBadge}>
                                        {opening.experience} experience
                                    </span>
                                )}
                            </motion.div>

                            {/* Description */}
                            {opening.description && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                >
                                    <h2 className={styles.sectionHeading}>About the Role</h2>
                                    <p className={styles.descriptionText}>{opening.description}</p>
                                </motion.div>
                            )}

                            {/* Responsibilities */}
                            {opening.responsibilities && opening.responsibilities.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    <h2 className={styles.sectionHeading}>Responsibilities</h2>
                                    <ul className={styles.bulletList}>
                                        {opening.responsibilities.map((item, i) => (
                                            <li key={i} className={styles.bulletItem}>
                                                <ArrowRight size={14} className={styles.bulletIcon} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}

                            {/* Requirements */}
                            {opening.requirements && opening.requirements.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                >
                                    <h2 className={styles.sectionHeading}>Requirements</h2>
                                    <ul className={styles.bulletList}>
                                        {opening.requirements.map((item, i) => (
                                            <li key={i} className={styles.bulletItem}>
                                                <CheckCircle2 size={14} className={styles.bulletIcon} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </main>
    );
}
