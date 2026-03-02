'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Clock, ArrowUpRight, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { createClient } from '@/lib/supabase/client';
import styles from './careers.module.css';

interface CareerOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    experience: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    }
};

export default function CareersPage() {
    const [openings, setOpenings] = useState<CareerOpening[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOpenings = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('career_openings')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setOpenings(data);
            }
            setLoading(false);
        };

        fetchOpenings();
    }, []);

    return (
        <main className="min-h-screen bg-light-grey">
            <Navigation alwaysScrolled={false} />

            <PageHero
                title="Careers"
                subtitle="Build the future of real estate with us"
                backgroundImage="https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=2070"
            />

            <div style={{
                position: 'relative',
                zIndex: 10,
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                marginTop: '-24px',
                backgroundColor: '#ffffff',
            }}>
                <div className="container mx-auto px-4" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
                    {/* Section Header */}
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.6 }}
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#BFA270',
                                marginBottom: '1rem',
                            }}
                        >
                            Join Our Team
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                                fontWeight: 500,
                                letterSpacing: '-0.02em',
                                color: '#183C38',
                                marginBottom: '1.25rem',
                                lineHeight: 1.2,
                            }}
                        >
                            Open Positions
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '1.0625rem',
                                lineHeight: 1.7,
                                color: '#0E110F',
                                opacity: 0.8,
                                maxWidth: '550px',
                                margin: '0 auto',
                            }}
                        >
                            We&apos;re always looking for talented individuals who share our passion for excellence in real estate. Explore our current openings below.
                        </motion.p>
                    </div>

                    {/* Job Listings */}
                    {loading ? (
                        <div className={styles.emptyState}>Loading openings...</div>
                    ) : openings.length > 0 ? (
                        <motion.div
                            className={styles.jobsGrid}
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-50px' }}
                        >
                            {openings.map((opening) => (
                                <motion.div key={opening.id} variants={itemVariants}>
                                    <Link
                                        href={`/careers/${opening.id}`}
                                        className={styles.jobCard}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <span className={styles.jobType}>{opening.type}</span>
                                        <div className={styles.jobCardHeader}>
                                            <h3 className={styles.jobTitle}>{opening.title}</h3>
                                            <ArrowUpRight size={20} className={styles.jobArrow} />
                                        </div>
                                        <div className={styles.jobMeta}>
                                            <span className={styles.jobMetaItem}>
                                                <Briefcase size={14} />
                                                {opening.department}
                                            </span>
                                            <span className={styles.jobMetaItem}>
                                                <MapPin size={14} />
                                                {opening.location}
                                            </span>
                                            {opening.experience && (
                                                <span className={styles.jobMetaItem}>
                                                    <Clock size={14} />
                                                    {opening.experience}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className={styles.emptyState}>
                            <Search size={48} style={{ color: '#d4d0c9', marginBottom: '1rem' }} />
                            <h3 className={styles.emptyStateTitle}>No Openings Right Now</h3>
                            <p className={styles.emptyStateText}>
                                We don&apos;t have any openings at the moment, but we&apos;re always looking for talent. Check back soon or send your resume to <a href="mailto:connect@27estates.com" style={{ color: '#BFA270' }}>connect@27estates.com</a>
                            </p>
                        </div>
                    )}
                </div>

                <Footer />
            </div>
        </main>
    );
}
