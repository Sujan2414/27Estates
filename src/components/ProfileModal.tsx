'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Camera, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager', agent: 'Employee',
}
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    super_admin: { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed' },
    admin:       { bg: 'rgba(24,60,56,0.12)',   color: '#183C38' },
    manager:     { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
    agent:       { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
}

interface Props {
    user: { id: string; full_name: string; email: string; role: string; avatar_url?: string | null }
    onClose: () => void
    onUpdate?: (u: { full_name: string; avatar_url?: string | null }) => void
}

export default function ProfileModal({ user, onClose, onUpdate }: Props) {
    const supabase = createClient()
    const fileRef  = useRef<HTMLInputElement>(null)

    const [fullName,     setFullName]     = useState(user.full_name)
    const [preview,      setPreview]      = useState<string>(user.avatar_url || '')
    const [avatarFile,   setAvatarFile]   = useState<File | null>(null)

    const [newPw,        setNewPw]        = useState('')
    const [confirmPw,    setConfirmPw]    = useState('')
    const [showPw,       setShowPw]       = useState(false)

    const [saving,       setSaving]       = useState(false)
    const [savingPw,     setSavingPw]     = useState(false)
    const [msg,          setMsg]          = useState<{ ok: boolean; text: string } | null>(null)
    const [pwMsg,        setPwMsg]        = useState<{ ok: boolean; text: string } | null>(null)

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 3 * 1024 * 1024) { setMsg({ ok: false, text: 'Image must be < 3 MB' }); return }
        setAvatarFile(file)
        const reader = new FileReader()
        reader.onload = ev => setPreview(ev.target?.result as string)
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        setSaving(true); setMsg(null)
        try {
            let avatarUrl = user.avatar_url ?? null
            if (avatarFile) {
                const ext  = avatarFile.name.split('.').pop() || 'jpg'
                const path = `${user.id}/avatar.${ext}`
                const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
                if (!upErr) {
                    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
                    avatarUrl = pub.publicUrl + '?t=' + Date.now()
                }
            }
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName.trim(), avatar_url: avatarUrl }),
            })
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
            setMsg({ ok: true, text: 'Profile saved!' })
            const updatedProfile = { full_name: fullName.trim(), avatar_url: avatarUrl }
            onUpdate?.(updatedProfile)
            // Broadcast profile change to ALL sections (CRM, HRMS, CMS) via localStorage + custom event
            try {
                localStorage.setItem('profile-sync', JSON.stringify({ ...updatedProfile, ts: Date.now() }))
                window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }))
            } catch { /* localStorage unavailable */ }
        } catch (e: any) {
            setMsg({ ok: false, text: e.message })
        } finally {
            setSaving(false)
        }
    }

    const handlePassword = async () => {
        if (!newPw || newPw !== confirmPw) { setPwMsg({ ok: false, text: 'Passwords do not match' }); return }
        if (newPw.length < 8) { setPwMsg({ ok: false, text: 'Minimum 8 characters' }); return }
        setSavingPw(true); setPwMsg(null)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPw })
            if (error) throw error
            setPwMsg({ ok: true, text: 'Password updated!' })
            setNewPw(''); setConfirmPw('')
        } catch (e: any) {
            setPwMsg({ ok: false, text: e.message })
        } finally {
            setSavingPw(false)
        }
    }

    const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.agent

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
        >
            <div style={{
                background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid #f0f2f5' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0d1117' }}>My Profile</span>
                    <button onClick={onClose} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', color: '#6b7280', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Avatar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: 76, height: 76, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #183C38, #2d7a6e)',
                                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '3px solid #e4e7ec',
                            }}>
                                {preview
                                    ? <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.6rem' }}>{user.full_name.charAt(0).toUpperCase()}</span>
                                }
                            </div>
                            <button
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    position: 'absolute', bottom: 2, right: 2,
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: '#183C38', color: '#fff', border: '2.5px solid #fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', padding: 0,
                                }}
                            >
                                <Camera size={12} />
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Click to change photo</span>
                    </div>

                    {/* Role */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ background: rc.bg, color: rc.color, padding: '3px 14px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em' }}>
                            {ROLE_LABELS[user.role] || user.role}
                        </span>
                    </div>

                    {/* Full name */}
                    <div style={{ marginBottom: '0.875rem' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                        <input
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e4e7ec', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', color: '#111', transition: 'border-color 0.15s' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#183C38'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e4e7ec'}
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                        <input
                            value={user.email}
                            readOnly
                            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e4e7ec', borderRadius: '10px', fontSize: '0.875rem', background: '#f9fafb', color: '#9ca3af', boxSizing: 'border-box' }}
                        />
                    </div>

                    {msg && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.875rem', fontSize: '0.8rem', background: msg.ok ? '#dcfce7' : '#fee2e2', color: msg.ok ? '#166534' : '#dc2626' }}>
                            {msg.ok ? <Check size={13} /> : <AlertCircle size={13} />} {msg.text}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ width: '100%', padding: '0.7rem', background: '#183C38', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '1.75rem', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? 'Saving…' : 'Save Profile'}
                    </button>

                    {/* Password section */}
                    <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '1.25rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '1rem' }}>Change Password</div>

                        <div style={{ marginBottom: '0.875rem' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={newPw}
                                    onChange={e => setNewPw(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 0.875rem', border: '1.5px solid #e4e7ec', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.currentTarget.style.borderColor = '#183C38'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#e4e7ec'}
                                />
                                <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPw}
                                onChange={e => setConfirmPw(e.target.value)}
                                placeholder="Repeat new password"
                                style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e4e7ec', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.currentTarget.style.borderColor = '#183C38'}
                                onBlur={e => e.currentTarget.style.borderColor = '#e4e7ec'}
                            />
                        </div>

                        {pwMsg && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.875rem', fontSize: '0.8rem', background: pwMsg.ok ? '#dcfce7' : '#fee2e2', color: pwMsg.ok ? '#166534' : '#dc2626' }}>
                                {pwMsg.ok ? <Check size={13} /> : <AlertCircle size={13} />} {pwMsg.text}
                            </div>
                        )}

                        <button
                            onClick={handlePassword}
                            disabled={savingPw}
                            style={{ width: '100%', padding: '0.7rem', background: 'transparent', color: '#183C38', border: '1.5px solid #183C38', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: savingPw ? 'not-allowed' : 'pointer', opacity: savingPw ? 0.7 : 1 }}
                        >
                            {savingPw ? 'Updating…' : 'Update Password'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
