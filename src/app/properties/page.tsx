"use client";

import { useState, useEffect } from "react";
import PropertyCard from "@/components/emergent/PropertyCard";
import LatestPropertyCard from "@/components/emergent/LatestPropertyCard";
import FilterModal, { FilterState } from "@/components/emergent/FilterModal";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/Dashboard.module.css";

// Property type matching Supabase V2 schema
interface Property {
    id: string;
    property_id: string;
    title: string;
    display_name: string | null;
    description: string | null;
    images: string[];
    price: number;
    price_text: string | null;
    price_per_sqft: number | null;
    // Location - Separate columns
    location: string;
    address: string | null;
    street: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string | null;
    // Property Details
    rooms: number | null;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lot_size: number | null;
    floors: number | null;
    // Type & Category
    property_type: 'Sale' | 'Rent';
    category: string;
    sub_category: string | null;
    furnishing: string | null;
    project_name: string | null;
    // Status
    is_featured: boolean;
    agent_id: string | null;
    // Media
    amenities: {
        interior?: string[];
        outdoor?: string[];
        utilities?: string[];
        other?: string[];
    } | null;
    video_url?: string | null;
    floor_plans?: { name: string; image: string }[] | null;
    // Index signature for compatibility with PropertyCard
    is_project?: boolean;
    [key: string]: unknown;
}

const Dashboard = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
    const [featuredProjects, setFeaturedProjects] = useState<Property[]>([]);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showProjects, setShowProjects] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        featured: false,
        category: null,
        city: null,
        area: null,
        minPrice: null,
        maxPrice: null
    });

    const supabase = createClient();

    const fetchProperties = async () => {
        try {
            // Fetch properties
            const { data: allProps, error: propsError } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (propsError) throw propsError;

            // Fetch projects
            const { data: allProjects, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (projectsError) console.error("Error fetching projects:", projectsError);

            // Normalize projects to Property shape
            const projectsAsProperties: Property[] = (allProjects || []).map((p: any) => ({
                id: p.id,
                property_id: p.project_id || p.id,
                title: p.project_name,
                display_name: p.project_name,
                description: p.description,
                images: p.images || [],
                price: p.min_price_numeric || 0,
                price_text: p.min_price && p.max_price ? `${p.min_price} - ${p.max_price}` : (p.min_price || 'Price on Request'),
                price_per_sqft: null,
                location: p.location || '',
                address: p.address,
                street: null,
                area: p.location,
                city: p.city,
                state: p.state,
                pincode: p.pincode,
                country: p.country,
                rooms: null,
                bedrooms: 0,
                bathrooms: 0,
                sqft: p.min_area || 0,
                lot_size: null,
                floors: null,
                property_type: 'Sale', // Projects are essentially for sale
                category: 'Project', // New category
                sub_category: null,
                furnishing: null,
                project_name: p.project_name,
                is_featured: p.is_featured || false,
                agent_id: null,
                amenities: null,
                video_url: p.video_url,
                floor_plans: null,
                is_project: true, // Marker
            }));

            // Fetch bookmarks for current user
            const { data: { user } } = await supabase.auth.getUser();
            let bookmarks: string[] = [];
            if (user) {
                const { data: bookmarkData } = await supabase
                    .from('user_bookmarks')
                    .select('property_id')
                    .eq('user_id', user.id);
                bookmarks = bookmarkData?.map(b => b.property_id) || [];
            }

            const propertiesOnly = allProps || [];
            const projectsOnly = projectsAsProperties;
            const combined = [...propertiesOnly, ...projectsOnly].sort((a, b) => {
                return new Date(b.created_at as string || 0).getTime() - new Date(a.created_at as string || 0).getTime();
            });

            setProperties(combined);
            setFeaturedProperties(propertiesOnly.filter(p => p.is_featured));
            setFeaturedProjects(projectsOnly.filter(p => p.is_featured));
            setBookmarkIds(bookmarks);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchProperties();
            return;
        }

        // Search Properties
        const { data: propData } = await supabase
            .from('properties')
            .select('*')
            .or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

        // Search Projects
        const { data: projData } = await supabase
            .from('projects')
            .select('*')
            .or(`project_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

        // Normalize Projects
        const projectsAsProperties: Property[] = (projData || []).map((p: any) => ({
            id: p.id,
            property_id: p.project_id || p.id,
            title: p.project_name,
            display_name: p.project_name,
            description: p.description,
            images: p.images || [],
            price: p.min_price_numeric || 0,
            price_text: p.min_price && p.max_price ? `${p.min_price} - ${p.max_price}` : (p.min_price || 'Price on Request'),
            price_per_sqft: null,
            location: p.location || '',
            address: p.address,
            street: null,
            area: p.location,
            city: p.city,
            state: p.state,
            pincode: p.pincode,
            country: p.country,
            rooms: null,
            bedrooms: 0,
            bathrooms: 0,
            sqft: p.min_area || 0,
            lot_size: null,
            floors: null,
            property_type: 'Sale',
            category: 'Project',
            sub_category: null,
            furnishing: null,
            project_name: p.project_name,
            is_featured: p.is_featured || false,
            agent_id: null,
            amenities: null,
            video_url: p.video_url,
            floor_plans: null,
            is_project: true,
        }));

        setProperties([...(propData || []), ...projectsAsProperties]);
    };

    const handleApplyFilters = async (newFilters: FilterState) => {
        setFilters(newFilters);

        let query = supabase.from('properties').select('*');

        if (newFilters.category) {
            query = query.eq('category', newFilters.category);
        }

        if (newFilters.featured) {
            query = query.eq('is_featured', true);
        }

        const { data } = await query.order('created_at', { ascending: false });

        setProperties(data || []);
        setFeaturedProperties((data || []).filter(p => p.is_featured));
    };

    const isBookmarked = (propertyId: string) => {
        return bookmarkIds.includes(propertyId);
    };

    // Get latest (non-featured) properties
    const latestProperties = properties.filter(p => !p.is_featured);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingText}>Loading properties...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header with Search */}
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Hi 👋</h1>

                <div className={styles.headerRight}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <div className={styles.searchContainer}>
                            <SearchIcon className={styles.searchIcon} size={18} strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder="Search properties"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </form>

                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={styles.filterButton}
                    >
                        <SlidersHorizontal size={18} strokeWidth={1.5} />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Featured Toggle */}
            {!searchQuery && (featuredProperties.length > 0 || featuredProjects.length > 0) && (
                <section className={styles.section}>
                    <div className={styles.featuredHeader}>
                        <h2 className={styles.sectionTitle}>
                            {showProjects ? 'FEATURED PROJECTS' : 'FEATURED PROPERTIES'}
                        </h2>
                        <div className={styles.toggleTabs}>
                            <button
                                className={`${styles.toggleTab} ${!showProjects ? styles.toggleTabActive : ''}`}
                                onClick={() => setShowProjects(false)}
                            >
                                Properties ({featuredProperties.length})
                            </button>
                            <button
                                className={`${styles.toggleTab} ${showProjects ? styles.toggleTabActive : ''}`}
                                onClick={() => setShowProjects(true)}
                            >
                                Projects ({featuredProjects.length})
                            </button>
                        </div>
                    </div>
                    <div className={styles.grid}>
                        {(showProjects ? featuredProjects : featuredProperties).map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                isBookmarked={isBookmarked(property.id)}
                                onBookmarkChange={fetchProperties}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Latest Properties - Smaller Cards with Details */}
            {latestProperties.length > 0 && !searchQuery && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>LATEST PROPERTIES</h2>
                    <div className={styles.latestGrid}>
                        {latestProperties.map((property) => (
                            <LatestPropertyCard
                                key={property.id}
                                property={property}
                                isBookmarked={isBookmarked(property.id)}
                                onBookmarkChange={fetchProperties}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Search Results */}
            {searchQuery && (
                <section>
                    <h2 className={styles.sectionTitle}>SEARCH RESULTS</h2>
                    <div className={styles.latestGrid}>
                        {properties.map((property) => (
                            <LatestPropertyCard
                                key={property.id}
                                property={property}
                                isBookmarked={isBookmarked(property.id)}
                                onBookmarkChange={fetchProperties}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Filter Modal */}
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApplyFilters={handleApplyFilters}
                initialFilters={filters}
            />
        </div>
    );
};

export default Dashboard;
