'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import styles from '../property-wizard.module.css'
import dynamic from 'next/dynamic'
import CitySelect from '@/components/admin/CitySelect'
import PincodeInput from '@/components/admin/PincodeInput'

// Dynamic import — Leaflet touches `window` so SSR has to be off.
const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => <div style={{ height: '380px', background: '#f5f5f5', borderRadius: '0.75rem' }} />
})

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
        state: initialData.state || '',
        location: initialData.location || '', // 'Locality'
        direction: initialData.direction || '',
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

    // Helper to safely parse coordinates
    const parseCoord = (val: string) => {
        const num = parseFloat(val)
        return isNaN(num) ? null : num
    }

    // Two-way sync between the interactive picker and the manual lat/lng
    // inputs below — picking on the map updates the inputs; typing in the
    // inputs would update the pin (via the controlled value).
    const setCoords = (la: number, ln: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: la.toFixed(6),
            longitude: ln.toFixed(6),
        }))
    }

    // Seed the picker's address search with whatever the admin already
    // typed in the address fields (locality + city is usually enough).
    const initialSearch = [formData.location, formData.city].filter(Boolean).join(', ')

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Where is the property located?</h2>

            {/* Interactive picker — click / drag / search to set lat & lng */}
            <div style={{ marginBottom: '2rem' }}>
                <LocationPicker
                    lat={parseCoord(formData.latitude)}
                    lng={parseCoord(formData.longitude)}
                    onChange={setCoords}
                    initialSearch={initialSearch}
                />
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
                    <label className={styles.label}>Pin Code <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 400 }}>(auto-fills city, state &amp; locality)</span></label>
                    <PincodeInput
                        value={formData.pincode}
                        onChange={(pincode) => setFormData(prev => ({ ...prev, pincode }))}
                        onLookup={(d) => setFormData(prev => ({
                            ...prev,
                            city: prev.city || d.city,
                            state: prev.state || d.state,
                            location: prev.location || d.area,
                        }))}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>City <span>*</span></label>
                    <CitySelect
                        value={formData.city}
                        onChange={(city) => setFormData(prev => ({ ...prev, city }))}
                        required
                    />
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Locality <span>*</span></label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className={styles.input} required />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Direction</label>
                    <select name="direction" value={formData.direction} onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value }))} className={styles.input}>
                        <option value="">None</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="Central">Central</option>
                    </select>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Landmark</label>
                    <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className={styles.input} />
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

