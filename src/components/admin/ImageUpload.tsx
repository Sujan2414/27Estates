'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    folder?: string
    label?: string
    accept?: string
}

export default function ImageUpload({
    value,
    onChange,
    folder = 'general',
    label = 'Upload Image',
    accept = 'image/jpeg,image/png,image/webp,image/gif',
}: ImageUploadProps) {
    const supabase = createClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File must be under 10MB')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // Clean filename
            const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-')
            const timestamp = Date.now()
            const fileName = `${folder}/${timestamp}-${cleanName}`

            // Direct Supabase upload from client
            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('Supabase Storage Error:', uploadError)
                throw new Error(uploadError.message || 'Upload failed')
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(fileName)

            onChange(publicUrl)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
            // Reset input so same file can be re-selected
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleRemove = () => {
        onChange('')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {value ? (
                <div style={{
                    position: 'relative',
                    display: 'inline-block',
                    maxWidth: '240px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                }}>
                    <img
                        src={value}
                        alt="Preview"
                        style={{
                            width: '100%',
                            height: '160px',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '24px',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        cursor: uploading ? 'wait' : 'pointer',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                        maxWidth: '240px',
                    }}
                    onMouseEnter={(e) => {
                        if (!uploading) {
                            e.currentTarget.style.borderColor = '#0ea5e9'
                            e.currentTarget.style.background = '#f0f9ff'
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1'
                        e.currentTarget.style.background = '#f8fafc'
                    }}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={24} />
                            <span>{label}</span>
                        </>
                    )}
                </button>
            )}

            {error && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</span>
            )}
        </div>
    )
}
