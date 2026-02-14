'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, FileText } from 'lucide-react'

interface BrochureUploadProps {
    value: string
    onChange: (url: string) => void
    folder?: string
    label?: string
}

export default function BrochureUpload({
    value,
    onChange,
    folder = 'projects/brochures',
    label = 'Upload Brochure (PDF)',
}: BrochureUploadProps) {
    const supabase = createClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate type
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file')
            return
        }

        // Validate size (20MB limit for brochures)
        if (file.size > 20 * 1024 * 1024) {
            setError('File must be under 20MB')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // Clean filename
            // Upload via API to bypass RLS
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', folder)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
            }

            const { publicUrl } = await response.json()

            onChange(publicUrl)
        } catch (err) {
            console.error('Upload failed:', err)
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleRemove = () => {
        if (confirm('Are you sure you want to remove this brochure?')) {
            onChange('')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {value ? (
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    maxWidth: '400px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileText size={20} />
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {value.split('/').pop()}
                        </p>
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'none' }}
                        >
                            View PDF
                        </a>
                    </div>

                    <button
                        type="button"
                        onClick={handleRemove}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fff5f5',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Remove brochure"
                    >
                        <X size={16} />
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
                            <span>Uploading PDF...</span>
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
