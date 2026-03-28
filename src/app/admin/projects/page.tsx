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
    status: string
    bhk_options: string[] | null
    min_area: number | null
    max_area: number | null
    min_price: string | null
    max_price: string | null
    is_featured: boolean
    display_order: number | null
    images: string[]
    created_at: string
}

export default function ProjectsPage() {
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
            .or('section.eq.residential,section.is.null')
            .order('display_order', { ascending: true, nullsFirst: false })
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

    const setPosition = async (id: string, position: number | null) => {
        const { error } = await supabase
            .from('projects')
            .update({ display_order: position, is_featured: position !== null })
            .eq('id', id)
        if (!error) fetchProjects()
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
                    <h1 className={styles.pageTitle}>Projects</h1>
                    <p className={styles.pageSubtitle}>Manage your project listings</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowBulkModal(true)} className={styles.addButton} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                        <FileSpreadsheet size={18} />
                        Bulk Import
                    </button>
                    <Link href="/admin/projects/new" className={styles.addButton}>
                        <Plus size={18} />
                        Add Project
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className={propertyStyles.searchBar}>
                <Search size={20} className={propertyStyles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={propertyStyles.searchInput}
                />
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className={styles.emptyState}>Loading projects...</div>
            ) : filteredProjects.length > 0 ? (
                <div className={propertyStyles.grid}>
                    {filteredProjects.map((project) => (
                        <div key={project.id} className={propertyStyles.card}>
                            <div className={propertyStyles.imageContainer} style={{ position: 'relative' }}>
                                {project.images && project.images.length > 0 ? (
                                    <Image
                                        src={proxyUrl(project.images[0])}
                                        alt={project.project_name}
                                        fill
                                        unoptimized
                                        className={propertyStyles.image}
                                    />
                                ) : (
                                    <div className={propertyStyles.noImage}>No Image</div>
                                )}

                                {/* Priority position badge */}
                                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, zIndex: 10 }}>
                                    {[1,2,3,4,5,6].map(n => {
                                        const isActive = project.display_order === n
                                        const takenBy = projects.find(p => p.display_order === n && p.id !== project.id)
                                        return (
                                            <button
                                                key={n}
                                                title={takenBy ? `Slot ${n} taken by "${takenBy.project_name}"` : isActive ? `Remove from slot ${n}` : `Set as slot ${n}`}
                                                onClick={() => setPosition(project.id, isActive ? null : n)}
                                                style={{
                                                    width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                                    fontSize: '0.65rem', fontWeight: 700, lineHeight: 1,
                                                    backgroundColor: isActive ? '#183C38' : takenBy ? '#9ca3af' : 'rgba(255,255,255,0.85)',
                                                    color: isActive ? '#c9a96e' : takenBy ? '#fff' : '#374151',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                                    outline: isActive ? '2px solid #c9a96e' : 'none',
                                                    outlineOffset: 1,
                                                }}
                                            >{n}</button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className={propertyStyles.content}>
                                <div className={propertyStyles.tags}>
                                    <span className={propertyStyles.tag}>{project.status}</span>
                                    <span className={propertyStyles.tag}>{project.category}</span>
                                    {project.display_order && <span className={propertyStyles.tag} style={{ background: '#183C38', color: '#c9a96e' }}>#{project.display_order} Featured</span>}
                                </div>

                                <h3 className={propertyStyles.title}>{project.project_name}</h3>
                                <p className={propertyStyles.location}>{project.location}{project.city ? `, ${project.city}` : ''}</p>

                                <div className={propertyStyles.details}>
                                    {project.bhk_options && project.bhk_options.length > 0 && (
                                        <span>{project.bhk_options.join(', ')}</span>
                                    )}
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
                    {searchQuery ? 'No projects match your search' : 'No projects yet. Add your first project!'}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className={propertyStyles.modal}>
                    <div className={propertyStyles.modalContent}>
                        <h3>Delete Project?</h3>
                        <p>Are you sure you want to delete this project? This action cannot be undone.</p>
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
                    type="project"
                    onClose={() => setShowBulkModal(false)}
                    onComplete={() => { fetchProjects(); }}
                />
            )}
        </div>
    )
}
