'use client'

import { useState, useEffect } from 'react'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import styles from '../../PropertyWizard/property-wizard.module.css'

interface Developer {
    id: string
    name: string
}

interface StepProps {
    initialData: any
    onNext: (data: any) => void
}

export default function ProjectStep1Basic({ initialData, onNext }: StepProps) {
    const supabase = createAdminBrowserClient()
    const [developers, setDevelopers] = useState<Developer[]>([])

    const [formData, setFormData] = useState({
        project_id: initialData.project_id || '',
        project_name: initialData.project_name || '',
        title: initialData.title || '',
        description: initialData.description || '',
        rera_number: initialData.rera_number || '',
        developer_id: initialData.developer_id || '',
        developer_name: initialData.developer_name || '',
        status: initialData.status || 'Under Construction',
        category: initialData.category || 'Residential',
        sub_category: initialData.sub_category || '',
        total_units: initialData.total_units || '',
        bhk_options: initialData.bhk_options || '',
        is_featured: initialData.is_featured || false,
        is_rera_approved: initialData.is_rera_approved || false,
    })

    useEffect(() => {
        const fetchDevelopers = async () => {
            const { data } = await supabase.from('developers').select('id, name')
            if (data) setDevelopers(data)
        }
        fetchDevelopers()
    }, [supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else if (name === 'category') {
            // Reset sub_category and irrelevant fields when category changes
            setFormData(prev => ({
                ...prev,
                category: value,
                sub_category: '',
                bhk_options: value === 'Plot' ? '' : prev.bhk_options,
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const totalLabel = formData.category === 'Villa' ? 'Total Villas' : formData.category === 'Plot' ? 'Total Plots' : 'Total Units'

    const categories = ['Residential', 'Villa', 'Plot']
    const subCategories: Record<string, string[]> = {
        Residential: ['Apartment', 'Penthouse', 'Studio', 'Duplex'],
        Villa: ['Independent Villa', 'Row House', 'Twin Villa', 'Farm Villa'],
        Plot: ['Farm Plot', 'Residential Plot', 'Commercial Plot', 'NA Plot'],
    }
    const statusOptions = ['Under Construction', 'Ready to Move', 'Pre-Launch', 'Upcoming', 'Completed']

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext(formData)
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Basic Information</h2>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Project ID</label>
                    <input type="text" name="project_id" value={formData.project_id} onChange={handleChange} className={styles.input} placeholder="Auto-generated if empty" />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Project Name *</label>
                    <input type="text" name="project_name" value={formData.project_name} onChange={handleChange} className={styles.input} required />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Title (Display)</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={styles.input} />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className={styles.textarea} rows={4} />
            </div>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} className={styles.select}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Sub Category</label>
                    <select name="sub_category" value={formData.sub_category} onChange={handleChange} className={styles.select}>
                        <option value="">Select...</option>
                        {(subCategories[formData.category] || []).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={styles.select}>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label className={styles.label}>Developer</label>
                    <select name="developer_id" value={formData.developer_id} onChange={handleChange} className={styles.select}>
                        <option value="">Select Developer</option>
                        {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Developer Name (Manual)</label>
                    <input type="text" name="developer_name" value={formData.developer_name} onChange={handleChange} className={styles.input} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>{totalLabel}</label>
                    <input type="number" name="total_units" value={formData.total_units} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>RERA Number</label>
                    <input type="text" name="rera_number" value={formData.rera_number} onChange={handleChange} className={styles.input} />
                </div>
                {formData.category !== 'Plot' && (
                    <div className={styles.field}>
                        <label className={styles.label}>BHK Options (comma-separated)</label>
                        <input type="text" name="bhk_options" value={formData.bhk_options} onChange={handleChange} className={styles.input} placeholder="1 BHK, 2 BHK, 3 BHK" />
                    </div>
                )}
            </div>

            <div className={styles.grid2}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} />
                    <label>Featured Project</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="is_rera_approved" checked={formData.is_rera_approved} onChange={handleChange} />
                    <label>RERA Approved</label>
                </div>
            </div>

            <div className={styles.actions}>
                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                    Next <ArrowRight size={18} />
                </button>
            </div>
        </form>
    )
}
