'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Search, FileSpreadsheet, Star } from 'lucide-react'
import BulkUploadModal from '@/components/admin/BulkUploadModal'
import { proxyUrl } from '@/lib/proxy-url'
import styles from '../admin.module.css'
import propertyStyles from '../properties/properties.module.css'

interface Project {
    id: string
    project_id: string
    project_name: string
    location: string
    city: string | null
    category: string
    sub_category: string | null
    status: string
    min_area: number | null
    max_area: number | null
    min_price: string | null
    max_price: string | null
    is_featured: boolean
    display_order: number | null
    images: string[]
    created_at: string
}

export default function CommercialPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchProjects() }, [])

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('section', 'commercial')
            .order('display_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false })
        if (!error && data) setProjects(data as unknown as Project[])
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (!error) setProjects(projects.filter(p => p.id !== id))
        setDeleteId(null)
    }

    const setPosition = async (id: string, position: number | null) => {
        await supabase.from('projects').update({ display_order: position, is_featured: position !== null }).eq('id', id)
        fetchProjects()
    }

    const filteredProjects = projects.filter(project =>
        project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className={styles.dashboard}>
            <div className={propertyStyles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Commercial</h1>
                    <p className={styles.pageSubtitle}>Manage commercial project listings</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowBulkModal(true)} className={styles.addButton} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                        <FileSpreadsheet size={18} /> Bulk Import
                    </button>
                    <Link href="/admin/commercial/new" className={styles.addButton}>
                        <Plus size={18} /> Add Commercial
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className={propertyStyles.searchBar}>
                <Search size={20} className={propertyStyles.searchIcon} />
                <input type="text" placeholder="Search commercial listings..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className={propertyStyles.searchInput} />
            </div>

            {/* Priority note */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', marginBottom: '1.25rem', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px' }}>
                <Star size={16} fill="#d97706" stroke="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.5 }}>
                    <strong>Featured Priority (1–6):</strong> Click the ☆ star on any card to feature it on the website. The next available slot (1→6) is auto-assigned. Featured listings appear first in the Commercial section in that order. Click a filled star to remove it.
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className={styles.emptyState}>Loading commercial listings...</div>
            ) : filteredProjects.length > 0 ? (
                <div className={propertyStyles.grid}>
                    {filteredProjects.map((project) => (
                        <div key={project.id} className={propertyStyles.card}>
                            <div className={propertyStyles.imageContainer} style={{ position: 'relative' }}>
                                {project.images && project.images.length > 0 ? (
                                    <Image src={proxyUrl(project.images[0])} alt={project.project_name} fill unoptimized className={propertyStyles.image} />
                                ) : (
                                    <div className={propertyStyles.noImage}>No Image</div>
                                )}
                                {/* Star badge */}
                                {(() => {
                                    const isActive = !!project.display_order
                                    const usedSlots = projects.filter(p => p.display_order !== null).map(p => p.display_order as number)
                                    const nextSlot = [1,2,3,4,5,6].find(n => !usedSlots.includes(n))
                                    const canAdd = !isActive && !!nextSlot && usedSlots.length < 6
                                    return (
                                        <button
                                            title={isActive ? `Featured #${project.display_order} — click to remove` : canAdd ? `Click to feature as #${nextSlot}` : 'All 6 slots taken'}
                                            onClick={() => (canAdd || isActive) ? setPosition(project.id, isActive ? null : nextSlot!) : undefined}
                                            style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: canAdd || isActive ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, padding: 0, backgroundColor: isActive ? '#183C38' : 'rgba(255,255,255,0.88)', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
                                        >
                                            <Star size={14} fill={isActive ? '#c9a96e' : 'none'} stroke={isActive ? '#c9a96e' : '#9ca3af'} />
                                            {isActive && <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#c9a96e', lineHeight: 1, marginTop: '-1px' }}>{project.display_order}</span>}
                                        </button>
                                    )
                                })()}
                            </div>

                            <div className={propertyStyles.content}>
                                <div className={propertyStyles.tags}>
                                    <span className={propertyStyles.tag}>{project.status}</span>
                                    {project.sub_category && <span className={propertyStyles.tag}>{project.sub_category}</span>}
                                    {project.display_order && <span className={propertyStyles.tag} style={{ background: '#183C38', color: '#c9a96e' }}>★ #{project.display_order}</span>}
                                </div>
                                <h3 className={propertyStyles.title}>{project.project_name}</h3>
                                <p className={propertyStyles.location}>{project.location}{project.city ? `, ${project.city}` : ''}</p>
                                <div className={propertyStyles.details}>
                                    {project.min_area && project.max_area && <span>{project.min_area} - {project.max_area} sqft</span>}
                                </div>
                                <div className={propertyStyles.footer}>
                                    <span className={propertyStyles.price}>
                                        {project.min_price ? `${project.min_price}${project.max_price ? ` - ${project.max_price}` : ''}` : 'Request for Details'}
                                    </span>
                                    <div className={propertyStyles.actions}>
                                        <Link href={`/admin/projects/${project.id}/edit`} className={propertyStyles.actionBtn}><Pencil size={16} /></Link>
                                        <button className={`${propertyStyles.actionBtn} ${propertyStyles.deleteBtn}`} onClick={() => setDeleteId(project.id)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    {searchQuery ? 'No commercial listings match your search' : 'No commercial listings yet. Add your first!'}
                </div>
            )}

            {deleteId && (
                <div className={propertyStyles.modal}>
                    <div className={propertyStyles.modalContent}>
                        <h3>Delete Commercial Listing?</h3>
                        <p>Are you sure you want to delete this listing? This action cannot be undone.</p>
                        <div className={propertyStyles.modalActions}>
                            <button className={propertyStyles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className={propertyStyles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {showBulkModal && (
                <BulkUploadModal type="project" section="commercial" onClose={() => setShowBulkModal(false)} onComplete={() => { fetchProjects() }} />
            )}
        </div>
    )
}
