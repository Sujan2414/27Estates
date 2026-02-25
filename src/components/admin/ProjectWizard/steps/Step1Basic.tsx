'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'
import BHKMultiSelect from '@/components/admin/BHKMultiSelect'
import styles from '../../PropertyWizard/property-wizard.module.css'

interface DevOption {
    id: string
    name: string
    image: string
    description: string
}

interface StepProps {
    initialData: any
    onNext: (data: any) => void
}

export default function ProjectStep1Basic({ initialData, onNext }: StepProps) {
    const supabase = createClient()
    const [existingDevs, setExistingDevs] = useState<DevOption[]>([])
    const [devMode, setDevMode] = useState<'existing' | 'new'>(initialData.developer_name && !initialData.developer_id ? 'new' : 'existing')

    const [formData, setFormData] = useState({
        project_id: initialData.project_id || '',
        project_name: initialData.project_name || '',
        title: initialData.title || '',
        description: initialData.description || '',
        rera_number: initialData.rera_number || '',
        developer_id: initialData.developer_id || '',
        developer_name: initialData.developer_name || '',
        developer_image: initialData.developer_image || '',
        developer_description: initialData.developer_description || '',
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
            const { data: dbDevs } = await supabase.from('developers').select('id, name, logo, description')

            const { data: projDevs } = await supabase
                .from('projects')
                .select('developer_name, developer_image, developer_description')
                .not('developer_name', 'is', null)

            const devMap = new Map<string, DevOption>()

            if (dbDevs) {
                dbDevs.forEach(d => {
                    devMap.set(d.name.toLowerCase().trim(), {
                        id: d.id,
                        name: d.name,
                        image: d.logo || '',
                        description: d.description || ''
                    })
                })
            }

            if (projDevs) {
                projDevs.forEach(p => {
                    if (p.developer_name) {
                        const key = p.developer_name.toLowerCase().trim()
                        if (!devMap.has(key)) {
                            devMap.set(key, {
                                id: '',
                                name: p.developer_name,
                                image: p.developer_image || '',
                                description: p.developer_description || ''
                            })
                        } else {
                            // Update image/desc if missing in dbDevs
                            const existing = devMap.get(key)!
                            if (!existing.image && p.developer_image) existing.image = p.developer_image
                            if (!existing.description && p.developer_description) existing.description = p.developer_description
                            devMap.set(key, existing)
                        }
                    }
                })
            }

            // Sort alphabetically by name
            const finalDevs = Array.from(devMap.values()).sort((a, b) => a.name.localeCompare(b.name))
            setExistingDevs(finalDevs)
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
                bhk_options: (value === 'Plot' || value === 'Commercial') ? '' : prev.bhk_options,
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const totalLabel = formData.category === 'Villa' ? 'Total Villas' : formData.category === 'Plot' ? 'Total Plots' : formData.category === 'Commercial' ? 'Total Units' : 'Total Units'

    const categories = ['Residential', 'Villa', 'Plot', 'Commercial']
    const subCategories: Record<string, string[]> = {
        Residential: ['Apartment', 'Penthouse', 'Studio', 'Duplex'],
        Villa: ['Independent Villa', 'Row House', 'Twin Villa', 'Farm Villa'],
        Plot: ['Farm Plot', 'Residential Plot', 'Commercial Plot', 'NA Plot'],
        Commercial: ['Office Space', 'Retail Shops', 'Co-Working Space', 'Showroom', 'Mixed Use', 'Business Park', 'Mall'],
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

            <div className={styles.grid2}>
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
            </div>
            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={styles.select}>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>{totalLabel}</label>
                    <input type="number" name="total_units" value={formData.total_units} onChange={handleChange} className={styles.input} />
                </div>
            </div>

            <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Developer Information</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Select an existing developer to auto-fill details, or create a new one.</p>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Action</label>
                    <select
                        className={styles.select}
                        value={devMode}
                        onChange={(e) => {
                            setDevMode(e.target.value as 'existing' | 'new')
                            if (e.target.value === 'new') {
                                setFormData(prev => ({ ...prev, developer_id: '', developer_name: '', developer_image: '', developer_description: '' }))
                            }
                        }}
                    >
                        <option value="existing">Select Existing Developer</option>
                        <option value="new">Add New Developer</option>
                    </select>
                </div>

                {devMode === 'existing' ? (
                    <div className={styles.field}>
                        <label className={styles.label}>Choose Developer *</label>
                        <select
                            className={styles.select}
                            value={formData.developer_name}
                            onChange={(e) => {
                                const selected = existingDevs.find(d => d.name === e.target.value)
                                if (selected) {
                                    setFormData(prev => ({
                                        ...prev,
                                        developer_id: selected.id,
                                        developer_name: selected.name,
                                        developer_image: selected.image,
                                        developer_description: selected.description
                                    }))
                                } else {
                                    setFormData(prev => ({ ...prev, developer_id: '', developer_name: '', developer_image: '', developer_description: '' }))
                                }
                            }}
                            required={devMode === 'existing'}
                        >
                            <option value="">Select...</option>
                            {existingDevs.map(d => (
                                <option key={d.name} value={d.name}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className={styles.field}>
                        <label className={styles.label}>Developer Name *</label>
                        <input
                            type="text"
                            name="developer_name"
                            value={formData.developer_name}
                            onChange={handleChange}
                            className={styles.input}
                            required={devMode === 'new'}
                        />
                    </div>
                )}
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Developer Image</label>
                    <ImageUpload
                        folder="developers"
                        onChange={(url) => setFormData(prev => ({ ...prev, developer_image: url }))}
                        value={formData.developer_image || ''}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Developer Description</label>
                    <textarea
                        name="developer_description"
                        value={formData.developer_description}
                        onChange={handleChange}
                        className={styles.textarea}
                        rows={5}
                        placeholder="Add a small description about the developer..."
                    />
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>RERA Number</label>
                    <input type="text" name="rera_number" value={formData.rera_number} onChange={handleChange} className={styles.input} />
                </div>
                {formData.category !== 'Plot' && formData.category !== 'Commercial' && (
                    <div className={styles.field}>
                        <label className={styles.label}>BHK Options</label>
                        <BHKMultiSelect
                            value={formData.bhk_options || ''}
                            onChange={(val) => setFormData(prev => ({ ...prev, bhk_options: val }))}
                        />
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
