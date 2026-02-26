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
const FLOOR_TYPES = ['Apartment', 'Penthouse', 'Studio', 'Duplex', 'Commercial', 'Office', 'Offices']

export default function PropertyBasicStep({ initialData, onNext, onBack }: StepProps) {
    const [formData, setFormData] = useState({
        request_date: initialData.request_date || new Date().toISOString().split('T')[0],
        property_type_for: initialData.property_type_for || 'Sale',
        property_type: initialData.property_type || '',
        transaction_type: initialData.transaction_type || '',
        ownership: initialData.ownership || '',
        bedrooms: initialData.bedrooms || '',
        furnishing: initialData.furnishing || '',
        suitable_for: initialData.suitable_for || '',
        unique_feature: initialData.unique_feature || '',
        channel: initialData.channel || '',
        description: initialData.description || '',
        remarks: initialData.remarks || '',
        // Category-specific extras
        floor_number: initialData.floor_number || '',
        total_floors: initialData.total_floors || '',
        plot_sub_type: initialData.plot_sub_type || '',
        // RERA / OC approvals
        is_rera_approved: initialData.is_rera_approved || false,
        is_oc_approved: initialData.is_oc_approved || false,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.property_type || !formData.property_type_for) {
            alert('Please fill in required fields (*)')
            return
        }
        onNext(formData)
    }

    // Category-derived flags
    const cat = formData.property_type
    const isResidential = RESIDENTIAL_TYPES.includes(cat)
    const isCommercial = COMMERCIAL_TYPES.includes(cat)
    const isPlot = cat === 'Plot'
    const isWarehouse = cat === 'Warehouse'

    const showBedrooms = isResidential && cat !== 'Studio'
    const showFloors = FLOOR_TYPES.includes(cat)
    const showFurnishing = isResidential || isCommercial
    const showSuitableFor = isResidential || isCommercial
    const showOwnership = isResidential || isPlot || isCommercial

    const propertyTypes = ['Apartment', 'House', 'Villa', 'Bungalow', 'Row Villa', 'Plot', 'Commercial', 'Farmhouse', 'Penthouse', 'Studio', 'Duplex', 'Office', 'Warehouse']
    const transactionTypes = ['New Property', 'Resale', 'Pre-Launch']
    const ownershipTypes = ['Freehold', 'Leasehold', 'Power of Attorney', 'Co-operative Society']
    const bedroomOptions = ['1', '2', '3', '4', '5', '6+']
    const plotSubTypes = ['Residential', 'Commercial', 'Agricultural', 'NA / Non-Agricultural', 'Industrial']

    const furnishingOptions = isCommercial
        ? ['Furnished', 'Semi Furnished', 'Bareshell', 'Warmshell']
        : ['Furnished', 'Semi Furnished', 'Unfurnished', 'Bareshell', 'Warmshell']

    const suitableForOptions = isCommercial
        ? ['Company', 'Startup', 'MNC']
        : ['Family', 'Bachelor', 'Company']

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Give us some basic information</h2>

            <div className={styles.field}>
                <label className={styles.label}>Request Date</label>
                <input
                    type="date"
                    name="request_date"
                    value={formData.request_date}
                    onChange={handleChange}
                    className={styles.input}
                />
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>For <span>*</span></label>
                    <select name="property_type_for" value={formData.property_type_for} onChange={handleChange} className={styles.select} required>
                        <option value="Sale">Sale</option>
                        <option value="Rent">Rent</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Property Type <span>*</span></label>
                    <select name="property_type" value={formData.property_type} onChange={handleChange} className={styles.select} required>
                        <option value="">Select Property Type</option>
                        {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Transaction</label>
                    <select name="transaction_type" value={formData.transaction_type} onChange={handleChange} className={styles.select}>
                        <option value="">Select Transaction</option>
                        {transactionTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                {showOwnership && (
                    <div className={styles.field}>
                        <label className={styles.label}>Ownership</label>
                        <select name="ownership" value={formData.ownership} onChange={handleChange} className={styles.select}>
                            <option value="">Select Ownership</option>
                            {ownershipTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Bedrooms + Furnishing (residential only) */}
            {showBedrooms && (
                <div className={styles.grid2}>
                    <div className={styles.field}>
                        <label className={styles.label}>Bedrooms</label>
                        <select name="bedrooms" value={formData.bedrooms} onChange={handleChange} className={styles.select}>
                            <option value="">Select Bedrooms</option>
                            {bedroomOptions.map(opt => <option key={opt} value={opt}>{opt} BHK</option>)}
                        </select>
                    </div>
                    {showFurnishing && (
                        <div className={styles.field}>
                            <label className={styles.label}>Furnishing</label>
                            <select name="furnishing" value={formData.furnishing} onChange={handleChange} className={styles.select}>
                                <option value="">Select Furnishing</option>
                                {furnishingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Furnishing only — Studio or Commercial (no bedrooms) */}
            {!showBedrooms && showFurnishing && (
                <div className={styles.field}>
                    <label className={styles.label}>Furnishing</label>
                    <select name="furnishing" value={formData.furnishing} onChange={handleChange} className={styles.select}>
                        <option value="">Select Furnishing</option>
                        {furnishingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            )}

            {/* Floor No. + Total Floors — Apartment, Penthouse, Studio, Duplex, Commercial, Office */}
            {showFloors && (
                <div className={styles.grid2}>
                    <div className={styles.field}>
                        <label className={styles.label}>Floor Number</label>
                        <input type="number" name="floor_number" value={formData.floor_number} onChange={handleChange} className={styles.input} placeholder="e.g. 5" min="0" />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Total Floors in Building</label>
                        <input type="number" name="total_floors" value={formData.total_floors} onChange={handleChange} className={styles.input} placeholder="e.g. 20" min="1" />
                    </div>
                </div>
            )}

            {/* Plot Type — Plot only */}
            {isPlot && (
                <div className={styles.field}>
                    <label className={styles.label}>Plot Type</label>
                    <select name="plot_sub_type" value={formData.plot_sub_type} onChange={handleChange} className={styles.select}>
                        <option value="">Select Plot Type</option>
                        {plotSubTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            )}

            {/* Suitable For + Channel */}
            {showSuitableFor ? (
                <div className={styles.grid2}>
                    <div className={styles.field}>
                        <label className={styles.label}>Suitable For</label>
                        <select name="suitable_for" value={formData.suitable_for} onChange={handleChange} className={styles.select}>
                            <option value="">Select</option>
                            {suitableForOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Channel</label>
                        <select name="channel" value={formData.channel} onChange={handleChange} className={styles.select}>
                            <option value="">Select Channel</option>
                            <option value="Direct">Direct</option>
                            <option value="Broker">Broker</option>
                        </select>
                    </div>
                </div>
            ) : (
                <div className={styles.field}>
                    <label className={styles.label}>Channel</label>
                    <select name="channel" value={formData.channel} onChange={handleChange} className={styles.select}>
                        <option value="">Select Channel</option>
                        <option value="Direct">Direct</option>
                        <option value="Broker">Broker</option>
                    </select>
                </div>
            )}

            <div className={styles.field}>
                <label className={styles.label}>Unique Feature</label>
                <input type="text" name="unique_feature" value={formData.unique_feature} onChange={handleChange} className={styles.input} placeholder="e.g. Sea View, Corner Plot" />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={4}
                    maxLength={2000}
                    placeholder="Enter description (Max 2000 chars)"
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
                    {formData.description.length}/2000
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Remark</label>
                <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className={styles.input} />
            </div>

            {/* RERA / OC — shown only for commercial property types */}
            {isCommercial && (
                <div className={styles.grid2} style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" name="is_rera_approved" checked={formData.is_rera_approved} onChange={handleChange} />
                        <label>RERA Approved</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" name="is_oc_approved" checked={formData.is_oc_approved} onChange={handleChange} />
                        <label>OC Certificate</label>
                    </div>
                </div>
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
