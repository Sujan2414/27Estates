'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/admin/ImageUpload'
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import BrochureUpload from '@/components/admin/BrochureUpload'
import styles from '../../PropertyWizard/property-wizard.module.css'

interface FloorPlan {
    name: string
    image: string
    bhk?: string
    area?: string
}

interface StepProps {
    initialData: any
    onNext: () => void
    onBack: () => void
}

export default function ProjectStep6Publish({ initialData, onNext, onBack }: StepProps) {
    const router = useRouter()
    const supabase = createAdminBrowserClient()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [video_url, setVideoUrl] = useState(initialData.video_url || '')
    const [brochure_url, setBrochureUrl] = useState(initialData.brochure_url || '')
    const [master_plan_image, setMasterPlanImage] = useState(initialData.master_plan_image || '')
    const [images, setImages] = useState<string[]>(initialData.images || [])
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(initialData.floorPlans || [{ name: '', image: '', bhk: '', area: '' }])

    // Ad Card state
    const [adCardImage, setAdCardImage] = useState(initialData.ad_card_image || '')
    const [showAdOnHome, setShowAdOnHome] = useState(initialData.show_ad_on_home || false)
    const [fifoWarning, setFifoWarning] = useState<{ show: boolean; oldestProject: string | null }>({ show: false, oldestProject: null })

    const handleAdToggle = async (checked: boolean) => {
        if (!checked) {
            setShowAdOnHome(false)
            setFifoWarning({ show: false, oldestProject: null })
            return
        }
        // Check how many active ads exist
        const { data: activeAds } = await supabase
            .from('projects')
            .select('id, project_name')
            .eq('show_ad_on_home', true)
            .order('created_at', { ascending: true })
        if (activeAds && activeAds.length >= 5) {
            setFifoWarning({ show: true, oldestProject: activeAds[0].project_name })
        } else {
            setFifoWarning({ show: false, oldestProject: null })
        }
        setShowAdOnHome(true)
    }

    const confirmFifoReplace = async () => {
        // Disable oldest ad
        const { data: activeAds } = await supabase
            .from('projects')
            .select('id')
            .eq('show_ad_on_home', true)
            .order('created_at', { ascending: true })
            .limit(1)
        if (activeAds && activeAds.length > 0) {
            await supabase
                .from('projects')
                .update({ show_ad_on_home: false })
                .eq('id', activeAds[0].id)
        }
        setFifoWarning({ show: false, oldestProject: null })
    }

    const handleFloorPlanChange = (index: number, field: keyof FloorPlan, value: string) => {
        setFloorPlans(prev => prev.map((fp, i) => i === index ? { ...fp, [field]: value } : fp))
    }
    const addFloorPlan = () => setFloorPlans(prev => [...prev, { name: '', image: '', bhk: '', area: '' }])
    const removeFloorPlan = (index: number) => setFloorPlans(prev => prev.filter((_, i) => i !== index))

    const addBtnStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0',
        borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#334155',
        marginTop: '8px',
    }
    const removeBtnStyle: React.CSSProperties = {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #fecaca',
        background: '#fff5f5', color: '#ef4444', cursor: 'pointer', flexShrink: 0,
    }
    const rowStyle: React.CSSProperties = {
        background: '#f8fafc', padding: '16px', borderRadius: '8px',
        marginBottom: '12px', border: '1px solid #e2e8f0',
    }

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const d = initialData

            const amenitiesData = Array.isArray(d.amenities)
                ? d.amenities.filter((a: string) => typeof a === 'string' && a.trim() !== '')
                : d.amenities ? d.amenities : null

            const floorPlansData = floorPlans.filter(fp => (fp.name || '').trim() !== '' || (fp.image || '').trim() !== '')
            const connectivityData = (d.connectivity || []).filter((c: any) => (c.name || '').trim() !== '')
            const highlightsData = (d.highlights || []).filter((h: any) => (h.label || '').trim() !== '' && (h.value || '').trim() !== '')

            let towersData: unknown[] = []
            if (d.category === 'Residential') {
                towersData = (d.residentialTowers || []).filter((t: any) => (t.name || '').trim() !== '')
            } else if (d.category === 'Villa') {
                towersData = (d.villaClusters || []).filter((c: any) => (c.cluster_name || '').trim() !== '')
            } else if (d.category === 'Plot') {
                towersData = (d.plotPhases || []).filter((p: any) => (p.phase_name || '').trim() !== '')
            }

            let planData: unknown[] = []
            if (d.category === 'Residential') {
                planData = (d.residentialUnits || []).filter((u: any) => (u.bhk || '').trim() !== '')
            } else if (d.category === 'Villa') {
                planData = (d.villaTypes || []).filter((v: any) => (v.villa_type || '').trim() !== '')
            } else if (d.category === 'Plot') {
                planData = (d.plotConfigs || []).filter((p: any) => (p.plot_type || '').trim() !== '')
            }

            let specsData = {}
            try {
                specsData = JSON.parse(d.specsJson || '{}')
            } catch {
                // keep empty
            }

            const projectId = d.project_id || `PRJ-${Date.now()}`

            const projectData: Record<string, unknown> = {
                project_id: projectId,
                project_name: d.project_name,
                title: d.title || null,
                description: d.description || null,
                rera_number: d.rera_number || null,
                developer_id: d.developer_id && d.developer_id.trim() !== '' ? d.developer_id : null,
                developer_name: d.developer_name || null,
                status: d.status || 'Available',
                category: d.category,
                sub_category: d.sub_category || null,
                total_units: d.total_units && !isNaN(parseInt(d.total_units)) ? parseInt(d.total_units) : null,
                min_price: d.min_price || null,
                max_price: d.max_price || null,
                min_price_numeric: d.min_price_numeric && !isNaN(parseFloat(d.min_price_numeric)) ? parseFloat(d.min_price_numeric) : null,
                max_price_numeric: d.max_price_numeric && !isNaN(parseFloat(d.max_price_numeric)) ? parseFloat(d.max_price_numeric) : null,
                price_per_sqft: d.price_per_sqft && !isNaN(parseFloat(d.price_per_sqft)) ? parseFloat(d.price_per_sqft) : null,
                min_area: d.min_area && !isNaN(parseFloat(d.min_area)) ? parseFloat(d.min_area) : null,
                max_area: d.max_area && !isNaN(parseFloat(d.max_area)) ? parseFloat(d.max_area) : null,
                property_type: d.property_type && d.property_type.trim() !== '' ? d.property_type : null,
                bhk_options: d.bhk_options ? d.bhk_options.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
                transaction_type: d.transaction_type && d.transaction_type.trim() !== '' ? d.transaction_type : null,
                launch_date: d.launch_date || null,
                possession_date: d.possession_date || null,
                address: d.address || null,
                location: d.location || null,
                city: d.city || null,
                state: d.state || null,
                landmark: d.landmark || null,
                pincode: d.pincode || null,
                country: d.country || null,
                latitude: d.latitude && !isNaN(parseFloat(d.latitude)) ? parseFloat(d.latitude) : null,
                longitude: d.longitude && !isNaN(parseFloat(d.longitude)) ? parseFloat(d.longitude) : null,
                images: images.filter(img => img && img.trim() !== ''),
                video_url: video_url || null,
                brochure_url: brochure_url || null,
                master_plan_image: master_plan_image || null,
                is_featured: d.is_featured || false,
                is_rera_approved: d.is_rera_approved || false,
                employee_name: d.employee_name || null,
                employee_phone: d.employee_phone || null,
                employee_email: d.employee_email || null,
                assigned_agent_id: d.assigned_agent_id && d.assigned_agent_id.trim() !== '' ? d.assigned_agent_id : null,
                amenities: amenitiesData,
                floor_plans: floorPlansData.length > 0 ? floorPlansData : null,
                connectivity: connectivityData.length > 0 ? connectivityData : null,
                highlights: highlightsData.length > 0 ? highlightsData : null,
                towers_data: towersData.length > 0 ? towersData : null,
                project_plan: planData.length > 0 ? planData : null,
                specifications_complex: Object.keys(specsData).length > 0 ? specsData : null,
                ad_card_image: adCardImage || null,
                show_ad_on_home: showAdOnHome,
            }

            const { error: insertError } = await supabase
                .from('projects')
                .insert(projectData)

            if (insertError) throw insertError

            router.push('/admin/projects')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleFinalSubmit}>
            <h2 className={styles.stepTitle}>Media & Publish</h2>

            {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '24px' }}>
                    {error}
                </div>
            )}

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Video URL</label>
                    <input type="url" value={video_url} onChange={(e) => setVideoUrl(e.target.value)} className={styles.input} placeholder="https://youtube.com/embed/..." />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Brochure (Optional)</label>
                    <BrochureUpload
                        value={brochure_url}
                        onChange={(url: string) => setBrochureUrl(url)}
                        folder="projects/brochures"
                        label="Upload Brochure (PDF)"
                    />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Master Plan Image</label>
                <ImageUpload
                    value={master_plan_image}
                    onChange={(url: string) => setMasterPlanImage(url)}
                    folder="projects/master-plans"
                    label="Upload Master Plan"
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Project Images</label>
                <MultiImageUpload
                    images={images}
                    onChange={setImages}
                    folder="projects"
                    label="Upload Project Images"
                />
            </div>

            {/* Floor Plans */}
            <div className={styles.field} style={{ marginTop: '24px' }}>
                <label className={styles.label} style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Floor Plans</label>
                {floorPlans.map((fp, index) => (
                    <div key={index} style={rowStyle}>
                        <div className={styles.grid2}>
                            <div className={styles.field}>
                                <label className={styles.label}>Plan Name</label>
                                <input type="text" value={fp.name} onChange={(e) => handleFloorPlanChange(index, 'name', e.target.value)} className={styles.input} placeholder="Plan name (e.g., 2 BHK Type A)" />
                            </div>
                            <div className={styles.field}>
                                <ImageUpload
                                    value={fp.image}
                                    onChange={(url: string) => handleFloorPlanChange(index, 'image', url)}
                                    folder="projects/floor-plans"
                                    label="Upload Floor Plan"
                                />
                            </div>
                        </div>
                        <div className={styles.grid2} style={{ marginTop: '0.5rem' }}>
                            <input type="text" value={fp.bhk || ''} onChange={(e) => handleFloorPlanChange(index, 'bhk', e.target.value)} className={styles.input} placeholder="BHK (optional)" />
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="text" value={fp.area || ''} onChange={(e) => handleFloorPlanChange(index, 'area', e.target.value)} className={styles.input} placeholder="Area (optional)" />
                                {floorPlans.length > 1 && (
                                    <button type="button" onClick={() => removeFloorPlan(index)} style={removeBtnStyle}><X size={16} /></button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addFloorPlan} style={addBtnStyle}>
                    <Plus size={16} /> Add Floor Plan
                </button>
            </div>

            {/* Ad Card for Homepage */}
            <div className={styles.field} style={{ marginTop: '24px' }}>
                <label className={styles.label} style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Ad Card for Homepage</label>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                    Upload an ad card image to display on the homepage stacking section. Max 5 active ads.
                </p>
                <ImageUpload
                    value={adCardImage}
                    onChange={(url: string) => setAdCardImage(url)}
                    folder="projects/ad-cards"
                    label="Upload Ad Card Image"
                />
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        checked={showAdOnHome}
                        onChange={(e) => handleAdToggle(e.target.checked)}
                        id="showAdOnHome"
                        style={{ width: '18px', height: '18px', accentColor: '#183C38' }}
                    />
                    <label htmlFor="showAdOnHome" style={{ fontSize: '0.875rem', color: '#334155', cursor: 'pointer' }}>
                        Show this ad on the homepage stacking section
                    </label>
                </div>

                {fifoWarning.show && (
                    <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '8px' }}>
                            There are already 5 active ads. Enabling this will replace <strong>{fifoWarning.oldestProject}</strong>&apos;s ad (oldest).
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={confirmFifoReplace}
                                style={{ padding: '6px 14px', background: '#183C38', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                Confirm Replace
                            </button>
                            <button type="button" onClick={() => { setShowAdOnHome(false); setFifoWarning({ show: false, oldestProject: null }) }}
                                style={{ padding: '6px 14px', background: '#fff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={onBack} className={`${styles.btn} ${styles.secondaryBtn}`}>
                    <ArrowLeft size={18} /> Back
                </button>
                <button type="submit" disabled={saving} className={`${styles.btn} ${styles.successBtn}`}>
                    <Save size={18} /> {saving ? 'Creating...' : 'Create Project'}
                </button>
            </div>
        </form>
    )
}
