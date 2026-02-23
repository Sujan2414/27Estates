'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ImageUpload from '@/components/admin/ImageUpload'
import styles from '../../../admin.module.css'
import formStyles from '../../../properties/form.module.css'

export default function EditBlogPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createAdminBrowserClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author: '',
        author_image: '',
        cover_image: '',
        reading_time: '',
        published_at: null as string | null,
    })

    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState('')

    useEffect(() => {
        fetchBlog()
    }, [])

    const fetchBlog = async () => {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', params?.id as string)
            .single()

        if (error || !data) {
            setError('Blog post not found')
            setLoading(false)
            return
        }

        setFormData({
            title: data.title || '',
            slug: data.slug || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            author: data.author || '',
            author_image: data.author_image || '',
            cover_image: data.cover_image || '',
            reading_time: data.reading_time || '',
            published_at: data.published_at,
        })
        setTags(data.tags || [])
        setLoading(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const addTag = () => {
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag])
            setNewTag('')
        }
    }

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const blogData = {
                ...formData,
                tags,
                published_at: publish ? new Date().toISOString() : formData.published_at,
            }

            const { error: updateError } = await supabase
                .from('blogs')
                .update(blogData)
                .eq('id', params?.id as string)

            if (updateError) throw updateError

            router.push('/admin/blogs')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update blog post')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.emptyState}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading blog post...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/blogs" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Edit Blog Post</h1>
                    <p className={styles.pageSubtitle}>{formData.title}</p>
                </div>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className={formStyles.form}>
                {error && <div className={formStyles.error}>{error}</div>}

                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Post Details</h2>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={formStyles.input}
                            required
                        />
                    </div>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Slug</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className={formStyles.input}
                            />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Reading Time</label>
                            <input
                                type="text"
                                name="reading_time"
                                value={formData.reading_time}
                                onChange={handleChange}
                                className={formStyles.input}
                            />
                        </div>
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Excerpt</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            className={formStyles.textarea}
                            rows={3}
                        />
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Content *</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            className={formStyles.textarea}
                            rows={15}
                            required
                        />
                    </div>
                </div>

                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Author & Media</h2>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Author Name *</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                className={formStyles.input}
                                required
                            />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Author Image</label>
                            <ImageUpload
                                value={formData.author_image}
                                onChange={(url) => setFormData(prev => ({ ...prev, author_image: url }))}
                                folder="blogs/authors"
                                label="Upload Author Photo"
                            />
                        </div>
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Cover Image</label>
                        <ImageUpload
                            value={formData.cover_image}
                            onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                            folder="blogs/covers"
                            label="Upload Cover Image"
                        />
                    </div>
                </div>

                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Tags</h2>

                    <div className={formStyles.tagsInput}>
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className={formStyles.input}
                            placeholder="Add a tag..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <button type="button" onClick={addTag} className={formStyles.addTagBtn}>
                            <Plus size={18} />
                        </button>
                    </div>

                    {tags.length > 0 && (
                        <div className={formStyles.tagsList}>
                            {tags.map(tag => (
                                <span key={tag} className={formStyles.tag}>
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)}>
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className={formStyles.actions}>
                    <Link href="/admin/blogs" className={formStyles.cancelBtn}>
                        Cancel
                    </Link>
                    <button type="submit" disabled={saving} className={formStyles.submitBtn}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {!formData.published_at && (
                        <button
                            type="button"
                            disabled={saving}
                            className={formStyles.publishBtn}
                            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                        >
                            Publish Now
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}
