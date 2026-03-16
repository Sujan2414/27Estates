'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
    url: string
    title?: string
    className?: string
    containerStyle?: React.CSSProperties
}

function extractYouTubeId(url: string): string | null {
    try {
        const u = url.trim()
        if (u.includes('youtube.com/watch')) return new URL(u).searchParams.get('v')
        if (u.includes('youtu.be/')) return u.split('youtu.be/')[1]?.split('?')[0] || null
        if (u.includes('youtube.com/embed/')) return u.split('youtube.com/embed/')[1]?.split('?')[0] || null
    } catch {}
    return null
}

function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : null
}

function buildEmbedSrc(url: string, autoplay: boolean): string {
    const ytId = extractYouTubeId(url)
    if (ytId) {
        const params = new URLSearchParams({
            rel: '0',
            modestbranding: '1',
            iv_load_policy: '3',
            cc_load_policy: '0',
            playsinline: '1',
            enablejsapi: '1',
            origin: typeof window !== 'undefined' ? window.location.origin : 'https://27estates.com',
        })
        if (autoplay) { params.set('autoplay', '1'); params.set('mute', '1') }
        return `https://www.youtube.com/embed/${ytId}?${params}`
    }

    const vmId = extractVimeoId(url)
    if (vmId) {
        const params = new URLSearchParams({
            byline: '0', portrait: '0', title: '0',
            ...(autoplay ? { autoplay: '1', muted: '1' } : {}),
        })
        return `https://player.vimeo.com/video/${vmId}?${params}`
    }

    // Already an embed URL or unknown — just append autoplay
    const base = url.trim()
    if (autoplay) {
        const sep = base.includes('?') ? '&' : '?'
        return base + sep + 'autoplay=1&mute=1'
    }
    return base
}

export default function VideoPlayer({ url, title = 'Video', className, containerStyle }: VideoPlayerProps) {
    const [playing, setPlaying] = useState(false)   // true = show iframe
    const [inView, setInView] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    const ytId = extractYouTubeId(url)
    const thumbnailUrl = ytId
        ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
        : null

    // Autoplay when scrolled into view (50% visible)
    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    setPlaying(true)   // auto-start when in view
                } else {
                    setInView(false)
                    // Reset so video restarts fresh when scrolled back
                    setPlaying(false)
                }
            },
            { threshold: 0.4 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    const handlePlayClick = () => setPlaying(true)

    return (
        <div
            ref={wrapRef}
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#0f1117',
                ...containerStyle,
            }}
        >
            {playing ? (
                <iframe
                    src={buildEmbedSrc(url, true)}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                />
            ) : (
                /* Thumbnail + branded play button */
                <div
                    onClick={handlePlayClick}
                    style={{ position: 'absolute', inset: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {/* Thumbnail */}
                    {thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={thumbnailUrl}
                            alt={title}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => {
                                // Fallback to hqdefault if maxresdefault 404s
                                const img = e.currentTarget
                                if (img.src.includes('maxresdefault')) {
                                    img.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                                }
                            }}
                        />
                    )}

                    {/* Dark vignette overlay */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)',
                    }} />

                    {/* Branded Play Button */}
                    <div style={{
                        position: 'relative', zIndex: 2,
                        width: '72px', height: '72px',
                        borderRadius: '50%',
                        backgroundColor: '#183C38',
                        border: '3px solid #BFA270',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
                            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)'
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Play triangle */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <polygon points="6,4 20,12 6,20" fill="#BFA270" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    )
}
