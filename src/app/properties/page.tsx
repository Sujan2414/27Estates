"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import PropertyCard from "@/components/emergent/PropertyCard";
import LatestPropertyCard from "@/components/emergent/LatestPropertyCard";
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
    property_type: 'Sale' | 'Rent';
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
    bhk_options: string[] | null;
    possession_date: string | null;
    developer_name: string | null;
    is_rera_approved: boolean;
    is_featured: boolean;
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

const statusOptions = [
    { id: null, label: "All" },
    { id: "Upcoming", label: "Upcoming" },
    { id: "Under Construction", label: "Under Construction" },
    { id: "Ready to Move", label: "Ready to Move" },
    { id: "New Launch", label: "New Launch" },
];

const cityOptions = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Goa"];
const configOptions = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "4+ BHK", "Villa", "Plot", "Penthouse"];

const formatBudgetLabel = (val: number) => {
    if (val >= 100000000) return "10 Cr +";
    if (val >= 10000000) return `${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)} L`;
    return `${val}`;
};

const Dashboard = () => {
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [allProjects, setAllProjects] = useState<Property[]>([]);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [projectStatusFilter, setProjectStatusFilter] = useState<string | null>(null);
    const [projectsVisible, setProjectsVisible] = useState(6);
    const [propertiesVisible, setPropertiesVisible] = useState(6);
    const [showPostForm, setShowPostForm] = useState(false);

    const searchParams = useSearchParams();

    // Check for ?action=post to open form automatically
    useEffect(() => {
        if (searchParams?.get('action') === 'post') {
            setShowPostForm(true);
        }
    }, [searchParams]);

    // Initialize state from URL params
    const [listingType, setListingType] = useState<'Buy' | 'Rent'>(
        (searchParams?.get('type') as 'Buy' | 'Rent') || 'Buy'
    );
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
                // 1) Try the profiles table first
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

            // 2) Refresh user to get latest metadata (getSession may be stale)
            try {
                const { data: { user: freshUser } } = await supabase.auth.getUser();
                const meta = freshUser?.user_metadata;
                if (meta) {
                    if (meta.first_name) {
                        setProfileName(String(meta.first_name));
                        return;
                    }
                    if (meta.full_name) {
                        setProfileName(String(meta.full_name).split(' ')[0]);
                        return;
                    }
                    if (meta.name) {
                        setProfileName(String(meta.name).split(' ')[0]);
                        return;
                    }
                }
            } catch {
                // getUser failed — continue to fallbacks
            }

            // 3) Context user metadata (from session)
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

    const handleSearch = async (e?: React.FormEvent, overrideParams?: { config?: string, city?: string, type?: 'Buy' | 'Rent' }) => {
        if (e) e.preventDefault();
        setLoading(true);

        const currentConfig = overrideParams?.config ?? selectedConfig;
        const currentCity = overrideParams?.city ?? selectedCity;
        const currentType = overrideParams?.type ?? listingType;

        // Build property query
        let propQuery = supabase.from('properties').select('*');

        // Filter by Buy/Rent
        propQuery = propQuery.eq('property_type', currentType === 'Buy' ? 'Sale' : 'Rent');

        // City filter
        if (currentCity) {
            propQuery = propQuery.ilike('city', `%${currentCity}%`);
        }

        // Search text
        if (searchQuery.trim()) {
            propQuery = propQuery.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,project_name.ilike.%${searchQuery}%`);
        }

        // Budget filter
        if (budgetApplied) {
            propQuery = propQuery.gte('price', budgetMin);
            // Only apply max limit if it's less than the slider max (10 Cr)
            if (budgetMax < 100000000) {
                propQuery = propQuery.lte('price', budgetMax);
            }
        }

        // Configuration filter
        if (currentConfig) {
            const bedroomMatch = currentConfig.match(/^(\d+)/);
            if (bedroomMatch) {
                const beds = parseInt(bedroomMatch[1]);
                if (currentConfig.includes('+')) {
                    propQuery = propQuery.gte('bedrooms', beds);
                } else {
                    propQuery = propQuery.eq('bedrooms', beds);
                }
            } else {
                propQuery = propQuery.ilike('category', `%${currentConfig}%`);
            }
        }

        const { data: propData } = await propQuery.order('created_at', { ascending: false });

        // Build project query
        let projQuery = supabase.from('projects').select('*');

        if (currentCity) {
            projQuery = projQuery.ilike('city', `%${currentCity}%`);
        }

        if (searchQuery.trim()) {
            projQuery = projQuery.or(`project_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        if (budgetApplied) {
            projQuery = projQuery.gte('min_price_numeric', budgetMin);
            // Only apply max limit if it's less than the slider max (10 Cr)
            if (budgetMax < 100000000) {
                projQuery = projQuery.lte('min_price_numeric', budgetMax);
            }
        }

        // Apply config filter to projects as well (checking bhk_options or description)
        if (currentConfig) {
            const bedroomMatch = currentConfig.match(/^(\d+)/);
            if (bedroomMatch) {
                const beds = bedroomMatch[1]; // "2", "3" etc
                // Check if bhk_options array contains "2 BHK" etc
                projQuery = projQuery.contains('bhk_options', [`${beds} BHK`]);
            } else {
                // For "Villa", "Plot" etc, check description or maybe we need a category field on projects?
                // Projects often have mixed types, but let's try searching basic text fields
                projQuery = projQuery.or(`description.ilike.%${currentConfig}%,project_name.ilike.%${currentConfig}%`);
            }
        }

        const { data: projData } = await projQuery.order('created_at', { ascending: false });

        setAllProperties(propData || []);
        setAllProjects((projData || []).map(normalizeProject));
        setProjectsVisible(6);
        setPropertiesVisible(6);
        setLoading(false);
    };

    const fetchData = async () => {
        try {
            // Fetch properties
            const { data: propsData, error: propsError } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (propsError) throw propsError;

            // Fetch projects
            const { data: projData, error: projError } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

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
                // Guest: load bookmarks from sessionStorage
                try {
                    bookmarks = JSON.parse(sessionStorage.getItem('guest_bookmarks') || '[]');
                } catch {
                    bookmarks = [];
                }
            }

            setAllProperties(propsData || []);
            setAllProjects((projData || []).map(normalizeProject));
            setBookmarkIds(bookmarks);
        } catch (error) {
            console.error("Error fetching data:", (error as Error).message || error, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // If we have query params, perform a filtered search immediately
        if (searchParams?.toString()) {
            handleSearch(undefined, {
                config: searchParams?.get('config') || '',
                city: searchParams?.get('city') || ''
            });
        } else {
            // Otherwise load everything
            fetchData();
        }
    }, [user?.id, searchParams]);



    const isBookmarked = (propertyId: string) => {
        return bookmarkIds.includes(propertyId);
    };

    // Filter projects by status (stored in _status from normalizeProject)
    const filteredProjects = projectStatusFilter
        ? allProjects.filter(p => p._status === projectStatusFilter)
        : allProjects;

    const filteredPropertiesByStatus = projectStatusFilter
        ? allProperties.filter(p => p.status === projectStatusFilter)
        : allProperties;

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

    return (
        <div className={styles.page}>
            {/* ===== MOBILE STICKY HEADER (Airbnb-style) ===== */}
            <div className={styles.mobileSearchHeader}>
                {/* Top row: Logo + Search Pill + Post Property */}
                <div className={styles.mobileTopRow}>
                    <a href="/" className={styles.mobileBackLogo}>
                        <img src="/sidebar-logo.png" alt="27 Estates" className={styles.mobileBackLogoImg} />
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
                            <button
                                type="button"
                                className={styles.mobileSearchClear}
                                onClick={() => setSearchQuery('')}
                            >
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

                    {/* City chip */}
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
                                <button
                                    className={`${styles.chipDropdownItem} ${!selectedCity ? styles.chipDropdownItemActive : ''}`}
                                    onClick={() => { setSelectedCity(''); setCityOpen(false); }}
                                >All Cities</button>
                                {cityOptions.map((city) => (
                                    <button
                                        key={city}
                                        className={`${styles.chipDropdownItem} ${selectedCity === city ? styles.chipDropdownItemActive : ''}`}
                                        onClick={() => { setSelectedCity(city); setCityOpen(false); }}
                                    >{city}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Config chip */}
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
                                <button
                                    className={`${styles.chipDropdownItem} ${!selectedConfig ? styles.chipDropdownItemActive : ''}`}
                                    onClick={() => { setSelectedConfig(''); setConfigOpen(false); }}
                                >All</button>
                                {configOptions.map((cfg) => (
                                    <button
                                        key={cfg}
                                        className={`${styles.chipDropdownItem} ${selectedConfig === cfg ? styles.chipDropdownItemActive : ''}`}
                                        onClick={() => { setSelectedConfig(cfg); setConfigOpen(false); }}
                                    >{cfg}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Budget chip */}
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
                                        <button
                                            className={styles.budgetRemoveBtn}
                                            onClick={() => {
                                                setBudgetApplied(false);
                                                setTempBudgetMin(100000);
                                                setTempBudgetMax(100000000);
                                                setBudgetMin(100000);
                                                setBudgetMax(100000000);
                                                setBudgetOpen(false);
                                            }}
                                        ><X size={14} /> Clear</button>
                                    )}
                                </div>
                                <div className={styles.budgetValues}>
                                    <span>{formatBudgetLabel(tempBudgetMin)}</span>
                                    <span>{formatBudgetLabel(tempBudgetMax)}</span>
                                </div>
                                <div className={styles.budgetSliders}>
                                    <label className={styles.budgetSliderLabel}>Min</label>
                                    <input type="range" min={100000} max={100000000} step={100000}
                                        value={tempBudgetMin}
                                        onChange={(e) => { const v = Number(e.target.value); if (v < tempBudgetMax) setTempBudgetMin(v); }}
                                        className={styles.budgetSlider} />
                                    <label className={styles.budgetSliderLabel} style={{ marginTop: '8px' }}>Max</label>
                                    <input type="range" min={100000} max={100000000} step={100000}
                                        value={tempBudgetMax}
                                        onChange={(e) => { const v = Number(e.target.value); if (v > tempBudgetMin) setTempBudgetMax(v); }}
                                        className={styles.budgetSlider} />
                                </div>
                                <button className={styles.budgetApplyBtn}
                                    onClick={() => { setBudgetMin(tempBudgetMin); setBudgetMax(tempBudgetMax); setBudgetApplied(true); setBudgetOpen(false); }}
                                >Apply</button>
                            </div>
                        )}
                    </div>

                    {/* Search button */}
                    <button className={styles.filterChipSearch} onClick={() => handleSearch()}>
                        <SearchIcon size={14} />
                    </button>
                </div>
            </div>

            {/* ===== DESKTOP HEADER (unchanged) ===== */}
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>
                    Hi, {profileName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Guest'} 👋
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowPostForm(!showPostForm)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: showPostForm ? '#dc2626' : 'var(--dark-turquoise)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(31,82,75,0.2)',
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

            {/* Post Property Form - Inline */}
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

            {/* Buy / Rent Toggle */}
            <div className={styles.listingActionsRow}>
                <div className={styles.listingToggle}>
                    <button
                        className={`${styles.listingBtn} ${listingType === 'Buy' ? styles.listingBtnActive : ''}`}
                        onClick={() => { setListingType('Buy'); handleSearch(undefined, { type: 'Buy' }); }}
                    >Buy</button>
                    <button
                        className={`${styles.listingBtn} ${listingType === 'Rent' ? styles.listingBtnActive : ''}`}
                        onClick={() => { setListingType('Rent'); handleSearch(undefined, { type: 'Rent' }); }}
                    >Rent</button>
                </div>
            </div>

            {/* Filter Bar — desktop only */}
            <div className={styles.filterBar}>
                {/* City Dropdown */}
                <div className={styles.filterDropdown} ref={cityRef}>
                    <button
                        className={styles.filterDropdownBtn}
                        onClick={() => { setCityOpen(!cityOpen); setConfigOpen(false); setBudgetOpen(false); }}
                    >
                        <span>{selectedCity || 'City'}</span>
                        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: cityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {cityOpen && (
                        <div className={styles.filterDropdownMenu}>
                            <button
                                className={`${styles.filterDropdownItem} ${!selectedCity ? styles.filterDropdownItemActive : ''}`}
                                onClick={() => { setSelectedCity(''); setCityOpen(false); }}
                            >All Cities</button>
                            {cityOptions.map((city) => (
                                <button
                                    key={city}
                                    className={`${styles.filterDropdownItem} ${selectedCity === city ? styles.filterDropdownItemActive : ''}`}
                                    onClick={() => { setSelectedCity(city); setCityOpen(false); }}
                                >{city}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Input */}
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

                {/* Configuration Dropdown */}
                <div className={styles.filterDropdown} ref={configRef}>
                    <button
                        className={styles.filterDropdownBtn}
                        onClick={() => { setConfigOpen(!configOpen); setCityOpen(false); setBudgetOpen(false); }}
                    >
                        <span>{selectedConfig || 'Configuration'}</span>
                        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: configOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {configOpen && (
                        <div className={styles.filterDropdownMenu}>
                            <button
                                className={`${styles.filterDropdownItem} ${!selectedConfig ? styles.filterDropdownItemActive : ''}`}
                                onClick={() => { setSelectedConfig(''); setConfigOpen(false); }}
                            >All</button>
                            {configOptions.map((cfg) => (
                                <button
                                    key={cfg}
                                    className={`${styles.filterDropdownItem} ${selectedConfig === cfg ? styles.filterDropdownItemActive : ''}`}
                                    onClick={() => { setSelectedConfig(cfg); setConfigOpen(false); }}
                                >{cfg}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Budget Dropdown with Slider */}
                <div className={styles.filterDropdown} ref={budgetRef}>
                    <button
                        className={`${styles.filterDropdownBtn} ${budgetApplied ? styles.filterDropdownBtnApplied : ''}`}
                        onClick={() => { setBudgetOpen(!budgetOpen); setCityOpen(false); setConfigOpen(false); }}
                    >
                        <span>{budgetApplied ? `${formatBudgetLabel(budgetMin)} – ${formatBudgetLabel(budgetMax)}` : 'Budget'}</span>
                        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: budgetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {budgetOpen && (
                        <div className={styles.budgetPanel}>
                            <div className={styles.budgetHeader}>
                                <span className={styles.budgetTitle}>Budget Range</span>
                                {budgetApplied && (
                                    <button
                                        className={styles.budgetRemoveBtn}
                                        onClick={() => {
                                            setBudgetApplied(false);
                                            setTempBudgetMin(100000);
                                            setTempBudgetMax(100000000);
                                            setBudgetMin(100000);
                                            setBudgetMax(100000000);
                                            setBudgetOpen(false);
                                        }}
                                    >
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
                                <input
                                    type="range" min={100000} max={100000000} step={100000}
                                    value={tempBudgetMin}
                                    onChange={(e) => { const val = Number(e.target.value); if (val < tempBudgetMax) setTempBudgetMin(val); }}
                                    className={styles.budgetSlider}
                                />
                                <label className={styles.budgetSliderLabel} style={{ marginTop: '12px' }}>Max</label>
                                <input
                                    type="range" min={100000} max={100000000} step={100000}
                                    value={tempBudgetMax}
                                    onChange={(e) => { const val = Number(e.target.value); if (val > tempBudgetMin) setTempBudgetMax(val); }}
                                    className={styles.budgetSlider}
                                />
                            </div>
                            <button
                                className={styles.budgetApplyBtn}
                                onClick={() => { setBudgetMin(tempBudgetMin); setBudgetMax(tempBudgetMax); setBudgetApplied(true); setBudgetOpen(false); }}
                            >Apply</button>
                        </div>
                    )}
                </div>

                {/* Search Button */}
                <button className={styles.filterSearchBtn} onClick={() => handleSearch()}>
                    <SearchIcon size={18} />
                </button>
            </div>

            {/* Section 1: PROJECTS */}
            {listingType === 'Buy' && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>PROJECTS</h2>
                    </div>
                    <div className={styles.statusFilters}>
                        {statusOptions.map((opt) => (
                            <button
                                key={opt.label}
                                className={`${styles.statusPill} ${projectStatusFilter === opt.id ? styles.statusPillActive : ''}`}
                                onClick={() => {
                                    setProjectStatusFilter(opt.id);
                                    setProjectsVisible(6);
                                }}
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
                                    <button
                                        className={styles.loadMoreButton}
                                        onClick={() => setProjectsVisible(prev => prev + 6)}
                                    >
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

            {/* Section 2: PROPERTIES */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>PROPERTIES</h2>
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
                                <button
                                    className={styles.loadMoreButton}
                                    onClick={() => setPropertiesVisible(prev => prev + 6)}
                                >
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
        </div >
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
