'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Search, X, AlertCircle } from 'lucide-react'

export interface SelectedProperty {
    kind: 'property' | 'project'
    id: string
    title: string
    location: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
}

interface Props {
    selected: SelectedProperty | null
    onSelect: (p: SelectedProperty | null) => void
    /** Surface a warning under the picker when the chosen listing has no
        coordinates — admins need to fix the listing before scheduling so
        the geofence arrival tracker has something to track against. */
    warnIfNoCoords?: boolean
}

interface SearchHit {
    kind: 'property' | 'project'
    id: string
    title: string
    location: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
    /** Short human ID surfaced in the result row — `property_id` for
        properties, just the first 8 chars of UUID for projects. */
    short_id: string
}

/**
 * Combined property + project search-by-name-or-ID for the CRM lead page's
 * "Schedule Visit" form. Searches the `properties` and `projects` tables in
 * parallel; debounced 300ms after typing stops. Shows up to 8 results with
 * a "no coordinates" warning where applicable so the admin sees the gap
 * BEFORE submitting.
 */
export default function PropertySearchInput({ selected, onSelect, warnIfNoCoords = true }: Props) {
    const supabase = createClient()
    const [query, setQuery] = useState('')
    const [hits, setHits] = useState<SearchHit[]>([])
    const [open, setOpen] = useState(false)
    const [searching, setSearching] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Debounced search
    useEffect(() => {
        const q = query.trim()
        if (q.length < 2) { setHits([]); return }

        let cancelled = false
        const t = setTimeout(async () => {
            setSearching(true)
            try {
                const ilike = `%${q}%`
                // Search both tables. property_id matches let admins paste a
                // listing ID directly; title/project_name matches handle name search.
                const [{ data: props }, { data: projs }] = await Promise.all([
                    supabase
                        .from('properties')
                        .select('id, property_id, title, location, city, latitude, longitude')
                        .or(`title.ilike.${ilike},property_id.ilike.${ilike}`)
                        .limit(8),
                    supabase
                        .from('projects')
                        .select('id, project_name, location, city, latitude, longitude')
                        .ilike('project_name', ilike)
                        .limit(8),
                ])

                if (cancelled) return

                const propHits: SearchHit[] = (props ?? []).map((p: any) => ({
                    kind: 'property',
                    id: p.id,
                    title: p.title || 'Untitled property',
                    location: p.location,
                    city: p.city,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    short_id: p.property_id || p.id.slice(0, 8),
                }))
                const projHits: SearchHit[] = (projs ?? []).map((p: any) => ({
                    kind: 'project',
                    id: p.id,
                    title: p.project_name || 'Untitled project',
                    location: p.location,
                    city: p.city,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    short_id: p.id.slice(0, 8),
                }))

                setHits([...propHits, ...projHits])
                setOpen(true)
            } finally {
                if (!cancelled) setSearching(false)
            }
        }, 300)

        return () => { cancelled = true; clearTimeout(t) }
    }, [query, supabase])

    const choose = (hit: SearchHit) => {
        onSelect({
            kind: hit.kind,
            id: hit.id,
            title: hit.title,
            location: hit.location,
            city: hit.city,
            latitude: hit.latitude,
            longitude: hit.longitude,
        })
        setQuery('')
        setHits([])
        setOpen(false)
    }

    const clear = () => {
        onSelect(null)
        setQuery('')
        setHits([])
    }

    if (selected) {
        const hasCoords = selected.latitude != null && selected.longitude != null
        return (
            <div ref={containerRef}>
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 8,
                    background: '#f0fdf4',
                }}>
                    <MapPin size={16} color="#166534" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#101828', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                                background: selected.kind === 'project' ? '#dbeafe' : '#dcfce7',
                                color: selected.kind === 'project' ? '#1e40af' : '#166534',
                                textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>{selected.kind}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.title}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#475467', marginTop: 2 }}>
                            {[selected.location, selected.city].filter(Boolean).join(', ') || 'Location not set'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={clear}
                        style={{ background: 'none', border: 0, cursor: 'pointer', color: '#475467', padding: 0, display: 'flex' }}
                    >
                        <X size={14} />
                    </button>
                </div>
                {warnIfNoCoords && !hasCoords && (
                    <div style={{
                        marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6,
                        fontSize: 11, color: '#B42318', padding: '6px 10px',
                        background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 6,
                    }}>
                        <AlertCircle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span>This listing has no map coordinates. Open the listing in admin and pin the location, otherwise arrival tracking can't work.</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 12px', border: '1px solid #d0d5dd', borderRadius: 8,
                background: '#fff',
            }}>
                <Search size={14} color="#667085" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => hits.length > 0 && setOpen(true)}
                    placeholder="Search property by name or ID…"
                    autoComplete="off"
                    style={{
                        flex: 1, padding: '10px 0', border: 0, outline: 'none',
                        fontSize: 13, background: 'transparent',
                    }}
                />
                {searching && (
                    <span style={{ fontSize: 10, color: '#667085' }}>Searching…</span>
                )}
            </div>
            {open && hits.length > 0 && (
                <ul style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', border: '1px solid #d0d5dd', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(16,24,40,0.12)',
                    listStyle: 'none', margin: 0, padding: 4, zIndex: 50,
                    maxHeight: 280, overflowY: 'auto',
                }}>
                    {hits.map(h => {
                        const hasCoords = h.latitude != null && h.longitude != null
                        return (
                            <li
                                key={`${h.kind}-${h.id}`}
                                onClick={() => choose(h)}
                                style={{
                                    padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                }}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#f0fdf4' }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
                            >
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                    background: h.kind === 'project' ? '#dbeafe' : '#dcfce7',
                                    color: h.kind === 'project' ? '#1e40af' : '#166534',
                                    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2,
                                }}>{h.kind}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {h.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
                                        #{h.short_id} · {[h.location, h.city].filter(Boolean).join(', ') || 'Location not set'}
                                    </div>
                                </div>
                                {!hasCoords && (
                                    <span title="No coordinates" style={{ flexShrink: 0, color: '#B42318', marginTop: 4 }}>
                                        <AlertCircle size={13} />
                                    </span>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
