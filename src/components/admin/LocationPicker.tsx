'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin, Loader2, Crosshair } from 'lucide-react'

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
    place_id?: number | string
    type?: string
}

interface Props {
    lat: number | null
    lng: number | null
    /** Called whenever the pin moves — via map click, marker drag, address
        search, or "use my location". Coords are full-precision floats. */
    onChange: (lat: number, lng: number) => void
    /** Map fallback center if no pin yet. Defaults to Bangalore CBD. */
    defaultCenter?: [number, number]
    height?: number
    /** Optional address text to seed the search box on first render. */
    initialSearch?: string
}

// Click handler — needs to live INSIDE <MapContainer> to access map events.
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

// Pans/zooms the map to the new lat/lng whenever it changes externally
// (e.g. address search result). Skips the initial mount so we don't undo
// the MapContainer's `center` prop.
function FlyToController({ lat, lng }: { lat: number | null; lng: number | null }) {
    const map = useMap()
    const [primed, setPrimed] = useState(false)
    useEffect(() => {
        if (lat == null || lng == null) return
        if (!primed) { setPrimed(true); return }
        map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.7 })
    }, [lat, lng, map, primed])
    return null
}

// Standard Leaflet blue marker icon (CDN-hosted so we don't have to bundle).
const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

/**
 * Interactive map picker for the admin "add listing" wizards.
 *
 * Replaces the previous read-only PropertyMap preview that just rendered
 * whatever lat/lng the admin manually typed (which is exactly why client-
 * uploaded listings ended up with wrong coordinates — typos compounded by
 * no visual feedback). Now:
 *   • Click anywhere on the map → drops/moves a pin → fills lat/lng
 *   • Drag the pin → updates lat/lng
 *   • Search address (Nominatim, free OSM geocoder) → flies the pin there
 *   • "Use my location" → browser geolocation → fills lat/lng
 *
 * Two-way binding via `onChange` so the wizard's manual lat/lng text
 * inputs stay in sync with the pin and vice versa.
 */
export default function LocationPicker({
    lat, lng, onChange,
    defaultCenter = [12.9716, 77.5946],
    height = 380,
    initialSearch = '',
}: Props) {
    const [search, setSearch] = useState(initialSearch)
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)

    const center: [number, number] = lat != null && lng != null ? [lat, lng] : defaultCenter
    const initialZoom = lat != null && lng != null ? 16 : 11

    // Debounced live search → Nominatim. Fires 350ms after the user stops
    // typing (well under the ~1 req/sec rate limit). Pulls up to 6 results
    // so the admin can pick the SPECIFIC place — fixes the "I hit search
    // and it took me somewhere else" problem where Nominatim's first hit
    // for an ambiguous query (e.g. "Indiranagar") could be in a different
    // city than the admin meant.
    useEffect(() => {
        const q = search.trim()
        if (q.length < 3) {
            setSuggestions([])
            setSearchError(null)
            return
        }
        let cancelled = false
        const t = setTimeout(async () => {
            try {
                setSearching(true)
                setSearchError(null)
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&countrycodes=in&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } },
                )
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const results: NominatimResult[] = await res.json()
                if (cancelled) return
                setSuggestions(Array.isArray(results) ? results : [])
                setShowSuggestions(true)
                setActiveIndex(-1)
            } catch (err: any) {
                if (!cancelled) setSearchError(err.message || 'Search failed')
            } finally {
                if (!cancelled) setSearching(false)
            }
        }, 350)
        return () => { cancelled = true; clearTimeout(t) }
    }, [search])

    const pickSuggestion = (s: NominatimResult) => {
        onChange(parseFloat(s.lat), parseFloat(s.lon))
        setSearch(s.display_name)
        setShowSuggestions(false)
        setSuggestions([])
        setActiveIndex(-1)
    }

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (suggestions.length > 0) {
            const idx = activeIndex >= 0 ? activeIndex : 0
            pickSuggestion(suggestions[idx])
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
        else if (e.key === 'Escape') { setShowSuggestions(false); setActiveIndex(-1) }
    }

    const useMyLocation = () => {
        if (!('geolocation' in navigator)) {
            setSearchError('Geolocation not supported by this browser')
            return
        }
        setSearchError(null)
        navigator.geolocation.getCurrentPosition(
            pos => onChange(pos.coords.latitude, pos.coords.longitude),
            err => setSearchError(err.message),
            { enableHighAccuracy: true, timeout: 10000 },
        )
    }

    return (
        <div>
            {/* Search + my-location row */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', position: 'relative' }}>
                <div style={{
                    flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 8,
                    background: '#fff', border: '1px solid #d0d5dd', borderRadius: 8,
                    paddingLeft: 12, position: 'relative',
                }}>
                    <Search size={16} color="#667085" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Type address, locality, landmark…"
                        autoComplete="off"
                        style={{ flex: 1, padding: '10px 8px', border: 0, outline: 'none', fontSize: 14, background: 'transparent' }}
                    />
                    {searching && <Loader2 size={14} className="animate-spin" color="#667085" style={{ marginRight: 12 }} />}

                    {/* Live autocomplete dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <ul style={{
                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                            background: '#fff', border: '1px solid #d0d5dd', borderRadius: 8,
                            boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
                            listStyle: 'none', margin: 0, padding: 4, zIndex: 1000,
                            maxHeight: 280, overflowY: 'auto',
                        }}>
                            {suggestions.map((s, i) => (
                                <li
                                    key={s.place_id ?? `${s.lat}-${s.lon}`}
                                    onMouseDown={e => { e.preventDefault(); pickSuggestion(s) }}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    style={{
                                        padding: '10px 12px', borderRadius: 6,
                                        cursor: 'pointer', fontSize: 13, color: '#344054',
                                        background: i === activeIndex ? '#f0fdf4' : 'transparent',
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                    }}
                                >
                                    <MapPin size={14} color="#183C38" style={{ marginTop: 2, flexShrink: 0 }} />
                                    <span style={{ lineHeight: 1.4 }}>{s.display_name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    type="button"
                    onClick={useMyLocation}
                    title="Use my current location"
                    style={{
                        padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        background: '#fff', color: '#344054', border: '1px solid #d0d5dd', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <Crosshair size={14} /> My location
                </button>
            </form>

            {searchError && (
                <div style={{ fontSize: 13, color: '#B42318', marginBottom: 8 }}>{searchError}</div>
            )}

            {/* Map */}
            <div style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid #eaecf0' }}>
                <MapContainer
                    center={center}
                    zoom={initialZoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                    zoomControl={false}
                >
                    {/* Move the +/- buttons to the bottom-right so they don't
                        sit underneath the autocomplete dropdown that drops
                        down from the search bar above. The default top-left
                        position was being covered by the dropdown's own
                        space, making it look like the buttons were blocking
                        the search results. */}
                    <ZoomControl position="bottomright" />
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {lat != null && lng != null && (
                        <Marker
                            position={[lat, lng]}
                            draggable
                            icon={markerIcon}
                            eventHandlers={{
                                dragend(e) {
                                    const ll = (e.target as L.Marker).getLatLng()
                                    onChange(ll.lat, ll.lng)
                                },
                            }}
                        />
                    )}
                    <ClickHandler onPick={onChange} />
                    <FlyToController lat={lat} lng={lng} />
                </MapContainer>
            </div>

            {/* Helper line */}
            <div style={{ marginTop: 8, fontSize: 12, color: '#475467', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} />
                {lat != null && lng != null ? (
                    <span>Drag the pin or click the map to adjust — coordinates auto-update below.</span>
                ) : (
                    <span>Click anywhere on the map to drop a pin, use search above, or type coordinates below.</span>
                )}
            </div>

            {/* Manual lat/lng inputs — see CoordInput for why these need
                local string state. Pin and inputs are two-way bound, but
                the inputs hold their own draft string while typing so a
                value like "77." doesn't immediately get rounded back to
                "77" by the parent re-render (which used to make backspace
                "stick" at the first digit). */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <CoordInput
                    label="Latitude"
                    value={lat}
                    placeholder="e.g. 12.9716"
                    onCommit={(la) => { if (la != null) onChange(la, lng ?? 0) }}
                />
                <CoordInput
                    label="Longitude"
                    value={lng}
                    placeholder="e.g. 77.5946"
                    onCommit={(ln) => { if (ln != null) onChange(lat ?? 0, ln) }}
                />
            </div>
        </div>
    )
}

/**
 * Tiny lat-or-lng input that keeps its own draft string while the user is
 * typing. Pushes the parsed number up to the parent on every change AS LONG
 * AS the draft parses to a valid number — but the displayed value is the
 * draft string itself, not the parent prop. This way:
 *   • "12.9716" → "12.971" → "12.97" → ... → "" all work without snapback
 *   • Trailing "." (in "77.") survives until the user types the next digit
 *   • Pin drag from the map still updates the displayed value, because the
 *     prop change resyncs the draft (handled by the useEffect below)
 */
function CoordInput({
    label, value, placeholder, onCommit,
}: {
    label: string
    value: number | null
    placeholder: string
    onCommit: (n: number | null) => void
}) {
    const [draft, setDraft] = useState<string>(value != null ? String(value) : '')

    // Resync the draft when the parent value changes from outside (e.g. user
    // dragged the pin or picked an autocomplete suggestion). Skip the resync
    // if the draft already parses to the same number — otherwise typing
    // "12.97" right after the parent set "12.97000000" would be clobbered.
    useEffect(() => {
        const parsed = parseFloat(draft)
        const same = !isNaN(parsed) && value != null && Math.abs(parsed - value) < 1e-7
        if (!same) setDraft(value != null ? String(value) : '')
        // We deliberately don't depend on `draft` — only react to external value changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>{label}</label>
            <input
                type="text"
                inputMode="decimal"
                value={draft}
                placeholder={placeholder}
                onChange={e => {
                    const next = e.target.value
                    setDraft(next)
                    if (next.trim() === '') {
                        onCommit(null)
                        return
                    }
                    const n = parseFloat(next)
                    if (!isNaN(n)) onCommit(n)
                }}
                style={{
                    width: '100%', padding: '10px 12px', fontSize: 14,
                    border: '1px solid #d0d5dd', borderRadius: 8, outline: 'none',
                }}
            />
        </div>
    )
}
