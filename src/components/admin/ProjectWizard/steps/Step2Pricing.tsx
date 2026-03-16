'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import styles from '../../PropertyWizard/property-wizard.module.css'

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

export default function ProjectStep2Pricing({ initialData, onNext, onBack }: StepProps) {
    const category = initialData.category || 'Residential'

    const [formData, setFormData] = useState({
        min_price: initialData.min_price || '',
        max_price: initialData.max_price || '',
        price_per_sqft: initialData.price_per_sqft || '',
        min_price_numeric: initialData.min_price_numeric || '',
        max_price_numeric: initialData.max_price_numeric || '',
        min_area: initialData.min_area || '',
        max_area: initialData.max_area || '',
        property_type: initialData.property_type || '',
        transaction_type: initialData.transaction_type || '',
        launch_date: initialData.launch_date || '',
        possession_status: initialData.possession_status || 'Immediately/Ready to Move',
        possession_date: initialData.possession_date || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext(formData)
    }

    const areaLabel = category === 'Plot' ? 'Plot Area' : category === 'Villa' ? 'Plot Area' : 'Carpet Area'
    const categoryHint = category === 'Residential' ? '🏢 Residential Project' : category === 'Villa' ? '🏡 Villa Project' : '📐 Plot Project'

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Pricing, Area & Dates</h2>

            <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem', color: '#166534' }}>
                {categoryHint} — showing relevant pricing fields
            </div>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>Min Price (Display)</label>
                    <input type="text" name="min_price" value={formData.min_price} onChange={handleChange} className={styles.input} placeholder="₹45 L" />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {['Price on Request', 'Price TBD', 'Request for Details'].map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, min_price: opt }))}
                                style={{
                                    padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer',
                                    border: formData.min_price === opt ? '1px solid #183C38' : '1px solid #e2e8f0',
                                    background: formData.min_price === opt ? '#f0fdf4' : '#f8fafc',
                                    color: formData.min_price === opt ? '#183C38' : '#64748b', fontWeight: 500,
                                }}
                            >{opt}</button>
                        ))}
                    </div>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Max Price (Display)</label>
                    <input type="text" name="max_price" value={formData.max_price} onChange={handleChange} className={styles.input} placeholder="₹1.2 Cr" />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Price per Sqft</label>
                    <input type="number" name="price_per_sqft" value={formData.price_per_sqft} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Min Price (Numeric)</label>
                    <input type="number" name="min_price_numeric" value={formData.min_price_numeric} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Max Price (Numeric)</label>
                    <input type="number" name="max_price_numeric" value={formData.max_price_numeric} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>Min {areaLabel} (sq.ft)</label>
                    <input type="number" name="min_area" value={formData.min_area} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Max {areaLabel} (sq.ft)</label>
                    <input type="number" name="max_area" value={formData.max_area} onChange={handleChange} className={styles.input} />
                </div>
                {category !== 'Plot' && (
                    <div className={styles.field}>
                        <label className={styles.label}>Property Type</label>
                        <input type="text" name="property_type" value={formData.property_type} onChange={handleChange} className={styles.input} />
                    </div>
                )}
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Launch Date</label>
                    <input type="text" name="launch_date" value={formData.launch_date} onChange={handleChange} className={styles.input} placeholder="March 2024" />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Availability/Possession</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select name="possession_status" value={formData.possession_status} onChange={handleChange} className={styles.input} style={{ flex: 1 }}>
                            <option value="Immediately/Ready to Move">Immediately/Ready to Move</option>
                            <option value="Specify Time">Specify Time</option>
                        </select>
                        {formData.possession_status === 'Specify Time' && (
                            <input
                                type="text"
                                name="possession_date"
                                value={formData.possession_date}
                                onChange={handleChange}
                                className={styles.input}
                                style={{ flex: 1 }}
                                placeholder={category === 'Plot' ? '12-18 months' : 'December 2026'}
                            />
                        )}
                    </div>
                </div>
            </div>

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
