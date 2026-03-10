'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import styles from '../property-wizard.module.css'

interface FloorDetail {
    floor: number
    bathrooms: string
    sqft: string
}

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

const RESIDENTIAL_TYPES = ['Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Penthouse', 'Studio', 'Duplex', 'Farmhouse']
const COMMERCIAL_TYPES = ['Commercial', 'Office', 'Offices']
// Residential types that also have a plot/land component
const HAS_PLOT = ['House', 'Villa', 'Bungalow', 'Row Villa', 'Farmhouse']

export default function PropertyAreaStep({ initialData, onNext, onBack }: StepProps) {
    const category = initialData.property_type || ''
    const isResidential = RESIDENTIAL_TYPES.includes(category)
    const isCommercial = COMMERCIAL_TYPES.includes(category)
    const isPlot = category === 'Plot'
    const isWarehouse = category === 'Warehouse'
    const isRent = initialData.property_type_for === 'Rent'

    const [formData, setFormData] = useState({
        sqft: initialData.sqft || '',
        built_up_area: initialData.built_up_area || '',
        carpet_area: initialData.carpet_area || '',
        terrace_area: initialData.terrace_area || '',
        plot_size: initialData.plot_size || '',
        bathrooms: initialData.bathrooms || '',
        floors: initialData.floors || '',
        parking_count: initialData.parking_count || '',
        price: initialData.price || '',
        is_negotiable: initialData.is_negotiable || false,
        maintenance_charges: initialData.maintenance_charges || '',
        maintenance_paid_by_licensor: initialData.maintenance_paid_by_licensor || false,
        deposit_amount: initialData.deposit_amount || '',
        deposit_negotiable: initialData.deposit_negotiable || false,
        deposit_refundable: initialData.deposit_refundable || false,
    })

    const isCommercialOrWarehouse = isCommercial || isWarehouse
    const showFloorTable = isCommercialOrWarehouse || isResidential

    // Floor-wise breakdown state (all non-plot categories)
    const [floorDetails, setFloorDetails] = useState<FloorDetail[]>(
        initialData.floor_details || []
    )

    // Sync rows when floors count changes
    useEffect(() => {
        if (!showFloorTable) return
        const count = parseInt(formData.floors) || 0
        setFloorDetails(prev => {
            if (count === 0) return []
            return Array.from({ length: count }, (_, i) => ({
                floor: i + 1,
                bathrooms: prev[i]?.bathrooms ?? '',
                sqft: prev[i]?.sqft ?? '',
            }))
        })
    }, [formData.floors, isCommercialOrWarehouse])

    const handleFloorDetailChange = (index: number, field: 'bathrooms' | 'sqft', value: string) => {
        setFloorDetails(prev => prev.map((fd, i) => i === index ? { ...fd, [field]: value } : fd))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const primaryArea = isPlot ? formData.plot_size : formData.sqft
        if (!primaryArea || !formData.price) {
            alert('Please fill in required fields (*)')
            return
        }
        const floorDetailsData = floorDetails.length > 0 ? floorDetails.map(fd => ({
            floor: fd.floor,
            bathrooms: fd.bathrooms ? parseInt(fd.bathrooms) : null,
            sqft: fd.sqft ? parseInt(fd.sqft) : null,
        })) : null
        onNext({ ...formData, floor_details: floorDetailsData })
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Area & Pricing</h2>

            {/* ── PLOT ─────────────────────────────────────────── */}
            {isPlot && (
                <>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Plot Area (Sq.Ft) <span>*</span></label>
                            <input type="number" name="plot_size" value={formData.plot_size} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Built-Up Area (if any)</label>
                            <input type="number" name="built_up_area" value={formData.built_up_area} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                </>
            )}

            {/* ── WAREHOUSE ────────────────────────────────────── */}
            {isWarehouse && (
                <>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Built-Up Area (Sq.Ft) <span>*</span></label>
                            <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Plot / Land Area (Sq.Ft)</label>
                            <input type="number" name="plot_size" value={formData.plot_size} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Bathrooms</label>
                            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className={styles.input} min="0" />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Floors</label>
                            <input type="number" name="floors" value={formData.floors} onChange={handleChange} className={styles.input} min="0" />
                        </div>
                    </div>
                    {floorDetails.length > 0 && <FloorTable rows={floorDetails} onChange={handleFloorDetailChange} />}
                </>
            )}

            {/* ── COMMERCIAL / OFFICE ──────────────────────────── */}
            {isCommercial && (
                <>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Carpet Area (Sq.Ft) <span>*</span></label>
                            <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Built-Up Area</label>
                            <input type="number" name="built_up_area" value={formData.built_up_area} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Bathrooms</label>
                            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className={styles.input} min="0" />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Floors</label>
                            <input type="number" name="floors" value={formData.floors} onChange={handleChange} className={styles.input} min="0" />
                        </div>
                    </div>
                    {floorDetails.length > 0 && <FloorTable rows={floorDetails} onChange={handleFloorDetailChange} />}
                </>
            )}

            {/* ── RESIDENTIAL (Apartment, House, Villa…) ───────── */}
            {isResidential && (
                <>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Area (Sq.Ft) <span>*</span></label>
                            <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Built-Up Area</label>
                            <input type="number" name="built_up_area" value={formData.built_up_area} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Carpet Area</label>
                            <input type="number" name="carpet_area" value={formData.carpet_area} onChange={handleChange} className={styles.input} />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Terrace Area</label>
                            <input type="number" name="terrace_area" value={formData.terrace_area} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                    {/* Plot area for residential types that include land */}
                    {HAS_PLOT.includes(category) && (
                        <div className={styles.field}>
                            <label className={styles.label}>Plot Area</label>
                            <input type="number" name="plot_size" value={formData.plot_size} onChange={handleChange} className={styles.input} />
                        </div>
                    )}
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Total Floors</label>
                            <input type="number" name="floors" value={formData.floors} onChange={handleChange} className={styles.input} min="0" />
                        </div>
                    </div>
                    {floorDetails.length > 0 && <FloorTable rows={floorDetails} onChange={handleFloorDetailChange} />}
                </>
            )}

            {/* Fallback — unknown / not yet selected category */}
            {!isPlot && !isWarehouse && !isCommercial && !isResidential && (
                <div className={styles.grid2}>
                    <div className={styles.field}>
                        <label className={styles.label}>Area (Sq.Ft) <span>*</span></label>
                        <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className={styles.input} required />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Plot Area</label>
                        <input type="number" name="plot_size" value={formData.plot_size} onChange={handleChange} className={styles.input} />
                    </div>
                </div>
            )}

            {/* Parking — shown for all except Plot */}
            {!isPlot && (
                <div className={styles.grid2} style={{ marginTop: '1rem' }}>
                    <div className={styles.field}>
                        <label className={styles.label}>Parking Spaces</label>
                        <input type="number" name="parking_count" value={formData.parking_count} onChange={handleChange} className={styles.input} min="0" />
                    </div>
                </div>
            )}

            <hr style={{ margin: '2rem 0', borderColor: '#eee' }} />
            <h3 className={styles.stepTitle} style={{ fontSize: '1.2rem', textAlign: 'left' }}>Pricing Details</h3>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>
                        {isRent ? 'Monthly Rent (₹)' : 'Expected Price (₹)'} <span>*</span>
                    </label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className={styles.input} required />
                </div>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', marginTop: '30px' }}>
                    <input type="checkbox" name="is_negotiable" checked={formData.is_negotiable} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                    <label style={{ marginBottom: 0 }}>Negotiable</label>
                </div>
            </div>

            {isRent && (
                <>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Maintenance Charges (₹)</label>
                            <input type="number" name="maintenance_charges" value={formData.maintenance_charges} onChange={handleChange} className={styles.input} />
                        </div>
                        <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', marginTop: '30px' }}>
                            <input type="checkbox" name="maintenance_paid_by_licensor" checked={formData.maintenance_paid_by_licensor} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                            <label style={{ marginBottom: 0 }}>Paid By Licensor</label>
                        </div>
                    </div>

                    <div className={styles.grid3}>
                        <div className={styles.field}>
                            <label className={styles.label}>Security Deposit (₹)</label>
                            <input type="number" name="deposit_amount" value={formData.deposit_amount} onChange={handleChange} className={styles.input} />
                        </div>
                        <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', marginTop: '30px' }}>
                            <input type="checkbox" name="deposit_negotiable" checked={formData.deposit_negotiable} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                            <label style={{ marginBottom: 0, fontSize: '0.8rem' }}>Negotiable</label>
                        </div>
                        <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', marginTop: '30px' }}>
                            <input type="checkbox" name="deposit_refundable" checked={formData.deposit_refundable} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                            <label style={{ marginBottom: 0, fontSize: '0.8rem' }}>Refundable</label>
                        </div>
                    </div>
                </>
            )}

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

function FloorTable({ rows, onChange }: { rows: FloorDetail[]; onChange: (i: number, field: 'bathrooms' | 'sqft', val: string) => void }) {
    return (
        <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Floor-wise Breakdown</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600, color: '#64748b', width: '80px' }}>Floor</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600, color: '#64748b' }}>Bathrooms</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600, color: '#64748b' }}>Sqft / Built-up Area</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((fd, i) => (
                        <tr key={fd.floor}>
                            <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: 500, color: '#374151', background: '#f8fafc' }}>Floor {fd.floor}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={fd.bathrooms} onChange={e => onChange(i, 'bathrooms', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8125rem' }} min="0" placeholder="0" />
                            </td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={fd.sqft} onChange={e => onChange(i, 'sqft', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8125rem' }} min="0" placeholder="0" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
