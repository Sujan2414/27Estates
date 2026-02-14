"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/emergent/ProjectCard";
import * as LucideIcons from "lucide-react";
import {
    MapPin, Heart, UserCircle, Map as MapIcon,
    Building2, Home, Calendar, CheckCircle2
} from "lucide-react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/ProjectDetail.module.css";
import GroupBuySection from "@/components/emergent/GroupBuySection";
import { AMENITY_ICON_MAP, AMENITIES_BY_CATEGORY, AMENITY_CATEGORIES, flattenAmenities } from "@/lib/amenities-data";
import type { AmenityCategory } from "@/lib/amenities-data";

// Dynamic import to avoid SSR — react-pdf uses DOMMatrix which only exists in the browser
const BrochureSection = dynamic(
    () => import("@/components/ui/brochure-viewer").then(mod => mod.BrochureSection),
    { ssr: false }
);

// Types
interface Project {
    id: string;
    project_id: string;
    project_name: string;
    title: string | null;
    description: string | null;
    specifications: string | null;
    rera_number: string | null;
    developer_id: string | null;
    developer_name: string | null;
    address: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
    landmark: string | null;
    pincode: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    min_price: string | null;
    max_price: string | null;
    min_price_numeric: number | null;
    max_price_numeric: number | null;
    price_per_sqft: number | null;
    min_area: number | null;
    max_area: number | null;
    category: string | null;
    sub_category: string | null;
    total_units: number | null;
    property_type: string | null;
    bhk_options: string[] | null;
    transaction_type: string | null;
    status: string;
    launch_date: string | null;
    possession_date: string | null;
    images: string[];
    brochure_url: string | null;
    video_url: string | null;
    master_plan_image: string | null;
    is_featured: boolean;
    is_rera_approved: boolean;
    employee_name: string | null;
    employee_phone: string | null;
    employee_email: string | null;
    towers_data: unknown;
    project_plan: unknown;
    specifications_complex: unknown;
    amenities: unknown;
    floor_plans: unknown;
    connectivity: unknown;
    highlights: unknown;
    ad_card_image: string | null;
    show_ad_on_home: boolean;
    created_at: string;
    updated_at: string;
}

interface Developer {
    id: string;
    name: string;
    logo: string | null;
    description: string | null;
    website: string | null;
}

// Category-specific types
interface ResidentialTower {
    name: string;
    total_floors: number;
    total_units: number;
    completion_date: string;
    status: string;
}

interface VillaCluster {
    cluster_name: string;
    total_villas: number;
    villa_types: string[];
    completion_date: string;
    status: string;
}

interface PlotPhase {
    phase_name: string;
    total_plots: number;
    launch_date: string;
    status: string;
    completion_date: string;
}

interface ResidentialUnit {
    type: string;
    bhk: string;
    area: string;
    price_rate: string;
    basic_price: string;
    completion_date: string;
}

interface VillaType {
    villa_type: string;
    bhk: number;
    plot_area: string;
    built_up_area: string;
    floors: number;
    price_range: string;
    status: string;
}

interface PlotConfig {
    plot_type: string;
    dimensions: string;
    area_sqft: number;
    facing: string;
    price_per_sqft: number;
    total_price: string;
    status: string;
}

interface FloorPlan {
    name: string;
    image: string;
    bhk?: string;
    area?: string;
}

interface ConnectivityItem {
    type: string;
    name: string;
    distance: string;
}

interface HighlightItem {
    icon: string;
    label: string;
    value: string;
}

// Helper to get Lucide icon component by name
const getLucideIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>;
    const Icon = icons[iconName];
    return Icon || LucideIcons.Circle;
};

interface ProjectDetailPageProps {
    params: Promise<{ id: string }>;
}

const ProjectDetailPage = ({ params }: ProjectDetailPageProps) => {
    const resolvedParams = use(params);
    const router = useRouter();
    const supabase = createClient();
    const [project, setProject] = useState<Project | null>(null);
    const [developer, setDeveloper] = useState<Developer | null>(null);
    const [similarProjects, setSimilarProjects] = useState<Project[]>([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeFloorPlan, setActiveFloorPlan] = useState(0);

    const fetchProjectData = async () => {
        try {
            const projectId = resolvedParams?.id || '';

            const { data: projectData, error: projError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (projError || !projectData) {
                setLoading(false);
                return;
            }

            setProject(projectData as unknown as Project);

            // Check if bookmarked
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: bookmark } = await supabase
                    .from('user_bookmarks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('project_id', projectId)
                    .single();
                setIsBookmarked(!!bookmark);
            }

            // Get developer
            if (projectData.developer_id) {
                const { data: devData } = await supabase
                    .from('developers')
                    .select('*')
                    .eq('id', projectData.developer_id)
                    .single();
                setDeveloper(devData || null);
            }

            // Get similar projects (same city or category, different id)
            const { data: similar } = await supabase
                .from('projects')
                .select('*')
                .neq('id', projectId)
                .limit(3);
            setSimilarProjects((similar || []) as unknown as Project[]);

        } catch (error) {
            console.error("Error fetching project:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();
    }, [resolvedParams?.id]);

    const handleBookmark = async () => {
        if (!project) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        if (isBookmarked) {
            await supabase
                .from('user_bookmarks')
                .delete()
                .eq('user_id', user.id)
                .eq('project_id', project.id);
            setIsBookmarked(false);
        } else {
            await supabase
                .from('user_bookmarks')
                .insert({ user_id: user.id, project_id: project.id });
            setIsBookmarked(true);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div>Loading project...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className={styles.notFound}>
                <h2 className={styles.sectionTitle}>Project not found</h2>
                <p style={{ color: '#737373', marginBottom: '1rem' }}>The project you&apos;re looking for doesn&apos;t exist.</p>
                <button onClick={() => router.push('/projects')} className={styles.backButton} style={{ border: '1px solid #e5e5e5', borderRadius: '0.5rem' }}>
                    Back to Projects
                </button>
            </div>
        );
    }

    // Prepare images
    const displayImages = project.images && project.images.length > 0
        ? project.images
        : ['/placeholder-project.jpg'];

    // Parse typed data
    const category = project.category || 'Residential';
    const towers = (project.towers_data as ResidentialTower[] | VillaCluster[] | PlotPhase[]) || [];
    const plans = (project.project_plan as ResidentialUnit[] | VillaType[] | PlotConfig[]) || [];
    const amenitiesList = flattenAmenities(project.amenities);
    // Group amenities by their category from the master list
    const amenitiesByCategory: Partial<Record<AmenityCategory, string[]>> = {};
    amenitiesList.forEach(label => {
        for (const cat of AMENITY_CATEGORIES) {
            if (AMENITIES_BY_CATEGORY[cat].some(a => a.label === label)) {
                if (!amenitiesByCategory[cat]) amenitiesByCategory[cat] = [];
                amenitiesByCategory[cat]!.push(label);
                return;
            }
        }
        // uncategorized
        if (!amenitiesByCategory['Lifestyle & Wellness']) amenitiesByCategory['Lifestyle & Wellness'] = [];
        amenitiesByCategory['Lifestyle & Wellness']!.push(label);
    });
    const specs = (project.specifications_complex as Record<string, string>) || {};
    const floorPlans = (project.floor_plans as FloorPlan[]) || [];
    const connectivity = (project.connectivity as ConnectivityItem[]) || [];
    const highlights = (project.highlights as HighlightItem[]) || [];

    // Build price display
    const priceDisplay = project.min_price
        ? project.max_price
            ? `${project.min_price} - ${project.max_price}`
            : project.min_price
        : 'Price on Request';

    // Default highlights if none set
    const displayHighlights: { label: string; value: string }[] = highlights.length > 0
        ? highlights.map(h => ({ label: h.label, value: h.value }))
        : [
            { label: 'Configuration', value: project.bhk_options?.join(', ') || 'N/A' },
            { label: 'Area Range', value: project.min_area && project.max_area ? `${project.min_area} - ${project.max_area} Sq.Ft` : 'N/A' },
            { label: 'Possession', value: project.possession_date || 'Soon' },
            { label: 'RERA', value: project.is_rera_approved ? 'Approved' : 'Pending' },
        ];

    const getStatusClass = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'available' || s === 'active' || s === 'ready') return styles.statusAvailable;
        if (s === 'sold out' || s === 'sold' || s === 'booked') return styles.statusSoldOut;
        return styles.statusUpcoming;
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.layoutGrid}>
                {/* Left Column: Sticky Gallery */}
                <div className={styles.leftColumn}>
                    <div className={styles.stickyGallery}>
                        <div className={styles.imageGallery}>
                            <div className={styles.mainImage}>
                                <img src={displayImages[0]} alt={project.project_name} />
                            </div>
                            {displayImages.slice(1, 3).map((img, idx) => (
                                <div key={idx} className={styles.subImage}>
                                    <img src={img} alt={`${project.project_name} ${idx + 2}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className={styles.rightColumn}>
                    {/* Header Info */}
                    <div>
                        <div className={styles.badges}>
                            {category && <span className={styles.badge}>{category}</span>}
                            <span className={styles.badge}>{project.status}</span>
                            {project.sub_category && <span className={styles.badge}>{project.sub_category}</span>}
                            {project.is_rera_approved && <span className={styles.badge}>RERA Approved</span>}
                        </div>

                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>{project.project_name}</h1>
                            <button
                                className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarkBtnActive : ''}`}
                                onClick={handleBookmark}
                            >
                                <Heart size={22} fill={isBookmarked ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        <div className={styles.price}>{priceDisplay}</div>

                        <div className={styles.locationRow}>
                            <MapPin size={18} />
                            <span className={styles.locationText}>
                                {project.location || project.address}
                                {project.city && `, ${project.city}`}
                            </span>
                        </div>

                        {/* Key Highlights */}
                        <div className={styles.highlightsGrid}>
                            {displayHighlights.map((h, i) => (
                                <div key={i} className={styles.highlightCard}>
                                    <span className={styles.highlightLabel}>{h.label}</span>
                                    <span className={styles.highlightValue}>{h.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Developer Card */}
                    {(developer || project.developer_name) && (
                        <div className={styles.developerCard}>
                            <div className={styles.developerLogo}>
                                {developer?.logo ? (
                                    <img src={developer.logo} alt={developer.name} />
                                ) : (
                                    <Building2 size={24} color="#a3a3a3" />
                                )}
                            </div>
                            <div className={styles.developerInfo}>
                                <h3>{developer?.name || project.developer_name}</h3>
                                <span className={styles.viewDeveloper}>View Developer</span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {project.description && (
                        <div>
                            <h2 className={styles.sectionTitle}>DESCRIPTION</h2>
                            <p className={styles.description}>{project.description}</p>
                        </div>
                    )}

                    {/* Address Section */}
                    {(project.address || project.city || project.location) && (
                        <div>
                            <h2 className={styles.sectionTitle}>ADDRESS</h2>
                            <div className={styles.detailsGrid}>
                                <div className={styles.detailColumn}>
                                    {project.address && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Street</span>
                                            <span className={styles.detailValue}>{project.address}</span>
                                        </div>
                                    )}
                                    {project.location && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Area</span>
                                            <span className={styles.detailValue}>{project.location}</span>
                                        </div>
                                    )}
                                    {project.city && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>City</span>
                                            <span className={styles.detailValue}>{project.city}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.detailColumn}>
                                    {project.state && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>State</span>
                                            <span className={styles.detailValue}>{project.state}</span>
                                        </div>
                                    )}
                                    {project.pincode && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>PIN Code</span>
                                            <span className={styles.detailValue}>{project.pincode}</span>
                                        </div>
                                    )}
                                    {project.country && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Country</span>
                                            <span className={styles.detailValue}>{project.country}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === CATEGORY-SPECIFIC SECTIONS === */}

                    {/* Villa: Villa Types */}
                    {category === 'Villa' && (plans as VillaType[]).length > 0 && (
                        <div>
                            <h2 className={styles.sectionTitle}>VILLA TYPES</h2>
                            <div className={styles.cardsGrid}>
                                {(plans as VillaType[]).map((villa, idx) => (
                                    <div key={idx} className={styles.configCard}>
                                        <h4 className={styles.configCardTitle}>{villa.villa_type}</h4>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>BHK</span>
                                            <span className={styles.configCardValue}>{villa.bhk}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Plot Area</span>
                                            <span className={styles.configCardValue}>{villa.plot_area}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Built-up Area</span>
                                            <span className={styles.configCardValue}>{villa.built_up_area}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Floors</span>
                                            <span className={styles.configCardValue}>{villa.floors}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Price Range</span>
                                            <span className={styles.configCardValue}>{villa.price_range}</span>
                                        </div>
                                        {villa.status && (
                                            <span className={`${styles.statusBadge} ${getStatusClass(villa.status)}`}>
                                                {villa.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Villa: Cluster Info */}
                    {category === 'Villa' && (towers as VillaCluster[]).length > 0 && (
                        <div>
                            <h2 className={styles.sectionTitle}>CLUSTER INFO</h2>
                            <div className={styles.cardsGrid}>
                                {(towers as VillaCluster[]).map((cluster, idx) => (
                                    <div key={idx} className={styles.configCard}>
                                        <h4 className={styles.configCardTitle}>{cluster.cluster_name}</h4>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Total Villas</span>
                                            <span className={styles.configCardValue}>{cluster.total_villas}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Completion</span>
                                            <span className={styles.configCardValue}>{cluster.completion_date}</span>
                                        </div>
                                        {cluster.status && (
                                            <span className={`${styles.statusBadge} ${getStatusClass(cluster.status)}`}>
                                                {cluster.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Plot: Plot Configurations */}
                    {category === 'Plot' && (plans as PlotConfig[]).length > 0 && (
                        <div>
                            <h2 className={styles.sectionTitle}>PLOT CONFIGURATIONS</h2>
                            <div className={styles.cardsGrid}>
                                {(plans as PlotConfig[]).map((plot, idx) => (
                                    <div key={idx} className={styles.configCard}>
                                        <h4 className={styles.configCardTitle}>{plot.plot_type}</h4>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Dimensions</span>
                                            <span className={styles.configCardValue}>{plot.dimensions}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Area</span>
                                            <span className={styles.configCardValue}>{plot.area_sqft} sq.ft</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Facing</span>
                                            <span className={styles.configCardValue}>{plot.facing}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Price/sq.ft</span>
                                            <span className={styles.configCardValue}>₹{plot.price_per_sqft}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Total Price</span>
                                            <span className={styles.configCardValue}>{plot.total_price}</span>
                                        </div>
                                        {plot.status && (
                                            <span className={`${styles.statusBadge} ${getStatusClass(plot.status)}`}>
                                                {plot.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Plot: Phase Details */}
                    {category === 'Plot' && (towers as PlotPhase[]).length > 0 && (
                        <div>
                            <h2 className={styles.sectionTitle}>PHASE DETAILS</h2>
                            <div className={styles.cardsGrid}>
                                {(towers as PlotPhase[]).map((phase, idx) => (
                                    <div key={idx} className={styles.configCard}>
                                        <h4 className={styles.configCardTitle}>{phase.phase_name}</h4>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Total Plots</span>
                                            <span className={styles.configCardValue}>{phase.total_plots}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Launch Date</span>
                                            <span className={styles.configCardValue}>{phase.launch_date}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Completion</span>
                                            <span className={styles.configCardValue}>{phase.completion_date}</span>
                                        </div>
                                        {phase.status && (
                                            <span className={`${styles.statusBadge} ${getStatusClass(phase.status)}`}>
                                                {phase.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Plot: Infrastructure (from specs) */}
                    {category === 'Plot' && Object.keys(specs).length > 0 && (
                        <div>
                            <h2 className={styles.sectionTitle}>INFRASTRUCTURE</h2>
                            <div className={styles.cardsGrid}>
                                {Object.entries(specs).map(([key, value]) => (
                                    <div key={key} className={styles.configCard}>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>{key.replace(/_/g, ' ')}</span>
                                            <span className={styles.configCardValue}>{String(value)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* === FULL WIDTH SECTIONS === */}
            <div className={styles.fullWidthContent}>
                {/* Amenities & Features */}
                {amenitiesList.length > 0 && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>AMENITIES & FEATURES</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {Object.entries(amenitiesByCategory).map(([cat, items]) => (
                                <div key={cat}>
                                    <h4 style={{ fontSize: '0.8125rem', color: '#a3a3a3', marginBottom: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                        {items!.map((label, i) => {
                                            const iconName = AMENITY_ICON_MAP[label] || 'Circle';
                                            const IconComp = getLucideIcon(iconName);
                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#ffffff', border: '1px solid #f0f0f0', borderRadius: '10px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <IconComp size={18} color="#1F524B" />
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0a0a0a' }}>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Residential: Combined Unit Configurations with Tower Details */}
                {category === 'Residential' && ((plans as ResidentialUnit[]).length > 0 || (towers as ResidentialTower[]).length > 0) && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>UNIT CONFIGURATIONS</h2>
                        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#1F524B', color: '#fafafa' }}>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tower</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Floors</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Units</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BHK</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Area</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price / Rate</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Basic Price</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completion</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const towerList = towers as ResidentialTower[];
                                        const unitList = plans as ResidentialUnit[];
                                        const unitsPerTower = towerList.length > 0 ? Math.ceil(unitList.length / towerList.length) : unitList.length;
                                        const rows: React.ReactNode[] = [];
                                        let unitIdx = 0;

                                        if (towerList.length > 0) {
                                            towerList.forEach((tower, tIdx) => {
                                                const towerUnits = unitList.slice(unitIdx, unitIdx + unitsPerTower);
                                                const rowSpan = Math.max(towerUnits.length, 1);

                                                if (towerUnits.length > 0) {
                                                    towerUnits.forEach((unit, uIdx) => {
                                                        const globalIdx = unitIdx + uIdx;
                                                        rows.push(
                                                            <tr key={`${tIdx}-${uIdx}`} style={{ borderTop: '1px solid #e5e5e5', background: globalIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                                {uIdx === 0 && (
                                                                    <>
                                                                        <td rowSpan={rowSpan} style={{ padding: '12px 18px', color: '#0a0a0a', fontWeight: 600, verticalAlign: 'top', borderRight: '1px solid #e5e5e5' }}>{tower.name}</td>
                                                                        <td rowSpan={rowSpan} style={{ padding: '12px 18px', color: '#525252', verticalAlign: 'top', borderRight: '1px solid #e5e5e5' }}>{tower.total_floors}</td>
                                                                        <td rowSpan={rowSpan} style={{ padding: '12px 18px', color: '#525252', verticalAlign: 'top', borderRight: '1px solid #e5e5e5' }}>{tower.total_units}</td>
                                                                    </>
                                                                )}
                                                                <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.type || '—'}</td>
                                                                <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.bhk || '—'}</td>
                                                                <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.area || '—'}</td>
                                                                <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.price_rate || '—'}</td>
                                                                <td style={{ padding: '12px 18px', color: '#0a0a0a', fontWeight: 500 }}>{unit.basic_price || '—'}</td>
                                                                <td style={{ padding: '12px 18px', color: '#737373' }}>{unit.completion_date || tower.completion_date || '—'}</td>
                                                                <td style={{ padding: '12px 18px' }}>
                                                                    <span className={`${styles.statusBadge} ${getStatusClass(tower.status)}`}>
                                                                        {tower.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                } else {
                                                    rows.push(
                                                        <tr key={`tower-${tIdx}`} style={{ borderTop: '1px solid #e5e5e5', background: tIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                            <td style={{ padding: '12px 18px', color: '#0a0a0a', fontWeight: 600, borderRight: '1px solid #e5e5e5' }}>{tower.name}</td>
                                                            <td style={{ padding: '12px 18px', color: '#525252', borderRight: '1px solid #e5e5e5' }}>{tower.total_floors}</td>
                                                            <td style={{ padding: '12px 18px', color: '#525252', borderRight: '1px solid #e5e5e5' }}>{tower.total_units}</td>
                                                            <td colSpan={5} style={{ padding: '12px 18px', color: '#a3a3a3', textAlign: 'center' }}>—</td>
                                                            <td style={{ padding: '12px 18px', color: '#737373' }}>{tower.completion_date || '—'}</td>
                                                            <td style={{ padding: '12px 18px' }}>
                                                                <span className={`${styles.statusBadge} ${getStatusClass(tower.status)}`}>
                                                                    {tower.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                                unitIdx += unitsPerTower;
                                            });
                                        } else {
                                            unitList.forEach((unit, idx) => {
                                                rows.push(
                                                    <tr key={idx} style={{ borderTop: '1px solid #e5e5e5', background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                        <td style={{ padding: '12px 18px', color: '#a3a3a3' }}>—</td>
                                                        <td style={{ padding: '12px 18px', color: '#a3a3a3' }}>—</td>
                                                        <td style={{ padding: '12px 18px', color: '#a3a3a3' }}>—</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.type || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.bhk || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.area || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.price_rate || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a', fontWeight: 500 }}>{unit.basic_price || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#737373' }}>{unit.completion_date || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#a3a3a3' }}>—</td>
                                                    </tr>
                                                );
                                            });
                                        }
                                        return rows;
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Floor Plans */}
                {floorPlans.length > 0 && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>FLOOR PLANS</h2>
                        <div className={styles.floorPlanTabs}>
                            {floorPlans.map((plan, index) => (
                                <button
                                    key={index}
                                    className={`${styles.tabButton} ${activeFloorPlan === index ? styles.active : ''}`}
                                    onClick={() => setActiveFloorPlan(index)}
                                >
                                    {plan.name}
                                </button>
                            ))}
                        </div>
                        <div className={styles.floorPlanImage}>
                            <img src={floorPlans[activeFloorPlan].image} alt={floorPlans[activeFloorPlan].name} />
                        </div>
                    </div>
                )}

                {/* Master Plan Image (if no floor plans but master plan exists) */}
                {floorPlans.length === 0 && project.master_plan_image && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>MASTER PLAN</h2>
                        <div className={styles.floorPlanImage}>
                            <img src={project.master_plan_image} alt="Master Plan" />
                        </div>
                    </div>
                )}

                {/* Brochure */}
                {project.brochure_url && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>BROCHURE</h2>
                        <BrochureSection
                            brochureUrl={project.brochure_url}
                            projectName={project.project_name}
                        />
                    </div>
                )}

                {/* Specifications (non-Plot categories) */}
                {category !== 'Plot' && Object.keys(specs).length > 0 && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>SPECIFICATIONS</h2>
                        <div className={styles.specsGrid}>
                            {Object.entries(specs).map(([groupName, groupValue]) => {
                                if (typeof groupValue === 'object' && groupValue && !Array.isArray(groupValue)) {
                                    return (
                                        <div key={groupName} className={styles.specsGroup}>
                                            <h4 className={styles.specsGroupTitle}>{groupName.replace(/_/g, ' ')}</h4>
                                            {Object.entries(groupValue as Record<string, string>).map(([k, v]) => (
                                                <div key={k} className={styles.specItem}>
                                                    <span className={styles.specLabel}>{k.replace(/_/g, ' ')}</span>
                                                    <span className={styles.specValue}>{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                                return (
                                    <div key={groupName} className={styles.specItem}>
                                        <span className={styles.specLabel}>{groupName.replace(/_/g, ' ')}</span>
                                        <span className={styles.specValue}>{String(groupValue)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Connectivity */}
                {connectivity.length > 0 && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>CONNECTIVITY</h2>
                        <div className={styles.connectivityGrid}>
                            {connectivity.map((item, idx) => (
                                <div key={idx} className={styles.connectivityCard}>
                                    <span className={styles.connectivityType}>{item.type}</span>
                                    <span className={styles.connectivityName}>{item.name}</span>
                                    <span className={styles.connectivityDistance}>{item.distance}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Video */}
                {project.video_url && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>VIDEO WALKTHROUGH</h2>
                        <div className={styles.videoContainer}>
                            <iframe
                                className={styles.videoFrame}
                                src={project.video_url.includes('watch?v=') ? project.video_url.replace('watch?v=', 'embed/') : project.video_url}
                                title="Project Video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>

            {/* Map Section */}
            <div className={styles.mapSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle} style={{ margin: 0 }}>LOCATION</h2>
                </div>
                <div className={styles.mapPlaceholder}>
                    <div style={{ textAlign: 'center' }}>
                        <MapIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Map Integration Coming Soon</p>
                        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                            {project.location || project.address}
                            {project.city && `, ${project.city}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Group Buy Section */}
            <GroupBuySection projectName={project.project_name} />

            {/* Similar Projects */}
            {similarProjects.length > 0 && (
                <div className={styles.similarSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>SIMILAR PROJECTS</h2>
                    </div>
                    <div className={styles.similarGrid}>
                        {similarProjects.map((p) => (
                            <ProjectCard
                                key={p.id}
                                id={p.id}
                                project_name={p.project_name}
                                location={p.location || ''}
                                min_price={p.min_price}
                                max_price={p.max_price}
                                bhk_options={p.bhk_options}
                                image={p.images?.[0] || ''}
                                status={p.status}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Sticky Contact Button */}
            <button className={styles.contactFloat}>
                Contact Agent <UserCircle size={20} />
            </button>
        </div>
    );
};

export default ProjectDetailPage;
