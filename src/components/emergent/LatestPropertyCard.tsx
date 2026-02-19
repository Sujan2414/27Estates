import { MapPin, BedDouble, Bath, Maximize, MessageSquare, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./LatestPropertyCard.module.css";

// Property type matching Supabase V2 schema
interface Property {
    id: string;
    property_id: string;
    title: string;
    display_name?: string | null;
    description: string | null;
    images: string[];
    price: number;
    price_text: string | null;
    location: string;
    city: string | null;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    property_type: 'Sale' | 'Rent';
    category: string;
    sub_category: string | null;
    furnishing: string | null;
    project_name: string | null;
    is_featured: boolean;
    [key: string]: unknown;
}

// Format Indian Rupee
const formatIndianRupee = (amount: number): string => {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
};

interface LatestPropertyCardProps {
    property: Property;
    isBookmarked?: boolean;
    onBookmarkChange?: () => void;
    showBookmark?: boolean;
}

const LatestPropertyCard = ({ property, isBookmarked: initialBookmarked, onBookmarkChange, showBookmark = true }: LatestPropertyCardProps) => {
    const router = useRouter();
    const supabase = createClient();
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setBookmarked(initialBookmarked);
    }, [initialBookmarked]);

    const mainImage = property.images?.[0] || '/placeholder-property.jpg';

    const handleCardClick = () => {
        if ((property as any).is_project) {
            router.push(`/projects/${property.id}`);
        } else {
            router.push(`/properties/${property.id}`);
        }
    };

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

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
                if (onBookmarkChange) onBookmarkChange();
                return;
            }

            if (bookmarked) {
                await supabase
                    .from('user_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('property_id', property.id);
                setBookmarked(false);
            } else {
                await supabase
                    .from('user_bookmarks')
                    .insert({ user_id: user.id, property_id: property.id });
                setBookmarked(true);
            }
            if (onBookmarkChange) onBookmarkChange();
        } catch (error) {
            console.error("Error toggling bookmark:", error);
        } finally {
            setLoading(false);
        }
    };

    // Generate tags based on property type
    const tags = [
        property.property_type === "Rent" ? "Rent" : "Sale",
        property.category || "House"
    ];

    // Display price - prefer price_text if available
    const displayPrice = property.price_text || formatIndianRupee(property.price);

    return (
        <div onClick={handleCardClick} className={styles.card}>
            {/* Image Section */}
            <div className={styles.imageContainer}>
                <img
                    src={mainImage}
                    alt={property.title}
                    className={styles.image}
                />

                {/* Tags and Bookmark overlay */}
                <div className={styles.tagsOverlay}>
                    <div className={styles.tags}>
                        {tags.map((tag, index) => (
                            <span key={index} className={styles.tag}>{tag}</span>
                        ))}
                    </div>
                    {showBookmark && (
                        <button
                            onClick={handleBookmark}
                            disabled={loading}
                            className={styles.bookmarkBtn}
                            style={{
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Heart
                                size={16}
                                fill={bookmarked ? "#dc2626" : "none"}
                                stroke={bookmarked ? "#dc2626" : "#666"}
                                className={bookmarked ? '' : ''}
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Section - Plain text, no card */}
            <div className={styles.content}>
                <h3 className={styles.title}>{property.display_name || property.project_name || property.title}</h3>

                <div className={styles.locationRow}>
                    <MapPin size={14} className={styles.locationIcon} />
                    <span className={styles.location}>
                        {property.location}
                        {property.city && `, ${property.city}`}
                    </span>
                    <span className={styles.dot}></span>
                    <MessageSquare size={14} className={styles.locationIcon} />
                    <span className={styles.roomsInfo}>{String(property.bedrooms).padStart(2, '0')}</span>
                </div>

                <p className={styles.description}>{property.description || ''}</p>

                <div className={styles.detailsRow}>
                    <div className={styles.detail}>
                        <BedDouble size={16} className={styles.detailIcon} />
                        <span>{property.bedrooms} Room{property.bedrooms > 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.detail}>
                        <Bath size={16} className={styles.detailIcon} />
                        <span>{property.bathrooms} Bathroom</span>
                    </div>
                </div>

                <div className={styles.areaRow}>
                    <div className={styles.area}>
                        <Maximize size={16} className={styles.detailIcon} />
                        <span>{property.sqft} ft²</span>
                    </div>
                    {property.furnishing && (
                        <span className={styles.furnishing}>{property.furnishing}</span>
                    )}
                </div>

                <p className={styles.price}>{displayPrice}</p>
            </div>
        </div>
    );
};

export default LatestPropertyCard;
