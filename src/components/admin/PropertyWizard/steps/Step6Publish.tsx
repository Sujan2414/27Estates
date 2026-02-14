'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Upload } from 'lucide-react'
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
    onNext: (data: any) => void // Not used here, this is final step
    onBack: () => void
}

export default function PropertyPublishStep({ initialData, onBack }: StepProps) {
    const router = useRouter()
    const supabase = createClient()
    const [submitting, setSubmitting] = useState(false)
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

        // Notification flags
        notify_whatsapp_assignee: false,
        notify_email_assignee: false,
        notify_whatsapp_customer: false,
        notify_email_customer: false
    })

    const [images, setImages] = useState<string[]>(initialData.images || [])

    useEffect(() => {
        async function fetchAgents() {
            const { data } = await supabase.from('agents').select('id, name').order('name')
            if (data) setAgents(data)
        }
        fetchAgents()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }



    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            // Combine all form data
            const allData = {
                ...initialData,
                ...formData,
                images // Add images
            }

            console.log('Wizard Data:', allData)

            // --- JSONB Structures ---

            const commercial_details = {
                workstation: allData.workstation,
                cabin: allData.cabin,
                conference_room: allData.conference_room,
                reception_area: allData.reception_area,
                power_kva: allData.power_kva,
                power_backup: allData.power_backup,
            }

            const warehouse_details = {
                pollution_zone: allData.pollution_zone,
                racking_capacity_tonnes: allData.racking_capacity_tonnes,
                floor_strength: allData.floor_strength,
                stp_etp_capacity: allData.stp_etp_capacity,
                loading_bays: allData.loading_bays,
                canopy_length: allData.canopy_length,
                canopy_width: allData.canopy_width,
                fire_noc: allData.fire_noc,
                approval_plan: allData.approval_plan,
                dock_levellers: allData.dock_levellers
            }

            const pricing_details = {
                is_negotiable: allData.is_negotiable,
                maintenance_paid_by_licensor: allData.maintenance_paid_by_licensor,
                deposit_negotiable: allData.deposit_negotiable,
                deposit_refundable: allData.deposit_refundable
            }

            // --- DB Mapping ---
            // Construct the exact object to insert into 'properties' table
            const dbPayload = {
                // Core
                property_id: 'PROP-' + Math.floor(Math.random() * 10000), // Temp ID gen
                title: `${allData.property_type} for ${allData.property_type_for} in ${allData.location}`,
                description: allData.description,

                // Fields with Name Mismatches
                property_type: allData.property_type_for, // Sale/Rent
                category: allData.property_type, // Apartment/Villa
                property_age: allData.age_of_property,

                // Direct Mappings
                price: parseFloat(allData.price) || 0,
                price_text: allData.price ? `₹ ${allData.price}` : null, // Simple formatting
                sqft: parseFloat(allData.sqft) || 0,
                bedrooms: parseInt(allData.bedrooms) || 0,
                bathrooms: 0, // Not in wizard currently, default

                location: allData.location,
                city: allData.city,
                address: allData.address,
                pincode: allData.pincode,
                landmark: allData.landmark,
                latitude: parseFloat(allData.latitude) || null,
                longitude: parseFloat(allData.longitude) || null,

                status: 'Available',
                is_featured: allData.is_featured,

                // Owner & Agent
                owner_id: allData.owner_id || null, // From Step 1 owner selection
                agent_id: allData.agent_id || null, // Assigned agent from this step
                branch: allData.branch,
                refer_by: allData.refer_by,
                channel: allData.channel,
                source: allData.source,

                // Details
                furnished_status: allData.furnishing, // DB col: furnishing
                furnishing: allData.furnishing,
                transaction_type: allData.transaction_type,
                ownership: allData.ownership,

                keywords: allData.keyword ? [allData.keyword] : [],

                // JSONB
                commercial_details,
                warehouse_details,
                pricing_details,
                images: images
            }

            // Log for debugging
            console.log('DB Payload:', dbPayload)

            // Real Save Logic
            const { error } = await supabase.from('properties').insert([dbPayload])

            if (error) {
                console.error('Supabase Error:', error)
                throw new Error(error.message)
            }

            alert('Property Created Successfully!')
            router.push('/admin/properties')

        } catch (error) {
            console.error(error)
            alert('Failed to save property. Check console.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleFinalSubmit}>
            <h2 className={styles.stepTitle}>Great! Lets Save and Publish the Property</h2>

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
                        {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label className={styles.label}>Branch <span>*</span></label>
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
                <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className={styles.input} style={{ width: '20px', height: '20px', margin: 0 }} />
                <label className={styles.label} style={{ marginBottom: 0, marginLeft: '10px' }}>Featured Property</label>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Visibility</label>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="radio" name="visibility" value="Public" checked={formData.visibility === 'Public'} onChange={handleChange} /> Public
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="radio" name="visibility" value="Branch" checked={formData.visibility === 'Branch'} onChange={handleChange} /> Branch
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="radio" name="visibility" value="Protected" checked={formData.visibility === 'Protected'} onChange={handleChange} /> Protected (Hide Contact)
                    </label>
                </div>
            </div>

            <div className={styles.grid2} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', margin: 0 }}>
                    <input type="checkbox" name="notify_whatsapp_assignee" checked={formData.notify_whatsapp_assignee} onChange={handleChange} />
                    <label style={{ marginLeft: '8px', marginBottom: 0 }}>Send WhatsApp to Assignee</label>
                </div>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', margin: 0 }}>
                    <input type="checkbox" name="notify_email_assignee" checked={formData.notify_email_assignee} onChange={handleChange} />
                    <label style={{ marginLeft: '8px', marginBottom: 0 }}>Send Email to Assignee</label>
                </div>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', margin: 0 }}>
                    <input type="checkbox" name="notify_whatsapp_customer" checked={formData.notify_whatsapp_customer} onChange={handleChange} />
                    <label style={{ marginLeft: '8px', marginBottom: 0 }}>Send WhatsApp to Customer</label>
                </div>
                <div className={styles.field} style={{ flexDirection: 'row', alignItems: 'center', margin: 0 }}>
                    <input type="checkbox" name="notify_email_customer" checked={formData.notify_email_customer} onChange={handleChange} />
                    <label style={{ marginLeft: '8px', marginBottom: 0 }}>Send Email to Customer</label>
                </div>
            </div>

            <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondaryBtn}`} onClick={onBack}>
                    <ArrowLeft size={16} /> BACK
                </button>
                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`} disabled={submitting}>
                    {submitting ? 'SAVING...' : 'SAVE & SUBMIT'} <Save size={16} />
                </button>
            </div>
        </form>
    )
}
