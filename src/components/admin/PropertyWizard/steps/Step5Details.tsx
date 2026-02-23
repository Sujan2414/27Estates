'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Search, X, Check, Plus } from 'lucide-react'
import styles from '../property-wizard.module.css'
import { AMENITIES_BY_CATEGORY, AMENITY_CATEGORIES, flattenAmenities } from '@/lib/amenities-data'

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

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

export default function PropertyDetailsStep({ initialData, onNext, onBack }: StepProps) {
    const defaultCommercial = {
        age_of_property: 'New Construction',
        possession_status: 'Ready To Move',
        possession_date: '',
        workstation: '',
        cabin: '',
        conference_room: '',
        reception_area: '',
        power_kva: '',
        power_backup: '',
        video_url: '',
        keyword: ''
    }

    const defaultWarehouse = {
        pollution_zone: 'Green',
        racking_capacity_tonnes: '',
        floor_strength: '',
        stp_etp_capacity: '',
        loading_bays: '',
        canopy_length: '',
        canopy_width: '',
        fire_noc: false,
        approval_plan: false,
        dock_levellers: false
    }

    const [formData, setFormData] = useState({
        ...defaultCommercial,
        ...defaultWarehouse,
        ...initialData
    })

    const [connectivity, setConnectivity] = useState<ConnectivityItem[]>(initialData.connectivity || [])

    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => flattenAmenities(initialData.amenities))
    const [amenitySearch, setAmenitySearch] = useState('')
    const [amenityDropdownOpen, setAmenityDropdownOpen] = useState(false)
    const amenityDropdownRef = useRef<HTMLDivElement>(null)

    const toggleAmenity = (label: string) => {
        setSelectedAmenities(prev =>
            prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
        )
    }
    const removeSelectedAmenity = (label: string) => {
        setSelectedAmenities(prev => prev.filter(a => a !== label))
    }

    // Connectivity handlers
    const handleConnectivityChange = (index: number, field: keyof ConnectivityItem, value: string) => {
        setConnectivity(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
    }
    const addConnectivity = () => setConnectivity(prev => [...prev, { type: '', name: '', distance: '', icon: '' }])
    const removeConnectivity = (index: number) => setConnectivity(prev => prev.filter((_, i) => i !== index))

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData((prev: any) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext({ ...formData, amenities: selectedAmenities, connectivity })
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Other Details</h2>

            {/* General Details */}
            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Age of Property</label>
                    <select name="age_of_property" value={formData.age_of_property} onChange={handleChange} className={styles.select}>
                        <option value="New Construction">New Construction</option>
                        <option value="Less than 5 years">Less than 5 years</option>
                        <option value="5 to 10 years">5 to 10 years</option>
                        <option value="More than 10 years">More than 10 years</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Availability/Possession</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select name="possession_status" value={formData.possession_status} onChange={handleChange} className={styles.select} style={{ flex: 1 }}>
                            <option value="Ready To Move">Ready To Move</option>
                            <option value="Under Construction">Under Construction</option>
                        </select>
                        {formData.possession_status === 'Under Construction' && (
                            <input type="date" name="possession_date" value={formData.possession_date} onChange={handleChange} className={styles.input} style={{ flex: 1 }} />
                        )}
                    </div>
                </div>
            </div>

            {/* Commercial Features */}
            <h3 className={styles.stepTitle} style={{ fontSize: '1.1rem', textAlign: 'left', marginTop: '1rem' }}>Commercial Features</h3>
            <div className={styles.grid2}>
                <div className={styles.field} style={{ flexDirection: 'row', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Workstation</label>
                        <input type="number" name="workstation" value={formData.workstation} onChange={handleChange} className={styles.input} placeholder="No." />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Cabins</label>
                        <input type="number" name="cabin" value={formData.cabin} onChange={handleChange} className={styles.input} placeholder="No." />
                    </div>
                </div>
                <div className={styles.field} style={{ flexDirection: 'row', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Conference Room</label>
                        <input type="number" name="conference_room" value={formData.conference_room} onChange={handleChange} className={styles.input} placeholder="No." />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Reception</label>
                        <input type="number" name="reception_area" value={formData.reception_area} onChange={handleChange} className={styles.input} placeholder="Area" />
                    </div>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Power (KVA)</label>
                    <input type="number" name="power_kva" value={formData.power_kva} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>DB Backup</label>
                    <input type="text" name="power_backup" value={formData.power_backup} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            {/* Media URL */}
            <div className={styles.field}>
                <label className={styles.label}>Video URL (YouTube/Vimeo)</label>
                <input type="text" name="video_url" value={formData.video_url} onChange={handleChange} className={styles.input} placeholder="https://..." />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Website Keyword</label>
                <input type="text" name="keyword" value={formData.keyword} onChange={handleChange} className={styles.input} />
            </div>

            {/* Warehouse Features */}
            <h3 className={styles.stepTitle} style={{ fontSize: '1.1rem', textAlign: 'left', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>Warehouse Features</h3>
            <div className={styles.field}>
                <label className={styles.label}>Pollution Zone</label>
                <select name="pollution_zone" value={formData.pollution_zone} onChange={handleChange} className={styles.select}>
                    <option value="Green">Green</option>
                    <option value="Orange">Orange</option>
                    <option value="Red">Red</option>
                </select>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Racking Capacity (Tonnes)</label>
                    <input type="number" name="racking_capacity_tonnes" value={formData.racking_capacity_tonnes} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Floor Strength (Ton/m³)</label>
                    <input type="number" name="floor_strength" value={formData.floor_strength} onChange={handleChange} className={styles.input} />
                </div>
            </div>
            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>STP/ETP Capacity (Liters)</label>
                    <input type="number" name="stp_etp_capacity" value={formData.stp_etp_capacity} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>No. of Loading Bays</label>
                    <input type="number" name="loading_bays" value={formData.loading_bays} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Canopy Details (Length - Width)</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input type="number" name="canopy_length" value={formData.canopy_length} onChange={handleChange} className={styles.input} placeholder="Len" />
                    <span style={{ alignSelf: 'center' }}>-</span>
                    <input type="number" name="canopy_width" value={formData.canopy_width} onChange={handleChange} className={styles.input} placeholder="Wid" />
                </div>
            </div>

            <div className={styles.grid3} style={{ marginTop: '1rem' }}>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <input type="checkbox" name="fire_noc" checked={formData.fire_noc} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                    <label style={{ marginBottom: 0 }}>Fire NOC</label>
                </div>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <input type="checkbox" name="approval_plan" checked={formData.approval_plan} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                    <label style={{ marginBottom: 0 }}>Approval Plan</label>
                </div>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <input type="checkbox" name="dock_levellers" checked={formData.dock_levellers} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                    <label style={{ marginBottom: 0 }}>Dock Levellers</label>
                </div>
            </div>

            {/* Amenities */}
            <h3 className={styles.stepTitle} style={{ fontSize: '1.1rem', textAlign: 'left', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>Amenities</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                Select amenities available in this property.
            </p>

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
            <h3 className={styles.stepTitle} style={{ fontSize: '1.1rem', textAlign: 'left', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>Connectivity</h3>
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
                        <button type="button" onClick={() => removeConnectivity(index)} style={removeBtnStyle}><X size={16} /></button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addConnectivity} style={addBtnStyle}><Plus size={16} /> Add Connectivity</button>

            <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondaryBtn}`} onClick={onBack}>
                    <ArrowLeft size={16} /> BACK
                </button>
                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                    CONTINUE <ArrowRight size={16} />
                </button>
            </div>
        </form>
    )
}
