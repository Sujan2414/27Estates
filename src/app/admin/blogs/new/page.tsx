'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import styles from '../../admin.module.css'
import formStyles from '../../properties/form.module.css'

export default function NewBlogPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        // Auto-generate slug from title
        if (name === 'title') {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            setFormData(prev => ({ ...prev, slug }))
        }
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
        setLoading(true)
        setError(null)

        try {
            const blogData = {
                ...formData,
                tags,
                published_at: publish ? new Date().toISOString() : null,
            }

            const { error: insertError } = await supabase
                .from('blogs')
                .insert([blogData])

            if (insertError) throw insertError

            router.push('/admin/blogs')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create blog post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/blogs" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Add New Blog Post</h1>
                    <p className={styles.pageSubtitle}>Create a new article</p>
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
                            placeholder="e.g., Top 10 Real Estate Investment Tips for 2024"
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
                                placeholder="auto-generated-from-title"
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
                                placeholder="e.g., 5 min read"
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
                            placeholder="Brief summary of the article..."
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
                            placeholder="Write your article content here... (Markdown supported)"
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
                                placeholder="e.g., John Smith"
                                required
                            />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Author Image URL</label>
                            <input
                                type="url"
                                name="author_image"
                                value={formData.author_image}
                                onChange={handleChange}
                                className={formStyles.input}
                                placeholder="https://example.com/author.jpg"
                            />
                        </div>
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Cover Image URL</label>
                        <input
                            type="url"
                            name="cover_image"
                            value={formData.cover_image}
                            onChange={handleChange}
                            className={formStyles.input}
                            placeholder="https://example.com/cover.jpg"
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
                    <button type="submit" disabled={loading} className={formStyles.submitBtn}>
                        {loading ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        className={formStyles.publishBtn}
                        onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                    >
                        {loading ? 'Publishing...' : 'Publish Now'}
                    </button>
                </div>
            </form>
        </div>
    )
}
