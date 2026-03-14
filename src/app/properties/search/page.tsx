"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search as SearchIcon, Map, List, Building2, Home, Building, TreePine, ChevronDown, Search, Plus, X, SlidersHorizontal } from "lucide-react";
import LatestPropertyCard from "@/components/emergent/LatestPropertyCard";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/emergent/Search.module.css";
import { motion, AnimatePresence } from "framer-motion";
import PostPropertyForm from "@/components/dashboard/PostPropertyForm";

const PropertyMap = dynamic(() => import("@/components/emergent/PropertyMap"), {
    ssr: false,
    loading: () => (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5", borderRadius: "1rem" }}>
            <p style={{ color: "#737373" }}>Loading map...</p>
        </div>
    ),
});

// Property type
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
    property_type: "Sale" | "Rent";
    category: string;
    is_featured: boolean;
    city: string;
    furnishing: string;
    status: string;
    created_at: string;
    price_text: string | null;
    sub_category: string | null;
    project_name: string | null;
    display_name: string | null;
    latitude: number | null;
    longitude: number | null;
    [key: string]: any;
}

// ... imports

// ... imports

const MAIN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];

// Category options with icons
const propertyCategories = [
    { id: "Apartment", label: "Apartment", icon: Building2 },
    { id: "House", label: "Houses", icon: Home },
    { id: "Villa", label: "Villas", icon: Home },
    { id: "Plot", label: "Plots", icon: Map },
    { id: "Duplex", label: "Duplex", icon: Building },
    { id: "Penthouse", label: "Penthouse", icon: Building2 },
    { id: "Farmhouse", label: "Farmhouse", icon: TreePine },
];

// Price options
const priceOptions = [
    { value: "", label: "Any" },
    { value: "2500000", label: "25 L" },
    { value: "5000000", label: "50 L" },
    { value: "7500000", label: "75 L" },
    { value: "10000000", label: "1 Cr" },
    { value: "15000000", label: "1.5 Cr" },
    { value: "20000000", label: "2 Cr" },
    { value: "30000000", label: "3 Cr" },
    { value: "50000000", label: "5 Cr" },
    { value: "100000000", label: "10 Cr" },
    { value: "200000000", label: "20 Cr" },
    { value: "500000000", label: "50 Cr" },
];

// ... (Rest of constants remain similar)
const furnishingOptions = ["Furnished", "Unfurnished", "Semi-furnished"];

const amenities = [
    "Parking", "Swimming Pool", "Gym", "Security", "Garden", "Balcony", "Elevator",
    "Club House", "Power Backup", "Jogging Track"
];

const propertyStatus = ["Ready to Move", "Under Construction", "New Launch"];
const propertyAge = ["New Construction", "Resale"];

const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
];

const bedroomOptions = ["Any", "1", "2", "3", "4", "5+"];
const bathroomOptions = ["Any", "1", "2", "3", "4+"];

const directionOptions = [
    { id: 'North', label: 'North' },
    { id: 'South', label: 'South' },
    { id: 'East', label: 'East' },
    { id: 'West', label: 'West' },
    { id: 'Central', label: 'Central' },
];

const SearchPage = () => {
    const supabase = createClient();
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Dynamic Filter Options
    const [cities, setCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
    const [pincodeSearch, setPincodeSearch] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [showPincodeDropdown, setShowPincodeDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);


    // View toggle
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [propertyIdSearch, setPropertyIdSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedBedrooms, setSelectedBedrooms] = useState("Any");
    const [selectedBathrooms, setSelectedBathrooms] = useState("Any");
    const [minArea, setMinArea] = useState(""); // sqft
    const [maxArea, setMaxArea] = useState(""); // sqft
    const [selectedFurnishing, setSelectedFurnishing] = useState<string | null>(null);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [selectedPropertyAge, setSelectedPropertyAge] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [listingType, setListingType] = useState<'Buy' | 'Rent' | 'Lease'>('Rent');
    const [sortBy, setSortBy] = useState("newest");
    const [showPostForm, setShowPostForm] = useState(false);

    // Split cities into main (quick chips) and others (searchable)
    const otherCities = useMemo(() => cities.filter(c => !MAIN_CITIES.includes(c)), [cities]);
    const filteredAllCities = useMemo(() =>
        citySearch.trim() ? cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())) : cities,
        [cities, citySearch]
    );

    // Derived Logic for Area Options
    const areaOptions = useMemo(() => {
        let propsToFilter = properties;
        if (selectedCity) propsToFilter = properties.filter(p => p.city === selectedCity);
        return Array.from(new Set(propsToFilter.map(p => p.location?.trim()).filter(Boolean))).sort() as string[];
    }, [properties, selectedCity]);

    const filteredAreaOptions = useMemo(() =>
        areaSearch.trim()
            ? areaOptions.filter(a => a.toLowerCase().includes(areaSearch.toLowerCase()))
            : areaOptions,
        [areaOptions, areaSearch]
    );

    const availablePincodes = useMemo(() => {
        let base = properties;
        if (selectedCity) base = properties.filter(p => p.city === selectedCity);
        return Array.from(new Set(base.map(p => p.pincode?.trim()).filter(Boolean))).sort() as string[];
    }, [properties, selectedCity]);

    const filteredPincodes = useMemo(() =>
        pincodeSearch.trim().length >= 2
            ? availablePincodes.filter(p => p.startsWith(pincodeSearch.trim()))
            : availablePincodes,
        [availablePincodes, pincodeSearch]
    );

    // Reset area search when city changes
    useEffect(() => {
        setAreaSearch('');
        setSelectedArea(null);
    }, [selectedCity]);

    // Collapsible sections
    const [openSections, setOpenSections] = useState({
        location: true,
        area_filter: true,
        category: true,
        budget: true,
        bedrooms: true,
        bathrooms: false,
        sqft_area: false,
        furnishing: false,
        amenities: false,
        status: false,
        age: false,
        builder: false,
        nearby: false,
        sort: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const fetchProperties = async () => {
        try {
            // Fetch all properties from Supabase
            const { data: allProps, error } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Extract unique Cities (Zones) and Areas (Locations)
            if (allProps) {
                const uniqueCities = Array.from(new Set(allProps.map(p => p.city).filter(Boolean))) as string[];
                setCities(uniqueCities.sort());
            }

            const { data: { user } } = await supabase.auth.getUser();
            let bookmarks: string[] = [];
            if (user) {
                const { data: bookmarkData } = await supabase
                    .from('user_bookmarks')
                    .select('property_id')
                    .eq('user_id', user.id);
                bookmarks = bookmarkData?.map(b => b.property_id) || [];
            }

            setProperties(allProps || []);
            setFilteredProperties(allProps || []);
            setBookmarkIds(bookmarks);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    };
    // ... rest of component logic (useEffect, etc.) remains same as dynamic values are used in render loop

    // Re-fetch when user changes (login/logout/switch user)
    useEffect(() => {
        fetchProperties();
    }, [user?.id]);

    // Apply filters matching new states
    useEffect(() => {
        let result = [...properties];

        // Filter by Buy/Rent/Lease (property_type)
        result = result.filter(p => p.property_type === (listingType === 'Buy' ? 'Sale' : listingType));

        if (propertyIdSearch.trim()) {
            const id = propertyIdSearch.toLowerCase();
            result = result.filter(p =>
                p.id.toLowerCase().includes(id) ||
                p.property_id.toLowerCase().includes(id)
            );
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.location.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            result = result.filter(p => p.category === selectedCategory);
        }

        if (selectedCity) {
            result = result.filter(p => p.city === selectedCity || p.location.includes(selectedCity));
        }

        if (selectedArea) {
            result = result.filter(p => p.location.includes(selectedArea));
        }

        if (selectedDirection) {
            result = result.filter(p =>
                p.direction?.toLowerCase() === selectedDirection.toLowerCase() ||
                p.location?.toLowerCase().includes(selectedDirection.toLowerCase())
            );
        }

        if (pincodeSearch.trim()) {
            const pin = pincodeSearch.trim();
            result = result.filter(p => p.pincode?.startsWith(pin) || p.location?.includes(pin));
        }

        if (minPrice) {
            result = result.filter(p => p.price >= parseInt(minPrice));
        }
        if (maxPrice) {
            result = result.filter(p => p.price <= parseInt(maxPrice));
        }

        // ... (Rest of filter logic same)
        if (selectedBedrooms !== "Any") {
            const bedCount = selectedBedrooms === "5+" ? 5 : parseInt(selectedBedrooms);
            result = result.filter(p =>
                selectedBedrooms === "5+" ? p.bedrooms >= bedCount : p.bedrooms === bedCount
            );
        }

        if (selectedBathrooms !== "Any") {
            const bathCount = selectedBathrooms === "4+" ? 4 : parseInt(selectedBathrooms);
            result = result.filter(p =>
                selectedBathrooms === "4+" ? p.bathrooms >= bathCount : p.bathrooms === bathCount
            );
        }

        if (minArea) {
            result = result.filter(p => p.sqft >= parseInt(minArea));
        }
        if (maxArea) {
            result = result.filter(p => p.sqft <= parseInt(maxArea));
        }

        if (featuredOnly) {
            result = result.filter(p => p.is_featured);
        }

        if (selectedFurnishing) {
            result = result.filter(p => p.furnishing === selectedFurnishing);
        }

        if (selectedStatus) {
            result = result.filter(p => p.status === selectedStatus);
        }

        switch (sortBy) {
            case "price_low":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price_high":
                result.sort((a, b) => b.price - a.price);
                break;
            case "newest":
            default:
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // improved sort
                break;
        }

        setFilteredProperties(result);
    }, [
        searchQuery, propertyIdSearch, selectedCategory, selectedCity, selectedArea, selectedDirection,
        minPrice, maxPrice, selectedBedrooms, selectedBathrooms,
        minArea, maxArea, featuredOnly, listingType, sortBy, properties, selectedStatus, selectedFurnishing, pincodeSearch
    ]);

    const handleReset = () => {
        setSearchQuery("");
        setPropertyIdSearch("");
        setSelectedCategory(null);
        setSelectedCity(null);
        setSelectedArea(null);
        setMinPrice("");
        setMaxPrice("");
        setSelectedBedrooms("Any");
        setSelectedBathrooms("Any");
        setMinArea("");
        setMaxArea("");
        setSelectedFurnishing(null);
        setSelectedAmenities([]);
        setSelectedPropertyAge(null);
        setSelectedStatus(null);
        setFeaturedOnly(false);
        setListingType('Rent');
        setSortBy("newest");
        setSelectedDirection(null);
        setPincodeSearch("");
        setAreaSearch("");
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    const isBookmarked = (propertyId: string) => {
        return bookmarkIds.includes(propertyId);
    };

    if (loading) {
        return (
            <div className={styles.searchPage}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingText}>Loading properties...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.searchPage}>
            {/* Filter Sidebar */}
            <aside className={styles.filterSidebar}>
                {/* Header - Sticky */}
                <div className={styles.filterHeader}>
                    <h1 className={styles.filterTitle}>Property Filters</h1>
                    <div className={styles.viewToggle}>
                        {/* View Toggles */}
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={14} /> List
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'map' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('map')}
                        >
                            <Map size={14} /> Map
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className={styles.filterScrollArea} data-lenis-prevent>
                    {/* Buy / Rent / Lease Toggle */}
                    <div className={styles.listingTypeToggle}>
                        <button
                            className={`${styles.listingTypeBtn} ${listingType === 'Buy' ? styles.listingTypeBtnActive : ''}`}
                            onClick={() => setListingType('Buy')}
                        >Buy</button>
                        <button
                            className={`${styles.listingTypeBtn} ${listingType === 'Rent' ? styles.listingTypeBtnActive : ''}`}
                            onClick={() => setListingType('Rent')}
                        >Rent</button>
                        <button
                            className={`${styles.listingTypeBtn} ${listingType === 'Lease' ? styles.listingTypeBtnActive : ''}`}
                            onClick={() => setListingType('Lease')}
                        >Lease</button>
                    </div>

                    {/* Featured Property Toggle */}
                    <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Featured Only</span>
                        <div className={styles.toggle}>
                            <button
                                className={`${styles.toggleButton} ${featuredOnly ? styles.toggleButtonActive : ''}`}
                                onClick={() => setFeaturedOnly(!featuredOnly)}
                            >
                                <span className={`${styles.toggleIndicator} ${featuredOnly ? styles.toggleIndicatorActive : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Property ID Search */}
                    <div className={styles.filterSection}>
                        <label className={styles.filterLabel}>Property ID</label>
                        <input
                            type="text"
                            placeholder="Enter Property ID..."
                            value={propertyIdSearch}
                            onChange={(e) => setPropertyIdSearch(e.target.value)}
                            className={styles.textInput}
                        />
                    </div>

                    {/* Location - City */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('location')}>
                            <label className={styles.filterLabel}>Location</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.location ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.location ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            {/* City autocomplete — all cities */}
                            <div className={styles.autocompleteWrap} style={{ marginBottom: '0.625rem' }}>
                                <input
                                    type="text"
                                    placeholder="Search city..."
                                    value={selectedCity ? selectedCity : citySearch}
                                    onChange={e => { setCitySearch(e.target.value); setSelectedCity(null); setShowCityDropdown(true); }}
                                    onFocus={() => setShowCityDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                                    className={styles.textInput}
                                />
                                {showCityDropdown && filteredAllCities.length > 0 && (
                                    <div className={styles.autocompleteList}>
                                        {filteredAllCities.slice(0, 20).map((city: string) => (
                                            <div key={city} className={styles.autocompleteItem}
                                                onMouseDown={() => { setSelectedCity(city); setCitySearch(''); setShowCityDropdown(false); }}>
                                                {city}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Main cities — quick select chips */}
                            <div className={styles.locationGrid}>
                                {MAIN_CITIES.map((city) => (
                                    <button
                                        key={city}
                                        className={`${styles.locationButton} ${selectedCity === city ? styles.locationButtonActive : ''}`}
                                        onClick={() => { setSelectedCity(selectedCity === city ? null : city); setCitySearch(''); setShowCityDropdown(false); }}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Direction Filter — only shown when a city is selected */}
                    {selectedCity && (
                        <div className={styles.filterSection}>
                            <label className={styles.filterLabel}>Direction</label>
                            <div className={styles.locationGrid}>
                                {directionOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        className={`${styles.locationButton} ${selectedDirection === opt.id ? styles.locationButtonActive : ''}`}
                                        onClick={() => setSelectedDirection(selectedDirection === opt.id ? null : opt.id)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Area / Neighborhood */}
                    {areaOptions.length > 0 && (
                        <div className={styles.filterSection}>
                            <label className={styles.filterLabel}>Area / Neighborhood</label>
                            <div className={styles.autocompleteWrap}>
                                <input
                                    type="text"
                                    placeholder="Type to search area..."
                                    value={selectedArea || areaSearch}
                                    onChange={e => { setAreaSearch(e.target.value); setSelectedArea(null); setShowAreaDropdown(true); }}
                                    onFocus={() => setShowAreaDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowAreaDropdown(false), 150)}
                                    className={styles.textInput}
                                />
                                {showAreaDropdown && filteredAreaOptions.length > 0 && (
                                    <div className={styles.autocompleteList}>
                                        {filteredAreaOptions.slice(0, 20).map(area => (
                                            <div key={area} className={styles.autocompleteItem} onMouseDown={() => { setSelectedArea(area); setAreaSearch(''); setShowAreaDropdown(false); }}>
                                                {area}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pincode Search */}
                    <div className={styles.filterSection}>
                        <label className={styles.filterLabel}>Pincode</label>
                        <div className={styles.autocompleteWrap}>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter pincode..."
                                value={pincodeSearch}
                                onChange={e => { setPincodeSearch(e.target.value.replace(/\D/g, '').slice(0, 6)); setShowPincodeDropdown(true); }}
                                onFocus={() => setShowPincodeDropdown(true)}
                                onBlur={() => setTimeout(() => setShowPincodeDropdown(false), 150)}
                                className={styles.textInput}
                                maxLength={6}
                            />
                            {showPincodeDropdown && filteredPincodes.length > 0 && (
                                <div className={styles.autocompleteList}>
                                    {filteredPincodes.slice(0, 15).map(pin => (
                                        <div key={pin} className={styles.autocompleteItem} onMouseDown={() => { setPincodeSearch(pin); setShowPincodeDropdown(false); }}>
                                            {pin}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Property Category */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('category')}>
                            <label className={styles.filterLabel}>Property Type</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.category ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.category ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.categoryGrid}>
                                {propertyCategories.map((cat) => {
                                    const Icon = cat.icon;
                                    return (
                                        <button
                                            key={cat.id}
                                            className={`${styles.categoryButton} ${selectedCategory === cat.id ? styles.categoryButtonActive : ''}`}
                                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                        >
                                            <Icon size={18} strokeWidth={1.5} />
                                            <span>{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Budget (Dropdowns) */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('budget')}>
                            <label className={styles.filterLabel}>Budget</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.budget ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.budget ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.rangeInputs}>
                                <select
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className={styles.rangeInput} // Reuse class for styling
                                    style={{ width: '45%', cursor: 'pointer' }}
                                >
                                    <option value="">Min Price</option>
                                    {priceOptions.map(opt => (
                                        <option key={`min-${opt.value}`} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <span className={styles.rangeSeparator}>to</span>
                                <select
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className={styles.rangeInput}
                                    style={{ width: '45%', cursor: 'pointer' }}
                                >
                                    <option value="">Max Price</option>
                                    {priceOptions.map(opt => (
                                        <option key={`max-${opt.value}`} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bedrooms */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('bedrooms')}>
                            <label className={styles.filterLabel}>Bedrooms</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.bedrooms ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.bedrooms ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.numberGrid}>
                                {bedroomOptions.map((opt) => (
                                    <button
                                        key={opt}
                                        className={`${styles.numberBtn} ${selectedBedrooms === opt ? styles.numberBtnActive : ''}`}
                                        onClick={() => setSelectedBedrooms(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bathrooms */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('bathrooms')}>
                            <label className={styles.filterLabel}>Bathrooms</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.bathrooms ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.bathrooms ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.numberGrid}>
                                {bathroomOptions.map((opt) => (
                                    <button
                                        key={opt}
                                        className={`${styles.numberBtn} ${selectedBathrooms === opt ? styles.numberBtnActive : ''}`}
                                        onClick={() => setSelectedBathrooms(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Area/Size (Renamed Section State) */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('sqft_area')}>
                            <label className={styles.filterLabel}>Size (sq ft)</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.sqft_area ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.sqft_area ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.rangeInputs}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minArea}
                                    onChange={(e) => setMinArea(e.target.value)}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.rangeSeparator}>to</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxArea}
                                    onChange={(e) => setMaxArea(e.target.value)}
                                    className={styles.rangeInput}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Furnishing */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('furnishing')}>
                            <label className={styles.filterLabel}>Furnishing</label>
                            {/* ... keeping rest same */}
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.furnishing ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.furnishing ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {furnishingOptions.map((opt) => (
                                    <button
                                        key={opt}
                                        className={`${styles.pillBtn} ${selectedFurnishing === opt ? styles.pillBtnActive : ''}`}
                                        onClick={() => setSelectedFurnishing(selectedFurnishing === opt ? null : opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('amenities')}>
                            <label className={styles.filterLabel}>Amenities</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.amenities ? styles.collapseIconOpen : ''}`} />
                        </div>
                        {/* ... keeping rest same */}
                        <div className={`${styles.collapsibleContent} ${openSections.amenities ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.checkboxGrid}>
                                {amenities.map((amenity) => (
                                    <label key={amenity} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={selectedAmenities.includes(amenity)}
                                            onChange={() => toggleAmenity(amenity)}
                                            className={styles.checkbox}
                                        />
                                        {amenity}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Property Status */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('status')}>
                            <label className={styles.filterLabel}>Property Status</label>
                            {/* ... keeping rest same */}
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.status ? styles.collapseIconOpen : ''}`} />
                        </div>
                        {/* ... keeping rest same */}
                        <div className={`${styles.collapsibleContent} ${openSections.status ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {propertyStatus.map((status) => (
                                    <button
                                        key={status}
                                        className={`${styles.pillBtn} ${selectedStatus === status ? styles.pillBtnActive : ''}`}
                                        onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Property Age */}
                    <div className={styles.filterSection}>
                        {/* ... keeping rest same */}
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('age')}>
                            <label className={styles.filterLabel}>Property Age</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.age ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.age ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {propertyAge.map((age) => (
                                    <button
                                        key={age}
                                        className={`${styles.pillBtn} ${selectedPropertyAge === age ? styles.pillBtnActive : ''}`}
                                        onClick={() => setSelectedPropertyAge(selectedPropertyAge === age ? null : age)}
                                    >
                                        {age}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className={styles.filterSection}>
                        {/* ... keeping rest same */}
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('sort')}>
                            <label className={styles.filterLabel}>Sort By</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.sort ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.sort ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={styles.selectInput}
                            >
                                {sortOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer - Sticky Reset Button */}
                <div className={styles.filterFooter}>
                    <button className={styles.resetButton} onClick={handleReset}>
                        Reset Search
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Sticky Search Header */}
                <div className={styles.searchHeader}>
                    <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                        <div className={styles.searchContainer}>
                            <SearchIcon className={styles.searchIcon} size={20} strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder="Search properties by title, location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </form>
                    <button
                        onClick={() => setShowPostForm(!showPostForm)}
                        className={`${styles.postBtnInline} ${showPostForm ? styles.postBtnInlineActive : ''}`}
                    >
                        <Plus size={16} /> {showPostForm ? 'Close Form' : 'Post Your Property'}
                    </button>
                </div>

                {/* Inline Post Property Form — expands below search bar */}
                <AnimatePresence>
                    {showPostForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: 'hidden', margin: '0 1.5rem 12px 1.5rem', maxHeight: '60vh', overflowY: 'auto' }}
                        >
                            <PostPropertyForm />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Controls Bar — Filter + List/Map toggle */}
                <div className={styles.mobileControls}>
                    <button
                        className={`${styles.mobileFilterBtn} ${showFilterModal ? styles.mobileFilterBtnActive : ''}`}
                        onClick={() => setShowFilterModal(true)}
                    >
                        <SlidersHorizontal size={14} />
                        Filters
                    </button>
                    {(selectedCategory || selectedCity || selectedArea || minPrice || maxPrice || selectedBedrooms !== 'Any' || selectedBathrooms !== 'Any' || selectedFurnishing || selectedStatus || featuredOnly) && (
                        <button
                            className={styles.mobileFilterBtn}
                            onClick={handleReset}
                        >
                            <X size={14} />
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => setShowPostForm(!showPostForm)}
                        className={styles.mobilePostBtnInline}
                        style={showPostForm ? { background: '#dc2626' } : {}}
                    >
                        {showPostForm ? <><X size={14} /> Close</> : <><Plus size={14} /> Post Property</>}
                    </button>
                </div>

                {/* Floating Map/List Toggle — bottom center on mobile, hidden when form is open */}
                {!showPostForm && (
                    <button
                        className={styles.floatingViewToggle}
                        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                    >
                        {viewMode === 'list' ? <><Map size={16} /> Map</> : <><List size={16} /> List</>}
                    </button>
                )}

                {/* Buy / Rent / Lease Toggle & Post Property Button */}
                <div className={styles.listingActionsRow}>
                    <div className={styles.listingToggle}>
                        <button
                            className={`${styles.listingBtn} ${listingType === 'Buy' ? styles.listingBtnActive : ''}`}
                            onClick={() => setListingType('Buy')}
                        >Buy</button>
                        <button
                            className={`${styles.listingBtn} ${listingType === 'Rent' ? styles.listingBtnActive : ''}`}
                            onClick={() => setListingType('Rent')}
                        >Rent</button>
                        <button
                            className={`${styles.listingBtn} ${listingType === 'Lease' ? styles.listingBtnActive : ''}`}
                            onClick={() => setListingType('Lease')}
                        >Lease</button>
                    </div>
                </div>

                {/* Scrollable Listings Area */}
                <div className={styles.listingsScrollArea} data-lenis-prevent>

                    {viewMode === 'map' ? (
                        /* Map View */
                        <div className={styles.mapContainer}>
                            <PropertyMap
                                properties={filteredProperties.map(p => ({
                                    ...p,
                                    type: "property" as const,
                                    category: p.category,
                                }))}
                            />
                        </div>
                    ) : (
                        /* Property Grid */
                        filteredProperties.length > 0 ? (
                            <div className={styles.grid}>
                                {filteredProperties.map((property) => (
                                    <LatestPropertyCard
                                        key={property.id}
                                        property={property}
                                        isBookmarked={isBookmarked(property.id)}
                                        onBookmarkChange={fetchProperties}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <Search size={48} className={styles.emptyIcon} strokeWidth={1} />
                                <p className={styles.emptyText}>No properties found</p>
                                <p className={styles.emptySubtext}>Try adjusting your filters or search query</p>
                            </div>
                        )
                    )}
                </div>
            </main>

            {/* ===== MOBILE FULL-SCREEN FILTER MODAL ===== */}
            <div className={showFilterModal ? styles.filterModalOpen : styles.filterModal}>
                <div className={styles.filterModalHeader}>
                    <h2 className={styles.filterModalTitle}>Filters</h2>
                    <button className={styles.filterModalClose} onClick={() => setShowFilterModal(false)}>
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.filterModalBody}>
                    {/* Featured Toggle */}
                    <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Featured Only</span>
                        <div className={styles.toggle}>
                            <button
                                className={`${styles.toggleButton} ${featuredOnly ? styles.toggleButtonActive : ''}`}
                                onClick={() => setFeaturedOnly(!featuredOnly)}
                            >
                                <span className={`${styles.toggleIndicator} ${featuredOnly ? styles.toggleIndicatorActive : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Location - City */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('location')}>
                            <label className={styles.filterLabel}>Location</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.location ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.location ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            {/* City autocomplete — all cities */}
                            <div className={styles.autocompleteWrap} style={{ marginBottom: '0.625rem' }}>
                                <input
                                    type="text"
                                    placeholder="Search city..."
                                    value={selectedCity ? selectedCity : citySearch}
                                    onChange={e => { setCitySearch(e.target.value); setSelectedCity(null); setShowCityDropdown(true); }}
                                    onFocus={() => setShowCityDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                                    className={styles.textInput}
                                />
                                {showCityDropdown && filteredAllCities.length > 0 && (
                                    <div className={styles.autocompleteList}>
                                        {filteredAllCities.slice(0, 20).map((city: string) => (
                                            <div key={city} className={styles.autocompleteItem}
                                                onMouseDown={() => { setSelectedCity(city); setCitySearch(''); setShowCityDropdown(false); }}>
                                                {city}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Main cities — quick select chips */}
                            <div className={styles.locationGrid}>
                                {MAIN_CITIES.map((city) => (
                                    <button
                                        key={city}
                                        className={`${styles.locationButton} ${selectedCity === city ? styles.locationButtonActive : ''}`}
                                        onClick={() => { setSelectedCity(selectedCity === city ? null : city); setCitySearch(''); setShowCityDropdown(false); }}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Direction Filter — only shown when a city is selected */}
                    {selectedCity && (
                        <div className={styles.filterSection}>
                            <label className={styles.filterLabel}>Direction</label>
                            <div className={styles.locationGrid}>
                                {directionOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        className={`${styles.locationButton} ${selectedDirection === opt.id ? styles.locationButtonActive : ''}`}
                                        onClick={() => setSelectedDirection(selectedDirection === opt.id ? null : opt.id)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Area / Neighborhood */}
                    {areaOptions.length > 0 && (
                        <div className={styles.filterSection}>
                            <label className={styles.filterLabel}>Area / Neighborhood</label>
                            <div className={styles.autocompleteWrap}>
                                <input
                                    type="text"
                                    placeholder="Type to search area..."
                                    value={selectedArea || areaSearch}
                                    onChange={e => { setAreaSearch(e.target.value); setSelectedArea(null); setShowAreaDropdown(true); }}
                                    onFocus={() => setShowAreaDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowAreaDropdown(false), 150)}
                                    className={styles.textInput}
                                />
                                {showAreaDropdown && filteredAreaOptions.length > 0 && (
                                    <div className={styles.autocompleteList}>
                                        {filteredAreaOptions.slice(0, 20).map(area => (
                                            <div key={area} className={styles.autocompleteItem} onMouseDown={() => { setSelectedArea(area); setAreaSearch(''); setShowAreaDropdown(false); }}>
                                                {area}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pincode */}
                    <div className={styles.filterSection}>
                        <label className={styles.filterLabel}>Pincode</label>
                        <div className={styles.autocompleteWrap}>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter pincode..."
                                value={pincodeSearch}
                                onChange={e => { setPincodeSearch(e.target.value.replace(/\D/g, '').slice(0, 6)); setShowPincodeDropdown(true); }}
                                onFocus={() => setShowPincodeDropdown(true)}
                                onBlur={() => setTimeout(() => setShowPincodeDropdown(false), 150)}
                                className={styles.textInput}
                                maxLength={6}
                            />
                            {showPincodeDropdown && filteredPincodes.length > 0 && (
                                <div className={styles.autocompleteList}>
                                    {filteredPincodes.slice(0, 15).map(pin => (
                                        <div key={pin} className={styles.autocompleteItem} onMouseDown={() => { setPincodeSearch(pin); setShowPincodeDropdown(false); }}>
                                            {pin}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Property Type */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('category')}>
                            <label className={styles.filterLabel}>Property Type</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.category ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.category ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.categoryGrid}>
                                {propertyCategories.map((cat) => {
                                    const Icon = cat.icon;
                                    return (
                                        <button
                                            key={cat.id}
                                            className={`${styles.categoryButton} ${selectedCategory === cat.id ? styles.categoryButtonActive : ''}`}
                                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                        >
                                            <Icon size={18} strokeWidth={1.5} />
                                            <span>{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('budget')}>
                            <label className={styles.filterLabel}>Budget</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.budget ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.budget ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.rangeInputs}>
                                <select value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={styles.rangeInput} style={{ width: '45%', cursor: 'pointer' }}>
                                    <option value="">Min Price</option>
                                    {priceOptions.map(opt => (<option key={`min-${opt.value}`} value={opt.value}>{opt.label}</option>))}
                                </select>
                                <span className={styles.rangeSeparator}>to</span>
                                <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={styles.rangeInput} style={{ width: '45%', cursor: 'pointer' }}>
                                    <option value="">Max Price</option>
                                    {priceOptions.map(opt => (<option key={`max-${opt.value}`} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bedrooms */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('bedrooms')}>
                            <label className={styles.filterLabel}>Bedrooms</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.bedrooms ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.bedrooms ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.numberGrid}>
                                {bedroomOptions.map((opt) => (
                                    <button key={opt} className={`${styles.numberBtn} ${selectedBedrooms === opt ? styles.numberBtnActive : ''}`} onClick={() => setSelectedBedrooms(opt)}>{opt}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bathrooms */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('bathrooms')}>
                            <label className={styles.filterLabel}>Bathrooms</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.bathrooms ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.bathrooms ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.numberGrid}>
                                {bathroomOptions.map((opt) => (
                                    <button key={opt} className={`${styles.numberBtn} ${selectedBathrooms === opt ? styles.numberBtnActive : ''}`} onClick={() => setSelectedBathrooms(opt)}>{opt}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Furnishing */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('furnishing')}>
                            <label className={styles.filterLabel}>Furnishing</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.furnishing ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.furnishing ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {furnishingOptions.map((opt) => (
                                    <button key={opt} className={`${styles.pillBtn} ${selectedFurnishing === opt ? styles.pillBtnActive : ''}`} onClick={() => setSelectedFurnishing(selectedFurnishing === opt ? null : opt)}>{opt}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('status')}>
                            <label className={styles.filterLabel}>Property Status</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.status ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.status ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {propertyStatus.map((status) => (
                                    <button key={status} className={`${styles.pillBtn} ${selectedStatus === status ? styles.pillBtnActive : ''}`} onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}>{status}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sort */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('sort')}>
                            <label className={styles.filterLabel}>Sort By</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.sort ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.sort ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.selectInput}>
                                {sortOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className={styles.filterModalFooter}>
                    <button className={styles.filterModalReset} onClick={() => { handleReset(); }}>Reset</button>
                    <button className={styles.filterModalApply} onClick={() => setShowFilterModal(false)}>Show Results</button>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
