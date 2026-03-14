'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Maximize2, Warehouse, Tag, Heart } from 'lucide-react';
import { proxyUrl } from '@/lib/proxy-url';
import { createClient } from '@/lib/supabase/client';
import styles from './WarehouseHomeCard.module.css';

interface WarehouseHomeCardProps {
    id: string;
    project_name: string;
    location: string;
    city?: string | null;
    min_price: string | null;
    max_price: string | null;
    min_area?: number | null;
    image: string;
    status: string;
    developer_name?: string | null;
    is_rera_approved?: boolean;
    bhk_options?: string[] | null;
    listing_type?: string | null;
    isBookmarked?: boolean;
    onBookmarkChange?: () => void;
}

const listingColors: Record<string, string> = {
    'For Sale': styles.badgeSale,
    'For Rent': styles.badgeRent,
    'For Lease': styles.badgeLease,
};

const WarehouseHomeCard: React.FC<WarehouseHomeCardProps> = ({
    id,
    project_name,
    location,
    city,
    min_price,
    max_price,
    min_area,
    image,
    status,
    developer_name,
    is_rera_approved,
    bhk_options,
    listing_type,
    isBookmarked: initialBookmarked = false,
    onBookmarkChange,
}) => {
    const router = useRouter();
    const supabase = createClient();
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    useEffect(() => {
        setBookmarked(initialBookmarked);
    }, [initialBookmarked]);

    const priceDisplay = min_price
        ? max_price ? `${min_price} – ${max_price}` : `From ${min_price}`
        : 'Request for Details';

    const warehouseType = bhk_options?.[0] || null;
    const displayLocation = city ? `${location}, ${city}` : location;
    const type = listing_type || 'For Rent';
    const badgeClass = listingColors[type] || styles.badgeRent;

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setBookmarkLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const key = 'guest_bookmarks';
                const stored = JSON.parse(sessionStorage.getItem(key) || '[]') as string[];
                if (bookmarked) {
                    sessionStorage.setItem(key, JSON.stringify(stored.filter((i: string) => i !== id)));
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
                await supabase.from('user_bookmarks').delete().eq('user_id', user.id).eq('project_id', id);
                setBookmarked(false);
            } else {
                await supabase.from('user_bookmarks').insert({ user_id: user.id, project_id: id });
                setBookmarked(true);
            }
            if (onBookmarkChange) onBookmarkChange();
        } catch (err) {
            console.error('Bookmark error:', err);
        } finally {
            setBookmarkLoading(false);
        }
    };

    return (
        <div className={styles.card} onClick={() => router.push(`/projects/${id}`)}>
            {/* Image */}
            <div className={styles.imageWrap}>
                {image ? (
                    <img src={proxyUrl(image)} alt={project_name} className={styles.image} onError={(e) => { e.currentTarget.src = '/no-image.svg'; }} />
                ) : (
                    <img src="/no-image.svg" alt="No image" className={styles.image} />
                )}

                {/* Top badges */}
                <div className={styles.topBadges}>
                    <span className={`${styles.listingBadge} ${badgeClass}`}>
                        <Tag size={9} />
                        {type}
                    </span>
                    {is_rera_approved && (
                        <span className={styles.reraBadge}>RERA ✓</span>
                    )}
                </div>

                {/* Bookmark button */}
                <button
                    className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarkBtnActive : ''}`}
                    onClick={handleBookmark}
                    disabled={bookmarkLoading}
                    aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                    <Heart size={14} fill={bookmarked ? '#ef4444' : 'none'} stroke={bookmarked ? '#ef4444' : 'currentColor'} />
                </button>

                {/* Status at bottom */}
                <div className={styles.bottomBar}>
                    <span className={styles.statusBadge}>{status}</span>
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                <h3 className={styles.title}>{project_name}</h3>

                <div className={styles.locationRow}>
                    <MapPin size={12} className={styles.locationIcon} />
                    <span className={styles.locationText}>{displayLocation}</span>
                </div>

                <div className={styles.metaRow}>
                    {min_area && min_area > 0 && (
                        <div className={styles.metaChip}>
                            <Maximize2 size={11} />
                            <span>{min_area.toLocaleString()}+ sqft</span>
                        </div>
                    )}
                    {warehouseType && (
                        <div className={styles.metaChip}>
                            <Warehouse size={11} />
                            <span>{warehouseType}</span>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.priceBlock}>
                        <span className={styles.priceLabel}>Price</span>
                        <span className={styles.price}>{priceDisplay}</span>
                    </div>
                    {developer_name && (
                        <span className={styles.developer}>by {developer_name}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WarehouseHomeCard;
