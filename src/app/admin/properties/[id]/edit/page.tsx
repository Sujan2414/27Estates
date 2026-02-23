'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ImageUpload from '@/components/admin/ImageUpload'
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import styles from '../../../admin.module.css'
import formStyles from '../../form.module.css'
import { AMENITIES_BY_CATEGORY, AMENITY_CATEGORIES, flattenAmenities } from '@/lib/amenities-data'
import { Check, Search } from 'lucide-react'

interface Agent {
    id: string
    name: string
}

interface Owner {
    id: string
    name: string
    phone: string | null
    company: string | null
}

interface FloorPlan {
    name: string
    image: string
}

export default function EditPropertyPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createAdminBrowserClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])
    const [owners, setOwners] = useState<Owner[]>([])

    // Basic Info
    const [formData, setFormData] = useState({
        property_id: '',
        title: '',
        description: '',
        price: '',
        price_per_sqft: '',
        location: '',
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        lot_size: '',
        floors: '',
        rooms: '',
        property_type: 'Sales',
        category: 'House',
        is_featured: false,
        agent_id: '',
        owner_id: '',
        video_url: '',
    })

    // Address
    const [address, setAddress] = useState({
        street: '',
        area: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
        lat: '',
        lng: '',
    })

    // Amenities
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
    const [amenitySearch, setAmenitySearch] = useState('')
    const [amenityDropdownOpen, setAmenityDropdownOpen] = useState(false)

    // Images & Floor Plans
    const [images, setImages] = useState<string[]>([''])
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([{ name: '', image: '' }])

    useEffect(() => {
        fetchProperty()
        fetchAgents()
        fetchOwners()
    }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const dropdown = document.getElementById('amenity-dropdown')
            if (dropdown && !dropdown.contains(e.target as Node)) {
                setAmenityDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const fetchProperty = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', params?.id as string)
            .single()

        if (error || !data) {
            setError('Property not found')
            setLoading(false)
            return
        }

        setFormData({
            property_id: data.property_id || '',
            title: data.title || '',
            description: data.description || '',
            price: data.price?.toString() || '',
            price_per_sqft: data.price_per_sqft?.toString() || '',
            location: data.location || '',
            bedrooms: data.bedrooms?.toString() || '',
            bathrooms: data.bathrooms?.toString() || '',
            sqft: data.sqft?.toString() || '',
            lot_size: data.lot_size?.toString() || '',
            floors: data.floors?.toString() || '',
            rooms: data.rooms?.toString() || '',
            property_type: data.property_type || 'Sales',
            category: data.category || 'House',
            is_featured: data.is_featured || false,
            agent_id: data.agent_id || '',
            owner_id: data.owner_id || '',
            video_url: data.video_url || '',
        })

        // Parse address
        const addr = data.address || {}
        setAddress({
            street: addr.street || '',
            area: addr.area || '',
            city: addr.city || '',
            state: addr.state || '',
            zip: addr.zip || '',
            country: addr.country || 'India',
            lat: addr.coordinates?.lat?.toString() || '',
            lng: addr.coordinates?.lng?.toString() || '',
        })

        // Parse amenities using helper
        setSelectedAmenities(flattenAmenities(data.amenities))

        // Parse images - filter out null/undefined entries
        const rawImages = data.images || []
        const cleanImages = rawImages.filter((img: unknown) => typeof img === 'string' && img.trim() !== '')
        setImages(cleanImages.length > 0 ? cleanImages : [''])

        // Parse floor plans
        const fp = data.floor_plans || []
        setFloorPlans(fp.length > 0 ? fp : [{ name: '', image: '' }])

        setLoading(false)
    }

    const fetchAgents = async () => {
        const { data } = await supabase.from('agents').select('id, name').order('name')
        if (data) setAgents(data)
    }

    const fetchOwners = async () => {
        const { data } = await supabase.from('owners').select('id, name, phone, company').order('name')
        if (data) setOwners(data)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setAddress(prev => ({ ...prev, [name]: value }))
    }

    // Amenity handlers
    const toggleAmenity = (label: string) => {
        setSelectedAmenities(prev =>
            prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
        )
    }
    const removeSelectedAmenity = (label: string) => {
        setSelectedAmenities(prev => prev.filter(a => a !== label))
    }

    // Filter amenities for dropdown
    const filteredAmenityCategories = AMENITY_CATEGORIES.map(cat => ({
        category: cat,
        items: AMENITIES_BY_CATEGORY[cat].filter(a =>
            a.label.toLowerCase().includes(amenitySearch.toLowerCase())
        ),
    })).filter(g => g.items.length > 0)

    // Image handlers
    const handleImageChange = (index: number, value: string) => {
        setImages(prev => prev.map((img, i) => i === index ? value : img))
    }
    const addImage = () => setImages(prev => [...prev, ''])
    const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index))

    // Floor plan handlers
    const handleFloorPlanChange = (index: number, field: 'name' | 'image', value: string) => {
        setFloorPlans(prev => prev.map((fp, i) => i === index ? { ...fp, [field]: value } : fp))
    }
    const addFloorPlan = () => setFloorPlans(prev => [...prev, { name: '', image: '' }])
    const removeFloorPlan = (index: number) => setFloorPlans(prev => prev.filter((_, i) => i !== index))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const addressData = {
                street: address.street,
                area: address.area,
                city: address.city,
                state: address.state,
                zip: address.zip,
                country: address.country,
                coordinates: {
                    lat: address.lat ? parseFloat(address.lat) : 0,
                    lng: address.lng ? parseFloat(address.lng) : 0,
                }
            }

            // Amenities are now sent as a flat array. Our backend stores jsonb, so flat array is fine for now,
            // or we might need to send it as step5 does if we want strict compatibility with the wizard structure.
            // But the wizard ultimately just sends the data, and if the DB column is jsonb, it accepts anything.
            // The Property Details page (display) uses a flat list logic or handles whatever is there.
            // Let's use the flat array as per the plan.
            const amenitiesData = selectedAmenities

            const floorPlansData = (floorPlans || []).filter(fp => {
                const name = fp?.name || ''
                const image = fp?.image || ''
                return name.trim() !== '' || image.trim() !== ''
            })

            const propertyData = {
                property_id: formData.property_id,
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                price_per_sqft: formData.price_per_sqft ? parseFloat(formData.price_per_sqft) : null,
                location: formData.location,
                address: addressData,
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                sqft: parseInt(formData.sqft),
                lot_size: formData.lot_size ? parseInt(formData.lot_size) : null,
                floors: formData.floors ? parseInt(formData.floors) : null,
                rooms: formData.rooms ? parseInt(formData.rooms) : null,
                property_type: formData.property_type,
                category: formData.category,
                is_featured: formData.is_featured,
                agent_id: formData.agent_id || null,
                owner_id: formData.owner_id || null,
                video_url: formData.video_url || null,
                images: (images || []).filter(img => img && typeof img === 'string' && img.trim() !== ''),
                amenities: amenitiesData,
                floor_plans: floorPlansData.length > 0 ? floorPlansData : null,
            }

            const { error: updateError } = await supabase
                .from('properties')
                .update(propertyData)
                .eq('id', params?.id as string)

            if (updateError) {
                console.error('Supabase update error:', updateError)
                console.error('Property data sent:', JSON.stringify(propertyData, null, 2))
                throw new Error(updateError.message || updateError.details || JSON.stringify(updateError))
            }

            router.push('/admin/properties')
        } catch (err: any) {
            console.error('Property save failed:', err)
            const msg = err?.message || err?.details || (typeof err === 'string' ? err : 'Failed to update property')
            setError(msg)
        } finally {
            setSaving(false)
        }
    }

    const categories = ['Apartment', 'House', 'Duplex', 'Villa', 'Plot', 'Commercial', 'Farmhouse', 'Offices']

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.emptyState}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading property...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/properties" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Edit Property</h1>
                    <p className={styles.pageSubtitle}>{formData.title}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={formStyles.form}>
                {error && <div className={formStyles.error}>{error}</div>}

                {/* Basic Information */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Basic Information</h2>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Property ID *</label>
                            <input type="text" name="property_id" value={formData.property_id} onChange={handleChange} className={formStyles.input} required />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className={formStyles.input} required />
                        </div>
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className={formStyles.textarea} rows={4} />
                    </div>
                </div>

                {/* Pricing & Type */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Pricing & Type</h2>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Price (₹) *</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className={formStyles.input} required />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Price per Sqft</label>
                            <input type="number" name="price_per_sqft" value={formData.price_per_sqft} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Location *</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} className={formStyles.input} required />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Type</label>
                            <select name="property_type" value={formData.property_type} onChange={handleChange} className={formStyles.select}>
                                <option value="Sales">For Sale</option>
                                <option value="Rent">For Rent</option>
                            </select>
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} className={formStyles.select}>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Assigned Agent</label>
                            <select name="agent_id" value={formData.agent_id} onChange={handleChange} className={formStyles.select}>
                                <option value="">Select Agent</option>
                                {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Owner / Landlord</label>
                            <select name="owner_id" value={formData.owner_id} onChange={handleChange} className={formStyles.select}>
                                <option value="">Select Owner</option>
                                {owners.map(owner => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name}{owner.phone ? ` • ${owner.phone}` : ''}{owner.company ? ` • ${owner.company}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={formStyles.checkboxField}>
                        <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} />
                        <label>Featured Property</label>
                    </div>
                </div>

                {/* Property Details */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Property Details</h2>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Bedrooms *</label>
                            <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className={formStyles.input} required />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Bathrooms *</label>
                            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className={formStyles.input} required />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Total Rooms</label>
                            <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Sqft *</label>
                            <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className={formStyles.input} required />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Lot Size (sqft)</label>
                            <input type="number" name="lot_size" value={formData.lot_size} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Floors</label>
                            <input type="number" name="floors" value={formData.floors} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Address</h2>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Street</label>
                            <input type="text" name="street" value={address.street} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Area</label>
                            <input type="text" name="area" value={address.area} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>City</label>
                            <input type="text" name="city" value={address.city} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>State</label>
                            <input type="text" name="state" value={address.state} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>ZIP Code</label>
                            <input type="text" name="zip" value={address.zip} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Country</label>
                            <input type="text" name="country" value={address.country} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Latitude</label>
                            <input type="text" name="lat" value={address.lat} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Longitude</label>
                            <input type="text" name="lng" value={address.lng} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                    </div>
                </div>

                {/* Amenities */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Amenities</h2>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                        Select amenities available in this property.
                    </p>

                    {selectedAmenities.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {selectedAmenities.map(label => (
                                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, color: '#166534' }}>
                                    {label}
                                    <button type="button" onClick={() => removeSelectedAmenity(label)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#166534' }}>
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div id="amenity-dropdown" style={{ position: 'relative', marginBottom: '16px' }}>
                        <div
                            onClick={() => setAmenityDropdownOpen(!amenityDropdownOpen)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: '#ffffff' }}
                        >
                            <Search size={16} color="#94a3b8" />
                            <input
                                type="text"
                                value={amenitySearch}
                                onChange={(e) => { setAmenitySearch(e.target.value); setAmenityDropdownOpen(true) }}
                                onFocus={() => setAmenityDropdownOpen(true)}
                                placeholder="Search amenities..."
                                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', background: 'transparent' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{selectedAmenities.length} selected</span>
                        </div>

                        {amenityDropdownOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: '360px', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 50, padding: '8px' }}>
                                {filteredAmenityCategories.map(({ category, items }) => (
                                    <div key={category}>
                                        <div style={{ padding: '8px 10px 4px', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{category}</div>
                                        {items.map(amenity => {
                                            const isSelected = selectedAmenities.includes(amenity.label)
                                            return (
                                                <button
                                                    key={amenity.label}
                                                    type="button"
                                                    onClick={() => toggleAmenity(amenity.label)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '6px', background: isSelected ? '#f0fdf4' : 'transparent', cursor: 'pointer', fontSize: '0.8125rem', color: isSelected ? '#166534' : '#334155', fontWeight: isSelected ? 600 : 400, transition: 'background 0.15s' }}
                                                >
                                                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', border: isSelected ? '2px solid #22c55e' : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isSelected ? '#22c55e' : 'transparent' }}>
                                                        {isSelected && <Check size={12} color="#fff" />}
                                                    </span>
                                                    {amenity.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))}
                                {filteredAmenityCategories.length === 0 && (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>No amenities match your search</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Media */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Media</h2>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Video URL</label>
                        <input type="url" name="video_url" value={formData.video_url} onChange={handleChange} className={formStyles.input} placeholder="https://youtube.com/embed/..." />
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Property Images</label>
                        <MultiImageUpload
                            images={images}
                            onChange={setImages}
                            folder="properties"
                            label="Upload Property Images"
                        />
                    </div>
                </div>

                {/* Floor Plans */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Floor Plans</h2>

                    {floorPlans.map((fp, index) => (
                        <div key={index} className={formStyles.floorPlanRow}>
                            <div className={formStyles.grid2}>
                                <input
                                    type="text"
                                    value={fp.name}
                                    onChange={(e) => handleFloorPlanChange(index, 'name', e.target.value)}
                                    className={formStyles.input}
                                    placeholder="Floor name (e.g., Ground Floor)"
                                />
                                <div style={{ marginTop: '8px' }}>
                                    <ImageUpload
                                        value={fp.image}
                                        onChange={(url) => handleFloorPlanChange(index, 'image', url)}
                                        folder="properties/floor-plans"
                                        label="Upload Floor Plan"
                                    />
                                </div>
                                {floorPlans.length > 1 && (
                                    <button type="button" onClick={() => removeFloorPlan(index)} className={formStyles.removeBtn} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addFloorPlan} className={formStyles.addImageBtn}>
                        <Plus size={16} /> Add Floor Plan
                    </button>
                </div>

                {/* Actions */}
                <div className={formStyles.actions}>
                    <Link href="/admin/properties" className={formStyles.cancelBtn}>Cancel</Link>
                    <button type="submit" disabled={saving} className={formStyles.submitBtn}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
