'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import styles from '../FeaturedProperties.module.css'; // Reusing similar styles

type Project = Database['public']['Tables']['projects']['Row'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
};

const FeaturedProjects: React.FC = () => {
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
                        <motion.article
                            key={project.id}
                            className={styles.card}
                            variants={itemVariants}
                        >
                            <Link href={`/projects/${project.id}`} className="block h-full group">
                                {/* Image */}
                                <div className={styles.imageWrapper}>
                                    <motion.img
                                        src={project.images?.[0] || '/placeholder-project.jpg'}
                                        alt={project.project_name}
                                        className={styles.image}
                                        whileHover={{ scale: 1.04 }}
                                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-black/70 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                                            {project.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={styles.content}>
                                    <span className={styles.type}>
                                        {project.bhk_options?.join(', ') || 'Mixed Use'}
                                    </span>
                                    <h3 className={styles.propertyTitle}>{project.project_name}</h3>
                                    <p className={styles.location}>{project.location || project.city}</p>

                                    <div className={styles.details}>
                                        <span className={styles.size}>
                                            {project.min_area} - {project.max_area} Sq.Ft
                                        </span>
                                    </div>

                                    <div className={styles.footer}>
                                        <span className={styles.price}>
                                            {project.min_price} Onwards
                                        </span>
                                        <span className={styles.viewBtn}>
                                            View Details →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.article>
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
                    <Link href="/projects" className={styles.viewAllBtn}>
                        View All Projects
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default FeaturedProjects;
