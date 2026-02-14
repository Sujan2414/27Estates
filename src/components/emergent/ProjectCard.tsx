'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
    id: string;
    project_name: string;
    location: string;
    min_price: string | null;
    max_price: string | null;
    bhk_options: string[] | null;
    image: string;
    status: string;
    developer_name?: string | null;
    is_rera_approved?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    id,
    project_name,
    location,
    min_price,
    max_price,
    bhk_options,
    image,
    status,
    developer_name,
    is_rera_approved,
}) => {
    const priceDisplay = min_price
        ? max_price
            ? `${min_price} - ${max_price}`
            : `From ${min_price}`
        : 'Price on Request';

    return (
        <Link href={`/projects/${id}`} className={styles.card}>
            {/* Image Section */}
            <div className={styles.imageContainer}>
                <img
                    src={image || '/placeholder-project.jpg'}
                    alt={project_name}
                    className={styles.image}
                />
                <div className={styles.badgeOverlay}>
                    <span className={styles.statusBadge}>{status}</span>
                    {is_rera_approved && (
                        <span className={styles.reraBadge}>RERA</span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                <h3 className={styles.projectName}>{project_name}</h3>

                <div className={styles.locationRow}>
                    <MapPin size={14} className={styles.locationIcon} />
                    <span className={styles.location}>{location}</span>
                </div>

                {developer_name && (
                    <div className={styles.developerRow}>
                        <Building2 size={12} className={styles.developerIcon} />
                        <span className={styles.developerName}>{developer_name}</span>
                    </div>
                )}

                <div className={styles.detailsGrid}>
                    <div className={styles.detailGroup}>
                        <div className={styles.detailLabel}>Price Range</div>
                        <div className={styles.detailValue}>{priceDisplay}</div>
                    </div>
                    <div className={styles.detailGroup}>
                        <div className={styles.detailLabel}>Config</div>
                        <div className={styles.configValue}>
                            {bhk_options?.join(', ') || 'Various'}
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <span className={styles.viewDetails}>View Project</span>
                    <span className={styles.arrowIcon}>
                        <ArrowRight size={14} />
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ProjectCard;
