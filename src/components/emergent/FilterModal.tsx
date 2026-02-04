"use client";

// ... imports
import { useState } from "react";
import { X, Building2, Home, Building, Map as MapIcon, Warehouse, Hotel, MapPin, IndianRupee } from "lucide-react";
import styles from "./FilterModal.module.css";

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: FilterState) => void;
    initialFilters?: FilterState;
}

export interface FilterState {
    featured: boolean;
    category: string | null;
    city: string | null;
    area: string | null;
    minPrice: string | null;
    maxPrice: string | null;
}

const categories = [
    { id: "Apartment", label: "Apartment", icon: Building2 },
    { id: "House", label: "House", icon: Home },
    { id: "Villa", label: "Villa", icon: Home },
    { id: "Bungalow", label: "Bungalow", icon: Home },
    { id: "Row Villa", label: "Row Villa", icon: Home },
    { id: "Plot", label: "Plot", icon: MapIcon },
    { id: "Commercial", label: "Commercial", icon: Building },
    { id: "Offices", label: "Office", icon: Building },
    { id: "Farmhouse", label: "Farmhouse", icon: Warehouse },
    { id: "Penthouse", label: "Penthouse", icon: Building2 },
    { id: "Studio", label: "Studio", icon: Home },
    { id: "Duplex", label: "Duplex", icon: Home },
];

const locations = ["Bangalore North", "Bangalore East", "Bangalore South", "Bangalore West", "Bangalore Central"];

const areas = [
    "Whitefield", "Indiranagar", "Koramangala", "HSR Layout",
    "Jayanagar", "JP Nagar", "Hebbal", "Yelahanka",
    "Sarjapur Road", "Bannerghatta Road", "Electronic City",
    "Marathahalli", "Bellandur", "Thanisandra", "Devanahalli",
    "Kanakapura Road", "Hennur Road", "Varthur"
];

const priceOptions = [
    { value: "", label: "Any" },
    { value: "2500000", label: "25 L" },
    { value: "5000000", label: "50 L" },
    { value: "7500000", label: "75 L" },
    { value: "10000000", label: "1 Cr" },
    { value: "20000000", label: "2 Cr" },
    { value: "30000000", label: "3 Cr" },
    { value: "50000000", label: "5 Cr" },
    { value: "100000000", label: "10 Cr" },
    { value: "150000000", label: "15 Cr" },
    { value: "200000000", label: "20 Cr" },
    { value: "500000000", label: "50 Cr" },
];

const FilterModal = ({ isOpen, onClose, onApplyFilters, initialFilters }: FilterModalProps) => {
    const [featured, setFeatured] = useState(initialFilters?.featured || false);
    const [category, setCategory] = useState<string | null>(initialFilters?.category || null);
    const [city, setCity] = useState<string | null>(initialFilters?.city || null);
    const [area, setArea] = useState<string | null>(initialFilters?.area || null);
    const [minPrice, setMinPrice] = useState<string | null>(initialFilters?.minPrice || null);
    const [maxPrice, setMaxPrice] = useState<string | null>(initialFilters?.maxPrice || null);

    const handleReset = () => {
        setFeatured(false);
        setCategory(null);
        setCity(null);
        setArea(null);
        setMinPrice(null);
        setMaxPrice(null);
        onApplyFilters({ featured: false, category: null, city: null, area: null, minPrice: null, maxPrice: null });
        onClose();
    };

    const handleApply = () => {
        onApplyFilters({ featured, category, city, area, minPrice, maxPrice });
        onClose();
    };

    const handleCategoryClick = (categoryId: string) => {
        setCategory(category === categoryId ? null : categoryId);
    };

    const handleCityClick = (cityId: string) => {
        setCity(city === cityId ? null : cityId);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </button>
                    <h2 className={styles.title}>Filters</h2>
                </div>

                {/* Content Container with Scroll */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

                    {/* Featured Property Toggle */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Featured Property</h3>
                        <button
                            className={`${styles.toggle} ${featured ? styles.toggleActive : ''}`}
                            onClick={() => setFeatured(!featured)}
                        >
                            <span className={styles.toggleHandle} />
                        </button>
                    </div>

                    {/* Location (City) */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>LOCATION</h3>
                        <div className={styles.categoryGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                            {locations.map((loc) => (
                                <button
                                    key={loc}
                                    className={`${styles.categoryButton} ${city === loc ? styles.categoryButtonActive : ''}`}
                                    onClick={() => handleCityClick(loc)}
                                    style={{ padding: '0.75rem', fontSize: '0.9rem' }}
                                >
                                    <MapPin size={18} strokeWidth={1.5} />
                                    <span>{loc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Area Dropdown */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>AREA</h3>
                        <select
                            value={area || ""}
                            onChange={(e) => setArea(e.target.value || null)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                fontSize: '1rem',
                                color: '#1f2937',
                                backgroundColor: '#fff',
                                outline: 'none'
                            }}
                        >
                            <option value="">Select Area</option>
                            {areas.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Budget (Min/Max) */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>BUDGET</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>Min Price</label>
                                <select
                                    value={minPrice || ""}
                                    onChange={(e) => setMinPrice(e.target.value || null)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                >
                                    {priceOptions.map(opt => (
                                        <option key={`min-${opt.value}`} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>Max Price</label>
                                <select
                                    value={maxPrice || ""}
                                    onChange={(e) => setMaxPrice(e.target.value || null)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                >
                                    {priceOptions.map(opt => (
                                        <option key={`max-${opt.value}`} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Property Category */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>PROPERTY CATEGORY</h3>
                        <div className={styles.categoryGrid}>
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        className={`${styles.categoryButton} ${isSelected ? styles.categoryButtonActive : ''}`}
                                        onClick={() => handleCategoryClick(cat.id)}
                                    >
                                        <Icon size={24} strokeWidth={1.5} />
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ padding: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '1rem' }}>
                    <button className={styles.resetButton} onClick={handleReset} style={{ flex: 1 }}>
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        style={{
                            flex: 1,
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Show Results
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
