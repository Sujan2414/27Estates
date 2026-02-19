"use client";

import { MapPin, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./PropertyCard.module.css";

// Property type matching Supabase V2 schema
interface Property {
    id: string;
    property_id: string;
    title: string;
    description: string | null;
    images: string[];
    price: number;
    price_text: string | null;
    location: string;
    city: string | null;
    is_featured: boolean;
    project_name?: string | null; // Added project_name
    [key: string]: unknown;
}

interface PropertyCardProps {
    property: Property;
    isBookmarked: boolean;
    onBookmarkChange?: () => void;
}

const PropertyCard = ({ property, isBookmarked: initialBookmarked, onBookmarkChange }: PropertyCardProps) => {
    const router = useRouter();
    const supabase = createClient();
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setBookmarked(initialBookmarked);
    }, [initialBookmarked]);

    const mainImage = property.images?.[0] || '/placeholder-property.jpg';

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const isProject = !!(property as any).is_project;
            console.log('[Bookmark] User:', user?.id, 'ID:', property.id, 'isProject:', isProject, 'Currently bookmarked:', bookmarked);

            if (!user) {
                // Guest mode: use sessionStorage (cleared when browser closes)
                const key = 'guest_bookmarks';
                const stored = JSON.parse(sessionStorage.getItem(key) || '[]') as string[];
                if (bookmarked) {
                    const updated = stored.filter((id: string) => id !== property.id);
                    sessionStorage.setItem(key, JSON.stringify(updated));
                    setBookmarked(false);
                } else {
                    stored.push(property.id);
                    sessionStorage.setItem(key, JSON.stringify(stored));
                    setBookmarked(true);
                }
                console.log('[Bookmark] Guest bookmarks:', JSON.parse(sessionStorage.getItem(key) || '[]'));
                if (onBookmarkChange) onBookmarkChange();
                return;
            }

            // Build the correct bookmark record based on item type
            const bookmarkRecord = isProject
                ? { user_id: user.id, project_id: property.id }
                : { user_id: user.id, property_id: property.id };

            const idColumn = isProject ? 'project_id' : 'property_id';

            if (bookmarked) {
                const { error } = await supabase
                    .from('user_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq(idColumn, property.id);
                if (error) {
                    console.error('[Bookmark] Delete error:', error);
                } else {
                    setBookmarked(false);
                }
            } else {
                const { error } = await supabase
                    .from('user_bookmarks')
                    .insert(bookmarkRecord);
                if (error) {
                    console.error('[Bookmark] Insert error:', error);
                } else {
                    setBookmarked(true);
                }
            }
            if (onBookmarkChange) onBookmarkChange();
        } catch (error) {
            console.error("Error toggling bookmark:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = () => {
        // Check if it looks like a project or has is_project flag (if we add it to the interface)
        // Since we are adding is_project to the object passed in via Dashboard, we can cast or check property['is_project']
        if ((property as any).is_project) {
            router.push(`/projects/${property.id}`);
        } else {
            router.push(`/properties/${property.id}`);
        }
    };

    return (
        <div onClick={handleCardClick} className={styles.card}>
            {/* Background Image */}
            <div className={styles.imageContainer}>
                <img
                    src={mainImage}
                    alt={property.title}
                    className={styles.image}
                />
            </div>

            {/* Gradient Overlay */}
            <div className={styles.overlay} />

            {/* Location Badge - Top Left */}
            <div className={styles.locationBadge}>
                <MapPin size={14} strokeWidth={1.5} className={styles.locationIcon} />
                <span>{property.location}{property.city && `, ${property.city}`}</span>
            </div>

            {/* Thumbnail Gallery - Top Right */}
            {property.images && property.images.length > 1 && (
                <div className={styles.thumbnailGallery}>
                    {property.images.slice(1, 3).map((img, i) => (
                        <div key={i} className={styles.thumbnail}>
                            <img src={img} alt="" />
                        </div>
                    ))}
                    {property.images.length > 3 && (
                        <div className={styles.thumbnailMore}>+{property.images.length - 3}</div>
                    )}
                </div>
            )}

            {/* Content Overlay - Bottom */}
            <div className={styles.content}>
                <h3 className={styles.title}>{(property.display_name as string) || property.project_name || property.title}</h3>
                <p className={styles.description}>{property.description || ''}</p>
            </div>

            {/* Bookmark Button */}
            <button
                onClick={handleBookmark}
                disabled={loading}
                className={styles.bookmarkBtn}
            >
                <Heart
                    size={18}
                    fill={bookmarked ? "#dc2626" : "none"}
                    className={bookmarked ? styles.bookmarkIconActive : styles.bookmarkIcon}
                />
            </button>
        </div>
    );
};

export default PropertyCard;
