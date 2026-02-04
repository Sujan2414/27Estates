'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Eye, Calendar } from 'lucide-react'
import styles from '../admin.module.css'

interface Blog {
    id: string
    slug: string
    title: string
    excerpt: string
    author: string
    cover_image: string
    tags: string[]
    published_at: string | null
    created_at: string
}

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchBlogs()
    }, [])

    const fetchBlogs = async () => {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setBlogs(data)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id)

        if (!error) {
            setBlogs(blogs.filter(b => b.id !== id))
        }
        setDeleteId(null)
    }

    const togglePublish = async (id: string, currentlyPublished: boolean) => {
        const { error } = await supabase
            .from('blogs')
            .update({ published_at: currentlyPublished ? null : new Date().toISOString() })
            .eq('id', id)

        if (!error) {
            setBlogs(blogs.map(b =>
                b.id === id ? { ...b, published_at: currentlyPublished ? null : new Date().toISOString() } : b
            ))
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Blog Posts</h1>
                    <p className={styles.pageSubtitle}>Manage your blog content</p>
                </div>
                <Link href="/admin/blogs/new" className={styles.addButton}>
                    <Plus size={18} />
                    Add Post
                </Link>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading blogs...</div>
            ) : blogs.length > 0 ? (
                <div className={styles.table}>
                    <div className={styles.tableHeader}>
                        <div className={styles.tableCell} style={{ flex: 2 }}>Title</div>
                        <div className={styles.tableCell}>Author</div>
                        <div className={styles.tableCell}>Status</div>
                        <div className={styles.tableCell}>Date</div>
                        <div className={styles.tableCell}>Actions</div>
                    </div>
                    {blogs.map((blog) => (
                        <div key={blog.id} className={styles.tableRow}>
                            <div className={styles.tableCell} style={{ flex: 2 }}>
                                <div>
                                    <strong>{blog.title}</strong>
                                    {blog.excerpt && (
                                        <p className={styles.blogExcerpt}>{blog.excerpt.substring(0, 80)}...</p>
                                    )}
                                </div>
                            </div>
                            <div className={styles.tableCell}>{blog.author}</div>
                            <div className={styles.tableCell}>
                                <button
                                    className={`${styles.statusBadge} ${blog.published_at ? styles.statusPublished : styles.statusDraft}`}
                                    onClick={() => togglePublish(blog.id, !!blog.published_at)}
                                >
                                    {blog.published_at ? 'Published' : 'Draft'}
                                </button>
                            </div>
                            <div className={styles.tableCell}>
                                <Calendar size={14} style={{ marginRight: 4 }} />
                                {formatDate(blog.created_at)}
                            </div>
                            <div className={styles.tableCell}>
                                <div className={styles.actionButtons}>
                                    <Link href={`/blog/${blog.slug}`} className={styles.iconBtn} title="View">
                                        <Eye size={16} />
                                    </Link>
                                    <Link href={`/admin/blogs/${blog.id}/edit`} className={styles.iconBtn} title="Edit">
                                        <Pencil size={16} />
                                    </Link>
                                    <button
                                        className={`${styles.iconBtn} ${styles.deleteIcon}`}
                                        onClick={() => setDeleteId(blog.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    No blog posts yet. Create your first post!
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Delete Blog Post?</h3>
                        <p>This action cannot be undone.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>
                                Cancel
                            </button>
                            <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
