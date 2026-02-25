'use client'

import { useState, useEffect } from 'react'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { UserPlus, ArrowRight, X, Search, Loader2 } from 'lucide-react'
import styles from '../property-wizard.module.css'

interface StepProps {
    initialData: any
    onNext: (data: any) => void
}

interface Owner {
    id: string
    name: string
    phone: string | null
    email: string | null
    company: string | null
}

export default function PropertyContactStep({ initialData, onNext }: StepProps) {
    const supabase = createAdminBrowserClient()
    const [owners, setOwners] = useState<Owner[]>([])
    const [selectedOwner, setSelectedOwner] = useState(initialData.owner_id || '')
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // New owner form
    const [newOwner, setNewOwner] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
        address: '',
        notes: '',
    })

    useEffect(() => {
        fetchOwners()
    }, [])

    async function fetchOwners() {
        setLoading(true)
        const { data } = await supabase
            .from('owners')
            .select('id, name, phone, email, company')
            .order('name')
        if (data) setOwners(data)
        setLoading(false)
    }

    const filteredOwners = owners.filter(owner => {
        const q = searchQuery.toLowerCase()
        return (
            owner.name.toLowerCase().includes(q) ||
            (owner.phone && owner.phone.includes(q)) ||
            (owner.email && owner.email.toLowerCase().includes(q)) ||
            (owner.company && owner.company.toLowerCase().includes(q))
        )
    })

    const selectedOwnerData = owners.find(o => o.id === selectedOwner)

    const handleCreateOwner = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newOwner.name.trim()) {
            setCreateError('Owner name is required')
            return
        }

        // Check for duplicates
        if (newOwner.phone) {
            const isPhoneDuplicate = owners.some(o => o.phone === newOwner.phone.trim())
            if (isPhoneDuplicate) {
                setCreateError('An owner with this phone number already exists.')
                return
            }
        }
        if (newOwner.email) {
            const isEmailDuplicate = owners.some(o => o.email?.toLowerCase() === newOwner.email.trim().toLowerCase())
            if (isEmailDuplicate) {
                setCreateError('An owner with this email already exists.')
                return
            }
        }

        setCreating(true)
        setCreateError(null)

        try {
            const { data, error } = await supabase
                .from('owners')
                .insert([{
                    name: newOwner.name.trim(),
                    phone: newOwner.phone.trim() || null,
                    email: newOwner.email.trim() || null,
                    company: newOwner.company.trim() || null,
                    address: newOwner.address.trim() || null,
                    notes: newOwner.notes.trim() || null,
                }])
                .select('id, name, phone, email, company')
                .single()

            if (error) throw error

            // Add to list and auto-select
            setOwners(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
            setSelectedOwner(data.id)
            setShowCreateForm(false)
            setNewOwner({ name: '', phone: '', email: '', company: '', address: '', notes: '' })
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create owner')
        } finally {
            setCreating(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedOwner) {
            alert('Please select an Owner/Landlord')
            return
        }
        onNext({ owner_id: selectedOwner })
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className={styles.stepTitle}>Owner / Landlord Details</h2>

            {/* Search & Select Owner */}
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div className={styles.field}>
                    <label className={styles.label}>
                        Select Owner/Landlord <span>*</span>
                    </label>

                    {/* Search bar */}
                    <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Search by name, phone, email, or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '36px' }}
                        />
                    </div>

                    {/* Custom Searchable Dropdown */}
                    <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                        {!selectedOwnerData ? (
                            <div style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: '#ffffff',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    background: '#f8fafc',
                                    padding: '10px 14px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Select from matches
                                </div>
                                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                    {filteredOwners.length > 0 ? (
                                        filteredOwners.map(owner => (
                                            <div
                                                key={owner.id}
                                                onClick={() => setSelectedOwner(owner.id)}
                                                style={{
                                                    padding: '12px 14px',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{owner.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '12px' }}>
                                                    {owner.phone && <span>📞 {owner.phone}</span>}
                                                    {owner.email && <span>✉️ {owner.email}</span>}
                                                    {owner.company && <span>🏢 {owner.company}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                            No owners found matching "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Selected owner card */}
                {selectedOwnerData && (
                    <div style={{
                        padding: '16px 20px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div>
                            <div style={{ fontWeight: 600, color: '#166534', fontSize: '1rem' }}>
                                ✅ {selectedOwnerData.name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '4px' }}>
                                {[selectedOwnerData.phone, selectedOwnerData.email, selectedOwnerData.company]
                                    .filter(Boolean)
                                    .join(' • ') || 'No contact details'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedOwner('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Create New Owner Toggle */}
                {!showCreateForm ? (
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.successBtn}`}
                        onClick={() => setShowCreateForm(true)}
                        style={{ marginBottom: '1.5rem' }}
                    >
                        <UserPlus size={16} /> ADD NEW OWNER
                    </button>
                ) : (
                    /* Inline Create Form */
                    <div style={{
                        padding: '24px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                                Add New Owner
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setShowCreateForm(false); setCreateError(null) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {createError && (
                            <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {createError}
                            </div>
                        )}

                        <div className={styles.grid2}>
                            <div className={styles.field}>
                                <label className={styles.label}>Name <span>*</span></label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Owner full name"
                                    value={newOwner.name}
                                    onChange={(e) => setNewOwner(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Phone</label>
                                <input
                                    type="tel"
                                    className={styles.input}
                                    placeholder="+91 XXXXX XXXXX"
                                    value={newOwner.phone}
                                    onChange={(e) => setNewOwner(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className={styles.grid2}>
                            <div className={styles.field}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="owner@email.com"
                                    value={newOwner.email}
                                    onChange={(e) => setNewOwner(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Company</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Company name (if any)"
                                    value={newOwner.company}
                                    onChange={(e) => setNewOwner(prev => ({ ...prev, company: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Address</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Owner address"
                                value={newOwner.address}
                                onChange={(e) => setNewOwner(prev => ({ ...prev, address: e.target.value }))}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Notes</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Any additional notes about this owner..."
                                value={newOwner.notes}
                                onChange={(e) => setNewOwner(prev => ({ ...prev, notes: e.target.value }))}
                                rows={2}
                            />
                        </div>

                        <button
                            type="button"
                            className={`${styles.btn} ${styles.successBtn}`}
                            onClick={handleCreateOwner}
                            disabled={creating}
                            style={{ width: '100%' }}
                        >
                            {creating ? (
                                <><Loader2 size={16} className="animate-spin" /> Creating...</>
                            ) : (
                                <><UserPlus size={16} /> CREATE OWNER</>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className={styles.actions} style={{ justifyContent: 'center' }}>
                <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                    CONTINUE <ArrowRight size={16} />
                </button>
                <button type="button" className={`${styles.btn} ${styles.secondaryBtn}`} onClick={() => window.history.back()}>
                    CANCEL
                </button>
            </div>

            {loading && <div className={styles.loadingOverlay}>Loading owners...</div>}
        </form>
    )
}
