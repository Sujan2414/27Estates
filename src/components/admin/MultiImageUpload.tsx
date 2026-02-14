'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Plus } from 'lucide-react'

interface MultiImageUploadProps {
    images: string[]
    onChange: (images: string[]) => void
    folder?: string
    label?: string
    maxImages?: number
}

export default function MultiImageUpload({
    images,
    onChange,
    folder = 'general',
    label = 'Upload Images',
    maxImages = 20,
}: MultiImageUploadProps) {
    const supabase = createClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Check max
        if (images.length + files.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed`)
            return
        }

        setUploading(true)
        setError(null)

        try {
            const uploadedUrls: string[] = []

            for (const file of Array.from(files)) {
                if (file.size > 10 * 1024 * 1024) {
                    setError(`${file.name} exceeds 10MB limit, skipped`)
                    continue
                }

                // Upload via API to bypass RLS
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', folder)

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    setError(`Failed to upload ${file.name}`)
                    continue
                }

                const { publicUrl } = await response.json()

                uploadedUrls.push(publicUrl)
            }

            if (uploadedUrls.length > 0) {
                // Filter out empty strings from existing images before adding new ones
                const existing = images.filter(img => img && img.trim() !== '')
                onChange([...existing, ...uploadedUrls])
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const removeImage = (index: number) => {
        onChange(images.filter((_, i) => i !== index))
    }

    // Filter out empty placeholder strings for display
    const displayImages = images.filter(img => img && img.trim() !== '')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFilesSelect}
                style={{ display: 'none' }}
            />

            {/* Image grid */}
            {displayImages.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                }}>
                    {displayImages.map((img, index) => (
                        <div
                            key={index}
                            style={{
                                position: 'relative',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                aspectRatio: '1',
                            }}
                        >
                            <img
                                src={img}
                                alt={`Image ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '24px',
                                    height: '24px',
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
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '16px 24px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    cursor: uploading ? 'wait' : 'pointer',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
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
                        <Loader2 size={18} className="animate-spin" />
                        <span>Uploading...</span>
                    </>
                ) : (
                    <>
                        <Plus size={18} />
                        <span>{label} ({displayImages.length}/{maxImages})</span>
                    </>
                )}
            </button>

            {error && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</span>
            )}
        </div>
    )
}
