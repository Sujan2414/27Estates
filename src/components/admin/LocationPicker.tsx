'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin, Loader2, Crosshair } from 'lucide-react'

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

    const center: [number, number] = lat != null && lng != null ? [lat, lng] : defaultCenter
    const initialZoom = lat != null && lng != null ? 16 : 11

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        const q = search.trim()
        if (!q) return
        setSearching(true)
        setSearchError(null)
        try {
            // Nominatim is OSM's free geocoder — no API key, ~1 req/sec rate
            // limit (fine for an admin form). countrycodes=in narrows to India.
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=in&addressdetails=0`,
                { headers: { 'Accept-Language': 'en' } },
            )
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const results = await res.json()
            if (!Array.isArray(results) || results.length === 0) {
                setSearchError('No results for that address')
                return
            }
            onChange(parseFloat(results[0].lat), parseFloat(results[0].lon))
        } catch (err: any) {
            setSearchError(err.message || 'Search failed')
        } finally {
            setSearching(false)
        }
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
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{
                    flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 8,
                    background: '#fff', border: '1px solid #d0d5dd', borderRadius: 8,
                    paddingLeft: 12,
                }}>
                    <Search size={16} color="#667085" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search address (e.g. Indiranagar, Bangalore)"
                        style={{ flex: 1, padding: '10px 8px', border: 0, outline: 'none', fontSize: 14, background: 'transparent' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={searching || !search.trim()}
                    style={{
                        padding: '0 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                        background: '#183C38', color: '#fff', border: 0, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        opacity: searching || !search.trim() ? 0.5 : 1,
                    }}
                >
                    {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    {searching ? 'Searching…' : 'Find'}
                </button>
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
                >
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
                    <span>
                        <strong>{lat.toFixed(6)}, {lng.toFixed(6)}</strong> — drag the pin or click the map to adjust
                    </span>
                ) : (
                    <span>Click anywhere on the map to drop a pin, or use search above.</span>
                )}
            </div>
        </div>
    )
}
