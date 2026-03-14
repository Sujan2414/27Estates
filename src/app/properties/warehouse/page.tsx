"use client";

import { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, ChevronDown, X, SlidersHorizontal, Warehouse as WarehouseIcon, Search, Snowflake, Truck, Factory, Archive, Package, Map } from "lucide-react";
import ProjectCard from "@/components/emergent/ProjectCard";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/Search.module.css";

interface WarehouseProject {
    id: string;
    project_name: string;
    description: string | null;
    images: string[];
    min_price: string | null;
    max_price: string | null;
    location: string;
    city: string | null;
    status: string;
    sub_category: string | null;
    possession_date: string | null;
    developer_name: string | null;
    is_rera_approved: boolean;
    is_featured: boolean;
    min_area: number | null;
    max_area: number | null;
    min_price_numeric: number | null;
    max_price_numeric: number | null;
    created_at: string;
    [key: string]: any;
}

const MAIN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];

const directionOptions = [
    { id: 'North', label: 'North' },
    { id: 'South', label: 'South' },
    { id: 'East', label: 'East' },
    { id: 'West', label: 'West' },
    { id: 'Central', label: 'Central' },
];

const listingTypeOptions = [
    { id: 'For Sale', label: 'For Sale' },
    { id: 'For Rent', label: 'For Rent' },
    { id: 'For Lease', label: 'For Lease' },
];

const statusOptions = [
    { id: "Pre-Launch", label: "Pre-Launch" },
    { id: "Upcoming", label: "Upcoming" },
    { id: "New Launch", label: "New Launch" },
    { id: "Under Construction", label: "Under Construction" },
    { id: "Ready to Move", label: "Ready to Move" },
];

const subCategoryOptions = [
    { id: "Cold Storage", label: "Cold Storage", icon: Snowflake },
    { id: "Distribution Center", label: "Distribution Center", icon: Truck },
    { id: "Industrial", label: "Industrial", icon: Factory },
    { id: "Self Storage", label: "Self Storage", icon: Archive },
    { id: "Fulfillment Center", label: "Fulfillment Center", icon: Package },
    { id: "Logistics Park", label: "Logistics Park", icon: Map },
];

const priceOptions = [
    { value: "2500000", label: "25 L" },
    { value: "5000000", label: "50 L" },
    { value: "10000000", label: "1 Cr" },
    { value: "20000000", label: "2 Cr" },
    { value: "50000000", label: "5 Cr" },
    { value: "100000000", label: "10 Cr" },
    { value: "200000000", label: "20 Cr" },
    { value: "500000000", label: "50 Cr" },
];

const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
];

const WarehousePage = () => {
    const supabase = createClient();
    const [projects, setProjects] = useState<WarehouseProject[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<WarehouseProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [developers, setDevelopers] = useState<string[]>([]);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [selectedListingType, setSelectedListingType] = useState<string>('For Rent');
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [citySearch, setCitySearch] = useState('');
    const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
    const [pincodeSearch, setPincodeSearch] = useState('');
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [showPincodeDropdown, setShowPincodeDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);
    const [reraApprovedOnly, setReraApprovedOnly] = useState(false);
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [sortBy, setSortBy] = useState("newest");

    const [openSections, setOpenSections] = useState({
        subCategory: true,
        status: true,
        location: true,
        area_filter: false,
        budget: true,
        developer: false,
        sort: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const otherCities = useMemo(() => cities.filter(c => !MAIN_CITIES.includes(c)), [cities]);
    const filteredAllCities = useMemo(() =>
        citySearch.trim() ? cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())) : cities,
        [cities, citySearch]
    );

    const areaOptions = useMemo(() => {
        let base = projects;
        if (selectedCity) base = projects.filter(p => p.city === selectedCity);
        return Array.from(new Set(base.map(p => p.location?.trim()).filter(Boolean))).sort() as string[];
    }, [projects, selectedCity]);

    const availablePincodes = useMemo(() => {
        let base = projects;
        if (selectedCity) base = projects.filter(p => p.city === selectedCity);
        return Array.from(new Set(base.map(p => p.pincode?.trim()).filter(Boolean))).sort() as string[];
    }, [projects, selectedCity]);

    const filteredAreaOptions = useMemo(() =>
        areaSearch.trim() ? areaOptions.filter(a => a.toLowerCase().includes(areaSearch.toLowerCase())) : areaOptions,
        [areaOptions, areaSearch]
    );

    const filteredPincodes = useMemo(() =>
        pincodeSearch.trim().length >= 2 ? availablePincodes.filter(p => p.startsWith(pincodeSearch.trim())) : availablePincodes,
        [availablePincodes, pincodeSearch]
    );

    useEffect(() => {
        if (selectedArea && !areaOptions.includes(selectedArea)) setSelectedArea(null);
    }, [selectedCity, areaOptions, selectedArea]);

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('section', 'warehouse')
            .order('created_at', { ascending: false });

        if (!error && data) {
            const uniqueCities = Array.from(new Set(data.map((p: any) => p.city).filter(Boolean))).sort() as string[];
            const uniqueDevs = Array.from(new Set(data.map((p: any) => p.developer_name).filter(Boolean))).sort() as string[];
            setCities(uniqueCities);
            setDevelopers(uniqueDevs);
            setProjects(data as WarehouseProject[]);
            setFilteredProjects(data as WarehouseProject[]);
        }
        setLoading(false);
    };

    const fetchBookmarks = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data } = await supabase.from('user_bookmarks').select('project_id').eq('user_id', authUser.id).not('project_id', 'is', null);
            if (data) setBookmarks(data.map((b: any) => b.project_id as string));
        } else {
            setBookmarks(JSON.parse(sessionStorage.getItem('guest_bookmarks') || '[]'));
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchBookmarks();
    }, []);

    useEffect(() => {
        let result = [...projects];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.project_name.toLowerCase().includes(q) ||
                p.location?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.developer_name?.toLowerCase().includes(q)
            );
        }
        result = result.filter(p => (p.listing_type || 'For Rent') === selectedListingType);
        if (selectedSubCategory) result = result.filter(p => p.sub_category === selectedSubCategory);
        if (selectedStatus) result = result.filter(p => p.status === selectedStatus);
        if (selectedCity) result = result.filter(p => p.city === selectedCity);
        if (selectedArea) result = result.filter(p => p.location?.includes(selectedArea));
        if (selectedDirection) result = result.filter(p =>
            p.direction?.toLowerCase() === selectedDirection.toLowerCase() ||
            p.location?.toLowerCase().includes(selectedDirection.toLowerCase())
        );
        if (pincodeSearch.trim()) result = result.filter(p => p.location?.includes(pincodeSearch.trim()) || p.pincode?.startsWith(pincodeSearch.trim()));
        if (minPrice) result = result.filter(p => {
            const price = p.min_price_numeric || parseFloat(p.min_price?.replace(/[^\d.]/g, '') || '0');
            return price >= parseInt(minPrice);
        });
        if (maxPrice) result = result.filter(p => {
            const price = p.max_price_numeric || parseFloat(p.max_price?.replace(/[^\d.]/g, '') || '0');
            return !price || price <= parseInt(maxPrice);
        });
        if (selectedDeveloper) result = result.filter(p => p.developer_name === selectedDeveloper);
        if (reraApprovedOnly) result = result.filter(p => p.is_rera_approved);
        if (featuredOnly) result = result.filter(p => p.is_featured);

        result.sort((a, b) => {
            if (sortBy === 'price_low') return (a.min_price_numeric || 0) - (b.min_price_numeric || 0);
            if (sortBy === 'price_high') return (b.min_price_numeric || 0) - (a.min_price_numeric || 0);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setFilteredProjects(result);
    }, [projects, searchQuery, selectedListingType, selectedSubCategory, selectedStatus, selectedCity, selectedArea, selectedDirection, minPrice, maxPrice, selectedDeveloper, reraApprovedOnly, featuredOnly, sortBy, pincodeSearch]);

    const handleReset = () => {
        setSearchQuery("");
        setSelectedListingType('For Rent');
        setSelectedSubCategory(null);
        setSelectedStatus(null);
        setSelectedCity(null);
        setCitySearch('');
        setSelectedDirection(null);
        setSelectedArea(null);
        setAreaSearch('');
        setMinPrice("");
        setMaxPrice("");
        setPincodeSearch("");
        setSelectedDeveloper(null);
        setReraApprovedOnly(false);
        setFeaturedOnly(false);
        setSortBy("newest");
    };

    const hasActiveFilters = !!(selectedSubCategory || selectedStatus || selectedCity || selectedArea || minPrice || maxPrice || selectedDeveloper || reraApprovedOnly || featuredOnly);

    const FilterContent = () => (
        <>
            {/* Listing Type Toggle */}
            <div className={styles.listingTypeToggle}>
                {listingTypeOptions.map(opt => (
                    <button
                        key={opt.id}
                        className={`${styles.listingTypeBtn} ${selectedListingType === opt.id ? styles.listingTypeBtnActive : ''}`}
                        onClick={() => setSelectedListingType(opt.id)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

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

            {/* RERA Approved Toggle */}
            <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>RERA Approved Only</span>
                <div className={styles.toggle}>
                    <button
                        className={`${styles.toggleButton} ${reraApprovedOnly ? styles.toggleButtonActive : ''}`}
                        onClick={() => setReraApprovedOnly(!reraApprovedOnly)}
                    >
                        <span className={`${styles.toggleIndicator} ${reraApprovedOnly ? styles.toggleIndicatorActive : ''}`} />
                    </button>
                </div>
            </div>

            {/* Space Type */}
            <div className={styles.filterSection}>
                <div className={styles.collapsibleHeader} onClick={() => toggleSection('status')}>
                    <label className={styles.filterLabel}>Space Type</label>
                    <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.status ? styles.collapseIconOpen : ''}`} />
                </div>
                <div className={`${styles.collapsibleContent} ${openSections.status ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                    <div className={styles.categoryGrid}>
                        {subCategoryOptions.map(opt => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.id}
                                    className={`${styles.categoryButton} ${selectedSubCategory === opt.id ? styles.categoryButtonActive : ''}`}
                                    onClick={() => setSelectedSubCategory(selectedSubCategory === opt.id ? null : opt.id)}
                                >
                                    <Icon size={18} strokeWidth={1.5} />
                                    <span>{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className={styles.filterSection}>
                <div className={styles.collapsibleHeader} onClick={() => toggleSection('location')}>
                    <label className={styles.filterLabel}>Status</label>
                    <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.location ? styles.collapseIconOpen : ''}`} />
                </div>
                <div className={`${styles.collapsibleContent} ${openSections.location ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                    <div className={styles.pillGrid}>
                        {statusOptions.map(opt => (
                            <button
                                key={opt.id}
                                className={`${styles.pillBtn} ${selectedStatus === opt.id ? styles.pillBtnActive : ''}`}
                                onClick={() => setSelectedStatus(selectedStatus === opt.id ? null : opt.id)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className={styles.filterSection}>
                <div className={styles.collapsibleHeader} onClick={() => toggleSection('area_filter')}>
                    <label className={styles.filterLabel}>City</label>
                    <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.area_filter ? styles.collapseIconOpen : ''}`} />
                </div>
                <div className={`${styles.collapsibleContent} ${openSections.area_filter ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
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
                    {/* Main cities — quick select */}
                    <div className={styles.locationGrid}>
                        {MAIN_CITIES.map(city => (
                            <button
                                key={city}
                                className={`${styles.locationButton} ${selectedCity === city ? styles.locationButtonActive : ''}`}
                                onClick={() => { setSelectedCity(selectedCity === city ? null : city); setSelectedArea(null); setCitySearch(''); setShowCityDropdown(false); }}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Direction — only shown when a city is selected */}
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

            {/* Area / Locality */}
            {areaOptions.length > 0 && (
                <div className={styles.filterSection}>
                    <label className={styles.filterLabel}>Area / Locality</label>
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
                                    <div key={area} className={styles.autocompleteItem}
                                        onMouseDown={() => { setSelectedArea(area); setAreaSearch(''); setShowAreaDropdown(false); }}>
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
                            {filteredPincodes.slice(0, 20).map(p => (
                                <div key={p} className={styles.autocompleteItem}
                                    onMouseDown={() => { setPincodeSearch(p); setShowPincodeDropdown(false); }}>
                                    {p}
                                </div>
                            ))}
                        </div>
                    )}
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
                        <select className={styles.rangeInput} style={{ width: '45%', cursor: 'pointer' }} value={minPrice} onChange={e => setMinPrice(e.target.value)}>
                            <option value="">Min Price</option>
                            {priceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span className={styles.rangeSeparator}>to</span>
                        <select className={styles.rangeInput} style={{ width: '45%', cursor: 'pointer' }} value={maxPrice} onChange={e => setMaxPrice(e.target.value)}>
                            <option value="">Max Price</option>
                            {priceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Developer */}
            {developers.length > 0 && (
                <div className={styles.filterSection}>
                    <div className={styles.collapsibleHeader} onClick={() => toggleSection('developer')}>
                        <label className={styles.filterLabel}>Developer / Owner</label>
                        <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.developer ? styles.collapseIconOpen : ''}`} />
                    </div>
                    <div className={`${styles.collapsibleContent} ${openSections.developer ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                        <select className={styles.selectInput} value={selectedDeveloper || ''} onChange={e => setSelectedDeveloper(e.target.value || null)}>
                            <option value="">All</option>
                            {developers.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Sort */}
            <div className={styles.filterSection}>
                <div className={styles.collapsibleHeader} onClick={() => toggleSection('sort')}>
                    <label className={styles.filterLabel}>Sort By</label>
                    <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.sort ? styles.collapseIconOpen : ''}`} />
                </div>
                <div className={`${styles.collapsibleContent} ${openSections.sort ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                    <select className={styles.selectInput} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>
        </>
    );

    if (loading) {
        return (
            <div className={styles.searchPage}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingText}>Loading warehouse listings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.searchPage}>
            {/* Filter Sidebar */}
            <aside className={styles.filterSidebar}>
                <div className={styles.filterHeader}>
                    <h1 className={styles.filterTitle}>Warehouse Filters</h1>
                </div>
                <div className={styles.filterScrollArea} data-lenis-prevent>
                    {FilterContent()}
                </div>
                <div className={styles.filterFooter}>
                    <button className={styles.resetButton} onClick={handleReset}>
                        Reset Filters
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.searchHeader}>
                    <form className={styles.searchForm} onSubmit={e => e.preventDefault()}>
                        <div className={styles.searchContainer}>
                            <SearchIcon className={styles.searchIcon} size={20} strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder="Search by name, location, developer..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </form>
                </div>

                {/* Mobile Controls Bar */}
                <div className={styles.mobileControls}>
                    <button
                        className={`${styles.mobileFilterBtn} ${showFilterModal ? styles.mobileFilterBtnActive : ''}`}
                        onClick={() => setShowFilterModal(true)}
                    >
                        <SlidersHorizontal size={14} />
                        Filters
                    </button>
                    {hasActiveFilters && (
                        <button className={styles.mobileFilterBtn} onClick={handleReset}>
                            <X size={14} /> Clear
                        </button>
                    )}
                </div>

                <div className={styles.listingsScrollArea} data-lenis-prevent>
                    {filteredProjects.length > 0 ? (
                        <div className={styles.grid}>
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    id={project.id}
                                    project_name={project.project_name}
                                    location={project.location}
                                    city={project.city}
                                    min_price={project.min_price}
                                    max_price={project.max_price}
                                    bhk_options={null}
                                    image={project.images?.[0] || ''}
                                    status={project.status}
                                    developer_name={project.developer_name}
                                    is_rera_approved={project.is_rera_approved}
                                    category={project.sub_category || 'Warehouse'}
                                    isBookmarked={bookmarks.includes(project.id)}
                                    onBookmarkChange={fetchBookmarks}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <WarehouseIcon size={48} className={styles.emptyIcon} strokeWidth={1} />
                            <p className={styles.emptyText}>No warehouse listings found</p>
                            <p className={styles.emptySubtext}>{hasActiveFilters ? 'Try adjusting your filters' : 'No warehouse listings available yet'}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Full-Screen Filter Modal */}
            <div className={showFilterModal ? styles.filterModalOpen : styles.filterModal}>
                <div className={styles.filterModalHeader}>
                    <h2 className={styles.filterModalTitle}>Warehouse Filters</h2>
                    <button className={styles.filterModalClose} onClick={() => setShowFilterModal(false)}>
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.filterModalBody}>
                    {FilterContent()}
                </div>
                <div className={styles.filterModalFooter}>
                    <button className={styles.filterModalReset} onClick={() => { handleReset(); setShowFilterModal(false); }}>
                        Reset
                    </button>
                    <button className={styles.filterModalApply} onClick={() => setShowFilterModal(false)}>
                        View {filteredProjects.length} listing{filteredProjects.length !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarehousePage;
