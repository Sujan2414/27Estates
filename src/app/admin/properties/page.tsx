'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Search, Star } from 'lucide-react'
import styles from '../admin.module.css'
import propertyStyles from './properties.module.css'

interface Property {
    id: string
    property_id: string
    title: string
    price: number
    price_text: string | null
    location: string
    city: string | null
    bedrooms: number
    bathrooms: number
    sqft: number
    category: string
    sub_category: string | null
    furnishing: string | null
    project_name: string | null
    property_type: string
    is_featured: boolean
    images: string[]
    created_at: string
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchProperties()
    }, [])

    const fetchProperties = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setProperties(data)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id)

        if (!error) {
            setProperties(properties.filter(p => p.id !== id))
        }
        setDeleteId(null)
    }

    const toggleFeatured = async (id: string, currentValue: boolean) => {
        const { error } = await supabase
            .from('properties')
            .update({ is_featured: !currentValue })
            .eq('id', id)

        if (!error) {
            setProperties(properties.map(p =>
                p.id === id ? { ...p, is_featured: !currentValue } : p
            ))
        }
    }

    const filteredProperties = properties.filter(property =>
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.property_id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatPrice = (price: number) => {
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} L`
        }
        return `₹${price.toLocaleString('en-IN')}`
    }

    return (
        <div className={styles.dashboard}>
            <div className={propertyStyles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Properties</h1>
                    <p className={styles.pageSubtitle}>Manage your property listings</p>
                </div>
                <Link href="/admin/properties/new" className={styles.addButton}>
                    <Plus size={18} />
                    Add Property
                </Link>
            </div>

            {/* Search */}
            <div className={propertyStyles.searchBar}>
                <Search size={20} className={propertyStyles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={propertyStyles.searchInput}
                />
            </div>

            {/* Properties Grid */}
            {loading ? (
                <div className={styles.emptyState}>Loading properties...</div>
            ) : filteredProperties.length > 0 ? (
                <div className={propertyStyles.grid}>
                    {filteredProperties.map((property) => (
                        <div key={property.id} className={propertyStyles.card}>
                            <div className={propertyStyles.imageContainer}>
                                {property.images && property.images.length > 0 ? (
                                    <Image
                                        src={property.images[0]}
                                        alt={property.title}
                                        fill
                                        className={propertyStyles.image}
                                    />
                                ) : (
                                    <div className={propertyStyles.noImage}>No Image</div>
                                )}
                                <button
                                    className={`${propertyStyles.featuredBtn} ${property.is_featured ? propertyStyles.featuredActive : ''}`}
                                    onClick={() => toggleFeatured(property.id, property.is_featured)}
                                    title={property.is_featured ? 'Remove from featured' : 'Add to featured'}
                                >
                                    <Star size={16} fill={property.is_featured ? '#BFA270' : 'none'} />
                                </button>
                            </div>

                            <div className={propertyStyles.content}>
                                <div className={propertyStyles.tags}>
                                    <span className={propertyStyles.tag}>{property.property_type}</span>
                                    <span className={propertyStyles.tag}>{property.category}</span>
                                </div>

                                <h3 className={propertyStyles.title}>{property.title}</h3>
                                <p className={propertyStyles.location}>{property.location}</p>

                                <div className={propertyStyles.details}>
                                    <span>{property.bedrooms} Beds</span>
                                    <span>{property.bathrooms} Baths</span>
                                    <span>{property.sqft.toLocaleString()} sqft</span>
                                </div>

                                <div className={propertyStyles.footer}>
                                    <span className={propertyStyles.price}>{formatPrice(property.price)}</span>
                                    <div className={propertyStyles.actions}>
                                        <Link href={`/admin/properties/${property.id}/edit`} className={propertyStyles.actionBtn}>
                                            <Pencil size={16} />
                                        </Link>
                                        <button
                                            className={`${propertyStyles.actionBtn} ${propertyStyles.deleteBtn}`}
                                            onClick={() => setDeleteId(property.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    {searchQuery ? 'No properties match your search' : 'No properties yet. Add your first property!'}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className={propertyStyles.modal}>
                    <div className={propertyStyles.modalContent}>
                        <h3>Delete Property?</h3>
                        <p>Are you sure you want to delete this property? This action cannot be undone.</p>
                        <div className={propertyStyles.modalActions}>
                            <button
                                className={propertyStyles.cancelBtn}
                                onClick={() => setDeleteId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className={propertyStyles.confirmDeleteBtn}
                                onClick={() => handleDelete(deleteId)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
