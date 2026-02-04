'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import styles from './FeaturedProjectsStacked.module.css';

type Project = Database['public']['Tables']['projects']['Row'];

const FeaturedProjectsStacked: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const supabase = createClient();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('is_featured', true)
                .limit(4);

            if (data) setProjects(data);
        };
        fetchProjects();
    }, [supabase]);

    if (projects.length === 0) return null;

    return (
        <section className={styles.section} ref={containerRef}>
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

                {/* Stacked Cards */}
                <div className={styles.stackedContainer}>
                    {projects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} total={projects.length} />
                    ))}
                </div>

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

const ProjectCard: React.FC<{ project: Project; index: number; total: number }> = ({ project, index, total }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    });

    const scale = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        [0.9, 1, 0.95]
    );

    const opacity = useTransform(
        scrollYProgress,
        [0, 0.3, 0.7, 1],
        [0.5, 1, 1, 0.8]
    );

    return (
        <motion.div
            ref={cardRef}
            className={styles.card}
            style={{
                scale,
                opacity,
                top: `${index * 40}px`,
                zIndex: total - index
            }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
        >
            <Link href={`/projects/${project.id}`} className={styles.cardLink}>
                {/* Image */}
                <div className={styles.imageWrapper}>
                    <motion.img
                        src={project.images?.[0] || '/placeholder-project.jpg'}
                        alt={project.project_name}
                        className={styles.image}
                    />
                    <div className={styles.badge}>
                        <span>{project.status}</span>
                    </div>
                    <div className={styles.overlay} />
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.contentInner}>
                        <span className={styles.type}>
                            {project.bhk_options?.join(', ') || 'Mixed Use'}
                        </span>
                        <h3 className={styles.projectTitle}>{project.project_name}</h3>
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
                </div>
            </Link>
        </motion.div>
    );
};

export default FeaturedProjectsStacked;