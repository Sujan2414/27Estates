'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Building2, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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
    category?: string | null;
    isBookmarked?: boolean;
    onBookmarkChange?: () => void;
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
    category,
    isBookmarked = false,
    onBookmarkChange,
}) => {
    const [bookmarked, setBookmarked] = React.useState(isBookmarked);
    const [loading, setLoading] = React.useState(false);
    const supabase = createClient();

    React.useEffect(() => {
        setBookmarked(isBookmarked);
    }, [isBookmarked]);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const key = 'guest_bookmarks';
                const stored = JSON.parse(sessionStorage.getItem(key) || '[]') as string[];
                if (bookmarked) {
                    const updated = stored.filter((bookmarkId: string) => bookmarkId !== id);
                    sessionStorage.setItem(key, JSON.stringify(updated));
                    setBookmarked(false);
                } else {
                    stored.push(id);
                    sessionStorage.setItem(key, JSON.stringify(stored));
                    setBookmarked(true);
                }
                if (onBookmarkChange) onBookmarkChange();
                return;
            }

            if (bookmarked) {
                const { error } = await supabase
                    .from('user_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('project_id', id);
                if (!error) setBookmarked(false);
            } else {
                const { error } = await supabase
                    .from('user_bookmarks')
                    .insert({ user_id: user.id, project_id: id });
                if (!error) setBookmarked(true);
            }
            if (onBookmarkChange) onBookmarkChange();
        } catch (error) {
            console.error("Error toggling bookmark:", error);
        } finally {
            setLoading(false);
        }
    };

    const priceDisplay = min_price
        ? max_price
            ? `${min_price} – ${max_price}`
            : `From ${min_price}`
        : 'Request for Details';

    return (
        <div className={styles.cardWrapper}>
            <Link href={`/projects/${id}`} className={styles.card}>
                {/* Image */}
                <div className={styles.imageContainer}>
                    <img
                        src={image || '/placeholder-project.jpg'}
                        alt={project_name}
                        className={styles.image}
                    />

                    {/* Status / RERA badges — top-left */}
                    <div className={styles.badgeOverlay}>
                        <span className={styles.statusBadge}>{status}</span>
                        {is_rera_approved && (
                            <span className={styles.reraBadge}>
                                {category === 'Commercial' ? 'OC' : 'RERA'}
                            </span>
                        )}
                    </div>

                    {/* Hover reveal panel — slides up from image bottom */}
                    <div className={styles.hoverPanel}>
                        {developer_name && (
                            <div className={styles.hoverDeveloper}>
                                <Building2 size={11} className={styles.hoverDeveloperIcon} />
                                <span className={styles.hoverDeveloperName}>{developer_name}</span>
                            </div>
                        )}
                        <div className={styles.hoverDetailsGrid}>
                            <div className={styles.hoverDetailGroup}>
                                <div className={styles.hoverDetailLabel}>Price Range</div>
                                <div className={styles.hoverDetailValue}>{priceDisplay}</div>
                            </div>
                            <div className={styles.hoverDetailGroup}>
                                <div className={styles.hoverDetailLabel}>Config</div>
                                <div className={styles.hoverConfigValue}>
                                    {bhk_options?.join(', ') || 'Various'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Static info below image — always visible */}
                <div className={styles.content}>
                    <h3 className={styles.projectName}>{project_name}</h3>
                    <div className={styles.locationRow}>
                        <MapPin size={13} className={styles.locationIcon} />
                        <span className={styles.location}>{location}</span>
                    </div>
                </div>
            </Link>

            {/* Bookmark button */}
            <button
                className={styles.bookmarkBtn}
                onClick={handleBookmark}
                disabled={loading}
                aria-label={bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            >
                <Heart
                    size={18}
                    className={`${styles.bookmarkIcon} ${bookmarked ? styles.bookmarkIconActive : ''}`}
                    fill={bookmarked ? "#BFA270" : "none"}
                />
            </button>
        </div>
    );
};

export default ProjectCard;
