"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/emergent/PropertyCard";
import {
    MapPin, BedDouble, Bath, Maximize,
    Heart, UserCircle, Map as MapIcon,
    Share2, Facebook, Link as LinkIcon
} from "lucide-react";
import { FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/PropertyDetail.module.css";
import ImageGalleryModal from "@/components/emergent/ImageGalleryModal";
import { AMENITY_ICON_MAP, AMENITIES_BY_CATEGORY, AMENITY_CATEGORIES, flattenAmenities } from "@/lib/amenities-data";
import type { AmenityCategory } from "@/lib/amenities-data";
import * as LucideIcons from "lucide-react";

// Helper to get Lucide icon component by name
const getLucideIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>;
    const Icon = icons[iconName];
    return Icon || LucideIcons.Circle;
};

// Dynamic import for Map to avoid SSR issues
const PropertyMap = dynamic(() => import("@/components/emergent/PropertyMap"), {
    ssr: false,
    loading: () => <div style={{ height: '400px', background: '#f5f5f5', borderRadius: '1rem' }} />
});

// Types matching Supabase V2 schema
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
    landmark: string | null;
    latitude: number | null;
    longitude: number | null;
    // Property Details
    rooms: number | null;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lot_size: number | null;
    floors: number | null;
    carpet_area: number | null;
    built_up_area: number | null;
    plot_size: number | null;
    balconies: number | null;
    parking_count: number | null;
    // Type & Category
    property_type: 'Sale' | 'Rent';
    category: string;
    sub_category: string | null;
    furnishing: string | null;
    facing: string | null;
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
    connectivity?: { type: string; name: string; distance: string; icon?: string }[] | null;
    video_url?: string | null;
    floor_plans?: { name: string; image: string }[] | null;
    pricing_details?: {
        maintenance_charges?: string | number;
        maintenance_paid_by_licensor?: boolean;
        deposit_amount?: string | number;
        deposit_negotiable?: boolean;
        deposit_refundable?: boolean;
    } | null;
    // Index signature for compatibility with PropertyCard
    [key: string]: unknown;
}

interface Agent {
    id: string;
    name: string;
    email: string;
    phone: string;
    image: string;
    role: string;
    bio: string;
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

interface PropertyDetailPageProps {
    params: Promise<{ id: string }>;
}

const PropertyDetailPage = ({ params }: PropertyDetailPageProps) => {
    const resolvedParams = use(params);
    const router = useRouter();
    const supabase = createClient();
    const [property, setProperty] = useState<Property | null>(null);
    const [agent, setAgent] = useState<Agent | null>(null);
    const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeFloorPlan, setActiveFloorPlan] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [initialGalleryIndex, setInitialGalleryIndex] = useState(0);
    const [showContactModal, setShowContactModal] = useState(false);

    const openGallery = (index: number) => {
        setInitialGalleryIndex(index);
        setIsGalleryOpen(true);
    };

    const fetchPropertyData = async () => {
        try {
            const propertyId = resolvedParams?.id || '';

            // Fetch property from Supabase
            const { data: propertyData, error: propError } = await supabase
                .from('properties')
                .select('*')
                .eq('id', propertyId)
                .single();

            if (propError || !propertyData) {
                setLoading(false);
                return;
            }

            setProperty(propertyData);

            // Check if bookmarked
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: bookmark } = await supabase
                    .from('user_bookmarks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('property_id', propertyId)
                    .single();
                setIsBookmarked(!!bookmark);

                // Get all user's bookmarks for similar properties section
                const { data: allBookmarks } = await supabase
                    .from('user_bookmarks')
                    .select('property_id')
                    .eq('user_id', user.id);
                setBookmarkIds(allBookmarks?.map(b => b.property_id).filter(Boolean) as string[] || []);
            }

            // Get agent
            if (propertyData.agent_id) {
                const { data: agentData } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('id', propertyData.agent_id)
                    .single();
                setAgent(agentData || null);
            }

            // Get similar properties (same category, different id)
            const { data: similar } = await supabase
                .from('properties')
                .select('*')
                .eq('category', propertyData.category)
                .neq('id', propertyId)
                .limit(3);
            setSimilarProperties(similar || []);

        } catch (error) {
            console.error("Error fetching property:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPropertyData();
    }, [resolvedParams?.id]);

    const handleBookmark = async () => {
        if (!property) return;

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
                .eq('property_id', property.id);
            setIsBookmarked(false);
        } else {
            await supabase
                .from('user_bookmarks')
                .insert({ user_id: user.id, property_id: property.id });
            setIsBookmarked(true);
        }
    };

    const isPropertyInBookmarks = (propertyId: string) => {
        return bookmarkIds.includes(propertyId);
    };

    const getWhatsAppLink = () => {
        const phone = agent?.phone || '+919999999999'; // Fallback

        // Remove non-numeric characters for link, ensuring country code is present if typical Indian
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

        const message = `Hey! I am interested in this property:\n\n*${property?.title}*\n📍 ${property?.location || property?.city || ''}\n🔗 ${typeof window !== 'undefined' ? window.location.href : ''}\n\nPlease share more details.`;
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    const getCallLink = () => {
        const phone = agent?.phone || '+919999999999';
        return `tel:${phone}`;
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingText}>Loading property...</div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className={styles.notFound}>
                <h2 className={styles.sectionTitle}>Property not found</h2>
                <p style={{ color: '#737373', marginBottom: '1rem' }}>The property you&apos;re looking for doesn&apos;t exist.</p>
                <button onClick={() => router.push('/properties')} className={styles.backButton} style={{ border: '1px solid #e5e5e5', borderRadius: '0.5rem' }}>
                    Back to Properties
                </button>
            </div>
        );
    }

    // Prepare images
    const displayImages = property.images && property.images.length > 0
        ? property.images
        : ['/placeholder-property.jpg'];

    // Get display price - prefer price_text if available
    const displayPrice = property.price_text || formatIndianRupee(property.price);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.layoutGrid}>
                {/* Left Column: Sticky Gallery */}
                <div className={styles.leftColumn}>
                    <div className={styles.stickyGallery}>
                        <div className={styles.imageGallery}>
                            <div className={styles.mainImage} onClick={() => openGallery(0)}>
                                <img src={displayImages[0]} alt={property.title} />
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
                                        <img src={img} alt={`${property.title} ${idx + 2}`} />
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
                            <span className={styles.badge}>{property.category}</span>
                            <span className={styles.badge}>{property.property_type}</span>
                            <span className={styles.badge}>{property.location}</span>
                            {property.furnishing && (
                                <span className={styles.badge}>{property.furnishing}</span>
                            )}
                        </div>

                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>{property.title}</h1>
                            <div className={styles.price}>{displayPrice}</div>
                        </div>

                        <div className={styles.locationRow}>
                            <MapPin size={18} />
                            <span className={styles.locationText}>
                                {property.location}
                                {property.city && `, ${property.city}`}
                            </span>
                        </div>

                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <BedDouble size={20} />
                                <span>{property.rooms || property.bedrooms} Rooms</span>
                            </div>
                            <div className={styles.statItem}>
                                <Bath size={20} />
                                <span>{property.bathrooms} Bathrooms</span>
                            </div>
                            <div className={styles.statItem}>
                                <Maximize size={20} />
                                <span>{property.sqft} ft²</span>
                            </div>
                        </div>

                        {/* RENT SPECIFIC PRICING CARDS */}
                        {property.property_type === 'Rent' && property.pricing_details && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '20px' }}>
                                {(property.pricing_details.maintenance_charges || property.pricing_details.maintenance_paid_by_licensor) ? (
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Maintenance</span>
                                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                                            {property.pricing_details.maintenance_charges ? `₹ ${property.pricing_details.maintenance_charges.toLocaleString()}` : (property.pricing_details.maintenance_paid_by_licensor ? 'Included' : 'N/A')}
                                        </span>
                                        {property.pricing_details.maintenance_paid_by_licensor && (
                                            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>Paid by Licensor</span>
                                        )}
                                    </div>
                                ) : null}
                                {(property.pricing_details.deposit_amount || property.pricing_details.deposit_negotiable || property.pricing_details.deposit_refundable) ? (
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Security Deposit</span>
                                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                                            {property.pricing_details.deposit_amount ? `₹ ${property.pricing_details.deposit_amount.toLocaleString()}` : 'N/A'}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                            {property.pricing_details.deposit_negotiable && (
                                                <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>Negotiable</span>
                                            )}
                                            {property.pricing_details.deposit_refundable && (
                                                <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>Refundable</span>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Agent Info */}
                    {agent && (
                        <div className={styles.agentCard}>
                            <div className={styles.agentAvatar}>
                                <img src={agent.image || '/placeholder-agent.jpg'} alt={agent.name} />
                            </div>
                            <div className={styles.agentInfo}>
                                <h3>{agent.name}</h3>
                                <div className={styles.viewProfile}>View Profile</div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {property.description && (
                        <div>
                            <h2 className={styles.sectionTitle}>DESCRIPTION</h2>
                            <p className={styles.description}>
                                {property.description}
                            </p>
                        </div>
                    )}

                    {/* Address Section - Using separate columns */}
                    {(property.street || property.city || property.area || property.location) && (
                        <div>
                            <h2 className={styles.sectionTitle}>ADDRESS</h2>
                            <div className={styles.detailsGrid}>
                                <div className={styles.detailColumn}>
                                    {property.street && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Street</span>
                                            <span className={styles.detailValue}>{property.street}</span>
                                        </div>
                                    )}
                                    {(property.area || property.location) && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Area</span>
                                            <span className={styles.detailValue}>{property.area || property.location}</span>
                                        </div>
                                    )}
                                    {property.city && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>City</span>
                                            <span className={styles.detailValue}>{property.city}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.detailColumn}>
                                    {property.state && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>State</span>
                                            <span className={styles.detailValue}>{property.state}</span>
                                        </div>
                                    )}
                                    {property.pincode && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>PIN Code</span>
                                            <span className={styles.detailValue}>{property.pincode}</span>
                                        </div>
                                    )}
                                    {property.country && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Country</span>
                                            <span className={styles.detailValue}>{property.country}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Section */}
                    <div>
                        <h2 className={styles.sectionTitle}>DETAILS</h2>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailColumn}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Property Id</span>
                                    <span className={styles.detailValue}>{property.property_id}</span>
                                </div>
                                {property.price_per_sqft && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Price Info</span>
                                        <span className={styles.detailValue}>₹ {property.price_per_sqft} / sq ft</span>
                                    </div>
                                )}
                                {property.lot_size && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Property Lot Size</span>
                                        <span className={styles.detailValue}>{property.lot_size.toLocaleString()} ft²</span>
                                    </div>
                                )}
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Bedrooms</span>
                                    <span className={styles.detailValue}>{property.bedrooms}</span>
                                </div>
                                {property.sub_category && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Type</span>
                                        <span className={styles.detailValue}>{property.sub_category}</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.detailColumn}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Price</span>
                                    <span className={styles.detailValue}>₹ {property.price.toLocaleString()}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Property Size</span>
                                    <span className={styles.detailValue}>{property.sqft} ft²</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Rooms</span>
                                    <span className={styles.detailValue}>{property.rooms || property.bedrooms}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Bathrooms</span>
                                    <span className={styles.detailValue}>{property.bathrooms}</span>
                                </div>
                                {property.project_name && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Project</span>
                                        <span className={styles.detailValue}>{property.project_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Width Sections */}
            <div className={styles.fullWidthContent}>

                {/* Amenities & Features */}
                {(() => {
                    const amenitiesList = flattenAmenities(property.amenities);
                    if (amenitiesList.length === 0) return null;

                    // Group amenities by their category from the master list
                    const amenitiesByCategory: Partial<Record<AmenityCategory, string[]>> = {};
                    amenitiesList.forEach(label => {
                        let found = false;
                        for (const cat of AMENITY_CATEGORIES) {
                            if (AMENITIES_BY_CATEGORY[cat].some(a => a.label === label)) {
                                if (!amenitiesByCategory[cat]) amenitiesByCategory[cat] = [];
                                amenitiesByCategory[cat]!.push(label);
                                found = true;
                                break;
                            }
                        }
                        // uncategorized -> Lifestyle & Wellness (fallback)
                        if (!found) {
                            if (!amenitiesByCategory['Lifestyle & Wellness']) amenitiesByCategory['Lifestyle & Wellness'] = [];
                            amenitiesByCategory['Lifestyle & Wellness']!.push(label);
                        }
                    });

                    return (
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
                    );
                })()}

                {/* Connectivity */}
                {property.connectivity && property.connectivity.length > 0 && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>CONNECTIVITY</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {property.connectivity.map((conn, idx) => {
                                const IconComp = conn.icon ? getLucideIcon(conn.icon) : LucideIcons.MapPin;
                                return (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#ffffff', border: '1px solid #f0f0f0', borderRadius: '12px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <IconComp size={24} color="#183C38" />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0a0a0a' }}>{conn.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                                                <span>{conn.type}</span>
                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }} />
                                                <span style={{ fontWeight: 500 }}>{conn.distance}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Floor Plans */}
                {property.floor_plans && property.floor_plans.length > 0 && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>FLOOR PLANS</h2>
                        <p className={styles.description} style={{ marginBottom: '1rem' }}>
                            Living Spaces are more easily interpreted. All-In-Ones color floor plan option clearly defines your listing&apos;s living spaces.
                        </p>

                        <div className={styles.floorPlanTabs}>
                            {property.floor_plans.map((plan, index) => (
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
                            <img src={property.floor_plans[activeFloorPlan].image} alt={property.floor_plans[activeFloorPlan].name} />
                        </div>
                    </div>
                )}

                {/* Video */}
                {property.video_url && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>VIDEO</h2>
                        <div className={styles.videoContainer}>
                            <iframe
                                className={styles.videoFrame}
                                src={property.video_url}
                                title="Property Video"
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
                <div style={{ height: '400px', width: '100%', marginTop: '1rem' }}>
                    <PropertyMap
                        properties={[{
                            id: property.id,
                            title: property.title,
                            display_name: property.display_name,
                            project_name: property.project_name,
                            price: property.price,
                            price_text: property.price_text,
                            images: property.images || [],
                            location: property.location,
                            latitude: property.latitude,
                            longitude: property.longitude,
                            type: 'property',
                            category: property.category
                        }]}
                    />
                </div>
            </div>

            {/* Similar Listings */}
            {similarProperties.length > 0 && (
                <div className={styles.similarSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>SIMILAR LISTINGS</h2>
                    </div>
                    <div className={styles.similarGrid}>
                        {similarProperties.map((p) => (
                            <PropertyCard
                                key={p.id}
                                property={p}
                                isBookmarked={isPropertyInBookmarks(p.id)}
                                onBookmarkChange={fetchPropertyData}
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
                            href={`https://wa.me/?text=${encodeURIComponent(`Check out this property: *${property.title}*\nPrice: ${displayPrice}\nLocation: ${property.location}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
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
                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent('Check out this property!')}`} target="_blank" rel="noopener noreferrer" title="X" className={`${styles.socialIconBtn} ${styles.twitter}`}>
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
                                    <img src={agent.image} alt={agent.name} className={styles.modalAgentImg} />
                                ) : (
                                    <UserCircle size={64} color="#94a3b8" strokeWidth={1} />
                                )}
                            </div>
                            <h3 className={styles.agentName}>{agent?.name || 'Property Expert'}</h3>
                            <p className={styles.agentRole}>Assigned Agent</p>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.modalText}>
                                Want to know more about <strong style={{ color: '#183C38' }}>{property.title}</strong>? Get in touch with our expert today!
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
        </div>

    );
};

export default PropertyDetailPage;
