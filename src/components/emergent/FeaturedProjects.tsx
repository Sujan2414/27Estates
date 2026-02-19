'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import styles from '../FeaturedProperties.module.css';
import { useAuth } from '@/context/AuthContext';
import FeaturedAdCard from '@/components/FeaturedAdCard';

type Project = Database['public']['Tables']['projects']['Row'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
    }
};

const FeaturedProjects: React.FC = () => {
    const { checkAuthAndNavigate, showAuthModal } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('is_featured', true)
                .limit(3);

            if (data) setProjects(data);
        };
        fetchProjects();
    }, [supabase]);

    if (projects.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.contentCard}>
                    {/* Header */}
                    <div className={styles.header}>
                        <motion.p
                            className={styles.subtitle}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            New Developments
                        </motion.p>
                        <motion.h2
                            className={styles.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                        >
                            Exclusive Projects
                        </motion.h2>
                        <motion.p
                            className={styles.description}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            Discover our handpicked collection of upcoming premium communities.
                        </motion.p>
                    </div>

                    {/* Projects Grid */}
                    <motion.div
                        className={styles.grid}
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                variants={itemVariants}
                            >
                                <FeaturedAdCard
                                    id={project.id}
                                    type="project"
                                    image={project.images?.[0] || '/placeholder-project.jpg'}
                                    title={project.project_name}
                                    location={project.location || ''}
                                    city={project.city || undefined}
                                    price={project.min_price ? `${project.min_price} Onwards` : ''}
                                    status={project.status || undefined}
                                    bhk={project.bhk_options?.join(', ') || undefined}
                                    area={project.min_area && project.max_area
                                        ? `${project.min_area} - ${project.max_area} Sq.Ft`
                                        : undefined}
                                    onCardClick={checkAuthAndNavigate}
                                />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* View All Link */}
                    <motion.div
                        className={styles.viewAllWrapper}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                    >
                        <button
                            className={styles.viewAllBtn}
                            onClick={() => showAuthModal('/projects')}
                        >
                            View All Projects
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProjects;
