"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search as SearchIcon, Map, List, Building2, Calendar, ChevronDown, Search, Home, Building, Factory, Briefcase, TreePine, Rows3 } from "lucide-react";
import ProjectCard from "@/components/emergent/ProjectCard";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/Search.module.css";

const PropertyMap = dynamic(() => import("@/components/emergent/PropertyMap"), {
    ssr: false,
    loading: () => (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5", borderRadius: "1rem" }}>
            <p style={{ color: "#737373" }}>Loading map...</p>
        </div>
    ),
});

// Project type
interface Project {
    id: string;
    project_name: string;
    description: string | null;
    images: string[];
    min_price: string | null;
    max_price: string | null;
    location: string;
    city: string | null;
    status: string;
    bhk_options: string[] | null;
    possession_date: string | null;
    developer_name: string | null;
    is_rera_approved: boolean;
    is_featured: boolean;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    [key: string]: any;
}

// Status options for projects
const projectStatusOptions = [
    { id: "Upcoming", label: "Upcoming" },
    { id: "Under Construction", label: "Under Construction" },
    { id: "Ready to Move", label: "Ready to Move" },
    { id: "New Launch", label: "New Launch" },
];

// BHK Configuration options
const bhkOptions = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"];

// Price options (same as properties)
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
];

// Project category options
const categoryOptions = [
    { id: "Apartment", label: "Apartment", icon: Home },
    { id: "Villa", label: "Villas", icon: Home },
    { id: "Plot", label: "Plots", icon: Map },
    { id: "Commercial", label: "Commercial", icon: Factory },
    { id: "Duplex", label: "Duplex", icon: Building },
    { id: "Penthouse", label: "Penthouse", icon: Building2 },
    { id: "Farmhouse", label: "Farmhouse", icon: TreePine },
    { id: "Row Villa", label: "Row Villa", icon: Rows3 },
];

// Possession year options
const possessionYears = ["2025", "2026", "2027", "2028", "2029+"];

const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
];

const ProjectsSearchPage = () => {
    const supabase = createClient();
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Dynamic Filter Options
    const [cities, setCities] = useState<string[]>([]);
    const [developers, setDevelopers] = useState<string[]>([]);

    // View toggle
    const [viewMode, setViewMode] = useState<"list" | "map">("list");

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedBhk, setSelectedBhk] = useState<string[]>([]);
    const [selectedPossession, setSelectedPossession] = useState<string | null>(null);
    const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);
    const [reraApprovedOnly, setReraApprovedOnly] = useState(false);
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState("newest");

    // Area options based on selected city
    const areaOptions = useMemo(() => {
        let propsToFilter = projects;
        if (selectedCity) {
            propsToFilter = projects.filter(p => p.city === selectedCity);
        }
        const uniqueAreas = Array.from(new Set(propsToFilter.map(p => p.location).filter(Boolean))) as string[];
        return uniqueAreas.sort();
    }, [projects, selectedCity]);

    // Reset Selected Area if not in options
    useEffect(() => {
        if (selectedArea && !areaOptions.includes(selectedArea)) {
            setSelectedArea(null);
        }
    }, [selectedCity, areaOptions, selectedArea]);

    // Collapsible sections
    const [openSections, setOpenSections] = useState({
        category: true,
        status: true,
        location: true,
        area_filter: true,
        budget: true,
        bhk: true,
        possession: false,
        developer: false,
        sort: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const fetchProjects = async () => {
        try {
            const { data: allProjects, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (allProjects) {
                const uniqueCities = Array.from(new Set(allProjects.map(p => p.city).filter(Boolean))) as string[];
                const uniqueDevelopers = Array.from(new Set(allProjects.map(p => p.developer_name).filter(Boolean))) as string[];
                setCities(uniqueCities.sort());
                setDevelopers(uniqueDevelopers.sort());
            }

            setProjects(allProjects || []);
            setFilteredProjects(allProjects || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...projects];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.project_name.toLowerCase().includes(query) ||
                p.location?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.developer_name?.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            result = result.filter(p => p.category === selectedCategory);
        }

        if (selectedStatus) {
            result = result.filter(p => p.status === selectedStatus);
        }

        if (selectedCity) {
            result = result.filter(p => p.city === selectedCity);
        }

        if (selectedArea) {
            result = result.filter(p => p.location?.includes(selectedArea));
        }

        if (minPrice) {
            result = result.filter(p => {
                const price = parseFloat(p.min_price?.replace(/[^\d.]/g, '') || '0');
                return price >= parseInt(minPrice);
            });
        }

        if (maxPrice) {
            result = result.filter(p => {
                const price = parseFloat(p.max_price?.replace(/[^\d.]/g, '') || '0');
                return price <= parseInt(maxPrice);
            });
        }

        if (selectedBhk.length > 0) {
            result = result.filter(p =>
                p.bhk_options?.some(bhk => selectedBhk.includes(bhk))
            );
        }

        if (selectedPossession) {
            result = result.filter(p => p.possession_date?.includes(selectedPossession));
        }

        if (selectedDeveloper) {
            result = result.filter(p => p.developer_name === selectedDeveloper);
        }

        if (reraApprovedOnly) {
            result = result.filter(p => p.is_rera_approved);
        }

        if (featuredOnly) {
            result = result.filter(p => p.is_featured);
        }

        switch (sortBy) {
            case "price_low":
                result.sort((a, b) => {
                    const priceA = parseFloat(a.min_price?.replace(/[^\d.]/g, '') || '0');
                    const priceB = parseFloat(b.min_price?.replace(/[^\d.]/g, '') || '0');
                    return priceA - priceB;
                });
                break;
            case "price_high":
                result.sort((a, b) => {
                    const priceA = parseFloat(a.min_price?.replace(/[^\d.]/g, '') || '0');
                    const priceB = parseFloat(b.min_price?.replace(/[^\d.]/g, '') || '0');
                    return priceB - priceA;
                });
                break;
            case "newest":
            default:
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }

        setFilteredProjects(result);
    }, [
        searchQuery, selectedCategory, selectedStatus, selectedCity, selectedArea,
        minPrice, maxPrice, selectedBhk, selectedPossession,
        selectedDeveloper, reraApprovedOnly, featuredOnly, sortBy, projects
    ]);

    const handleReset = () => {
        setSearchQuery("");
        setSelectedCategory(null);
        setSelectedStatus(null);
        setSelectedCity(null);
        setSelectedArea(null);
        setMinPrice("");
        setMaxPrice("");
        setSelectedBhk([]);
        setSelectedPossession(null);
        setSelectedDeveloper(null);
        setReraApprovedOnly(false);
        setFeaturedOnly(false);
        setSortBy("newest");
    };

    const toggleBhk = (bhk: string) => {
        setSelectedBhk(prev =>
            prev.includes(bhk) ? prev.filter(b => b !== bhk) : [...prev, bhk]
        );
    };

    if (loading) {
        return (
            <div className={styles.searchPage}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingText}>Loading projects...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.searchPage}>
            {/* Filter Sidebar */}
            <aside className={styles.filterSidebar}>
                <div className={styles.filterHeader}>
                    <h1 className={styles.filterTitle}>Project Filters</h1>
                    <div className={styles.viewToggle}>
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

                <div className={styles.filterScrollArea} data-lenis-prevent>
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

                    {/* Project Type */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('category')}>
                            <label className={styles.filterLabel}>Project Type</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.category ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.category ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.categoryGrid}>
                                {categoryOptions.map((cat) => {
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

                    {/* Project Status */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('status')}>
                            <label className={styles.filterLabel}>Project Status</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.status ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.status ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {projectStatusOptions.map((opt) => (
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

                    {/* Location - City */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('location')}>
                            <label className={styles.filterLabel}>Location</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.location ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.location ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.locationGrid}>
                                {cities.map((city) => (
                                    <button
                                        key={city}
                                        className={`${styles.locationButton} ${selectedCity === city ? styles.locationButtonActive : ''}`}
                                        onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Area Dropdown */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('area_filter')}>
                            <label className={styles.filterLabel}>Area / Neighborhood</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.area_filter ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.area_filter ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <select
                                value={selectedArea || ""}
                                onChange={(e) => setSelectedArea(e.target.value || null)}
                                className={styles.selectInput}
                            >
                                <option value="">Select Area</option>
                                {areaOptions.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
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
                                <select
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className={styles.rangeInput}
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

                    {/* BHK Configuration */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('bhk')}>
                            <label className={styles.filterLabel}>Configuration (BHK)</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.bhk ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.bhk ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {bhkOptions.map((bhk) => (
                                    <button
                                        key={bhk}
                                        className={`${styles.pillBtn} ${selectedBhk.includes(bhk) ? styles.pillBtnActive : ''}`}
                                        onClick={() => toggleBhk(bhk)}
                                    >
                                        {bhk}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Possession Date */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('possession')}>
                            <label className={styles.filterLabel}>Possession By</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.possession ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.possession ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <div className={styles.pillGrid}>
                                {possessionYears.map((year) => (
                                    <button
                                        key={year}
                                        className={`${styles.pillBtn} ${selectedPossession === year ? styles.pillBtnActive : ''}`}
                                        onClick={() => setSelectedPossession(selectedPossession === year ? null : year)}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Developer */}
                    <div className={styles.filterSection}>
                        <div className={styles.collapsibleHeader} onClick={() => toggleSection('developer')}>
                            <label className={styles.filterLabel}>Developer</label>
                            <ChevronDown size={16} className={`${styles.collapseIcon} ${openSections.developer ? styles.collapseIconOpen : ''}`} />
                        </div>
                        <div className={`${styles.collapsibleContent} ${openSections.developer ? styles.collapsibleContentOpen : styles.collapsibleContentClosed}`}>
                            <select
                                value={selectedDeveloper || ""}
                                onChange={(e) => setSelectedDeveloper(e.target.value || null)}
                                className={styles.selectInput}
                            >
                                <option value="">All Developers</option>
                                {developers.map(dev => (
                                    <option key={dev} value={dev}>{dev}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sort */}
                    <div className={styles.filterSection}>
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

                <div className={styles.filterFooter}>
                    <button className={styles.resetButton} onClick={handleReset}>
                        Reset Filters
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.searchHeader}>
                    <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                        <div className={styles.searchContainer}>
                            <SearchIcon className={styles.searchIcon} size={20} strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder="Search projects by name, location, developer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </form>
                </div>

                <div className={styles.listingsScrollArea} data-lenis-prevent>
                    {viewMode === 'map' ? (
                        <div className={styles.mapContainer}>
                            <PropertyMap
                                properties={[]}
                                projects={filteredProjects.map(p => ({
                                    id: p.id,
                                    title: p.project_name,
                                    project_name: p.project_name,
                                    images: p.images || [],
                                    location: p.location || '',
                                    latitude: p.latitude,
                                    longitude: p.longitude,
                                    min_price: p.min_price,
                                    max_price: p.max_price,
                                    type: "project" as const,
                                    category: p.category || undefined,
                                }))}
                            />
                        </div>
                    ) : (
                        filteredProjects.length > 0 ? (
                            <div className={styles.grid}>
                                {filteredProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        id={project.id}
                                        project_name={project.project_name}
                                        location={project.location}
                                        min_price={project.min_price}
                                        max_price={project.max_price}
                                        bhk_options={project.bhk_options}
                                        image={project.images?.[0] || '/placeholder-project.jpg'}
                                        status={project.status}
                                        developer_name={project.developer_name}
                                        is_rera_approved={project.is_rera_approved}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <Building2 size={48} className={styles.emptyIcon} strokeWidth={1} />
                                <p className={styles.emptyText}>No projects found</p>
                                <p className={styles.emptySubtext}>Try adjusting your filters or search query</p>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProjectsSearchPage;
