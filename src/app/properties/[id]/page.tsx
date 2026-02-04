"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/emergent/PropertyCard";
import {
    MapPin, BedDouble, Bath, Maximize,
    Heart, UserCircle, Map as MapIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/PropertyDetail.module.css";

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
    video_url?: string | null;
    floor_plans?: { name: string; image: string }[] | null;
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
                            <div className={styles.mainImage}>
                                <img src={displayImages[0]} alt={property.title} />
                            </div>
                            {displayImages.slice(1, 3).map((img, idx) => (
                                <div key={idx} className={styles.subImage}>
                                    <img src={img} alt={`${property.title} ${idx + 2}`} />
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
                    </div>

                    {/* Agent Info */}
                    {agent && (
                        <div className={styles.agentCard}>
                            <div className={styles.agentImage}>
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
                {property.amenities && (
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>AMENITIES & FEATURES</h2>
                        <div className={styles.amenitiesGrid}>
                            <div className={styles.detailColumn}>
                                {property.amenities.interior && property.amenities.interior.length > 0 && (
                                    <div className={styles.amenityGroup}>
                                        <h4>Interior Details</h4>
                                        <ul className={styles.amenityList}>
                                            {property.amenities.interior.map((item, i) => (
                                                <li key={i}><span className={styles.bullet}></span>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {property.amenities.utilities && property.amenities.utilities.length > 0 && (
                                    <div className={styles.amenityGroup}>
                                        <h4>Utilities</h4>
                                        <ul className={styles.amenityList}>
                                            {property.amenities.utilities.map((item, i) => (
                                                <li key={i}><span className={styles.bullet}></span>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className={styles.detailColumn}>
                                {property.amenities.outdoor && property.amenities.outdoor.length > 0 && (
                                    <div className={styles.amenityGroup}>
                                        <h4>Outdoor Details</h4>
                                        <ul className={styles.amenityList}>
                                            {property.amenities.outdoor.map((item, i) => (
                                                <li key={i}><span className={styles.bullet}></span>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {property.amenities.other && property.amenities.other.length > 0 && (
                                    <div className={styles.amenityGroup}>
                                        <h4>Other Features</h4>
                                        <ul className={styles.amenityList}>
                                            {property.amenities.other.map((item, i) => (
                                                <li key={i}><span className={styles.bullet}></span>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
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
                <div className={styles.mapPlaceholder}>
                    <div style={{ textAlign: 'center' }}>
                        <MapIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Map Integration Coming Soon</p>
                        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                            {property.location}
                            {property.city && `, ${property.city}`}
                        </p>
                    </div>
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

            {/* Sticky Contact Button */}
            <button className={styles.contactFloat}>
                Contact Agent <UserCircle size={20} />
            </button>
        </div>
    );
};

export default PropertyDetailPage;
