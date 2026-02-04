'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import styles from '../property-wizard.module.css'

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

export default function PropertyBasicStep({ initialData, onNext, onBack }: StepProps) {
    const [formData, setFormData] = useState({
        request_date: initialData.request_date || new Date().toISOString().split('T')[0],
        property_type_for: initialData.property_type_for || 'Sale', // 'For' in screenshot
        property_type: initialData.property_type || '',
        transaction_type: initialData.transaction_type || '', // 'Transaction'
        ownership: initialData.ownership || '',
        bedrooms: initialData.bedrooms || '',
        furnishing: initialData.furnishing || '',
        suitable_for: initialData.suitable_for || '',
        unique_feature: initialData.unique_feature || '',
        channel: initialData.channel || '',
        description: initialData.description || '',
        remarks: initialData.remarks || '' // 'Remark'
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Basic validation
        if (!formData.property_type || !formData.property_type_for) {
            alert('Please fill in required fields (*)')
            return
        }
        onNext(formData)
    }

    // Dropdown Options
    const propertyTypes = ['Apartment', 'House', 'Villa', 'Bungalow', 'Plot', 'Commercial', 'Farmhouse', 'Penthouse', 'Studio', 'Duplex', 'Office', 'Warehouse']
    const furnishingOptions = ['Furnished', 'Semi Furnished', 'Unfurnished', 'Bareshell', 'Warmshell']
    const transactionTypes = ['New Property', 'Resale', 'Pre-Launch']
    const ownershipTypes = ['Freehold', 'Leasehold', 'Power of Attorney', 'Co-operative Society']
    const bedroomOptions = ['1', '2', '3', '4', '5', '6+']

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
                <div className={styles.field}>
                    <label className={styles.label}>Ownership</label>
                    <select name="ownership" value={formData.ownership} onChange={handleChange} className={styles.select}>
                        <option value="">Select Ownership</option>
                        {ownershipTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Bedroom</label>
                    <select name="bedrooms" value={formData.bedrooms} onChange={handleChange} className={styles.select}>
                        <option value="">Select Bedroom</option>
                        {bedroomOptions.map(opt => <option key={opt} value={opt}>{opt} BHK</option>)}
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Furnishing</label>
                    <select name="furnishing" value={formData.furnishing} onChange={handleChange} className={styles.select}>
                        <option value="">Select Furnishing</option>
                        {furnishingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Suitable For</label>
                    <select name="suitable_for" value={formData.suitable_for} onChange={handleChange} className={styles.select}>
                        <option value="">Select</option>
                        <option value="Family">Family</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Company">Company</option>
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
            <div className={styles.field}>
                <label className={styles.label}>Unique Feature</label>
                <input type="text" name="unique_feature" value={formData.unique_feature} onChange={handleChange} className={styles.input} placeholder="e.g. Sea View" />
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
