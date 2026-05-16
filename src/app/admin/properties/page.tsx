'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Search, FileSpreadsheet, Star, MessageCircleQuestion } from 'lucide-react'
import BulkUploadModal from '@/components/admin/BulkUploadModal'
import { proxyUrl } from '@/lib/proxy-url'
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
    display_order: number | null
    images: string[]
    created_at: string
}

// UI label → DB value. Matches the public /properties page so admin and
// public stay aligned on what "Buy" means (DB stores 'Sale').
const LISTING_FILTERS: { ui: 'Buy' | 'Rent' | 'Lease'; db: 'Sale' | 'Rent' | 'Lease' }[] = [
    { ui: 'Buy',   db: 'Sale'  },
    { ui: 'Rent',  db: 'Rent'  },
    { ui: 'Lease', db: 'Lease' },
]

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [listingFilter, setListingFilter] = useState<'Sale' | 'Rent' | 'Lease'>('Rent')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchProperties()
    }, [])

    const fetchProperties = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .not('category', 'in', '("Commercial","Office","Offices","Warehouse")')
            .order('display_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false })

        if (!error && data) {
            setProperties(data)
        }
        setLoading(false)
    }

    const setPosition = async (id: string, position: number | null) => {
        await supabase.from('properties').update({ display_order: position, is_featured: position !== null }).eq('id', id)
        fetchProperties()
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


    const filteredProperties = properties.filter(property => {
        if (property.property_type !== listingFilter) return false
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            property.title.toLowerCase().includes(q) ||
            property.location.toLowerCase().includes(q) ||
            property.property_id.toLowerCase().includes(q)
        )
    })

    const formatPrice = (price: number, priceText: string | null) => {
        if (priceText) return priceText
        if (price <= 0) return 'Price on Request'
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
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowBulkModal(true)} className={styles.addButton} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                        <FileSpreadsheet size={18} />
                        Bulk Import
                    </button>
                    <Link href="/admin/properties/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Property
                    </Link>
                </div>
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

            {/* Listing-type filter — mirrors the public /properties tabs so admin
                stays aligned with what users see. */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {LISTING_FILTERS.map(({ ui, db }) => {
                    const active = listingFilter === db
                    const count = properties.filter(p => p.property_type === db).length
                    return (
                        <button
                            key={db}
                            onClick={() => setListingFilter(db)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '999px',
                                border: '1px solid',
                                borderColor: active ? '#183C38' : '#d1d5db',
                                backgroundColor: active ? '#183C38' : '#ffffff',
                                color: active ? '#ffffff' : '#374151',
                                fontSize: '0.8125rem',
                                fontWeight: active ? 600 : 500,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            For {ui === 'Buy' ? 'Sale' : ui}
                            <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>{count}</span>
                        </button>
                    )
                })}
            </div>

            {/* Priority note */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', marginBottom: '1.25rem', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px' }}>
                <Star size={16} fill="#d97706" stroke="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.5 }}>
                    <strong>Featured Priority (1–6, per listing type):</strong> Click the ☆ star on any property card to feature it. Each listing type (Sale / Rent / Lease) has its own 1→6 slots, so featuring a Rent property doesn't consume a Buy slot. Click a filled star to remove it.
                </div>
            </div>

            {/* Properties Grid */}
            {loading ? (
                <div className={styles.emptyState}>Loading properties...</div>
            ) : filteredProperties.length > 0 ? (
                <div className={propertyStyles.grid}>
                    {filteredProperties.map((property) => (
                        <div key={property.id} className={propertyStyles.card}>
                            <div className={propertyStyles.imageContainer} style={{ position: 'relative' }}>
                                {property.images && property.images.length > 0 ? (
                                    <Image
                                        src={proxyUrl(property.images[0])}
                                        alt={property.title}
                                        fill
                                        unoptimized
                                        className={propertyStyles.image}
                                    />
                                ) : (
                                    <div className={propertyStyles.noImage}>No Image</div>
                                )}
                                {/* Star badge — slots are scoped to this row's listing type
                                    so each of Sale / Rent / Lease has its own 1→6 sequence. */}
                                {(() => {
                                    const isActive = !!property.display_order
                                    const usedSlots = properties
                                        .filter(p => p.property_type === property.property_type && p.display_order !== null)
                                        .map(p => p.display_order as number)
                                    const nextSlot = [1,2,3,4,5,6].find(n => !usedSlots.includes(n))
                                    const canAdd = !isActive && !!nextSlot && usedSlots.length < 6
                                    return (
                                        <button
                                            title={isActive ? `Featured #${property.display_order} — click to remove` : canAdd ? `Click to feature as #${nextSlot}` : 'All 6 slots taken'}
                                            onClick={() => (canAdd || isActive) ? setPosition(property.id, isActive ? null : nextSlot!) : undefined}
                                            style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: canAdd || isActive ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, padding: 0, backgroundColor: isActive ? '#183C38' : 'rgba(255,255,255,0.88)', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
                                        >
                                            <Star size={14} fill={isActive ? '#c9a96e' : 'none'} stroke={isActive ? '#c9a96e' : '#9ca3af'} />
                                            {isActive && <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#c9a96e', lineHeight: 1, marginTop: '-1px' }}>{property.display_order}</span>}
                                        </button>
                                    )
                                })()}
                            </div>

                            <div className={propertyStyles.content}>
                                <div className={propertyStyles.tags}>
                                    <span className={propertyStyles.tag}>{property.property_type}</span>
                                    <span className={propertyStyles.tag}>{property.category}</span>
                                </div>

                                <h3 className={propertyStyles.title}>{property.title}</h3>
                                <p className={propertyStyles.location}>{property.location}</p>

                                <div className={propertyStyles.details}>
                                    {!['Commercial', 'Office', 'Offices', 'Warehouse', 'Plot'].includes(property.category) ? (
                                        <>
                                            <span>{property.bedrooms} Beds</span>
                                            <span>{property.bathrooms} Baths</span>
                                            <span>{property.sqft.toLocaleString()} sqft</span>
                                        </>
                                    ) : (
                                        <>
                                            {property.bathrooms > 0 && <span>{property.bathrooms} Baths</span>}
                                            {property.sqft > 0 && <span>{property.sqft.toLocaleString()} sqft</span>}
                                            {property.furnishing && <span>{property.furnishing}</span>}
                                            {!property.furnishing && (property as unknown as Record<string, unknown>).ownership && <span>{String((property as unknown as Record<string, unknown>).ownership)}</span>}
                                        </>
                                    )}
                                </div>

                                <div className={propertyStyles.footer}>
                                    <span className={propertyStyles.price}>{formatPrice(property.price, property.price_text)}</span>
                                    <div className={propertyStyles.actions}>
                                        <Link href={`/admin/properties/${property.id}/edit`} className={propertyStyles.actionBtn} title="Edit property">
                                            <Pencil size={16} />
                                        </Link>
                                        <Link href={`/admin/properties/${property.id}/faqs`} className={propertyStyles.actionBtn} title="Edit FAQs (SEO/AEO)">
                                            <MessageCircleQuestion size={16} />
                                        </Link>
                                        <button
                                            className={`${propertyStyles.actionBtn} ${propertyStyles.deleteBtn}`}
                                            onClick={() => setDeleteId(property.id)}
                                            title="Delete property"
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
            {showBulkModal && (
                <BulkUploadModal
                    type="property"
                    onClose={() => setShowBulkModal(false)}
                    onComplete={() => { fetchProperties(); }}
                />
            )}
        </div>
    )
}
