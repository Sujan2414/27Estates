'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import styles from '../../../admin.module.css'
import formStyles from '../../form.module.css'

interface Agent {
    id: string
    name: string
}

interface FloorPlan {
    name: string
    image: string
}

export default function EditPropertyPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])

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
    const [amenities, setAmenities] = useState({
        interior: [''],
        outdoor: [''],
        utilities: [''],
        other: [''],
    })

    // Images & Floor Plans
    const [images, setImages] = useState<string[]>([''])
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([{ name: '', image: '' }])

    useEffect(() => {
        fetchProperty()
        fetchAgents()
    }, [])

    const fetchProperty = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', params.id)
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

        // Parse amenities
        const am = data.amenities || {}
        setAmenities({
            interior: am.interior?.length > 0 ? am.interior : [''],
            outdoor: am.outdoor?.length > 0 ? am.outdoor : [''],
            utilities: am.utilities?.length > 0 ? am.utilities : [''],
            other: am.other?.length > 0 ? am.other : [''],
        })

        // Parse images
        setImages(data.images?.length > 0 ? data.images : [''])

        // Parse floor plans
        const fp = data.floor_plans || []
        setFloorPlans(fp.length > 0 ? fp : [{ name: '', image: '' }])

        setLoading(false)
    }

    const fetchAgents = async () => {
        const { data } = await supabase.from('agents').select('id, name')
        if (data) setAgents(data)
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
    const handleAmenityChange = (category: keyof typeof amenities, index: number, value: string) => {
        setAmenities(prev => ({
            ...prev,
            [category]: prev[category].map((item, i) => i === index ? value : item)
        }))
    }

    const addAmenity = (category: keyof typeof amenities) => {
        setAmenities(prev => ({
            ...prev,
            [category]: [...prev[category], '']
        }))
    }

    const removeAmenity = (category: keyof typeof amenities, index: number) => {
        setAmenities(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }))
    }

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

            const amenitiesData = {
                interior: amenities.interior.filter(a => a.trim() !== ''),
                outdoor: amenities.outdoor.filter(a => a.trim() !== ''),
                utilities: amenities.utilities.filter(a => a.trim() !== ''),
                other: amenities.other.filter(a => a.trim() !== ''),
            }

            const floorPlansData = floorPlans.filter(fp => fp.name.trim() !== '' || fp.image.trim() !== '')

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
                video_url: formData.video_url || null,
                images: images.filter(img => img.trim() !== ''),
                amenities: amenitiesData,
                floor_plans: floorPlansData.length > 0 ? floorPlansData : null,
            }

            const { error: updateError } = await supabase
                .from('properties')
                .update(propertyData)
                .eq('id', params.id)

            if (updateError) throw updateError

            router.push('/admin/properties')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update property')
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
                            <label className={formStyles.label}>Agent</label>
                            <select name="agent_id" value={formData.agent_id} onChange={handleChange} className={formStyles.select}>
                                <option value="">Select Agent</option>
                                {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
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

                    {(['interior', 'outdoor', 'utilities', 'other'] as const).map(category => (
                        <div key={category} className={formStyles.amenityGroup}>
                            <label className={formStyles.label}>{category.charAt(0).toUpperCase() + category.slice(1)}</label>
                            {amenities[category].map((item, index) => (
                                <div key={index} className={formStyles.imageInput}>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleAmenityChange(category, index, e.target.value)}
                                        className={formStyles.input}
                                        placeholder={`Add ${category} amenity...`}
                                    />
                                    {amenities[category].length > 1 && (
                                        <button type="button" onClick={() => removeAmenity(category, index)} className={formStyles.removeBtn}>
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => addAmenity(category)} className={formStyles.addImageBtn}>
                                <Plus size={16} /> Add {category}
                            </button>
                        </div>
                    ))}
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
                        {images.map((img, index) => (
                            <div key={index} className={formStyles.imageInput}>
                                <input type="url" value={img} onChange={(e) => handleImageChange(index, e.target.value)} className={formStyles.input} placeholder="Image URL" />
                                {images.length > 1 && (
                                    <button type="button" onClick={() => removeImage(index)} className={formStyles.removeBtn}>
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addImage} className={formStyles.addImageBtn}>
                            <Plus size={16} /> Add Image
                        </button>
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
                                <div className={formStyles.imageInput}>
                                    <input
                                        type="url"
                                        value={fp.image}
                                        onChange={(e) => handleFloorPlanChange(index, 'image', e.target.value)}
                                        className={formStyles.input}
                                        placeholder="Floor plan image URL"
                                    />
                                    {floorPlans.length > 1 && (
                                        <button type="button" onClick={() => removeFloorPlan(index)} className={formStyles.removeBtn}>
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
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
