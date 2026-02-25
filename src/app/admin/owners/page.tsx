'use client'

import { useEffect, useState } from 'react'
import { createAdminBrowserClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Mail, Phone, Building, X, Save, Loader2, Image as ImageIcon } from 'lucide-react'
import styles from '../admin.module.css'
import ImageUpload from '@/components/admin/ImageUpload'

interface Owner {
    id: string
    name: string
    phone: string | null
    email: string | null
    company: string | null
    address: string | null
    notes: string | null
    created_at: string
}

interface Developer {
    id: string
    name: string
    logo: string | null
    description: string | null
    created_at: string
}

export default function OwnersPage() {
    const supabase = createAdminBrowserClient()
    const [activeTab, setActiveTab] = useState<'owners' | 'developers'>('owners')
    const [owners, setOwners] = useState<Owner[]>([])
    const [developers, setDevelopers] = useState<Developer[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<{ id: string, type: 'owner' | 'developer' } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Owner Inline edit
    const [editId, setEditId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', company: '', address: '', notes: '' })
    const [editSaving, setEditSaving] = useState(false)

    // Owner Inline create
    const [showCreate, setShowCreate] = useState(false)
    const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', company: '', address: '', notes: '' })
    const [createSaving, setCreateSaving] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // Developer Inline edit
    const [devEditId, setDevEditId] = useState<string | null>(null)
    const [devEditForm, setDevEditForm] = useState({ name: '', logo: '', description: '' })
    const [devEditSaving, setDevEditSaving] = useState(false)

    // Developer Inline create
    const [devShowCreate, setDevShowCreate] = useState(false)
    const [devCreateForm, setDevCreateForm] = useState({ name: '', logo: '', description: '' })
    const [devCreateSaving, setDevCreateSaving] = useState(false)
    const [devCreateError, setDevCreateError] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [ownersRes, devsRes] = await Promise.all([
            supabase.from('owners').select('*').order('name'),
            supabase.from('developers').select('*').order('name')
        ])
        if (ownersRes.data) setOwners(ownersRes.data)
        if (devsRes.data) setDevelopers(devsRes.data)
        setLoading(false)
    }

    const handleDelete = async (id: string, type: 'owner' | 'developer') => {
        const table = type === 'owner' ? 'owners' : 'developers'
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (!error) {
            if (type === 'owner') setOwners(owners.filter(o => o.id !== id))
            else setDevelopers(developers.filter(d => d.id !== id))
        }
        setDeleteId(null)
    }

    // --- Owners Logic ---
    const startEditOwner = (owner: Owner) => {
        setEditId(owner.id)
        setEditForm({
            name: owner.name,
            phone: owner.phone || '',
            email: owner.email || '',
            company: owner.company || '',
            address: owner.address || '',
            notes: owner.notes || '',
        })
    }

    const saveEditOwner = async () => {
        if (!editId || !editForm.name.trim()) return
        setEditSaving(true)
        const { error } = await supabase
            .from('owners')
            .update({
                name: editForm.name.trim(),
                phone: editForm.phone.trim() || null,
                email: editForm.email.trim() || null,
                company: editForm.company.trim() || null,
                address: editForm.address.trim() || null,
                notes: editForm.notes.trim() || null,
            })
            .eq('id', editId)

        if (!error) {
            setOwners(owners.map(o => o.id === editId ? { ...o, ...editForm, phone: editForm.phone || null, email: editForm.email || null, company: editForm.company || null, address: editForm.address || null, notes: editForm.notes || null } : o))
            setEditId(null)
        }
        setEditSaving(false)
    }

    const handleCreateOwner = async () => {
        if (!createForm.name.trim()) {
            setCreateError('Name is required')
            return
        }
        setCreateSaving(true)
        setCreateError(null)

        const { data, error } = await supabase
            .from('owners')
            .insert([{
                name: createForm.name.trim(),
                phone: createForm.phone.trim() || null,
                email: createForm.email.trim() || null,
                company: createForm.company.trim() || null,
                address: createForm.address.trim() || null,
                notes: createForm.notes.trim() || null,
            }])
            .select('*')
            .single()

        if (error) {
            setCreateError(error.message)
        } else {
            setOwners(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
            setShowCreate(false)
            setCreateForm({ name: '', phone: '', email: '', company: '', address: '', notes: '' })
        }
        setCreateSaving(false)
    }

    // --- Developers Logic ---
    const startEditDev = (dev: Developer) => {
        setDevEditId(dev.id)
        setDevEditForm({
            name: dev.name,
            logo: dev.logo || '',
            description: dev.description || '',
        })
    }

    const saveEditDev = async () => {
        if (!devEditId || !devEditForm.name.trim()) return
        setDevEditSaving(true)
        const { error } = await supabase
            .from('developers')
            .update({
                name: devEditForm.name.trim(),
                logo: devEditForm.logo.trim() || null,
                description: devEditForm.description.trim() || null,
            })
            .eq('id', devEditId)

        if (!error) {
            setDevelopers(developers.map(d => d.id === devEditId ? { ...d, name: devEditForm.name.trim(), logo: devEditForm.logo || null, description: devEditForm.description || null } : d))
            setDevEditId(null)
        }
        setDevEditSaving(false)
    }

    const handleCreateDev = async () => {
        if (!devCreateForm.name.trim()) {
            setDevCreateError('Name is required')
            return
        }
        setDevCreateSaving(true)
        setDevCreateError(null)

        const { data, error } = await supabase
            .from('developers')
            .insert([{
                name: devCreateForm.name.trim(),
                logo: devCreateForm.logo.trim() || null,
                description: devCreateForm.description.trim() || null,
            }])
            .select('*')
            .single()

        if (error) {
            setDevCreateError(error.message)
        } else {
            setDevelopers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
            setDevShowCreate(false)
            setDevCreateForm({ name: '', logo: '', description: '' })
        }
        setDevCreateSaving(false)
    }

    const filteredOwners = owners.filter(o => {
        const q = searchQuery.toLowerCase()
        return (
            o.name.toLowerCase().includes(q) ||
            (o.phone && o.phone.includes(q)) ||
            (o.email && o.email.toLowerCase().includes(q)) ||
            (o.company && o.company.toLowerCase().includes(q))
        )
    })

    const filteredDevelopers = developers.filter(d => {
        const q = searchQuery.toLowerCase()
        return d.name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q))
    })

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>{activeTab === 'owners' ? 'Owners' : 'Developers'}</h1>
                    <p className={styles.pageSubtitle}>
                        {activeTab === 'owners'
                            ? 'Manage property owners and landlords'
                            : 'Manage real estate developers and builders'}
                    </p>
                </div>
                <button
                    className={styles.addButton}
                    onClick={() => activeTab === 'owners' ? setShowCreate(true) : setDevShowCreate(true)}
                >
                    <Plus size={18} />
                    {activeTab === 'owners' ? 'Add Owner' : 'Add Developer'}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => { setActiveTab('owners'); setSearchQuery(''); }}
                    style={activeTab === 'owners' ? activeTabStyle : inactiveTabStyle}
                >
                    Owners
                </button>
                <button
                    onClick={() => { setActiveTab('developers'); setSearchQuery(''); }}
                    style={activeTab === 'developers' ? activeTabStyle : inactiveTabStyle}
                >
                    Developers
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '10px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                    }}
                />
            </div>

            {/* Owners Content */}
            {activeTab === 'owners' && (
                <>
                    {/* Inline Create Form */}
                    {showCreate && (
                        <div style={inlineFormCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>New Owner</h3>
                                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            {createError && (
                                <div style={errorStyle}>{createError}</div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <input placeholder="Name *" value={createForm.name} onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                                <input placeholder="Phone" value={createForm.phone} onChange={(e) => setCreateForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
                                <input placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <input placeholder="Company" value={createForm.company} onChange={(e) => setCreateForm(p => ({ ...p, company: e.target.value }))} style={inputStyle} />
                                <input placeholder="Address" value={createForm.address} onChange={(e) => setCreateForm(p => ({ ...p, address: e.target.value }))} style={inputStyle} />
                            </div>
                            <input placeholder="Notes" value={createForm.notes} onChange={(e) => setCreateForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, marginBottom: '1rem' }} />
                            <button onClick={handleCreateOwner} disabled={createSaving} style={primaryActionBtnStyle}>
                                {createSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {createSaving ? 'Creating...' : 'Create Owner'}
                            </button>
                        </div>
                    )}

                    {/* Owners Table */}
                    {loading ? (
                        <div className={styles.emptyState}>Loading owners...</div>
                    ) : filteredOwners.length > 0 ? (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Phone</th>
                                        <th style={thStyle}>Email</th>
                                        <th style={thStyle}>Company</th>
                                        <th style={thStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOwners.map(owner => (
                                        <tr key={owner.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            {editId === owner.id ? (
                                                <>
                                                    <td style={tdStyle}><input value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></td>
                                                    <td style={tdStyle}><input value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} /></td>
                                                    <td style={tdStyle}><input value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} /></td>
                                                    <td style={tdStyle}><input value={editForm.company} onChange={(e) => setEditForm(p => ({ ...p, company: e.target.value }))} style={inputStyle} /></td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={saveEditOwner} disabled={editSaving} style={actionBtnStyle('#10b981')}><Save size={14} /> {editSaving ? '...' : 'Save'}</button>
                                                            <button onClick={() => setEditId(null)} style={actionBtnStyle('#64748b')}><X size={14} /> Cancel</button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={tdStyle}><strong>{owner.name}</strong></td>
                                                    <td style={tdStyle}>{owner.phone ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} color="#64748b" /> {owner.phone}</span> : '—'}</td>
                                                    <td style={tdStyle}>{owner.email ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} color="#64748b" /> {owner.email}</span> : '—'}</td>
                                                    <td style={tdStyle}>{owner.company ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building size={13} color="#64748b" /> {owner.company}</span> : '—'}</td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={() => startEditOwner(owner)} style={actionBtnStyle('#0ea5e9')}><Pencil size={14} /> Edit</button>
                                                            <button onClick={() => setDeleteId({ id: owner.id, type: 'owner' })} style={actionBtnStyle('#ef4444')}><Trash2 size={14} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            {searchQuery ? 'No owners match your search.' : 'No owners yet. Add your first owner!'}
                        </div>
                    )}
                </>
            )}

            {/* Developers Content */}
            {activeTab === 'developers' && (
                <>
                    {/* Inline Create Form */}
                    {devShowCreate && (
                        <div style={inlineFormCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>New Developer</h3>
                                <button onClick={() => setDevShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            {devCreateError && (
                                <div style={errorStyle}>{devCreateError}</div>
                            )}
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>Developer Logo</label>
                                    <ImageUpload
                                        folder="developers"
                                        onChange={(url) => setDevCreateForm(prev => ({ ...prev, logo: url }))}
                                        value={devCreateForm.logo || ''}
                                    />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>Developer Name *</label>
                                        <input placeholder="Name *" value={devCreateForm.name} onChange={(e) => setDevCreateForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>Description</label>
                                        <textarea placeholder="Description" value={devCreateForm.description} onChange={(e) => setDevCreateForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleCreateDev} disabled={devCreateSaving} style={primaryActionBtnStyle}>
                                {devCreateSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {devCreateSaving ? 'Creating...' : 'Create Developer'}
                            </button>
                        </div>
                    )}

                    {/* Developers Table */}
                    {loading ? (
                        <div className={styles.emptyState}>Loading developers...</div>
                    ) : filteredDevelopers.length > 0 ? (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={thStyle}>Logo</th>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Description</th>
                                        <th style={thStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDevelopers.map(dev => (
                                        <tr key={dev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            {devEditId === dev.id ? (
                                                <>
                                                    <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                                                        <ImageUpload
                                                            folder="developers"
                                                            onChange={(url) => setDevEditForm(prev => ({ ...prev, logo: url }))}
                                                            value={devEditForm.logo || ''}
                                                        />
                                                    </td>
                                                    <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                                                        <input value={devEditForm.name} onChange={(e) => setDevEditForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                                                    </td>
                                                    <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                                                        <textarea value={devEditForm.description} onChange={(e) => setDevEditForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
                                                    </td>
                                                    <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <button onClick={saveEditDev} disabled={devEditSaving} style={actionBtnStyle('#10b981')}><Save size={14} /> {devEditSaving ? '...' : 'Save'}</button>
                                                            <button onClick={() => setDevEditId(null)} style={actionBtnStyle('#64748b')}><X size={14} /> Cancel</button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={tdStyle}>
                                                        {dev.logo ? (
                                                            <img src={dev.logo} alt={dev.name} style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                                                        ) : (
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                                                <ImageIcon size={20} />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={tdStyle}><strong>{dev.name}</strong></td>
                                                    <td style={tdStyle}>
                                                        {dev.description ? (
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {dev.description}
                                                            </p>
                                                        ) : '—'}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={() => startEditDev(dev)} style={actionBtnStyle('#0ea5e9')}><Pencil size={14} /> Edit</button>
                                                            <button onClick={() => setDeleteId({ id: dev.id, type: 'developer' })} style={actionBtnStyle('#ef4444')}><Trash2 size={14} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            {searchQuery ? 'No developers match your search.' : 'No developers yet. Add your first developer!'}
                        </div>
                    )}
                </>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Delete {deleteId.type === 'owner' ? 'Owner' : 'Developer'}?</h3>
                        <p>This will remove the {deleteId.type} from any linked properties or projects. This action cannot be undone.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteId.id, deleteId.type)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Styles
const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.9rem',
    width: '100%',
    fontFamily: 'inherit',
}

const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '0.9rem',
    color: '#1e293b',
}

const actionBtnStyle = (color: string): React.CSSProperties => ({
    padding: '6px 12px',
    background: 'transparent',
    color: color,
    border: `1px solid ${color}30`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
})

const activeTabStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: '#1e293b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.9rem',
}

const inactiveTabStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: 'transparent',
    color: '#64748b',
    border: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.9rem',
}

const inlineFormCardStyle: React.CSSProperties = {
    padding: '24px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

const errorStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.85rem'
}

const primaryActionBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
}
