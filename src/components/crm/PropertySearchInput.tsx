'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Search, X, AlertCircle } from 'lucide-react'
import styles from './PropertySearchInput.module.css'

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
 *
 * Theming: every color goes through the --crm-* CSS variables so the
 * picker auto-flips between light and dark mode the same way the rest of
 * the CRM does. The previous version was hardcoded to white/dark-text and
 * looked broken in dark mode (text was invisible against dark page bg).
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
                <div className={styles.selected}>
                    <MapPin size={16} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: 13, fontWeight: 600,
                            color: 'var(--crm-text-primary)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                                background: selected.kind === 'project' ? 'rgba(59,130,246,0.18)' : 'rgba(34,197,94,0.18)',
                                color: selected.kind === 'project' ? '#60a5fa' : '#4ade80',
                                textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>{selected.kind}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.title}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--crm-text-muted)', marginTop: 2 }}>
                            {[selected.location, selected.city].filter(Boolean).join(', ') || 'Location not set'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={clear}
                        style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--crm-text-muted)', padding: 0, display: 'flex' }}
                    >
                        <X size={14} />
                    </button>
                </div>
                {warnIfNoCoords && !hasCoords && (
                    <div style={{
                        marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6,
                        fontSize: 11, color: '#f87171', padding: '6px 10px',
                        background: 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6,
                    }}>
                        <AlertCircle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span>This listing has no map coordinates. Open the listing in admin and pin the location, otherwise arrival tracking can&apos;t work.</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div ref={containerRef} className={styles.wrap}>
            <div className={styles.inputBox}>
                <Search size={14} style={{ color: 'var(--crm-text-muted)' }} />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => query.trim().length >= 2 && setOpen(true)}
                    placeholder="Search listing by name or ID…"
                    autoComplete="off"
                    className={styles.input}
                />
                {searching && (
                    <span style={{ fontSize: 10, color: 'var(--crm-text-muted)' }}>Searching…</span>
                )}
            </div>
            {/* Show the dropdown whenever the user has typed something searchable.
                Empty-state row tells them the search ran and nothing matched —
                otherwise the picker just looks broken on a no-results query. */}
            {open && query.trim().length >= 2 && !searching && hits.length === 0 && (
                <ul className={styles.dropdown}>
                    <li style={{
                        padding: '12px 14px',
                        fontSize: 13,
                        color: 'var(--crm-text-muted)',
                        textAlign: 'center',
                    }}>
                        No listings matched <strong style={{ color: 'var(--crm-text-primary)' }}>&quot;{query.trim()}&quot;</strong>
                    </li>
                </ul>
            )}
            {open && hits.length > 0 && (
                <ul className={styles.dropdown}>
                    {hits.map(h => {
                        const hasCoords = h.latitude != null && h.longitude != null
                        return (
                            <li
                                key={`${h.kind}-${h.id}`}
                                onClick={() => choose(h)}
                                className={styles.hit}
                            >
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                    background: h.kind === 'project' ? 'rgba(59,130,246,0.18)' : 'rgba(34,197,94,0.18)',
                                    color: h.kind === 'project' ? '#60a5fa' : '#4ade80',
                                    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2,
                                }}>{h.kind}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 600,
                                        color: 'var(--crm-text-primary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {h.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--crm-text-muted)', marginTop: 2 }}>
                                        #{h.short_id} · {[h.location, h.city].filter(Boolean).join(', ') || 'Location not set'}
                                    </div>
                                </div>
                                {!hasCoords && (
                                    <span title="No coordinates" style={{ flexShrink: 0, color: '#f87171', marginTop: 4 }}>
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
