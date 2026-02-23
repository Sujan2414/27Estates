'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ImageUpload from '@/components/admin/ImageUpload'
import styles from '../../admin.module.css'
import formStyles from '../../properties/form.module.css'

export default function NewAgentPage() {
    const router = useRouter()
    const supabase = createAdminBrowserClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        image: '',
        role: 'Agent',
        bio: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: insertError } = await supabase
                .from('agents')
                .insert([formData])

            if (insertError) throw insertError

            router.push('/admin/agents')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create agent')
        } finally {
            setLoading(false)
        }
    }

    const roles = ['Agent', 'Senior Property Consultant', 'Luxury Properties Specialist', 'Commercial Properties Expert', 'Property Manager']

    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/agents" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Add New Agent</h1>
                    <p className={styles.pageSubtitle}>Create a new property agent</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={formStyles.form}>
                {error && <div className={formStyles.error}>{error}</div>}

                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Agent Information</h2>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={formStyles.input}
                                placeholder="e.g., John Smith"
                                required
                            />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={formStyles.input}
                                placeholder="e.g., john@27estates.com"
                                required
                            />
                        </div>
                    </div>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={formStyles.input}
                                placeholder="e.g., +1 (555) 123-4567"
                            />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={formStyles.select}
                            >
                                {roles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Profile Image</label>
                        <ImageUpload
                            value={formData.image}
                            onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                            folder="agents"
                            label="Upload Profile Photo"
                        />
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className={formStyles.textarea}
                            placeholder="Brief description of the agent's experience and expertise..."
                            rows={4}
                        />
                    </div>
                </div>

                <div className={formStyles.actions}>
                    <Link href="/admin/agents" className={formStyles.cancelBtn}>
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading} className={formStyles.submitBtn}>
                        {loading ? 'Creating...' : 'Create Agent'}
                    </button>
                </div>
            </form>
        </div>
    )
}
