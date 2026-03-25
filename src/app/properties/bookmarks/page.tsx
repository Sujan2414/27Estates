"use client";

import { useState, useEffect } from "react";
import ProjectCard from "@/components/emergent/ProjectCard";
import { Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { proxyUrl } from "@/lib/proxy-url";
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

// Clean card matching ProjectCard style
const PropertyBookmarkCard = ({ property, onBookmarkChange }: { property: Property; onBookmarkChange: () => void }) => {
    const supabase = createClient();
    const [bookmarked, setBookmarked] = useState(true);
    const [loading, setLoading] = useState(false);
    const image = property.images?.[0] ? proxyUrl(property.images[0]) : '/no-image.svg';

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            if (bookmarked) {
                await supabase.from('user_bookmarks').delete().eq('user_id', user.id).eq('property_id', property.id);
                setBookmarked(false);
            } else {
                await supabase.from('user_bookmarks').insert({ user_id: user.id, property_id: property.id });
                setBookmarked(true);
            }
            onBookmarkChange();
        } catch { } finally { setLoading(false); }
    };

    return (
        <div className={styles.propCard}>
            <Link href={`/properties/${property.id}`} className={styles.propCardLink}>
                <div className={styles.propImageWrap}>
                    <img
                        src={image}
                        alt={property.title}
                        className={styles.propImage}
                        onError={e => { e.currentTarget.src = '/no-image.svg'; }}
                    />
                    {property.category && (
                        <span className={styles.propBadge}>{property.category}</span>
                    )}
                </div>
                <div className={styles.propInfo}>
                    <h3 className={styles.propName}>{property.title}</h3>
                    <div className={styles.propLocation}>
                        <MapPin size={13} />
                        <span>{property.location}{property.city ? `, ${property.city}` : ''}</span>
                    </div>
                    {property.price_text && (
                        <div className={styles.propPrice}>{property.price_text}</div>
                    )}
                </div>
            </Link>
            <button
                className={styles.propBookmarkBtn}
                onClick={handleBookmark}
                disabled={loading}
                aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
                <Heart size={18} fill={bookmarked ? "#BFA270" : "none"} style={{ color: bookmarked ? "#BFA270" : "#9a9a9a" }} />
            </button>
        </div>
    );
};

const Bookmarks = () => {
    const supabase = createClient();
    const [bookmarkedProperties, setBookmarkedProperties] = useState<Property[]>([]);
    const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([]);
    const [bookmarkedCommercial, setBookmarkedCommercial] = useState<Project[]>([]);
    const [bookmarkedWarehouse, setBookmarkedWarehouse] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookmarks = async () => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            let propertyIds: string[] = [];
            let projectIds: string[] = [];

            if (currentUser) {
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
                const stored = JSON.parse(sessionStorage.getItem('guest_bookmarks') || '[]') as string[];
                propertyIds = stored;
                projectIds = stored;
            }

            const [propertiesRes, projectsRes] = await Promise.all([
                propertyIds.length > 0
                    ? supabase.from('properties').select('*').in('id', propertyIds)
                    : Promise.resolve({ data: [] }),
                projectIds.length > 0
                    ? supabase.from('projects').select('*').in('id', projectIds)
                    : Promise.resolve({ data: [] }),
            ]);

            setBookmarkedProperties((propertiesRes.data as Property[]) || []);

            const allProjects = (projectsRes.data as Project[]) || [];
            setBookmarkedProjects(allProjects.filter(p => !p.section || p.section === 'residential'));
            setBookmarkedCommercial(allProjects.filter(p => p.section === 'commercial'));
            setBookmarkedWarehouse(allProjects.filter(p => p.section === 'warehouse'));

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

    const hasBookmarks =
        bookmarkedProperties.length > 0 ||
        bookmarkedProjects.length > 0 ||
        bookmarkedCommercial.length > 0 ||
        bookmarkedWarehouse.length > 0;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Bookmarks</h1>
                <p className={styles.subtitle}>Your saved properties & projects</p>
            </div>

            {hasBookmarks ? (
                <div className={styles.contentContainer}>
                    {/* Residential Projects */}
                    {bookmarkedProjects.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Projects</h2>
                            <div className={styles.grid}>
                                {bookmarkedProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        id={project.id}
                                        project_name={project.project_name}
                                        location={project.location || ''}
                                        city={project.city}
                                        min_price={project.min_price}
                                        max_price={project.max_price}
                                        bhk_options={project.bhk_options}
                                        image={project.images?.[0] || '/placeholder-project.jpg'}
                                        status={project.status || 'Upcoming'}
                                        developer_name={project.developer_name}
                                        is_rera_approved={project.is_rera_approved}
                                        category={project.category}
                                        isBookmarked={true}
                                        onBookmarkChange={fetchBookmarks}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Commercial Projects */}
                    {bookmarkedCommercial.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Commercial</h2>
                            <div className={styles.grid}>
                                {bookmarkedCommercial.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        id={project.id}
                                        project_name={project.project_name}
                                        location={project.location || ''}
                                        city={project.city}
                                        min_price={project.min_price}
                                        max_price={project.max_price}
                                        bhk_options={project.bhk_options}
                                        image={project.images?.[0] || '/placeholder-project.jpg'}
                                        status={project.status || 'Upcoming'}
                                        developer_name={project.developer_name}
                                        is_rera_approved={project.is_rera_approved}
                                        category={project.category}
                                        isBookmarked={true}
                                        onBookmarkChange={fetchBookmarks}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warehouse Projects */}
                    {bookmarkedWarehouse.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Warehouse</h2>
                            <div className={styles.grid}>
                                {bookmarkedWarehouse.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        id={project.id}
                                        project_name={project.project_name}
                                        location={project.location || ''}
                                        city={project.city}
                                        min_price={project.min_price}
                                        max_price={project.max_price}
                                        bhk_options={project.bhk_options}
                                        image={project.images?.[0] || '/placeholder-project.jpg'}
                                        status={project.status || 'Upcoming'}
                                        developer_name={project.developer_name}
                                        is_rera_approved={project.is_rera_approved}
                                        category={project.category}
                                        isBookmarked={true}
                                        onBookmarkChange={fetchBookmarks}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Properties */}
                    {bookmarkedProperties.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Properties</h2>
                            <div className={styles.grid}>
                                {bookmarkedProperties.map((property) => (
                                    <PropertyBookmarkCard
                                        key={property.id}
                                        property={property}
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
                        <Link href="/properties/search" className={styles.browseLink}>
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
