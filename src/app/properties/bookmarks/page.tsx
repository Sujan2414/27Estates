"use client";

import { useState, useEffect } from "react";
import PropertyCard from "@/components/emergent/PropertyCard";
import ProjectCard from "@/components/emergent/ProjectCard";
import { Heart, Building2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/emergent/Bookmarks.module.css";
import { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface Property {
    id: string;
    property_id: string;
    title: string;
    description: string;
    images: string[];
    price: number;
    price_text: string | null;
    location: string;
    city: string | null;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    property_type: string;
    category: string;
    is_featured: boolean;
    [key: string]: unknown;
}

const Bookmarks = () => {
    const { user, showAuthModal } = useAuth();
    const supabase = createClient();
    const [bookmarkedProperties, setBookmarkedProperties] = useState<Property[]>([]);
    const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookmarks = async () => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            let propertyIds: string[] = [];
            let projectIds: string[] = [];

            if (currentUser) {
                // Logged-in user: get bookmarks from Supabase (separate columns)
                const { data: bookmarks } = await supabase
                    .from('user_bookmarks')
                    .select('property_id, project_id')
                    .eq('user_id', currentUser.id);

                if (bookmarks && bookmarks.length > 0) {
                    propertyIds = bookmarks
                        .filter(b => b.property_id)
                        .map(b => b.property_id as string);

                    projectIds = bookmarks
                        .filter(b => b.project_id)
                        .map(b => b.project_id as string);
                }
            } else {
                // Guest: get bookmarks from sessionStorage (mixed IDs)
                const stored = JSON.parse(sessionStorage.getItem('guest_bookmarks') || '[]') as string[];
                propertyIds = stored;
                projectIds = stored; // Try same IDs for projects
            }

            // Fetch Properties
            if (propertyIds.length > 0) {
                const { data: properties } = await supabase
                    .from('properties')
                    .select('*')
                    .in('id', propertyIds);
                setBookmarkedProperties(properties || []);
            } else {
                setBookmarkedProperties([]);
            }

            // Fetch Projects
            if (projectIds.length > 0) {
                const { data: projects } = await supabase
                    .from('projects')
                    .select('*')
                    .in('id', projectIds);
                setBookmarkedProjects(projects || []);
            } else {
                setBookmarkedProjects([]);
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

    const hasBookmarks = bookmarkedProperties.length > 0 || bookmarkedProjects.length > 0;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Bookmarks</h1>
                <p className={styles.subtitle}>Your saved properties & projects</p>
            </div>

            {hasBookmarks ? (
                <div className={styles.contentContainer}>
                    {/* Projects Section */}
                    {bookmarkedProjects.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Projects</h2>
                            <div className={styles.grid}>
                                {bookmarkedProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        id={project.id}
                                        project_name={project.project_name}
                                        location={project.location || project.city || ''}
                                        min_price={project.min_price}
                                        max_price={project.max_price}
                                        bhk_options={project.bhk_options}
                                        image={project.images?.[0] || '/placeholder-project.jpg'}
                                        status={project.status || 'Upcoming'}
                                        developer_name={project.developer_name}
                                        is_rera_approved={project.is_rera_approved}
                                        isBookmarked={true}
                                        onBookmarkChange={fetchBookmarks}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Properties Section */}
                    {bookmarkedProperties.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Properties</h2>
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
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Heart size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className={styles.emptyTitle}>Bookmarks will appear here</h2>
                    <p className={styles.emptyText}>
                        Add properties or projects to bookmarks to have them appear here
                    </p>
                    <div className={styles.emptyActions}>
                        <Link href="/properties" className={styles.browseLink}>
                            See Properties
                        </Link>
                        <Link href="/properties/projects" className={styles.browseLinkSecondary}>
                            See Projects
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bookmarks;
