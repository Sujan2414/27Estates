'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import styles from '../../PropertyWizard/property-wizard.module.css'
import dynamic from 'next/dynamic'

// Dynamic import for Map
const PropertyMap = dynamic(() => import('@/components/emergent/PropertyMap'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', background: '#f5f5f5', borderRadius: '1rem' }} />
})

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

export default function ProjectStep3Location({ initialData, onNext, onBack }: StepProps) {
    const [address, setAddress] = useState({
        address: initialData.address || '',
        location: initialData.location || '',
        city: initialData.city || '',
        state: initialData.state || '',
        landmark: initialData.landmark || '',
        pincode: initialData.pincode || '',
        country: initialData.country || 'India',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setAddress(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext(address)
    }

    // Helper to safely parse coordinates
    const parseCoord = (val: string) => {
        const num = parseFloat(val)
        return isNaN(num) ? null : num
    }

    // Construct preview item for map
    const mapPreviewItem = {
        id: 'preview',
        title: 'New Project',
        location: address.location || address.city || 'Bangalore',
        latitude: parseCoord(address.latitude),
        longitude: parseCoord(address.longitude),
        type: 'project' as const,
        images: [],
        min_price: 'Price on Request',
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Location</h2>

            {/* Map Preview */}
            <div style={{ height: '350px', marginBottom: '2rem', borderRadius: '1rem', overflow: 'hidden' }}>
                <PropertyMap properties={[]} projects={[mapPreviewItem]} />
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Address</label>
                    <input type="text" name="address" value={address.address} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Location / Area</label>
                    <input type="text" name="location" value={address.location} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>City</label>
                    <input type="text" name="city" value={address.city} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>State</label>
                    <input type="text" name="state" value={address.state} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>PIN Code</label>
                    <input type="text" name="pincode" value={address.pincode} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>Country</label>
                    <input type="text" name="country" value={address.country} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Landmark</label>
                    <input type="text" name="landmark" value={address.landmark} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Latitude</label>
                    <input type="text" name="latitude" value={address.latitude} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>Longitude</label>
                    <input type="text" name="longitude" value={address.longitude} onChange={handleChange} className={styles.input} />
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
