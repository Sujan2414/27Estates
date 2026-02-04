"use client";

import { useState, useEffect } from "react";
import PropertyCard from "@/components/emergent/PropertyCard";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/Bookmarks.module.css";

interface Property {
    id: string;
    property_id: string;
    title: string;
    description: string;
    images: string[];
    price: number;
    location: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    property_type: string;
    category: string;
    is_featured: boolean;
}

const Bookmarks = () => {
    const router = useRouter();
    const supabase = createClient();
    const [bookmarkedProperties, setBookmarkedProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookmarks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Get bookmarked property IDs
            const { data: bookmarks } = await supabase
                .from('user_bookmarks')
                .select('property_id')
                .eq('user_id', user.id);

            if (bookmarks && bookmarks.length > 0) {
                const propertyIds = bookmarks.map(b => b.property_id);

                // Fetch the actual properties
                const { data: properties } = await supabase
                    .from('properties')
                    .select('*')
                    .in('id', propertyIds);

                setBookmarkedProperties(properties || []);
            } else {
                setBookmarkedProperties([]);
            }
        } catch (error) {
            console.error("Error fetching bookmarks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookmarks();
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingText}>Loading bookmarks...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Bookmarks</h1>
                <p className={styles.subtitle}>Your saved properties</p>
            </div>

            {bookmarkedProperties.length > 0 ? (
                <div className={styles.grid}>
                    {bookmarkedProperties.map((property) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            isBookmarked={true}
                            onBookmarkChange={fetchBookmarks}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Heart size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className={styles.emptyTitle}>Bookmarks will appear here</h2>
                    <p className={styles.emptyText}>
                        Add properties to bookmarks to have them appear here
                    </p>
                    <Link href="/properties" className={styles.browseLink}>
                        See Properties
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Bookmarks;
