'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import styles from '../property-wizard.module.css'

interface Agent {
    id: string
    name: string
}

interface StepProps {
    initialData: any
    onNext: (data: any) => void
    onBack: () => void
}

/** Collision-safe property ID: PROP-<timestamp base36>-<4 random chars> */
function generatePropertyId(): string {
    const ts = Date.now().toString(36).toUpperCase()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `PROP-${ts}-${rand}`
}

/** Format price as Indian rupee string */
function formatPriceText(price: string | number): string {
    const n = parseFloat(String(price))
    if (isNaN(n)) return ''
    if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr`
    if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} L`
    return `₹ ${n.toLocaleString('en-IN')}`
}

export default function PropertyPublishStep({ initialData, onBack }: StepProps) {
    const router = useRouter()
    const supabase = createClient()
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])

    const [formData, setFormData] = useState({
        refer_by: initialData.refer_by || '',
        key_holder: initialData.key_holder || '',
        folder: initialData.folder || '',
        source: initialData.source || '',
        branch: initialData.branch || '',
        agent_id: initialData.agent_id || '',
        is_featured: initialData.is_featured || false,
        visibility: initialData.visibility || 'Public',
        notify_whatsapp_assignee: false,
        notify_email_assignee: false,
        notify_whatsapp_customer: false,
        notify_email_customer: false,
    })

    const [images, setImages] = useState<string[]>(initialData.images || [])

    useEffect(() => {
        supabase.from('agents').select('id, name').order('name').then(({ data }) => {
            if (data) setAgents(data)
        })
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError(null)

        // ── Client-side validation ──────────────────────────────────
        if (!formData.agent_id) {
            setSubmitError('Please assign an agent before publishing.')
            return
        }
        if (!formData.source) {
            setSubmitError('Please select the property source.')
            return
        }
        if (!initialData.property_type_for) {
            setSubmitError('Missing basic info — go back to Step 2.')
            return
        }
        if (!initialData.property_type) {
            setSubmitError('Missing property category — go back to Step 2.')
            return
        }
        const price = parseFloat(initialData.price)
        if (!initialData.price || isNaN(price) || price <= 0) {
            setSubmitError('Invalid price — go back to Step 4.')
            return
        }

        setSubmitting(true)

        try {
            const d = { ...initialData, ...formData, images }

            // ── JSONB structures ────────────────────────────────────
            const pricing_details = {
                is_negotiable: d.is_negotiable || false,
                maintenance_charges: d.maintenance_charges || null,
                maintenance_paid_by_licensor: d.maintenance_paid_by_licensor || false,
                deposit_amount: d.deposit_amount || null,
                deposit_negotiable: d.deposit_negotiable || false,
                deposit_refundable: d.deposit_refundable || false,
            }

            const commercial_details = (d.workstation || d.cabin || d.conference_room || d.power_kva)
                ? {
                    workstation: d.workstation || null,
                    cabin: d.cabin || null,
                    conference_room: d.conference_room || null,
                    reception_area: d.reception_area || null,
                    power_kva: d.power_kva || null,
                    power_backup: d.power_backup || null,
                }
                : null

            const warehouse_details = (d.racking_capacity_tonnes || d.loading_bays || d.floor_strength)
                ? {
                    pollution_zone: d.pollution_zone || null,
                    racking_capacity_tonnes: d.racking_capacity_tonnes || null,
                    floor_strength: d.floor_strength || null,
                    stp_etp_capacity: d.stp_etp_capacity || null,
                    loading_bays: d.loading_bays || null,
                    canopy_length: d.canopy_length || null,
                    canopy_width: d.canopy_width || null,
                    fire_noc: d.fire_noc || false,
                    approval_plan: d.approval_plan || false,
                    dock_levellers: d.dock_levellers || false,
                }
                : null

            // Amenities — stored as flat string array
            const amenities = Array.isArray(d.amenities) ? d.amenities : []

            // Connectivity — stored as JSONB array
            const connectivity = Array.isArray(d.connectivity) ? d.connectivity : []

            // ── DB payload ──────────────────────────────────────────
            const dbPayload: Record<string, unknown> = {
                // ID & core
                property_id: generatePropertyId(),
                title: d.title || `${d.property_type} for ${d.property_type_for} in ${d.city || d.location || ''}`,
                description: d.description || null,

                // Type & category
                property_type: d.property_type_for,          // 'Sale' | 'Rent'
                category: d.property_type,                   // 'Apartment' | 'Villa' …
                sub_category: d.plot_sub_type || null,       // for Plot type

                // Pricing
                price: price,
                price_text: formatPriceText(d.price),
                price_per_sqft: (d.sqft && price) ? Math.round(price / parseFloat(d.sqft)) : null,

                // Area — map correct primary field per category
                sqft: parseFloat(d.sqft) || 0,
                built_up_area: parseFloat(d.built_up_area) || null,
                carpet_area: parseFloat(d.carpet_area) || null,
                plot_size: parseFloat(d.plot_size) || null,

                // Rooms
                bedrooms: parseInt(d.bedrooms) || 0,
                bathrooms: parseInt(d.bathrooms) || 0,
                balconies: parseInt(d.balconies) || null,
                parking_count: parseInt(d.parking_count) || null,

                // Location
                location: d.location || d.city || '',
                city: d.city || null,
                area: d.locality || null,
                street: d.address || null,
                address: d.address || null,
                building_name: d.building_name || null,
                flat_no: d.flat_no || null,
                landmark: d.landmark || null,
                pincode: d.pincode || null,
                latitude: d.latitude && !isNaN(parseFloat(d.latitude)) ? parseFloat(d.latitude) : null,
                longitude: d.longitude && !isNaN(parseFloat(d.longitude)) ? parseFloat(d.longitude) : null,

                // Floor info (Apartment, Commercial…)
                floor_number: d.floor_number || null,
                total_floors: d.total_floors || null,

                // Property details
                furnishing: d.furnishing || null,
                ownership: d.ownership || null,
                transaction_type: d.transaction_type || null,
                property_age: d.age_of_property || null,
                possession_status: d.possession_status || 'Ready To Move',
                suitable_for: d.suitable_for || null,
                unique_feature: d.unique_feature || null,

                // Status & meta
                status: 'Available',
                is_featured: d.is_featured || false,
                source: d.source || null,
                channel: d.channel || null,
                branch: d.branch || null,
                refer_by: d.refer_by || null,
                visibility: d.visibility || 'Public',

                // Relations
                owner_id: d.owner_id || null,
                agent_id: d.agent_id || null,

                // Media
                images: images,
                video_url: d.video_url || null,

                // JSONB
                amenities: amenities.length > 0 ? amenities : null,
                connectivity: connectivity.length > 0 ? connectivity : null,
                pricing_details,
                commercial_details,
                warehouse_details,
            }

            const { error } = await supabase.from('properties').insert([dbPayload])

            if (error) {
                // Surface a human-readable error
                if (error.code === '23505') {
                    // unique constraint — regenerate ID and retry once
                    dbPayload.property_id = generatePropertyId()
                    const { error: retryError } = await supabase.from('properties').insert([dbPayload])
                    if (retryError) throw new Error(retryError.message)
                } else if (error.code === '23503') {
                    throw new Error('Invalid agent or owner reference. Please re-check your selection.')
                } else if (error.code === '23514') {
                    throw new Error(`Data validation failed: ${error.message}`)
                } else {
                    throw new Error(error.message)
                }
            }

            router.push('/admin/properties')

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
            setSubmitError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleFinalSubmit}>
            <h2 className={styles.stepTitle}>Save & Publish Property</h2>

            <div className={styles.field}>
                <label className={styles.label}>Images</label>
                <MultiImageUpload
                    images={images}
                    onChange={setImages}
                    folder="properties"
                    label="Upload Property Images"
                />
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Refer By</label>
                    <select name="refer_by" value={formData.refer_by} onChange={handleChange} className={styles.select}>
                        <option value="">Select</option>
                        <option value="Agent A">Agent A</option>
                        <option value="Agent B">Agent B</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Key Holder</label>
                    <select name="key_holder" value={formData.key_holder} onChange={handleChange} className={styles.select}>
                        <option value="">Select</option>
                        <option value="Owner">Owner</option>
                        <option value="Office">Office</option>
                    </select>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Source <span>*</span></label>
                    <select name="source" value={formData.source} onChange={handleChange} className={styles.select} required>
                        <option value="">Select Source</option>
                        <option value="Website">Website</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Referral">Referral</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Assigned Agent <span>*</span></label>
                    <select name="agent_id" value={formData.agent_id} onChange={handleChange} className={styles.select} required>
                        <option value="">Select Agent</option>
                        {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Branch</label>
                    <select name="branch" value={formData.branch} onChange={handleChange} className={styles.select}>
                        <option value="">Select Branch</option>
                        <option value="Main">Main Branch</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Folder</label>
                    <select name="folder" value={formData.folder} onChange={handleChange} className={styles.select}>
                        <option value="">Select Folder</option>
                        <option value="Active">Active</option>
                        <option value="Archive">Archive</option>
                    </select>
                </div>
            </div>

            <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', margin: '1rem 0' }}>
                <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    style={{ width: '20px', height: '20px', margin: 0 }}
                />
                <label className={styles.label} style={{ marginBottom: 0, marginLeft: '10px' }}>Featured Property</label>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Visibility</label>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    {['Public', 'Branch', 'Protected'].map(v => (
                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input type="radio" name="visibility" value={v} checked={formData.visibility === v} onChange={handleChange} />
                            {v === 'Protected' ? 'Protected (Hide Contact)' : v}
                        </label>
                    ))}
                </div>
            </div>

            {/* Notification preferences (UI only — wire to backend when ready) */}
            <div className={styles.grid2} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {[
                    { name: 'notify_whatsapp_assignee', label: 'WhatsApp to Assignee' },
                    { name: 'notify_email_assignee', label: 'Email to Assignee' },
                    { name: 'notify_whatsapp_customer', label: 'WhatsApp to Customer' },
                    { name: 'notify_email_customer', label: 'Email to Customer' },
                ].map(({ name, label }) => (
                    <div key={name} className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', margin: 0 }}>
                        <input
                            type="checkbox"
                            name={name}
                            checked={(formData as any)[name]}
                            onChange={handleChange}
                        />
                        <label style={{ marginLeft: '8px', marginBottom: 0 }}>{label}</label>
                    </div>
                ))}
            </div>

            {/* Inline error message */}
            {submitError && (
                <div style={{
                    marginTop: '1rem',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderLeft: '4px solid #ef4444',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                }}>
                    {submitError}
                </div>
            )}

            <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondaryBtn}`} onClick={onBack}>
                    <ArrowLeft size={16} /> BACK
                </button>
                <button
                    type="submit"
                    className={`${styles.btn} ${styles.primaryBtn}`}
                    disabled={submitting}
                >
                    {submitting ? 'SAVING…' : 'SAVE & PUBLISH'} <Save size={16} />
                </button>
            </div>
        </form>
    )
}
