'use client'

import { useState, useRef } from 'react'
import { X, Loader2, Plus, Star } from 'lucide-react'

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

                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', folder)

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                let data;
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await res.json();
                } else {
                    const text = await res.text();
                    throw new Error(`Server returned a non-JSON error (${res.status}): ${text.slice(0, 100)}...`);
                }

                if (!res.ok) {
                    console.error(`Failed to upload ${file.name}:`, data.error)
                    setError(`Failed to upload ${file.name}`)
                    continue
                }

                uploadedUrls.push(data.publicUrl)
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

    const setDefaultImage = (index: number) => {
        if (index === 0) return
        const reordered = [...displayImages]
        const [picked] = reordered.splice(index, 1)
        reordered.unshift(picked)
        onChange(reordered)
    }

    // Filter out empty placeholder strings for display
    const displayImages = images.filter(img => img && img.trim() !== '')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                <strong>Note:</strong> The image marked with ★ is the cover photo. Click ☆ on any image to set it as default. If none selected, the 1st image is used.
            </p>
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
                                border: index === 0 ? '2px solid #f59e0b' : '1px solid #e2e8f0',
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
                            {/* Cover / number badge */}
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: index === 0 ? 'rgba(245, 158, 11, 0.95)' : 'rgba(24, 60, 56, 0.9)',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                zIndex: 1,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {index === 0 ? '★ Cover' : index + 1}
                            </div>
                            {/* Set as default star button (only on non-cover images) */}
                            {index !== 0 && (
                                <button
                                    type="button"
                                    title="Set as cover image"
                                    onClick={() => setDefaultImage(index)}
                                    style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        left: '4px',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        background: 'rgba(245, 158, 11, 0.85)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 2,
                                    }}
                                >
                                    <Star size={13} />
                                </button>
                            )}
                            {/* Remove button */}
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
                                    zIndex: 2,
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
