'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ImageUpload from '@/components/admin/ImageUpload'
import styles from '../../../admin.module.css'
import formStyles from '../../../properties/form.module.css'

export default function EditAgentPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        image: '',
        role: 'Agent',
        bio: '',
    })

    useEffect(() => {
        fetchAgent()
    }, [])

    const fetchAgent = async () => {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', params?.id as string)
            .single()

        if (error || !data) {
            setError('Agent not found')
            setLoading(false)
            return
        }

        setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            image: data.image || '',
            role: data.role || 'Agent',
            bio: data.bio || '',
        })
        setLoading(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const { error: updateError } = await supabase
                .from('agents')
                .update(formData)
                .eq('id', params?.id as string)

            if (updateError) throw updateError

            router.push('/admin/agents')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update agent')
        } finally {
            setSaving(false)
        }
    }

    const roles = ['Agent', 'Senior Property Consultant', 'Luxury Properties Specialist', 'Commercial Properties Expert', 'Property Manager']

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.emptyState}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading agent...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/agents" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Edit Agent</h1>
                    <p className={styles.pageSubtitle}>{formData.name}</p>
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
                            rows={4}
                        />
                    </div>
                </div>

                <div className={formStyles.actions}>
                    <Link href="/admin/agents" className={formStyles.cancelBtn}>
                        Cancel
                    </Link>
                    <button type="submit" disabled={saving} className={formStyles.submitBtn}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
