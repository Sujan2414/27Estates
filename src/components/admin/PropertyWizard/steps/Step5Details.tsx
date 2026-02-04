'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import styles from '../property-wizard.module.css'

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
        ...defaultWarehouse, // In a real app, merging might handle overlaps better
        ...initialData
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
        onNext(formData)
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
