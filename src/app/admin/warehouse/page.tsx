'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Search, FileSpreadsheet } from 'lucide-react'
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
    images: string[]
    created_at: string
}

export default function WarehousePage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('section', 'warehouse')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setProjects(data as unknown as Project[])
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (!error) {
            setProjects(projects.filter(p => p.id !== id))
        }
        setDeleteId(null)
    }

    const toggleFeatured = async (id: string, currentValue: boolean) => {
        const { error } = await supabase
            .from('projects')
            .update({ is_featured: !currentValue })
            .eq('id', id)

        if (!error) {
            setProjects(projects.map(p =>
                p.id === id ? { ...p, is_featured: !currentValue } : p
            ))
        }
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
                    <h1 className={styles.pageTitle}>Warehouse</h1>
                    <p className={styles.pageSubtitle}>Manage warehouse & industrial listings</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowBulkModal(true)} className={styles.addButton} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                        <FileSpreadsheet size={18} />
                        Bulk Import
                    </button>
                    <Link href="/admin/warehouse/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Warehouse
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className={propertyStyles.searchBar}>
                <Search size={20} className={propertyStyles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search warehouse listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={propertyStyles.searchInput}
                />
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className={styles.emptyState}>Loading warehouse listings...</div>
            ) : filteredProjects.length > 0 ? (
                <div className={propertyStyles.grid}>
                    {filteredProjects.map((project) => (
                        <div key={project.id} className={propertyStyles.card}>
                            <div className={propertyStyles.imageContainer}>
                                {project.images && project.images.length > 0 ? (
                                    <Image
                                        src={proxyUrl(project.images[0])}
                                        alt={project.project_name}
                                        fill
                                        className={propertyStyles.image}
                                    />
                                ) : (
                                    <div className={propertyStyles.noImage}>No Image</div>
                                )}
                            </div>

                            <div className={propertyStyles.content}>
                                <div className={propertyStyles.tags}>
                                    <span className={propertyStyles.tag}>{project.status}</span>
                                    {project.sub_category && <span className={propertyStyles.tag}>{project.sub_category}</span>}
                                </div>

                                <h3 className={propertyStyles.title}>{project.project_name}</h3>
                                <p className={propertyStyles.location}>{project.location}{project.city ? `, ${project.city}` : ''}</p>

                                <div className={propertyStyles.details}>
                                    {project.min_area && project.max_area && (
                                        <span>{project.min_area} - {project.max_area} sqft</span>
                                    )}
                                </div>

                                <div className={propertyStyles.footer}>
                                    <span className={propertyStyles.price}>
                                        {project.min_price ? `${project.min_price}${project.max_price ? ` - ${project.max_price}` : ''}` : 'Request for Details'}
                                    </span>
                                    <div className={propertyStyles.actions}>
                                        <Link href={`/admin/projects/${project.id}/edit`} className={propertyStyles.actionBtn}>
                                            <Pencil size={16} />
                                        </Link>
                                        <button
                                            className={`${propertyStyles.actionBtn} ${propertyStyles.deleteBtn}`}
                                            onClick={() => setDeleteId(project.id)}
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
                    {searchQuery ? 'No warehouse listings match your search' : 'No warehouse listings yet. Add your first!'}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className={propertyStyles.modal}>
                    <div className={propertyStyles.modalContent}>
                        <h3>Delete Warehouse Listing?</h3>
                        <p>Are you sure you want to delete this listing? This action cannot be undone.</p>
                        <div className={propertyStyles.modalActions}>
                            <button className={propertyStyles.cancelBtn} onClick={() => setDeleteId(null)}>
                                Cancel
                            </button>
                            <button className={propertyStyles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showBulkModal && (
                <BulkUploadModal
                    type="project"
                    section="warehouse"
                    onClose={() => setShowBulkModal(false)}
                    onComplete={() => { fetchProjects(); }}
                />
            )}
        </div>
    )
}
