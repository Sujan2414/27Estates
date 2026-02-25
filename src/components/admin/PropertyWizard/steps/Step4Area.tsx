'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import styles from '../property-wizard.module.css'

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
        price: initialData.price || '',
        is_negotiable: initialData.is_negotiable || false,
        maintenance_charges: initialData.maintenance_charges || '',
        maintenance_paid_by_licensor: initialData.maintenance_paid_by_licensor || false,
        deposit_amount: initialData.deposit_amount || '',
        deposit_negotiable: initialData.deposit_negotiable || false,
        deposit_refundable: initialData.deposit_refundable || false,
    })

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
        onNext(formData)
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
                            <label className={styles.label}>Built-Up Area (Sq.Ft) <span>*</span></label>
                            <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Plot / Land Area (Sq.Ft)</label>
                            <input type="number" name="plot_size" value={formData.plot_size} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                </>
            )}

            {/* ── COMMERCIAL / OFFICE ──────────────────────────── */}
            {isCommercial && (
                <>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Carpet Area (Sq.Ft) <span>*</span></label>
                            <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Built-Up Area</label>
                            <input type="number" name="built_up_area" value={formData.built_up_area} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
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
