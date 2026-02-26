'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Plus, X, Search, Check } from 'lucide-react'
import styles from '../../PropertyWizard/property-wizard.module.css'
import { AMENITIES_BY_CATEGORY, AMENITY_CATEGORIES, flattenAmenities } from '@/lib/amenities-data'
import type { AmenityCategory } from '@/lib/amenities-data'

interface ConnectivityItem {
    type: string
    name: string
    distance: string
    icon?: string
}

const CONNECTIVITY_ICONS = [
    { label: 'Map Pin', value: 'MapPin' },
    { label: 'Train', value: 'Train' },
    { label: 'Bus', value: 'Bus' },
    { label: 'Plane', value: 'Plane' },
    { label: 'Hospital', value: 'Building2' },
    { label: 'School', value: 'GraduationCap' },
    { label: 'Shopping', value: 'ShoppingCart' },
    { label: 'Park', value: 'TreePine' },
    { label: 'Office', value: 'Briefcase' },
    { label: 'Metro', value: 'TrainFront' },
]

interface HighlightItem {
    icon: string
    label: string
    value: string
}

interface ResidentialTower {
    name: string
    total_floors: string
    total_units: string
    completion_date: string
    status: string
}

interface VillaCluster {
    cluster_name: string
    total_villas: string
    villa_types: string
    completion_date: string
    status: string
}

interface PlotPhase {
    phase_name: string
    total_plots: string
    launch_date: string
    status: string
    completion_date: string
}

interface ResidentialUnit {
    type: string
    bhk: string
    area: string
    price_rate: string
    basic_price: string
    completion_date: string
}

interface VillaTypeConfig {
    villa_type: string
    bhk: string
    plot_area: string
    built_up_area: string
    floors: string
    price_range: string
    status: string
}

interface PlotConfig {
    plot_type: string
    dimensions: string
    area_sqft: string
    facing: string
    price_per_sqft: string
    total_price: string
    status: string
}

interface CommercialFloor {
    floor_name: string
    total_units: string
    unit_types: string
    completion_date: string
    status: string
}

interface CommercialUnit {
    unit_type: string
    area_range: string
    price_range: string
    rent_per_sqft: string
    status: string
}

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

export default function ProjectStep4Details({ initialData, onNext, onBack }: StepProps) {
    const category = initialData.category || 'Residential'

    const [connectivity, setConnectivity] = useState<ConnectivityItem[]>(initialData.connectivity || [{ type: '', name: '', distance: '', icon: '' }])
    const [highlights, setHighlights] = useState<HighlightItem[]>(initialData.highlights || [{ icon: '', label: '', value: '' }])
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => flattenAmenities(initialData.amenities))
    const [amenitySearch, setAmenitySearch] = useState('')
    const [amenityDropdownOpen, setAmenityDropdownOpen] = useState(false)
    const amenityDropdownRef = useRef<HTMLDivElement>(null)
    // Specifications: structured key-value groups instead of raw JSON
    interface SpecItem { key: string; value: string }
    interface SpecGroup { groupName: string; items: SpecItem[] }

    const parseSpecsFromJson = (jsonStr: string): SpecGroup[] => {
        try {
            const obj = JSON.parse(jsonStr || '{}')
            if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
                return [{ groupName: '', items: [{ key: '', value: '' }] }]
            }
            const groups: SpecGroup[] = []
            for (const [key, val] of Object.entries(obj)) {
                if (typeof val === 'object' && val && !Array.isArray(val)) {
                    // Nested group
                    const items = Object.entries(val as Record<string, string>).map(([k, v]) => ({ key: k, value: String(v) }))
                    groups.push({ groupName: key, items: items.length > 0 ? items : [{ key: '', value: '' }] })
                } else {
                    // Flat key-value — put in a group with empty name
                    const existingFlat = groups.find(g => g.groupName === '')
                    if (existingFlat) {
                        existingFlat.items.push({ key, value: String(val) })
                    } else {
                        groups.push({ groupName: '', items: [{ key, value: String(val) }] })
                    }
                }
            }
            return groups.length > 0 ? groups : [{ groupName: '', items: [{ key: '', value: '' }] }]
        } catch {
            return [{ groupName: '', items: [{ key: '', value: '' }] }]
        }
    }

    const buildSpecsObject = (groups: SpecGroup[]): Record<string, unknown> => {
        const result: Record<string, unknown> = {}
        for (const group of groups) {
            const validItems = group.items.filter(i => i.key.trim() !== '')
            if (validItems.length === 0) continue
            if (group.groupName.trim() === '') {
                // Flat items
                for (const item of validItems) {
                    result[item.key] = item.value
                }
            } else {
                // Grouped items
                const subObj: Record<string, string> = {}
                for (const item of validItems) {
                    subObj[item.key] = item.value
                }
                result[group.groupName] = subObj
            }
        }
        return result
    }

    const [specGroups, setSpecGroups] = useState<SpecGroup[]>(() =>
        parseSpecsFromJson(initialData.specsJson || '{}')
    )

    const [residentialTowers, setResidentialTowers] = useState<ResidentialTower[]>(initialData.residentialTowers || [{ name: '', total_floors: '', total_units: '', completion_date: '', status: '' }])
    const [villaClusters, setVillaClusters] = useState<VillaCluster[]>(initialData.villaClusters || [{ cluster_name: '', total_villas: '', villa_types: '', completion_date: '', status: '' }])
    const [plotPhases, setPlotPhases] = useState<PlotPhase[]>(initialData.plotPhases || [{ phase_name: '', total_plots: '', launch_date: '', status: '', completion_date: '' }])
    const [residentialUnits, setResidentialUnits] = useState<ResidentialUnit[]>(initialData.residentialUnits || [{ type: '', bhk: '', area: '', price_rate: '', basic_price: '', completion_date: '' }])
    const [villaTypes, setVillaTypes] = useState<VillaTypeConfig[]>(initialData.villaTypes || [{ villa_type: '', bhk: '', plot_area: '', built_up_area: '', floors: '', price_range: '', status: '' }])
    const [plotConfigs, setPlotConfigs] = useState<PlotConfig[]>(initialData.plotConfigs || [{ plot_type: '', dimensions: '', area_sqft: '', facing: '', price_per_sqft: '', total_price: '', status: '' }])
    const [commercialFloors, setCommercialFloors] = useState<CommercialFloor[]>(initialData.commercialFloors || [{ floor_name: '', total_units: '', unit_types: '', completion_date: '', status: '' }])
    const [commercialUnits, setCommercialUnits] = useState<CommercialUnit[]>(initialData.commercialUnits || [{ unit_type: '', area_range: '', price_range: '', rent_per_sqft: '', status: '' }])

    // Amenity handlers
    const toggleAmenity = (label: string) => {
        setSelectedAmenities(prev =>
            prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
        )
    }
    const removeSelectedAmenity = (label: string) => {
        setSelectedAmenities(prev => prev.filter(a => a !== label))
    }

    // Close amenity dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (amenityDropdownRef.current && !amenityDropdownRef.current.contains(e.target as Node)) {
                setAmenityDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filteredAmenityCategories = AMENITY_CATEGORIES.map(cat => ({
        category: cat,
        items: AMENITIES_BY_CATEGORY[cat].filter(a =>
            a.label.toLowerCase().includes(amenitySearch.toLowerCase())
        ),
    })).filter(g => g.items.length > 0)

    // Connectivity handlers
    const handleConnectivityChange = (index: number, field: keyof ConnectivityItem, value: string) => {
        setConnectivity(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
    }
    const addConnectivity = () => setConnectivity(prev => [...prev, { type: '', name: '', distance: '', icon: '' }])
    const removeConnectivity = (index: number) => setConnectivity(prev => prev.filter((_, i) => i !== index))

    // Highlight handlers
    const handleHighlightChange = (index: number, field: keyof HighlightItem, value: string) => {
        setHighlights(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
    }
    const addHighlight = () => setHighlights(prev => [...prev, { icon: '', label: '', value: '' }])
    const removeHighlight = (index: number) => setHighlights(prev => prev.filter((_, i) => i !== index))

    // Tower handlers
    const handleResTowerChange = (index: number, field: keyof ResidentialTower, value: string) => {
        setResidentialTowers(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
    }
    const addResTower = () => setResidentialTowers(prev => [...prev, { name: '', total_floors: '', total_units: '', completion_date: '', status: '' }])
    const removeResTower = (index: number) => setResidentialTowers(prev => prev.filter((_, i) => i !== index))

    // Unit handlers
    const handleResUnitChange = (index: number, field: keyof ResidentialUnit, value: string) => {
        setResidentialUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u))
    }
    const addResUnit = () => setResidentialUnits(prev => [...prev, { type: '', bhk: '', area: '', price_rate: '', basic_price: '', completion_date: '' }])
    const removeResUnit = (index: number) => setResidentialUnits(prev => prev.filter((_, i) => i !== index))

    // Villa Cluster handlers
    const handleVillaClusterChange = (index: number, field: keyof VillaCluster, value: string) => {
        setVillaClusters(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
    }
    const addVillaCluster = () => setVillaClusters(prev => [...prev, { cluster_name: '', total_villas: '', villa_types: '', completion_date: '', status: '' }])
    const removeVillaCluster = (index: number) => setVillaClusters(prev => prev.filter((_, i) => i !== index))

    // Villa Type handlers
    const handleVillaTypeChange = (index: number, field: keyof VillaTypeConfig, value: string) => {
        setVillaTypes(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
    }
    const addVillaType = () => setVillaTypes(prev => [...prev, { villa_type: '', bhk: '', plot_area: '', built_up_area: '', floors: '', price_range: '', status: '' }])
    const removeVillaType = (index: number) => setVillaTypes(prev => prev.filter((_, i) => i !== index))

    // Plot Phase handlers
    const handlePlotPhaseChange = (index: number, field: keyof PlotPhase, value: string) => {
        setPlotPhases(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }
    const addPlotPhase = () => setPlotPhases(prev => [...prev, { phase_name: '', total_plots: '', launch_date: '', status: '', completion_date: '' }])
    const removePlotPhase = (index: number) => setPlotPhases(prev => prev.filter((_, i) => i !== index))

    // Plot Config handlers
    const handlePlotConfigChange = (index: number, field: keyof PlotConfig, value: string) => {
        setPlotConfigs(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }
    const addPlotConfig = () => setPlotConfigs(prev => [...prev, { plot_type: '', dimensions: '', area_sqft: '', facing: '', price_per_sqft: '', total_price: '', status: '' }])
    const removePlotConfig = (index: number) => setPlotConfigs(prev => prev.filter((_, i) => i !== index))

    // Commercial Floor handlers
    const handleCommercialFloorChange = (index: number, field: keyof CommercialFloor, value: string) => {
        setCommercialFloors(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
    }
    const addCommercialFloor = () => setCommercialFloors(prev => [...prev, { floor_name: '', total_units: '', unit_types: '', completion_date: '', status: '' }])
    const removeCommercialFloor = (index: number) => setCommercialFloors(prev => prev.filter((_, i) => i !== index))

    // Commercial Unit handlers
    const handleCommercialUnitChange = (index: number, field: keyof CommercialUnit, value: string) => {
        setCommercialUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u))
    }
    const addCommercialUnit = () => setCommercialUnits(prev => [...prev, { unit_type: '', area_range: '', price_range: '', rent_per_sqft: '', status: '' }])
    const removeCommercialUnit = (index: number) => setCommercialUnits(prev => prev.filter((_, i) => i !== index))

    // Spec group handlers
    const handleSpecGroupNameChange = (groupIndex: number, value: string) => {
        setSpecGroups(prev => prev.map((g, i) => i === groupIndex ? { ...g, groupName: value } : g))
    }
    const handleSpecItemChange = (groupIndex: number, itemIndex: number, field: 'key' | 'value', value: string) => {
        setSpecGroups(prev => prev.map((g, gi) =>
            gi === groupIndex
                ? { ...g, items: g.items.map((item, ii) => ii === itemIndex ? { ...item, [field]: value } : item) }
                : g
        ))
    }
    const addSpecGroup = () => setSpecGroups(prev => [...prev, { groupName: '', items: [{ key: '', value: '' }] }])
    const removeSpecGroup = (groupIndex: number) => setSpecGroups(prev => prev.filter((_, i) => i !== groupIndex))
    const addSpecItem = (groupIndex: number) => {
        setSpecGroups(prev => prev.map((g, i) =>
            i === groupIndex ? { ...g, items: [...g.items, { key: '', value: '' }] } : g
        ))
    }
    const removeSpecItem = (groupIndex: number, itemIndex: number) => {
        setSpecGroups(prev => prev.map((g, gi) =>
            gi === groupIndex ? { ...g, items: g.items.filter((_, ii) => ii !== itemIndex) } : g
        ))
    }

    const addBtnStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0',
        borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#334155',
        marginTop: '8px',
    }
    const removeBtnStyle: React.CSSProperties = {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #fecaca',
        background: '#fff5f5', color: '#ef4444', cursor: 'pointer', flexShrink: 0,
    }
    const rowStyle: React.CSSProperties = {
        background: '#f8fafc', padding: '16px', borderRadius: '8px',
        marginBottom: '12px', border: '1px solid #e2e8f0',
    }
    const sectionHeaderStyle: React.CSSProperties = {
        fontSize: '1.1rem', color: '#0f172a', fontWeight: 600, marginBottom: '16px', marginTop: '24px',
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Build specs object from groups and pass as JSON string for Step6Publish
        const specsObj = buildSpecsObject(specGroups)
        onNext({
            connectivity,
            highlights,
            amenities: selectedAmenities,
            specsJson: JSON.stringify(specsObj),
            residentialTowers,
            villaClusters,
            plotPhases,
            residentialUnits,
            villaTypes,
            plotConfigs,
            commercialFloors,
            commercialUnits,
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Project Details</h2>

            {/* Category-specific: Towers / Clusters / Phases */}
            {category === 'Residential' && (
                <>
                    <h3 style={sectionHeaderStyle}>Tower Details</h3>
                    {residentialTowers.map((tower, index) => (
                        <div key={index} style={rowStyle}>
                            <div className={styles.grid3}>
                                <input type="text" value={tower.name} onChange={(e) => handleResTowerChange(index, 'name', e.target.value)} className={styles.input} placeholder="Tower Name" />
                                <input type="text" value={tower.total_floors} onChange={(e) => handleResTowerChange(index, 'total_floors', e.target.value)} className={styles.input} placeholder="Total Floors" />
                                <input type="text" value={tower.total_units} onChange={(e) => handleResTowerChange(index, 'total_units', e.target.value)} className={styles.input} placeholder="Total Units" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={tower.completion_date} onChange={(e) => handleResTowerChange(index, 'completion_date', e.target.value)} className={styles.input} placeholder="Completion Date" />
                                <input type="text" value={tower.status} onChange={(e) => handleResTowerChange(index, 'status', e.target.value)} className={styles.input} placeholder="Status" />
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    {residentialTowers.length > 1 && (
                                        <button type="button" onClick={() => removeResTower(index)} style={removeBtnStyle}><X size={16} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addResTower} style={addBtnStyle}><Plus size={16} /> Add Tower</button>

                    <h3 style={sectionHeaderStyle}>Unit Configurations</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                        Add unit types with pricing and area details. This will be shown as a table on the project page.
                    </p>
                    {/* Table Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr 40px', gap: '8px', padding: '8px 16px', background: '#1e293b', borderRadius: '8px 8px 0 0', color: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>Type</span>
                        <span>BHK</span>
                        <span>Area</span>
                        <span>Price / Rate</span>
                        <span>Basic Price</span>
                        <span>Completion</span>
                        <span></span>
                    </div>
                    {/* Table Rows */}
                    {residentialUnits.map((unit, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr 40px', gap: '8px', padding: '10px 16px', background: index % 2 === 0 ? '#f8fafc' : '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none', alignItems: 'center' }}>
                            <input type="text" value={unit.type} onChange={(e) => handleResUnitChange(index, 'type', e.target.value)} className={styles.input} placeholder="e.g. Apartment" style={{ margin: 0 }} />
                            <input type="text" value={unit.bhk} onChange={(e) => handleResUnitChange(index, 'bhk', e.target.value)} className={styles.input} placeholder="2 BHK" style={{ margin: 0 }} />
                            <input type="text" value={unit.area} onChange={(e) => handleResUnitChange(index, 'area', e.target.value)} className={styles.input} placeholder="1200 sqft" style={{ margin: 0 }} />
                            <input type="text" value={unit.price_rate} onChange={(e) => handleResUnitChange(index, 'price_rate', e.target.value)} className={styles.input} placeholder="₹8,500/sqft" style={{ margin: 0 }} />
                            <input type="text" value={unit.basic_price} onChange={(e) => handleResUnitChange(index, 'basic_price', e.target.value)} className={styles.input} placeholder="₹1.02 Cr" style={{ margin: 0 }} />
                            <input type="text" value={unit.completion_date} onChange={(e) => handleResUnitChange(index, 'completion_date', e.target.value)} className={styles.input} placeholder="Dec 2026" style={{ margin: 0 }} />
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {residentialUnits.length > 1 && (
                                    <button type="button" onClick={() => removeResUnit(index)} style={removeBtnStyle}><X size={14} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addResUnit} style={addBtnStyle}><Plus size={16} /> Add Row</button>
                </>
            )}

            {category === 'Villa' && (
                <>
                    <h3 style={sectionHeaderStyle}>Cluster Details</h3>
                    {villaClusters.map((cluster, index) => (
                        <div key={index} style={rowStyle}>
                            <div className={styles.grid3}>
                                <input type="text" value={cluster.cluster_name} onChange={(e) => handleVillaClusterChange(index, 'cluster_name', e.target.value)} className={styles.input} placeholder="Cluster Name" />
                                <input type="text" value={cluster.total_villas} onChange={(e) => handleVillaClusterChange(index, 'total_villas', e.target.value)} className={styles.input} placeholder="Total Villas" />
                                <input type="text" value={cluster.villa_types} onChange={(e) => handleVillaClusterChange(index, 'villa_types', e.target.value)} className={styles.input} placeholder="Villa Types (comma-sep)" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={cluster.completion_date} onChange={(e) => handleVillaClusterChange(index, 'completion_date', e.target.value)} className={styles.input} placeholder="Completion Date" />
                                <input type="text" value={cluster.status} onChange={(e) => handleVillaClusterChange(index, 'status', e.target.value)} className={styles.input} placeholder="Status" />
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    {villaClusters.length > 1 && (
                                        <button type="button" onClick={() => removeVillaCluster(index)} style={removeBtnStyle}><X size={16} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addVillaCluster} style={addBtnStyle}><Plus size={16} /> Add Cluster</button>

                    <h3 style={sectionHeaderStyle}>Villa Type Configurations</h3>
                    {villaTypes.map((villa, index) => (
                        <div key={index} style={rowStyle}>
                            <div className={styles.grid2}>
                                <input type="text" value={villa.villa_type} onChange={(e) => handleVillaTypeChange(index, 'villa_type', e.target.value)} className={styles.input} placeholder="Villa Type" />
                                <input type="text" value={villa.bhk} onChange={(e) => handleVillaTypeChange(index, 'bhk', e.target.value)} className={styles.input} placeholder="BHK" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={villa.plot_area} onChange={(e) => handleVillaTypeChange(index, 'plot_area', e.target.value)} className={styles.input} placeholder="Plot Area" />
                                <input type="text" value={villa.built_up_area} onChange={(e) => handleVillaTypeChange(index, 'built_up_area', e.target.value)} className={styles.input} placeholder="Built-up Area" />
                                <input type="text" value={villa.floors} onChange={(e) => handleVillaTypeChange(index, 'floors', e.target.value)} className={styles.input} placeholder="Floors" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={villa.price_range} onChange={(e) => handleVillaTypeChange(index, 'price_range', e.target.value)} className={styles.input} placeholder="Price Range" />
                                <input type="text" value={villa.status} onChange={(e) => handleVillaTypeChange(index, 'status', e.target.value)} className={styles.input} placeholder="Status" />
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    {villaTypes.length > 1 && (
                                        <button type="button" onClick={() => removeVillaType(index)} style={removeBtnStyle}><X size={16} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addVillaType} style={addBtnStyle}><Plus size={16} /> Add Villa Type</button>
                </>
            )}

            {category === 'Commercial' && (
                <>
                    <h3 style={sectionHeaderStyle}>Floor / Wing Details</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                        Add floors or wings with unit types (e.g., Floor 1, Ground Floor, Tower A).
                    </p>
                    {commercialFloors.map((floor, index) => (
                        <div key={index} style={rowStyle}>
                            <div className={styles.grid3}>
                                <input type="text" value={floor.floor_name} onChange={(e) => handleCommercialFloorChange(index, 'floor_name', e.target.value)} className={styles.input} placeholder="Floor / Wing Name" />
                                <input type="text" value={floor.total_units} onChange={(e) => handleCommercialFloorChange(index, 'total_units', e.target.value)} className={styles.input} placeholder="Total Units" />
                                <input type="text" value={floor.unit_types} onChange={(e) => handleCommercialFloorChange(index, 'unit_types', e.target.value)} className={styles.input} placeholder="Unit Types (Office, Retail...)" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={floor.completion_date} onChange={(e) => handleCommercialFloorChange(index, 'completion_date', e.target.value)} className={styles.input} placeholder="Completion Date" />
                                <input type="text" value={floor.status} onChange={(e) => handleCommercialFloorChange(index, 'status', e.target.value)} className={styles.input} placeholder="Status" />
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    {commercialFloors.length > 1 && (
                                        <button type="button" onClick={() => removeCommercialFloor(index)} style={removeBtnStyle}><X size={16} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addCommercialFloor} style={addBtnStyle}><Plus size={16} /> Add Floor / Wing</button>

                    <h3 style={sectionHeaderStyle}>Unit Configurations</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                        Add commercial unit types with area, price, and rental details.
                    </p>
                    {/* Table Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.8fr 0.7fr 40px', gap: '8px', padding: '8px 16px', background: '#1e293b', borderRadius: '8px 8px 0 0', color: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>Unit Type</span>
                        <span>Area Range</span>
                        <span>Price Range</span>
                        <span>Rent / Sqft</span>
                        <span>Status</span>
                        <span></span>
                    </div>
                    {commercialUnits.map((unit, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.8fr 0.7fr 40px', gap: '8px', padding: '10px 16px', background: index % 2 === 0 ? '#f8fafc' : '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none', alignItems: 'center' }}>
                            <input type="text" value={unit.unit_type} onChange={(e) => handleCommercialUnitChange(index, 'unit_type', e.target.value)} className={styles.input} placeholder="e.g. Office Space" style={{ margin: 0 }} />
                            <input type="text" value={unit.area_range} onChange={(e) => handleCommercialUnitChange(index, 'area_range', e.target.value)} className={styles.input} placeholder="500–2000 sqft" style={{ margin: 0 }} />
                            <input type="text" value={unit.price_range} onChange={(e) => handleCommercialUnitChange(index, 'price_range', e.target.value)} className={styles.input} placeholder="₹50L–₹2Cr" style={{ margin: 0 }} />
                            <input type="text" value={unit.rent_per_sqft} onChange={(e) => handleCommercialUnitChange(index, 'rent_per_sqft', e.target.value)} className={styles.input} placeholder="₹80/sqft" style={{ margin: 0 }} />
                            <input type="text" value={unit.status} onChange={(e) => handleCommercialUnitChange(index, 'status', e.target.value)} className={styles.input} placeholder="Available" style={{ margin: 0 }} />
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {commercialUnits.length > 1 && (
                                    <button type="button" onClick={() => removeCommercialUnit(index)} style={removeBtnStyle}><X size={14} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addCommercialUnit} style={addBtnStyle}><Plus size={16} /> Add Unit Config</button>
                </>
            )}

            {category === 'Plot' && (
                <>
                    <h3 style={sectionHeaderStyle}>Phase Details</h3>
                    {plotPhases.map((phase, index) => (
                        <div key={index} style={rowStyle}>
                            <div className={styles.grid3}>
                                <input type="text" value={phase.phase_name} onChange={(e) => handlePlotPhaseChange(index, 'phase_name', e.target.value)} className={styles.input} placeholder="Phase Name" />
                                <input type="text" value={phase.total_plots} onChange={(e) => handlePlotPhaseChange(index, 'total_plots', e.target.value)} className={styles.input} placeholder="Total Plots" />
                                <input type="text" value={phase.launch_date} onChange={(e) => handlePlotPhaseChange(index, 'launch_date', e.target.value)} className={styles.input} placeholder="Launch Date" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={phase.completion_date} onChange={(e) => handlePlotPhaseChange(index, 'completion_date', e.target.value)} className={styles.input} placeholder="Completion Date" />
                                <input type="text" value={phase.status} onChange={(e) => handlePlotPhaseChange(index, 'status', e.target.value)} className={styles.input} placeholder="Status" />
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    {plotPhases.length > 1 && (
                                        <button type="button" onClick={() => removePlotPhase(index)} style={removeBtnStyle}><X size={16} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addPlotPhase} style={addBtnStyle}><Plus size={16} /> Add Phase</button>

                    <h3 style={sectionHeaderStyle}>Plot Configurations</h3>
                    {plotConfigs.map((plot, index) => (
                        <div key={index} style={rowStyle}>
                            <div className={styles.grid2}>
                                <input type="text" value={plot.plot_type} onChange={(e) => handlePlotConfigChange(index, 'plot_type', e.target.value)} className={styles.input} placeholder="Plot Type" />
                                <input type="text" value={plot.dimensions} onChange={(e) => handlePlotConfigChange(index, 'dimensions', e.target.value)} className={styles.input} placeholder="Dimensions (30x40)" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={plot.area_sqft} onChange={(e) => handlePlotConfigChange(index, 'area_sqft', e.target.value)} className={styles.input} placeholder="Area (sqft)" />
                                <input type="text" value={plot.facing} onChange={(e) => handlePlotConfigChange(index, 'facing', e.target.value)} className={styles.input} placeholder="Facing" />
                                <input type="text" value={plot.price_per_sqft} onChange={(e) => handlePlotConfigChange(index, 'price_per_sqft', e.target.value)} className={styles.input} placeholder="Price/sqft" />
                            </div>
                            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
                                <input type="text" value={plot.total_price} onChange={(e) => handlePlotConfigChange(index, 'total_price', e.target.value)} className={styles.input} placeholder="Total Price" />
                                <input type="text" value={plot.status} onChange={(e) => handlePlotConfigChange(index, 'status', e.target.value)} className={styles.input} placeholder="Status" />
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    {plotConfigs.length > 1 && (
                                        <button type="button" onClick={() => removePlotConfig(index)} style={removeBtnStyle}><X size={16} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addPlotConfig} style={addBtnStyle}><Plus size={16} /> Add Plot Config</button>
                </>
            )}

            {/* Key Highlights */}
            <h3 style={sectionHeaderStyle}>Key Highlights</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                Shown as highlight cards on the detail page (e.g., Configuration, Area Range, Possession, RERA)
            </p>
            {highlights.map((hl, index) => (
                <div key={index} style={rowStyle}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input type="text" value={hl.label} onChange={(e) => handleHighlightChange(index, 'label', e.target.value)} className={styles.input} placeholder="Label (e.g., Configuration)" />
                        <input type="text" value={hl.value} onChange={(e) => handleHighlightChange(index, 'value', e.target.value)} className={styles.input} placeholder="Value (e.g., 2, 3 BHK)" />
                        <input type="text" value={hl.icon} onChange={(e) => handleHighlightChange(index, 'icon', e.target.value)} className={styles.input} placeholder="Icon (optional)" style={{ maxWidth: '150px' }} />
                        {highlights.length > 1 && (
                            <button type="button" onClick={() => removeHighlight(index)} style={removeBtnStyle}><X size={16} /></button>
                        )}
                    </div>
                </div>
            ))}
            <button type="button" onClick={addHighlight} style={addBtnStyle}><Plus size={16} /> Add Highlight</button>

            {/* Amenities */}
            <h3 style={sectionHeaderStyle}>Amenities</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                Select amenities from the dropdown. You can search to find specific ones.
            </p>

            {/* Selected amenities pills */}
            {selectedAmenities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {selectedAmenities.map(label => (
                        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, color: '#166534' }}>
                            {label}
                            <button type="button" onClick={() => removeSelectedAmenity(label)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#166534' }}>
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Amenity dropdown selector */}
            <div ref={amenityDropdownRef} style={{ position: 'relative', marginBottom: '16px' }}>
                <div
                    onClick={() => setAmenityDropdownOpen(!amenityDropdownOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: '#ffffff' }}
                >
                    <Search size={16} color="#94a3b8" />
                    <input
                        type="text"
                        value={amenitySearch}
                        onChange={(e) => { setAmenitySearch(e.target.value); setAmenityDropdownOpen(true) }}
                        onFocus={() => setAmenityDropdownOpen(true)}
                        placeholder="Search amenities..."
                        style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', background: 'transparent' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{selectedAmenities.length} selected</span>
                </div>

                {amenityDropdownOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: '360px', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 50, padding: '8px' }}>
                        {filteredAmenityCategories.map(({ category, items }) => (
                            <div key={category}>
                                <div style={{ padding: '8px 10px 4px', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{category}</div>
                                {items.map(amenity => {
                                    const isSelected = selectedAmenities.includes(amenity.label)
                                    return (
                                        <button
                                            key={amenity.label}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity.label)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '6px', background: isSelected ? '#f0fdf4' : 'transparent', cursor: 'pointer', fontSize: '0.8125rem', color: isSelected ? '#166534' : '#334155', fontWeight: isSelected ? 600 : 400, transition: 'background 0.15s' }}
                                        >
                                            <span style={{ width: '18px', height: '18px', borderRadius: '4px', border: isSelected ? '2px solid #22c55e' : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isSelected ? '#22c55e' : 'transparent' }}>
                                                {isSelected && <Check size={12} color="#fff" />}
                                            </span>
                                            {amenity.label}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                        {filteredAmenityCategories.length === 0 && (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>No amenities match your search</div>
                        )}
                    </div>
                )}
            </div>

            {/* Connectivity */}
            <h3 style={sectionHeaderStyle}>Connectivity</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                Nearby landmarks, schools, hospitals, transport etc.
            </p>
            {connectivity.map((conn, index) => (
                <div key={index} style={rowStyle}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            value={conn.icon || ''}
                            onChange={(e) => handleConnectivityChange(index, 'icon', e.target.value)}
                            className={styles.input}
                            style={{ flex: '1 1 120px', maxWidth: '140px', padding: '10px', height: 'auto', margin: 0 }}
                        >
                            <option value="">Select Icon</option>
                            {CONNECTIVITY_ICONS.map(i => (
                                <option key={i.value} value={i.value}>{i.label}</option>
                            ))}
                        </select>
                        <input type="text" value={conn.type} onChange={(e) => handleConnectivityChange(index, 'type', e.target.value)} className={styles.input} placeholder="Type (School...)" style={{ flex: '1 1 150px', margin: 0 }} />
                        <input type="text" value={conn.name} onChange={(e) => handleConnectivityChange(index, 'name', e.target.value)} className={styles.input} placeholder="Name" style={{ flex: '1 1 150px', margin: 0 }} />
                        <input type="text" value={conn.distance} onChange={(e) => handleConnectivityChange(index, 'distance', e.target.value)} className={styles.input} placeholder="Dist (2 km)" style={{ flex: '1 1 100px', maxWidth: '120px', margin: 0 }} />
                        {connectivity.length > 1 && (
                            <button type="button" onClick={() => removeConnectivity(index)} style={removeBtnStyle}><X size={16} /></button>
                        )}
                    </div>
                </div>
            ))}
            <button type="button" onClick={addConnectivity} style={addBtnStyle}><Plus size={16} /> Add Connectivity</button>

            {/* Specifications */}
            <h3 style={sectionHeaderStyle}>Specifications</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                {category === 'Plot'
                    ? 'Add infrastructure specs like road width, drainage, etc.'
                    : 'Add specification groups (e.g. Structure, Flooring) with their details.'}
            </p>
            {specGroups.map((group, gi) => (
                <div key={gi} style={{ ...rowStyle, padding: '16px', marginBottom: '16px' }}>
                    {/* Group header */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        {category !== 'Plot' && (
                            <input
                                type="text"
                                value={group.groupName}
                                onChange={(e) => handleSpecGroupNameChange(gi, e.target.value)}
                                className={styles.input}
                                placeholder="Group Name (e.g. Structure, Flooring)"
                                style={{ flex: 1, fontWeight: 600, margin: 0 }}
                            />
                        )}
                        {category === 'Plot' && (
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Infrastructure Specs</span>
                        )}
                        {specGroups.length > 1 && (
                            <button type="button" onClick={() => removeSpecGroup(gi)} style={removeBtnStyle}><X size={16} /></button>
                        )}
                    </div>
                    {/* Items */}
                    {group.items.map((item, ii) => (
                        <div key={ii} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input
                                type="text"
                                value={item.key}
                                onChange={(e) => handleSpecItemChange(gi, ii, 'key', e.target.value)}
                                className={styles.input}
                                placeholder="Label (e.g. Wall, Road Width)"
                                style={{ flex: 1, margin: 0 }}
                            />
                            <input
                                type="text"
                                value={item.value}
                                onChange={(e) => handleSpecItemChange(gi, ii, 'value', e.target.value)}
                                className={styles.input}
                                placeholder="Value (e.g. RCC Frame, 30 ft)"
                                style={{ flex: 1, margin: 0 }}
                            />
                            {group.items.length > 1 && (
                                <button type="button" onClick={() => removeSpecItem(gi, ii)} style={removeBtnStyle}><X size={14} /></button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => addSpecItem(gi)} style={{ ...addBtnStyle, marginTop: '4px' }}>
                        <Plus size={14} /> Add Row
                    </button>
                </div>
            ))}
            {category !== 'Plot' && (
                <button type="button" onClick={addSpecGroup} style={addBtnStyle}>
                    <Plus size={16} /> Add Specification Group
                </button>
            )}

            <div className={styles.actions}>
                <button type="button" onClick={onBack} className={`${styles.btn} ${styles.secondaryBtn}`}>
                    <ArrowLeft size={18} /> Back
                </button>
                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                    Next <ArrowRight size={18} />
                </button>
            </div>
        </form>
    )
}
