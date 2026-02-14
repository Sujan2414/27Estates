'use client';

import React from 'react';
import styles from './FeaturedAdCard.module.css';

interface FeaturedAdCardProps {
    id: string;
    type: 'property' | 'project';
    image: string;
    title: string;
    location: string;
    city?: string;
    price: string;
    category?: string;
    status?: string;
    bhk?: string;
    area?: string;
    onCardClick: (path: string) => void;
}

const FeaturedAdCard: React.FC<FeaturedAdCardProps> = ({
    id,
    type,
    image,
    title,
    location,
    city,
    price,
    category,
    status,
    bhk,
    area,
    onCardClick,
}) => {
    const path = type === 'property' ? `/properties/${id}` : `/projects/${id}`;
    const badgeText = status || category || '';
    const locationText = city ? `${location}, ${city}` : location;

    return (
        <div className={styles.card} onClick={() => onCardClick(path)}>
            <div className={styles.imageWrapper}>
                <img
                    src={image}
                    alt={title}
                    className={styles.image}
                    loading="lazy"
                />
            </div>
            <div className={styles.overlay} />

            {price && <span className={styles.priceBadge}>{price}</span>}
            {badgeText && <span className={styles.statusBadge}>{badgeText}</span>}

            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.location}>{locationText}</p>

                <div className={styles.detailsRow}>
                    {bhk && <span className={styles.detailItem}>{bhk}</span>}
                    {area && <span className={styles.detailItem}>{area}</span>}
                </div>

                <span className={styles.viewPrompt}>View Details &rarr;</span>
            </div>
        </div>
    );
};

export default FeaturedAdCard;
