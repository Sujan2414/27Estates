"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/emergent/ProjectCard";
import * as LucideIcons from "lucide-react";
import {
    MapPin, Heart, UserCircle, Map as MapIcon,
    Building2, Home, Calendar, CheckCircle2,
    Share2, Facebook, Link as LinkIcon
} from "lucide-react";
import { FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/ProjectDetail.module.css";
import GroupBuySection from "@/components/emergent/GroupBuySection";
import ImageGalleryModal from "@/components/emergent/ImageGalleryModal";
import { AMENITY_ICON_MAP, AMENITIES_BY_CATEGORY, AMENITY_CATEGORIES, flattenAmenities } from "@/lib/amenities-data";
import type { AmenityCategory } from "@/lib/amenities-data";

// Dynamic import to avoid SSR — react-pdf uses DOMMatrix which only exists in the browser
const BrochureSection = dynamic(
    () => import("@/components/ui/brochure-viewer").then(mod => mod.BrochureSection),
    { ssr: false }
);

// Dynamic import for Map
const PropertyMap = dynamic(() => import("@/components/emergent/PropertyMap"), {
    ssr: false,
    loading: () => <div style={{ height: '400px', background: '#f5f5f5', borderRadius: '1rem' }} />
});

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
    developer_image?: string | null;
    developer_description?: string | null;
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

interface CommercialFloor {
    floor_name: string;
    total_units: string;
    unit_types: string;
    completion_date: string;
    status: string;
}

interface CommercialUnit {
    unit_type: string;
    area_range: string;
    price_range: string;
    rent_per_sqft: string;
    status: string;
}

interface ConnectivityItem {
    type: string;
    name: string;
    distance: string;
    icon?: string;
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
    const [agent, setAgent] = useState<any | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showDeveloperModal, setShowDeveloperModal] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [initialGalleryIndex, setInitialGalleryIndex] = useState(0);

    const openGallery = (index: number) => {
        setInitialGalleryIndex(index);
        setIsGalleryOpen(true);
    };

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
            } else {
                // Check guest bookmarks
                const guestBookmarks = JSON.parse(sessionStorage.getItem('guest_bookmarks') || '[]');
                setIsBookmarked(guestBookmarks.includes(projectId));
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

            // Get agent
            if (projectData.assigned_agent_id) {
                const { data: agentData } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('id', projectData.assigned_agent_id)
                    .single();
                setAgent(agentData || null);
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
            // Guest bookmark logic
            const key = 'guest_bookmarks';
            const stored = JSON.parse(sessionStorage.getItem(key) || '[]') as string[];

            if (isBookmarked) {
                const updated = stored.filter((id: string) => id !== project.id);
                sessionStorage.setItem(key, JSON.stringify(updated));
                setIsBookmarked(false);
            } else {
                stored.push(project.id);
                sessionStorage.setItem(key, JSON.stringify(stored));
                setIsBookmarked(true);
            }
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

    const getWhatsAppLink = () => {
        const phone = agent?.phone || project?.employee_phone || '+919999999999'; // Fallback
        // Remove non-numeric characters for link, ensuring country code is present if typical Indian
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

        const message = `Hey! I am interested in this project:\n\n*${project?.project_name}*\n📍 ${project?.location || project?.city || ''}\n🔗 ${typeof window !== 'undefined' ? window.location.href : ''}\n\nPlease share more details.`;
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    const getCallLink = () => {
        const phone = agent?.phone || project?.employee_phone || '+919999999999';
        return `tel:${phone}`;
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
                            <div className={styles.mainImage} onClick={() => openGallery(0)}>
                                <img src={displayImages[0]} alt={project.project_name} />
                            </div>
                            {displayImages.slice(1, 3).map((img, idx) => {
                                const globalIndex = idx + 1;
                                const isLastVisble = idx === 1; // 2nd sub-image (3rd total)
                                const hasMore = displayImages.length > 3;

                                return (
                                    <div
                                        key={idx}
                                        className={styles.subImage}
                                        onClick={() => openGallery(globalIndex)}
                                        style={{ cursor: 'pointer', position: 'relative' }}
                                    >
                                        <img src={img} alt={`${project.project_name} ${idx + 2}`} />
                                        {isLastVisble && hasMore && (
                                            <div className={styles.viewAllOverlay}>
                                                <span className={styles.viewAllText}>
                                                    +{displayImages.length - 3} photos
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <ImageGalleryModal
                            isOpen={isGalleryOpen}
                            onClose={() => setIsGalleryOpen(false)}
                            images={displayImages}
                            initialIndex={initialGalleryIndex}
                        />
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
                                {developer?.logo || project.developer_image ? (
                                    <img src={developer?.logo || project.developer_image || ''} alt={developer?.name || project.developer_name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                                ) : (
                                    <Building2 size={24} color="#a3a3a3" />
                                )}
                            </div>
                            <div className={styles.developerInfo}>
                                <h3>{developer?.name || project.developer_name}</h3>
                                {(developer?.description || project.developer_description) && (
                                    <span
                                        className={styles.viewDeveloper}
                                        onClick={() => setShowDeveloperModal(true)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        View Developer
                                    </span>
                                )}
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

                    {/* Commercial: Unit Configurations */}
                    {category === 'Commercial' && (plans as CommercialUnit[]).length > 0 && (
                        <div>
                            <h2 className={styles.sectionTitle}>UNIT CONFIGURATIONS</h2>
                            <div className={styles.cardsGrid}>
                                {(plans as CommercialUnit[]).map((unit, idx) => (
                                    <div key={idx} className={styles.configCard}>
                                        <h4 className={styles.configCardTitle}>{unit.unit_type}</h4>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Area Range</span>
                                            <span className={styles.configCardValue}>{unit.area_range}</span>
                                        </div>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Price Range</span>
                                            <span className={styles.configCardValue}>{unit.price_range}</span>
                                        </div>
                                        {unit.rent_per_sqft && (
                                            <div className={styles.configCardRow}>
                                                <span className={styles.configCardLabel}>Rent / Sq.Ft</span>
                                                <span className={styles.configCardValue}>{unit.rent_per_sqft}</span>
                                            </div>
                                        )}
                                        {unit.status && (
                                            <span className={`${styles.statusBadge} ${getStatusClass(unit.status)}`}>
                                                {unit.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Commercial: Floor / Wing Details */}
                    {category === 'Commercial' && (towers as CommercialFloor[]).length > 0 && (
                        <div>
                            <h2 className={styles.sectionTitle}>FLOOR / WING DETAILS</h2>
                            <div className={styles.cardsGrid}>
                                {(towers as CommercialFloor[]).map((floor, idx) => (
                                    <div key={idx} className={styles.configCard}>
                                        <h4 className={styles.configCardTitle}>{floor.floor_name}</h4>
                                        <div className={styles.configCardRow}>
                                            <span className={styles.configCardLabel}>Total Units</span>
                                            <span className={styles.configCardValue}>{floor.total_units}</span>
                                        </div>
                                        {floor.unit_types && (
                                            <div className={styles.configCardRow}>
                                                <span className={styles.configCardLabel}>Unit Types</span>
                                                <span className={styles.configCardValue}>{floor.unit_types}</span>
                                            </div>
                                        )}
                                        {floor.completion_date && (
                                            <div className={styles.configCardRow}>
                                                <span className={styles.configCardLabel}>Completion</span>
                                                <span className={styles.configCardValue}>{floor.completion_date}</span>
                                            </div>
                                        )}
                                        {floor.status && (
                                            <span className={`${styles.statusBadge} ${getStatusClass(floor.status)}`}>
                                                {floor.status}
                                            </span>
                                        )}
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
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#ffffff', border: '1px solid #f0f0f0', borderRadius: '12px' }}>
                                                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <IconComp size={24} color="#183C38" />
                                                    </div>
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0a0a0a' }}>{label}</span>
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
                                    <tr style={{ background: '#183C38', color: '#fafafa' }}>
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

                {/* Commercial: Combined Floor & Unit Table */}
                {category === 'Commercial' && ((plans as CommercialUnit[]).length > 0 || (towers as CommercialFloor[]).length > 0) && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>COMMERCIAL UNIT DETAILS</h2>
                        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#183C38', color: '#fafafa' }}>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Floor / Wing</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Units</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unit Type</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Area Range</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price Range</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rent / Sq.Ft</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completion</th>
                                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const floorList = towers as CommercialFloor[];
                                        const unitList = plans as CommercialUnit[];
                                        const rows: React.ReactNode[] = [];

                                        if (unitList.length > 0) {
                                            unitList.forEach((unit, idx) => {
                                                const floor = floorList[idx] || null;
                                                rows.push(
                                                    <tr key={idx} style={{ borderTop: '1px solid #e5e5e5', background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a', fontWeight: 600, borderRight: '1px solid #e5e5e5' }}>{floor?.floor_name || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#525252', borderRight: '1px solid #e5e5e5' }}>{floor?.total_units || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.unit_type || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.area_range || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a', fontWeight: 500 }}>{unit.price_range || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{unit.rent_per_sqft || '—'}</td>
                                                        <td style={{ padding: '12px 18px', color: '#737373' }}>{floor?.completion_date || '—'}</td>
                                                        <td style={{ padding: '12px 18px' }}>
                                                            {unit.status && (
                                                                <span className={`${styles.statusBadge} ${getStatusClass(unit.status)}`}>
                                                                    {unit.status}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        } else if (floorList.length > 0) {
                                            floorList.forEach((floor, idx) => {
                                                rows.push(
                                                    <tr key={idx} style={{ borderTop: '1px solid #e5e5e5', background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a', fontWeight: 600, borderRight: '1px solid #e5e5e5' }}>{floor.floor_name}</td>
                                                        <td style={{ padding: '12px 18px', color: '#525252', borderRight: '1px solid #e5e5e5' }}>{floor.total_units}</td>
                                                        <td style={{ padding: '12px 18px', color: '#0a0a0a' }}>{floor.unit_types || '—'}</td>
                                                        <td colSpan={3} style={{ padding: '12px 18px', color: '#a3a3a3', textAlign: 'center' }}>—</td>
                                                        <td style={{ padding: '12px 18px', color: '#737373' }}>{floor.completion_date || '—'}</td>
                                                        <td style={{ padding: '12px 18px' }}>
                                                            {floor.status && (
                                                                <span className={`${styles.statusBadge} ${getStatusClass(floor.status)}`}>
                                                                    {floor.status}
                                                                </span>
                                                            )}
                                                        </td>
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
                            {connectivity.map((item, idx) => {
                                const IconComp = item.icon ? getLucideIcon(item.icon) : LucideIcons.MapPin;
                                return (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#ffffff', border: '1px solid #f0f0f0', borderRadius: '12px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <IconComp size={24} color="#183C38" />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0a0a0a' }}>{item.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                                                <span>{item.type}</span>
                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }} />
                                                <span style={{ fontWeight: 500 }}>{item.distance}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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

                {/* Map Section */}
                <div className={styles.sectionContainer}>
                    <h2 className={styles.sectionTitle}>LOCATION</h2>
                    <div style={{ height: '400px', width: '100%', marginTop: '1rem' }}>
                        <PropertyMap
                            properties={[]}
                            projects={[{
                                id: project.id,
                                title: project.project_name,
                                project_name: project.project_name,
                                display_name: project.project_name,
                                price: project.min_price_numeric || undefined,
                                price_text: project.min_price || undefined,
                                min_price: project.min_price,
                                max_price: project.max_price,
                                images: project.images || [],
                                location: project.location || project.address || '',
                                latitude: project.latitude,
                                longitude: project.longitude,
                                type: 'project',
                                category: project.category || undefined
                            }]}
                        />
                    </div>
                </div>
            </div>



            {/* Group Buy Section */}
            <GroupBuySection
                projectName={project.project_name}
                agentPhone={agent?.phone || project?.employee_phone || undefined}
            />

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

            {/* Sticky Actions Container */}
            <div className={styles.stickyActionsContainer}>
                {/* Contact Agent Button */}
                <button className={styles.contactFloat} onClick={() => setShowContactModal(true)}>
                    <span>Contact Agent</span> <UserCircle size={24} strokeWidth={1.5} />
                </button>

                {/* Share Button Group */}
                <div className={styles.shareGroup}>
                    <button className={styles.shareBtnFloat}>
                        <Share2 size={24} strokeWidth={1.5} />
                    </button>
                    <div className={styles.socialIconsMenu}>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Check out this project: *${project.project_name}*\nPrice: ${project.min_price || 'Price on Request'}\nLocation: ${project.location || project.address || 'Location Unknown'}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp"
                            className={`${styles.socialIconBtn} ${styles.whatsapp}`}
                        >
                            <FaWhatsapp size={20} />
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" title="Facebook" className={`${styles.socialIconBtn} ${styles.facebook}`}>
                            <Facebook size={20} />
                        </a>
                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent('Check out this project!')}`} target="_blank" rel="noopener noreferrer" title="X" className={`${styles.socialIconBtn} ${styles.twitter}`}>
                            <FaXTwitter size={20} />
                        </a>
                        <button onClick={() => navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '')} title="Copy Link" className={`${styles.socialIconBtn} ${styles.copy}`}>
                            <LinkIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Contact Modal Overlay */}
            {showContactModal && (
                <div className={styles.modalOverlay} onClick={() => setShowContactModal(false)}>
                    <div className={styles.contactModal} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setShowContactModal(false)}>
                            <LucideIcons.X size={24} />
                        </button>

                        <div className={styles.modalHeader}>
                            <div className={styles.agentImageWrapper}>
                                {agent?.image ? (
                                    <img src={agent.image} alt={agent.name} className={styles.agentImage} />
                                ) : (
                                    <UserCircle size={64} color="#94a3b8" strokeWidth={1} />
                                )}
                            </div>
                            <h3 className={styles.agentName}>{agent?.name || project?.employee_name || 'Property Expert'}</h3>
                            <p className={styles.agentRole}>Assigned Agent</p>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.modalText}>
                                Want to know more about <strong style={{ color: '#183C38' }}>{project.project_name}</strong>? Get in touch with our expert today!
                            </p>

                            <div className={styles.contactActions}>
                                <a href={getCallLink()} className={`${styles.actionBtn} ${styles.callBtn}`}>
                                    <LucideIcons.Phone size={18} fill="currentColor" /> Call Now
                                </a>
                                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.whatsappBtn}`}>
                                    <LucideIcons.MessageCircle size={18} fill="currentColor" /> WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Developer Modal Overlay */}
            {showDeveloperModal && (
                <div className={styles.modalOverlay} onClick={() => setShowDeveloperModal(false)}>
                    <div className={styles.contactModal} onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <button className={styles.closeModalBtn} onClick={() => setShowDeveloperModal(false)}>
                            <LucideIcons.X size={24} />
                        </button>

                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                            {developer?.logo || project.developer_image ? (
                                <img src={developer?.logo || project.developer_image || ''} alt={developer?.name || project.developer_name} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px' }} />
                            ) : (
                                <Building2 size={48} color="#a3a3a3" />
                            )}
                        </div>
                        <h3 className={styles.agentName} style={{ marginBottom: '12px' }}>{developer?.name || project.developer_name}</h3>
                        <div style={{ width: '40px', height: '2px', background: 'var(--color-gold)', margin: '0 auto 16px' }} />
                        <div className={styles.modalBody} style={{ padding: '0 8px 16px' }}>
                            <p className={styles.modalText} style={{ textAlign: 'center', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                {project.developer_description || developer?.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailPage;
