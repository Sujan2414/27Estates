'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, MapPin } from 'lucide-react'
import styles from '../property-wizard.module.css'

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

export default function PropertyLocationStep({ initialData, onNext, onBack }: StepProps) {
    const [formData, setFormData] = useState({
        address: initialData.address || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        flat_no: initialData.flat_no || '', // 'Flat/Office/Unit No.'
        building_name: initialData.building_name || '', // 'Building/Premises'
        city: initialData.city || '',
        location: initialData.location || '', // 'Locality'
        landmark: initialData.landmark || '',
        pincode: initialData.pincode || '',
        survey_number: initialData.survey_number || '',
        survey_name: initialData.survey_name || '',
        project_name: initialData.project_name || '', // 'Property/Developer Name'
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.city || !formData.location) {
            alert('Please fill in required fields (*)')
            return
        }
        onNext(formData)
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Where is the property located?</h2>

            {/* Map Placeholder */}
            <div style={{
                background: '#eef2f6',
                height: '300px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '2rem',
                border: '2px dashed #cbd5e1',
                color: '#64748b'
            }}>
                <MapPin size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Interactive Map Integration</p>
                <small>(Google Maps API Key required)</small>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Address</label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Type your property address"
                />
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Lat</label>
                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className={styles.input} placeholder="Latitude" />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Long</label>
                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className={styles.input} placeholder="Longitude" />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Building/Premises</label>
                <input type="text" name="building_name" value={formData.building_name} onChange={handleChange} className={styles.input} />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Flat/Office/Unit No.</label>
                <input type="text" name="flat_no" value={formData.flat_no} onChange={handleChange} className={styles.input} maxLength={20} />
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>City <span>*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={styles.input} required />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Locality <span>*</span></label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className={styles.input} required />
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Landmark</label>
                    <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Pin Code</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Survey Number</label>
                    <input type="text" name="survey_number" value={formData.survey_number} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Survey Name</label>
                    <input type="text" name="survey_name" value={formData.survey_name} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Property/Developer Name</label>
                <input type="text" name="project_name" value={formData.project_name} onChange={handleChange} className={styles.input} />
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
