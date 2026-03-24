'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Persists for the browser tab lifetime
let _sid: string | null = null
function getSessionId(): string {
    if (_sid) return _sid
    if (typeof window === 'undefined') return ''
    let id = sessionStorage.getItem('__27e_sid')
    if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2)
        sessionStorage.setItem('__27e_sid', id)
    }
    _sid = id
    return id
}

export default function PageTracker() {
    const pathname = usePathname()
    const startRef = useRef<number>(Date.now())
    const pathRef = useRef<string>(pathname)

    const send = (path: string, durationMs: number) => {
        const secs = Math.round(durationMs / 1000)
        if (secs < 1) return
        try {
            navigator.sendBeacon(
                '/api/analytics/track',
                JSON.stringify({
                    session_id: getSessionId(),
                    page_path: path,
                    page_title: document.title,
                    duration_seconds: Math.min(secs, 3600),
                })
            )
        } catch { /* silent */ }
    }

    useEffect(() => {
        // Skip admin / CRM pages — they're staff-only
        if (pathname.startsWith('/admin') || pathname.startsWith('/crm')) return

        startRef.current = Date.now()
        pathRef.current = pathname

        const onVisibility = () => {
            if (document.hidden) {
                send(pathRef.current, Date.now() - startRef.current)
                startRef.current = Date.now()
            } else {
                startRef.current = Date.now()
            }
        }

        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            document.removeEventListener('visibilitychange', onVisibility)
            send(pathRef.current, Date.now() - startRef.current)
        }
    }, [pathname])

    return null
}
