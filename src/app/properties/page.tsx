"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import PropertyCard from "@/components/emergent/PropertyCard";
import LatestPropertyCard from "@/components/emergent/LatestPropertyCard";
import CommercialHomeCard from "@/components/emergent/CommercialHomeCard";
import WarehouseHomeCard from "@/components/emergent/WarehouseHomeCard";
import { Search as SearchIcon, ChevronDown, X, Loader2, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/emergent/Dashboard.module.css";
import { motion, AnimatePresence } from "framer-motion";
import PostPropertyForm from "@/components/dashboard/PostPropertyForm";

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
    location: string;
    address: string | null;
    street: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string | null;
    rooms: number | null;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lot_size: number | null;
    floors: number | null;
    property_type: 'Sale' | 'Rent' | 'Lease';
    category: string;
    sub_category: string | null;
    furnishing: string | null;
    project_name: string | null;
    is_featured: boolean;
    agent_id: string | null;
    amenities: {
        interior?: string[];
        outdoor?: string[];
        utilities?: string[];
        other?: string[];
    } | null;
    video_url?: string | null;
    floor_plans?: { name: string; image: string }[] | null;
    is_project?: boolean;
    [key: string]: unknown;
}

// Raw project type from Supabase
interface RawProject {
    id: string;
    project_id?: string;
    project_name: string;
    description: string | null;
    images: string[];
    min_price: string | null;
    max_price: string | null;
    min_price_numeric?: number | null;
    min_area?: number | null;
    location: string;
    address?: string | null;
    city: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    status: string;
    section?: string | null;
    bhk_options: string[] | null;
    possession_date: string | null;
    developer_name: string | null;
    is_rera_approved: boolean;
    is_featured: boolean;
    listing_type?: string | null;
    sub_category?: string | null;
    video_url?: string | null;
    created_at: string;
    [key: string]: any;
}

// Normalize a raw project into a Property shape for PropertyCard
const normalizeProject = (p: RawProject): Property => ({
    id: p.id,
    property_id: p.project_id || p.id,
    title: p.project_name,
    display_name: p.project_name,
    description: p.description,
    images: p.images || [],
    price: p.min_price_numeric || 0,
    price_text: p.min_price && p.max_price ? `${p.min_price} - ${p.max_price}` : (p.min_price || 'Request for Details'),
    price_per_sqft: null,
    location: p.location || '',
    address: p.address || null,
    street: null,
    area: p.location,
    city: p.city,
    state: p.state || null,
    pincode: p.pincode || null,
    country: p.country || null,
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
    _status: p.status, // Preserve project status for filtering
});

type SectionType = 'All' | 'Projects' | 'Properties' | 'Commercials' | 'Warehouse';

const sectionTabs: { id: SectionType; label: string }[] = [
    { id: 'All', label: 'All' },
    { id: 'Projects', label: 'Projects' },
    { id: 'Properties', label: 'Properties' },
    { id: 'Commercials', label: 'Commercial' },
    { id: 'Warehouse', label: 'Warehouse' },
];

const propertyCategories = ['Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Plot', 'Penthouse', 'Studio', 'Duplex', 'Farmhouse'];
const commercialTypes = ['Office Space', 'Retail Shops', 'Co-Working Space', 'Showroom', 'Mixed Use', 'Business Park', 'Mall'];
const warehouseTypes = ['Cold Storage', 'Distribution Center', 'Industrial', 'Self Storage', 'Fulfillment Center', 'Logistics Park'];

const statusOptions = [
    { id: null, label: "All" },
    { id: "Pre-Launch", label: "Pre-Launch" },
    { id: "Upcoming", label: "Upcoming" },
    { id: "New Launch", label: "New Launch" },
    { id: "Under Construction", label: "Under Construction" },
    { id: "Ready to Move", label: "Ready to Move" },
];

const cityOptions = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Goa"];
const configOptions = ["1 BHK", "2 BHK", "2.5 BHK", "3 BHK", "3.5 BHK", "4 BHK", "4.5 BHK", "4+ BHK", "Villa", "Plot", "Penthouse"];

const formatBudgetLabel = (val: number) => {
    if (val >= 100000000) return "10 Cr +";
    if (val >= 10000000) return `${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)} L`;
    return `${val}`;
};

const Dashboard = () => {
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [allProjects, setAllProjects] = useState<Property[]>([]);
    const [allCommercial, setAllCommercial] = useState<RawProject[]>([]);
    const [allWarehouse, setAllWarehouse] = useState<RawProject[]>([]);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<SectionType>('All');
    const [projectStatusFilter, setProjectStatusFilter] = useState<string | null>(null);
    const [projectsVisible, setProjectsVisible] = useState(6);
    const [propertiesVisible, setPropertiesVisible] = useState(6);
    const [commercialVisible, setCommercialVisible] = useState(6);
    const [warehouseVisible, setWarehouseVisible] = useState(6);
    const [showPostForm, setShowPostForm] = useState(false);

    // Per-section listing type toggles — default to Rent/For Rent
    const [propertyListingType, setPropertyListingType] = useState<'Buy' | 'Rent' | 'Lease'>('Rent');
    const [commercialListingType, setCommercialListingType] = useState<'For Sale' | 'For Rent' | 'For Lease'>('For Rent');
    const [warehouseListingType, setWarehouseListingType] = useState<'For Sale' | 'For Rent' | 'For Lease'>('For Rent');

    // Category-specific type filters
    const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('');
    const [commercialTypeFilter, setCommercialTypeFilter] = useState<string>('');
    const [warehouseTypeFilter, setWarehouseTypeFilter] = useState<string>('');

    const searchParams = useSearchParams();

    // Check for ?action=post to open form automatically
    // Also read ?tab= to pre-select a section
    useEffect(() => {
        if (searchParams?.get('action') === 'post') {
            setShowPostForm(true);
        }
        const tabParam = searchParams?.get('tab') as SectionType | null;
        if (tabParam && ['All', 'Projects', 'Properties', 'Commercials', 'Warehouse'].includes(tabParam)) {
            setActiveSection(tabParam);
        }
    }, [searchParams]);

    // Initialize state from URL params
    const [selectedCity, setSelectedCity] = useState<string>(searchParams?.get('city') || '');
    const [selectedConfig, setSelectedConfig] = useState<string>(searchParams?.get('config') || '');

    // Budget state
    const [budgetMin, setBudgetMin] = useState<number>(100000);
    const [budgetMax, setBudgetMax] = useState<number>(100000000);
    const [tempBudgetMin, setTempBudgetMin] = useState<number>(100000);
    const [tempBudgetMax, setTempBudgetMax] = useState<number>(100000000);
    const [budgetApplied, setBudgetApplied] = useState(false);

    // Dropdown open states
    const [cityOpen, setCityOpen] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const [budgetOpen, setBudgetOpen] = useState(false);

    const cityRef = useRef<HTMLDivElement>(null);
    const configRef = useRef<HTMLDivElement>(null);
    const budgetRef = useRef<HTMLDivElement>(null);

    const [profileName, setProfileName] = useState<string | null>(null);
    const supabase = createClient();
    const { user } = useAuth();

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
            if (configRef.current && !configRef.current.contains(e.target as Node)) setConfigOpen(false);
            if (budgetRef.current && !budgetRef.current.contains(e.target as Node)) setBudgetOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch profile name
    useEffect(() => {
        if (!user) {
            setProfileName(null);
            return;
        }

        const fetchProfile = async () => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('first_name, full_name')
                    .eq('id', user.id)
                    .single();

                if (data?.first_name) {
                    setProfileName(data.first_name);
                    return;
                }
                if (data?.full_name) {
                    setProfileName(data.full_name.split(' ')[0]);
                    return;
                }
            } catch {
                // profiles query failed — continue to fallbacks
            }

            try {
                const { data: { user: freshUser } } = await supabase.auth.getUser();
                const meta = freshUser?.user_metadata;
                if (meta) {
                    if (meta.first_name) { setProfileName(String(meta.first_name)); return; }
                    if (meta.full_name) { setProfileName(String(meta.full_name).split(' ')[0]); return; }
                    if (meta.name) { setProfileName(String(meta.name).split(' ')[0]); return; }
                }
            } catch {
                // getUser failed — continue to fallbacks
            }

            const meta = user.user_metadata;
            if (meta?.first_name) {
                setProfileName(String(meta.first_name));
            } else if (meta?.full_name) {
                setProfileName(String(meta.full_name).split(' ')[0]);
            } else if (meta?.name) {
                setProfileName(String(meta.name).split(' ')[0]);
            } else if (user.email) {
                setProfileName(user.email.split('@')[0]);
            } else {
                setProfileName(null);
            }
        };

        fetchProfile();
    }, [user?.id]);

    const handleSearch = async (e?: React.FormEvent, overrideParams?: { config?: string, city?: string }) => {
        if (e) e.preventDefault();
        setLoading(true);

        const currentConfig = overrideParams?.config ?? selectedConfig;
        const currentCity = overrideParams?.city ?? selectedCity;

        // Build property query — fetch all, filtered client-side by per-section toggle
        let propQuery = supabase.from('properties').select('*');

        if (currentCity) propQuery = propQuery.ilike('city', `%${currentCity}%`);
        if (searchQuery.trim()) {
            propQuery = propQuery.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,project_name.ilike.%${searchQuery}%`);
        }
        if (budgetApplied) {
            propQuery = propQuery.gte('price', budgetMin);
            if (budgetMax < 100000000) propQuery = propQuery.lte('price', budgetMax);
        }
        if (currentConfig) {
            const bedroomMatch = currentConfig.match(/^(\d+\.?\d*)/);
            if (bedroomMatch) {
                const beds = parseFloat(bedroomMatch[1]);
                if (currentConfig.includes('+')) propQuery = propQuery.gte('bedrooms', beds);
                else propQuery = propQuery.eq('bedrooms', beds);
            } else {
                propQuery = propQuery.ilike('category', `%${currentConfig}%`);
            }
        }

        // Build residential projects query
        let projQuery = supabase.from('projects').select('*').or('section.eq.residential,section.is.null');

        if (currentCity) projQuery = projQuery.ilike('city', `%${currentCity}%`);
        if (searchQuery.trim()) {
            projQuery = projQuery.or(`project_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        if (budgetApplied) {
            projQuery = projQuery.gte('min_price_numeric', budgetMin);
            if (budgetMax < 100000000) projQuery = projQuery.lte('min_price_numeric', budgetMax);
        }
        if (currentConfig) {
            const bedroomMatch = currentConfig.match(/^(\d+\.?\d*)/);
            if (bedroomMatch) {
                projQuery = projQuery.contains('bhk_options', [`${bedroomMatch[1]} BHK`]);
            } else {
                projQuery = projQuery.or(`description.ilike.%${currentConfig}%,project_name.ilike.%${currentConfig}%`);
            }
        }

        // Build commercial query
        let commQuery = supabase.from('projects').select('*').eq('section', 'commercial');
        if (currentCity) commQuery = commQuery.ilike('city', `%${currentCity}%`);
        if (searchQuery.trim()) {
            commQuery = commQuery.or(`project_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
        }
        if (budgetApplied) {
            commQuery = commQuery.gte('min_price_numeric', budgetMin);
            if (budgetMax < 100000000) commQuery = commQuery.lte('min_price_numeric', budgetMax);
        }

        // Build warehouse query
        let wareQuery = supabase.from('projects').select('*').eq('section', 'warehouse');
        if (currentCity) wareQuery = wareQuery.ilike('city', `%${currentCity}%`);
        if (searchQuery.trim()) {
            wareQuery = wareQuery.or(`project_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
        }
        if (budgetApplied) {
            wareQuery = wareQuery.gte('min_price_numeric', budgetMin);
            if (budgetMax < 100000000) wareQuery = wareQuery.lte('min_price_numeric', budgetMax);
        }

        const [{ data: propData }, { data: projData }, { data: commData }, { data: wareData }] = await Promise.all([
            propQuery.order('created_at', { ascending: false }),
            projQuery.order('created_at', { ascending: false }),
            commQuery.order('created_at', { ascending: false }),
            wareQuery.order('created_at', { ascending: false }),
        ]);

        setAllProperties(propData || []);
        setAllProjects((projData || []).map(normalizeProject));
        setAllCommercial(commData || []);
        setAllWarehouse(wareData || []);
        setProjectsVisible(6);
        setPropertiesVisible(6);
        setCommercialVisible(6);
        setWarehouseVisible(6);
        setLoading(false);
    };

    const fetchData = async () => {
        try {
            const [
                { data: propsData, error: propsError },
                { data: projData, error: projError },
                { data: commercialData },
                { data: warehouseData },
            ] = await Promise.all([
                supabase.from('properties').select('*').order('created_at', { ascending: false }),
                supabase.from('projects').select('*').eq('section', 'residential').order('created_at', { ascending: false }),
                supabase.from('projects').select('*').eq('section', 'commercial').order('created_at', { ascending: false }),
                supabase.from('projects').select('*').eq('section', 'warehouse').order('created_at', { ascending: false }),
            ]);

            if (propsError) throw propsError;
            if (projError) console.error("Error fetching projects:", projError);

            // Fetch bookmarks for current user
            const { data: { user: authUser } } = await supabase.auth.getUser();
            let bookmarks: string[] = [];
            if (authUser) {
                const { data: bookmarkData } = await supabase
                    .from('user_bookmarks')
                    .select('property_id, project_id')
                    .eq('user_id', authUser.id);
                bookmarks = bookmarkData?.flatMap(b => [b.property_id, b.project_id].filter(Boolean)) || [];
            } else {
                try {
                    bookmarks = JSON.parse(sessionStorage.getItem('guest_bookmarks') || '[]');
                } catch {
                    bookmarks = [];
                }
            }

            setAllProperties(propsData || []);
            setAllProjects((projData || []).map(normalizeProject));
            setAllCommercial(commercialData || []);
            setAllWarehouse(warehouseData || []);
            setBookmarkIds(bookmarks);

        } catch (error) {
            console.error("Error fetching data:", (error as Error).message || error, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchParams?.toString()) {
            handleSearch(undefined, {
                config: searchParams?.get('config') || '',
                city: searchParams?.get('city') || ''
            });
        } else {
            fetchData();
        }
    }, [user?.id, searchParams]);

    const isBookmarked = (propertyId: string) => bookmarkIds.includes(propertyId);

    // Filter projects by status
    const filteredProjects = projectStatusFilter
        ? allProjects.filter(p => p._status === projectStatusFilter)
        : allProjects;

    const propertyTypeMap: Record<'Buy' | 'Rent' | 'Lease', string> = { Buy: 'Sale', Rent: 'Rent', Lease: 'Lease' };
    const filteredPropertiesByStatus = allProperties.filter(p => {
        const listingMatch = p.property_type === propertyTypeMap[propertyListingType];
        const typeMatch = !propertyTypeFilter || p.category === propertyTypeFilter;
        return listingMatch && typeMatch;
    });

    const filteredCommercial = allCommercial.filter(p => {
        const effectiveType = p.listing_type || 'For Rent';
        const listingMatch = effectiveType === commercialListingType;
        const typeMatch = !commercialTypeFilter || (p.sub_category && p.sub_category === commercialTypeFilter) || (p.bhk_options && p.bhk_options.includes(commercialTypeFilter));
        return listingMatch && typeMatch;
    });

    const filteredWarehouse = allWarehouse.filter(p => {
        const effectiveType = p.listing_type || 'For Rent';
        const listingMatch = effectiveType === warehouseListingType;
        const typeMatch = !warehouseTypeFilter || (p.sub_category && p.sub_category === warehouseTypeFilter) || (p.bhk_options && p.bhk_options.includes(warehouseTypeFilter));
        return listingMatch && typeMatch;
    });

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="animate-spin text-[var(--dark-turquoise)]">
                    <Loader2 size={40} />
                </div>
                <div className={styles.loadingText}>Loading properties...</div>
            </div>
        );
    }

    const showProjects = activeSection === 'All' || activeSection === 'Projects';
    const showProperties = activeSection === 'All' || activeSection === 'Properties';
    const showCommercials = activeSection === 'All' || activeSection === 'Commercials';
    const showWarehouse = activeSection === 'All' || activeSection === 'Warehouse';

    return (
        <div className={styles.page}>
            {/* ===== MOBILE STICKY HEADER ===== */}
            <div className={styles.mobileSearchHeader}>
                <div className={styles.mobileTopRow}>
                    <a href="/" className={styles.mobileBackLogo}>
                        <div style={{ backgroundColor: '#183C38', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42 }}>
                            <img src="/27 Estates_Logo.png" alt="27 Estates" style={{ width: 36, height: 36, objectFit: 'contain', objectPosition: 'top' }} />
                        </div>
                    </a>
                    <div className={styles.searchPillWrap}>
                        <SearchIcon size={16} className={styles.searchPillIcon} />
                        <input
                            type="text"
                            placeholder="Search properties, projects, locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchPillInput}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        />
                        {searchQuery && (
                            <button type="button" className={styles.mobileSearchClear} onClick={() => setSearchQuery('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {!user && (
                        <a href="/auth/signin?redirect=/properties" className={styles.mobileSignInBtn}>
                            Sign In
                        </a>
                    )}
                </div>

                {/* Horizontal Filter Chips */}
                <div className={styles.filterChips}>
                    <div className={styles.filterChipWrap} ref={cityRef}>
                        <button
                            className={`${styles.filterChip} ${selectedCity ? styles.filterChipActive : ''}`}
                            onClick={() => { setCityOpen(!cityOpen); setConfigOpen(false); setBudgetOpen(false); }}
                        >
                            {selectedCity || 'City'}
                            <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: cityOpen ? 'rotate(180deg)' : '' }} />
                        </button>
                        {cityOpen && (
                            <div className={styles.chipDropdown}>
                                <button className={`${styles.chipDropdownItem} ${!selectedCity ? styles.chipDropdownItemActive : ''}`} onClick={() => { setSelectedCity(''); setCityOpen(false); }}>All Cities</button>
                                {cityOptions.map((city) => (
                                    <button key={city} className={`${styles.chipDropdownItem} ${selectedCity === city ? styles.chipDropdownItemActive : ''}`} onClick={() => { setSelectedCity(city); setCityOpen(false); }}>{city}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {activeSection === 'Commercials' ? (
                        <div className={styles.filterChipWrap} ref={configRef}>
                            <button
                                className={`${styles.filterChip} ${commercialTypeFilter ? styles.filterChipActive : ''}`}
                                onClick={() => { setConfigOpen(!configOpen); setCityOpen(false); setBudgetOpen(false); }}
                            >
                                {commercialTypeFilter || 'Type'}
                                <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: configOpen ? 'rotate(180deg)' : '' }} />
                            </button>
                            {configOpen && (
                                <div className={styles.chipDropdown}>
                                    <button className={`${styles.chipDropdownItem} ${!commercialTypeFilter ? styles.chipDropdownItemActive : ''}`} onClick={() => { setCommercialTypeFilter(''); setConfigOpen(false); }}>All Types</button>
                                    {commercialTypes.map((t) => (
                                        <button key={t} className={`${styles.chipDropdownItem} ${commercialTypeFilter === t ? styles.chipDropdownItemActive : ''}`} onClick={() => { setCommercialTypeFilter(t); setConfigOpen(false); }}>{t}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : activeSection === 'Warehouse' ? (
                        <div className={styles.filterChipWrap} ref={configRef}>
                            <button
                                className={`${styles.filterChip} ${warehouseTypeFilter ? styles.filterChipActive : ''}`}
                                onClick={() => { setConfigOpen(!configOpen); setCityOpen(false); setBudgetOpen(false); }}
                            >
                                {warehouseTypeFilter || 'Type'}
                                <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: configOpen ? 'rotate(180deg)' : '' }} />
                            </button>
                            {configOpen && (
                                <div className={styles.chipDropdown}>
                                    <button className={`${styles.chipDropdownItem} ${!warehouseTypeFilter ? styles.chipDropdownItemActive : ''}`} onClick={() => { setWarehouseTypeFilter(''); setConfigOpen(false); }}>All Types</button>
                                    {warehouseTypes.map((t) => (
                                        <button key={t} className={`${styles.chipDropdownItem} ${warehouseTypeFilter === t ? styles.chipDropdownItemActive : ''}`} onClick={() => { setWarehouseTypeFilter(t); setConfigOpen(false); }}>{t}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.filterChipWrap} ref={configRef}>
                            <button
                                className={`${styles.filterChip} ${selectedConfig ? styles.filterChipActive : ''}`}
                                onClick={() => { setConfigOpen(!configOpen); setCityOpen(false); setBudgetOpen(false); }}
                            >
                                {selectedConfig || 'BHK'}
                                <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: configOpen ? 'rotate(180deg)' : '' }} />
                            </button>
                            {configOpen && (
                                <div className={styles.chipDropdown}>
                                    <button className={`${styles.chipDropdownItem} ${!selectedConfig ? styles.chipDropdownItemActive : ''}`} onClick={() => { setSelectedConfig(''); setConfigOpen(false); }}>All</button>
                                    {configOptions.map((cfg) => (
                                        <button key={cfg} className={`${styles.chipDropdownItem} ${selectedConfig === cfg ? styles.chipDropdownItemActive : ''}`} onClick={() => { setSelectedConfig(cfg); setConfigOpen(false); }}>{cfg}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.filterChipWrap} ref={budgetRef}>
                        <button
                            className={`${styles.filterChip} ${budgetApplied ? styles.filterChipActive : ''}`}
                            onClick={() => { setBudgetOpen(!budgetOpen); setCityOpen(false); setConfigOpen(false); }}
                        >
                            {budgetApplied ? `${formatBudgetLabel(budgetMin)}–${formatBudgetLabel(budgetMax)}` : 'Budget'}
                            <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: budgetOpen ? 'rotate(180deg)' : '' }} />
                        </button>
                        {budgetOpen && (
                            <div className={styles.chipDropdown} style={{ width: '260px' }}>
                                <div className={styles.budgetHeader}>
                                    <span className={styles.budgetTitle}>Budget Range</span>
                                    {budgetApplied && (
                                        <button className={styles.budgetRemoveBtn} onClick={() => { setBudgetApplied(false); setTempBudgetMin(100000); setTempBudgetMax(100000000); setBudgetMin(100000); setBudgetMax(100000000); setBudgetOpen(false); }}>
                                            <X size={14} /> Clear
                                        </button>
                                    )}
                                </div>
                                <div className={styles.budgetValues}>
                                    <span>{formatBudgetLabel(tempBudgetMin)}</span>
                                    <span>{formatBudgetLabel(tempBudgetMax)}</span>
                                </div>
                                <div className={styles.budgetSliders}>
                                    <label className={styles.budgetSliderLabel}>Min</label>
                                    <input type="range" min={100000} max={100000000} step={100000} value={tempBudgetMin} onChange={(e) => { const v = Number(e.target.value); if (v < tempBudgetMax) setTempBudgetMin(v); }} className={styles.budgetSlider} />
                                    <label className={styles.budgetSliderLabel} style={{ marginTop: '8px' }}>Max</label>
                                    <input type="range" min={100000} max={100000000} step={100000} value={tempBudgetMax} onChange={(e) => { const v = Number(e.target.value); if (v > tempBudgetMin) setTempBudgetMax(v); }} className={styles.budgetSlider} />
                                </div>
                                <button className={styles.budgetApplyBtn} onClick={() => { setBudgetMin(tempBudgetMin); setBudgetMax(tempBudgetMax); setBudgetApplied(true); setBudgetOpen(false); }}>Apply</button>
                            </div>
                        )}
                    </div>

                    <button className={styles.filterChipSearch} onClick={() => handleSearch()}>
                        <SearchIcon size={14} />
                    </button>
                </div>
            </div>

            {/* ===== DESKTOP HEADER ===== */}
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>
                    Hi, {profileName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Guest'} 👋
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowPostForm(!showPostForm)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: showPostForm ? '#dc2626' : 'var(--dark-turquoise)',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                            transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(31,82,75,0.2)',
                        }}
                    >
                        {showPostForm ? <X size={18} /> : <Plus size={18} />}
                        {showPostForm ? 'Close' : 'Post Your Property'}
                    </button>
                    {!user && (
                        <Link href="/auth/signin" className={styles.signInButton}>
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

            {/* Post Property Form */}
            <AnimatePresence>
                {showPostForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden', marginBottom: '24px' }}
                    >
                        <PostPropertyForm />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Toggle */}
            <div className={styles.sectionTabsWrap}>
                {/* Mobile: dropdown */}
                <select
                    className={styles.sectionSelectMobile}
                    value={activeSection}
                    onChange={e => setActiveSection(e.target.value as SectionType)}
                >
                    {sectionTabs.map(tab => (
                        <option key={tab.id} value={tab.id}>{tab.label}</option>
                    ))}
                </select>
                {/* Desktop: tab buttons */}
                <div className={styles.sectionTabs}>
                    {sectionTabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.sectionTab} ${activeSection === tab.id ? styles.sectionTabActive : ''}`}
                            onClick={() => setActiveSection(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter Bar — desktop only */}
            <div className={styles.filterBar}>
                <div className={styles.filterDropdown} ref={cityRef}>
                    <button className={styles.filterDropdownBtn} onClick={() => { setCityOpen(!cityOpen); setConfigOpen(false); setBudgetOpen(false); }}>
                        <span>{selectedCity || 'City'}</span>
                        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: cityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {cityOpen && (
                        <div className={styles.filterDropdownMenu}>
                            <button className={`${styles.filterDropdownItem} ${!selectedCity ? styles.filterDropdownItemActive : ''}`} onClick={() => { setSelectedCity(''); setCityOpen(false); }}>All Cities</button>
                            {cityOptions.map((city) => (
                                <button key={city} className={`${styles.filterDropdownItem} ${selectedCity === city ? styles.filterDropdownItemActive : ''}`} onClick={() => { setSelectedCity(city); setCityOpen(false); }}>{city}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.filterSearchWrap}>
                    <SearchIcon size={16} className={styles.filterSearchIcon} />
                    <input
                        type="text"
                        placeholder="Enter your location or project"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.filterSearchInput}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    />
                </div>

                {/* Category-specific third filter */}
                {(activeSection === 'Commercials') ? (
                    <div className={styles.filterDropdown} ref={configRef}>
                        <button className={`${styles.filterDropdownBtn} ${commercialTypeFilter ? styles.filterDropdownBtnApplied : ''}`} onClick={() => { setConfigOpen(!configOpen); setCityOpen(false); setBudgetOpen(false); }}>
                            <span>{commercialTypeFilter || 'Type'}</span>
                            <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: configOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>
                        {configOpen && (
                            <div className={styles.filterDropdownMenu}>
                                <button className={`${styles.filterDropdownItem} ${!commercialTypeFilter ? styles.filterDropdownItemActive : ''}`} onClick={() => { setCommercialTypeFilter(''); setConfigOpen(false); }}>All Types</button>
                                {commercialTypes.map((t) => (
                                    <button key={t} className={`${styles.filterDropdownItem} ${commercialTypeFilter === t ? styles.filterDropdownItemActive : ''}`} onClick={() => { setCommercialTypeFilter(t); setConfigOpen(false); }}>{t}</button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (activeSection === 'Warehouse') ? (
                    <div className={styles.filterDropdown} ref={configRef}>
                        <button className={`${styles.filterDropdownBtn} ${warehouseTypeFilter ? styles.filterDropdownBtnApplied : ''}`} onClick={() => { setConfigOpen(!configOpen); setCityOpen(false); setBudgetOpen(false); }}>
                            <span>{warehouseTypeFilter || 'Type'}</span>
                            <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: configOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>
                        {configOpen && (
                            <div className={styles.filterDropdownMenu}>
                                <button className={`${styles.filterDropdownItem} ${!warehouseTypeFilter ? styles.filterDropdownItemActive : ''}`} onClick={() => { setWarehouseTypeFilter(''); setConfigOpen(false); }}>All Types</button>
                                {warehouseTypes.map((t) => (
                                    <button key={t} className={`${styles.filterDropdownItem} ${warehouseTypeFilter === t ? styles.filterDropdownItemActive : ''}`} onClick={() => { setWarehouseTypeFilter(t); setConfigOpen(false); }}>{t}</button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.filterDropdown} ref={configRef}>
                        <button className={styles.filterDropdownBtn} onClick={() => { setConfigOpen(!configOpen); setCityOpen(false); setBudgetOpen(false); }}>
                            <span>{selectedConfig || 'Configuration'}</span>
                            <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: configOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>
                        {configOpen && (
                            <div className={styles.filterDropdownMenu}>
                                <button className={`${styles.filterDropdownItem} ${!selectedConfig ? styles.filterDropdownItemActive : ''}`} onClick={() => { setSelectedConfig(''); setConfigOpen(false); }}>All</button>
                                {configOptions.map((cfg) => (
                                    <button key={cfg} className={`${styles.filterDropdownItem} ${selectedConfig === cfg ? styles.filterDropdownItemActive : ''}`} onClick={() => { setSelectedConfig(cfg); setConfigOpen(false); }}>{cfg}</button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.filterDropdown} ref={budgetRef}>
                    <button className={`${styles.filterDropdownBtn} ${budgetApplied ? styles.filterDropdownBtnApplied : ''}`} onClick={() => { setBudgetOpen(!budgetOpen); setCityOpen(false); setConfigOpen(false); }}>
                        <span>{budgetApplied ? `${formatBudgetLabel(budgetMin)} – ${formatBudgetLabel(budgetMax)}` : 'Budget'}</span>
                        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: budgetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {budgetOpen && (
                        <div className={styles.budgetPanel}>
                            <div className={styles.budgetHeader}>
                                <span className={styles.budgetTitle}>Budget Range</span>
                                {budgetApplied && (
                                    <button className={styles.budgetRemoveBtn} onClick={() => { setBudgetApplied(false); setTempBudgetMin(100000); setTempBudgetMax(100000000); setBudgetMin(100000); setBudgetMax(100000000); setBudgetOpen(false); }}>
                                        <X size={14} /> Remove
                                    </button>
                                )}
                            </div>
                            <div className={styles.budgetValues}>
                                <span>{formatBudgetLabel(tempBudgetMin)}</span>
                                <span>{formatBudgetLabel(tempBudgetMax)}</span>
                            </div>
                            <div className={styles.budgetSliders}>
                                <label className={styles.budgetSliderLabel}>Min</label>
                                <input type="range" min={100000} max={100000000} step={100000} value={tempBudgetMin} onChange={(e) => { const val = Number(e.target.value); if (val < tempBudgetMax) setTempBudgetMin(val); }} className={styles.budgetSlider} />
                                <label className={styles.budgetSliderLabel} style={{ marginTop: '12px' }}>Max</label>
                                <input type="range" min={100000} max={100000000} step={100000} value={tempBudgetMax} onChange={(e) => { const val = Number(e.target.value); if (val > tempBudgetMin) setTempBudgetMax(val); }} className={styles.budgetSlider} />
                            </div>
                            <button className={styles.budgetApplyBtn} onClick={() => { setBudgetMin(tempBudgetMin); setBudgetMax(tempBudgetMax); setBudgetApplied(true); setBudgetOpen(false); }}>Apply</button>
                        </div>
                    )}
                </div>

                <button className={styles.filterSearchBtn} onClick={() => handleSearch()}>
                    <SearchIcon size={18} />
                </button>
            </div>


            {/* Section 1: PROJECTS */}
            {showProjects && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>PROJECTS</h2>
                        <Link href="/properties/projects" className={styles.sectionPostBtn}>
                            View All
                        </Link>
                    </div>
                    <div className={styles.statusFilters}>
                        {statusOptions.map((opt) => (
                            <button
                                key={opt.label}
                                className={`${styles.statusPill} ${projectStatusFilter === opt.id ? styles.statusPillActive : ''}`}
                                onClick={() => { setProjectStatusFilter(opt.id); setProjectsVisible(6); }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {filteredProjects.length > 0 ? (
                        <>
                            <div className={styles.grid}>
                                {filteredProjects.slice(0, projectsVisible).map((project) => (
                                    <PropertyCard
                                        key={project.id}
                                        property={project}
                                        isBookmarked={isBookmarked(project.id)}
                                        onBookmarkChange={fetchData}
                                    />
                                ))}
                            </div>
                            {projectsVisible < filteredProjects.length && (
                                <div className={styles.loadMoreContainer}>
                                    <button className={styles.loadMoreButton} onClick={() => setProjectsVisible(prev => prev + 6)}>
                                        Load More Projects
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>No projects found</p>
                        </div>
                    )}
                </section>
            )}

            {/* Section 2: INDIVIDUAL PROPERTIES */}
            {showProperties && (
                <section className={styles.section}>
                    <div className={styles.sectionHeaderBlock}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>INDIVIDUAL PROPERTIES</h2>
                            <div className={styles.listingToggle}>
                                <button className={`${styles.listingBtn} ${propertyListingType === 'Buy' ? styles.listingBtnActive : ''}`} onClick={() => setPropertyListingType('Buy')}>For Sale</button>
                                <button className={`${styles.listingBtn} ${propertyListingType === 'Rent' ? styles.listingBtnActive : ''}`} onClick={() => setPropertyListingType('Rent')}>For Rent</button>
                                <button className={`${styles.listingBtn} ${propertyListingType === 'Lease' ? styles.listingBtnActive : ''}`} onClick={() => setPropertyListingType('Lease')}>For Lease</button>
                            </div>
                        </div>
                        <div className={styles.sectionSubRow}>
                            {/* Desktop: type filter buttons */}
                            <div className={styles.typeFilterDesktop}>
                                <button className={`${styles.typeFilterBtn} ${!propertyTypeFilter ? styles.typeFilterBtnActive : ''}`} onClick={() => setPropertyTypeFilter('')}>All</button>
                                {propertyCategories.map(t => (
                                    <button key={t} className={`${styles.typeFilterBtn} ${propertyTypeFilter === t ? styles.typeFilterBtnActive : ''}`} onClick={() => setPropertyTypeFilter(t)}>{t}</button>
                                ))}
                            </div>
                            {/* Mobile: dropdown */}
                            <select className={styles.typeFilterMobile} value={propertyTypeFilter} onChange={e => setPropertyTypeFilter(e.target.value)}>
                                <option value="">All Types</option>
                                {propertyCategories.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Link href="/properties/search" className={`${styles.sectionPostBtn} ${styles.viewAllRight}`}>View All</Link>
                        </div>
                    </div>
                    {filteredPropertiesByStatus.length > 0 ? (
                        <>
                            <div className={styles.latestGrid}>
                                {filteredPropertiesByStatus.slice(0, propertiesVisible).map((property) => (
                                    <LatestPropertyCard
                                        key={property.id}
                                        property={property}
                                        isBookmarked={isBookmarked(property.id)}
                                        onBookmarkChange={fetchData}
                                    />
                                ))}
                            </div>
                            {propertiesVisible < filteredPropertiesByStatus.length && (
                                <div className={styles.loadMoreContainer}>
                                    <button className={styles.loadMoreButton} onClick={() => setPropertiesVisible(prev => prev + 6)}>
                                        Load More Properties
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>No properties found</p>
                        </div>
                    )}
                </section>
            )}

            {/* Section 3: COMMERCIALS */}
            {showCommercials && (
                <section className={styles.section}>
                    <div className={styles.sectionHeaderBlock}>
                        <div className={styles.sectionHeader}>
                            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleCommercial}`}>COMMERCIALS</h2>
                            <div className={styles.listingToggle}>
                                <button className={`${styles.listingBtn} ${commercialListingType === 'For Sale' ? styles.listingBtnActive : ''}`} onClick={() => setCommercialListingType('For Sale')}>For Sale</button>
                                <button className={`${styles.listingBtn} ${commercialListingType === 'For Rent' ? styles.listingBtnActive : ''}`} onClick={() => setCommercialListingType('For Rent')}>For Rent</button>
                                <button className={`${styles.listingBtn} ${commercialListingType === 'For Lease' ? styles.listingBtnActive : ''}`} onClick={() => setCommercialListingType('For Lease')}>For Lease</button>
                            </div>
                        </div>
                        <div className={styles.sectionSubRow}>
                            <div className={styles.typeFilterDesktop}>
                                <button className={`${styles.typeFilterBtn} ${!commercialTypeFilter ? styles.typeFilterBtnActive : ''}`} onClick={() => setCommercialTypeFilter('')}>All</button>
                                {commercialTypes.map(t => (
                                    <button key={t} className={`${styles.typeFilterBtn} ${commercialTypeFilter === t ? styles.typeFilterBtnActive : ''}`} onClick={() => setCommercialTypeFilter(t)}>{t}</button>
                                ))}
                            </div>
                            <select className={styles.typeFilterMobile} value={commercialTypeFilter} onChange={e => setCommercialTypeFilter(e.target.value)}>
                                <option value="">All Types</option>
                                {commercialTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Link href="/properties/commercial" className={`${styles.sectionPostBtn} ${styles.viewAllRight}`}>View All</Link>
                        </div>
                    </div>
                    {filteredCommercial.length > 0 ? (
                        <>
                            <div className={styles.commercialGrid}>
                                {filteredCommercial.slice(0, commercialVisible).map((project) => (
                                    <CommercialHomeCard
                                        key={project.id}
                                        id={project.id}
                                        project_name={project.project_name}
                                        location={project.location}
                                        city={project.city}
                                        min_price={project.min_price}
                                        max_price={project.max_price}
                                        min_area={project.min_area}
                                        bhk_options={project.bhk_options}
                                        image={project.images?.[0] || ''}
                                        status={project.status}
                                        developer_name={project.developer_name}
                                        is_rera_approved={project.is_rera_approved}
                                        listing_type={project.listing_type}
                                        isBookmarked={isBookmarked(project.id)}
                                        onBookmarkChange={fetchData}
                                    />
                                ))}
                            </div>
                            {commercialVisible < filteredCommercial.length && (
                                <div className={styles.loadMoreContainer}>
                                    <button className={styles.loadMoreButton} onClick={() => setCommercialVisible(prev => prev + 6)}>
                                        Load More Commercials
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>No {commercialListingType.toLowerCase()} commercial listings found</p>
                        </div>
                    )}
                </section>
            )}

            {/* Section 4: WAREHOUSE */}
            {showWarehouse && (
                <section className={styles.section}>
                    <div className={styles.sectionHeaderBlock}>
                        <div className={styles.sectionHeader}>
                            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleWarehouse}`}>WAREHOUSE</h2>
                            <div className={styles.listingToggle}>
                                <button className={`${styles.listingBtn} ${warehouseListingType === 'For Sale' ? styles.listingBtnActive : ''}`} onClick={() => setWarehouseListingType('For Sale')}>For Sale</button>
                                <button className={`${styles.listingBtn} ${warehouseListingType === 'For Rent' ? styles.listingBtnActive : ''}`} onClick={() => setWarehouseListingType('For Rent')}>For Rent</button>
                                <button className={`${styles.listingBtn} ${warehouseListingType === 'For Lease' ? styles.listingBtnActive : ''}`} onClick={() => setWarehouseListingType('For Lease')}>For Lease</button>
                            </div>
                        </div>
                        <div className={styles.sectionSubRow}>
                            <div className={styles.typeFilterDesktop}>
                                <button className={`${styles.typeFilterBtn} ${!warehouseTypeFilter ? styles.typeFilterBtnActive : ''}`} onClick={() => setWarehouseTypeFilter('')}>All</button>
                                {warehouseTypes.map(t => (
                                    <button key={t} className={`${styles.typeFilterBtn} ${warehouseTypeFilter === t ? styles.typeFilterBtnActive : ''}`} onClick={() => setWarehouseTypeFilter(t)}>{t}</button>
                                ))}
                            </div>
                            <select className={styles.typeFilterMobile} value={warehouseTypeFilter} onChange={e => setWarehouseTypeFilter(e.target.value)}>
                                <option value="">All Types</option>
                                {warehouseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Link href="/properties/warehouse" className={`${styles.sectionPostBtn} ${styles.viewAllRight}`}>View All</Link>
                        </div>
                    </div>
                    {filteredWarehouse.length > 0 ? (
                        <>
                            <div className={styles.commercialGrid}>
                                {filteredWarehouse.slice(0, warehouseVisible).map((project) => (
                                    <WarehouseHomeCard
                                        key={project.id}
                                        id={project.id}
                                        project_name={project.project_name}
                                        location={project.location}
                                        city={project.city}
                                        min_price={project.min_price}
                                        max_price={project.max_price}
                                        min_area={project.min_area}
                                        bhk_options={project.bhk_options}
                                        image={project.images?.[0] || ''}
                                        status={project.status}
                                        developer_name={project.developer_name}
                                        is_rera_approved={project.is_rera_approved}
                                        listing_type={project.listing_type}
                                        isBookmarked={isBookmarked(project.id)}
                                        onBookmarkChange={fetchData}
                                    />
                                ))}
                            </div>
                            {warehouseVisible < filteredWarehouse.length && (
                                <div className={styles.loadMoreContainer}>
                                    <button className={styles.loadMoreButton} onClick={() => setWarehouseVisible(prev => prev + 6)}>
                                        Load More Warehouses
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>No {warehouseListingType.toLowerCase()} warehouse listings found</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

const PropertiesPage = () => (
    <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
    }>
        <Dashboard />
    </Suspense>
);

export default PropertiesPage;
