'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface EmployeeMarker {
    id: string
    name: string
    lat: number
    lng: number
    withinGeofence: boolean | null
    checkInTime?: string | null
    distanceM?: number | null
    address?: string | null
    role?: string | null
    avatarUrl?: string | null
}

interface Props {
    /** Office latitude */
    officeLat: number
    /** Office longitude */
    officeLng: number
    /** Geofence radius in metres */
    radiusM: number
    /** Current user lat (optional — if missing, only office is shown) */
    userLat: number | null
    /** Current user lng (optional) */
    userLng: number | null
    /** Other employee markers to plot (super_admin view) */
    employees?: EmployeeMarker[]
}

const OFFICE_COLOR = '#183C38'
const USER_COLOR = '#2563eb'
const INSIDE_COLOR = 'rgba(24, 60, 56, 0.18)'
const OUTSIDE_COLOR = 'rgba(239, 68, 68, 0.22)'

function officeIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `<div style="
            width: 28px; height: 28px; border-radius: 50%;
            background: ${OFFICE_COLOR}; border: 3px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 11px; font-weight: 700;
        ">HQ</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    })
}

function userIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `<div style="
            width: 18px; height: 18px; border-radius: 50%;
            background: ${USER_COLOR}; border: 3px solid #fff;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25), 0 2px 4px rgba(0,0,0,0.2);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    })
}

function employeeIcon(name: string, withinGeofence: boolean | null, avatarUrl?: string | null): L.DivIcon {
    const ring = withinGeofence === false ? '#dc2626' : '#0891b2'
    const initial = (name?.charAt(0) || '?').toUpperCase()
    const safeUrl = avatarUrl ? avatarUrl.replace(/"/g, '&quot;') : ''
    const inner = safeUrl
        ? `<img src="${safeUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
           <div style="display:none; width: 100%; height: 100%; border-radius: 50%; background: ${ring}; color: #fff; font-size: 12px; font-weight: 700; align-items: center; justify-content: center;">${initial}</div>`
        : `<div style="width: 100%; height: 100%; border-radius: 50%; background: ${ring}; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;">${initial}</div>`
    return L.divIcon({
        className: '',
        html: `<div style="
            width: 34px; height: 34px; border-radius: 50%;
            padding: 3px; background: ${ring};
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            overflow: hidden;
        ">${inner}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
    })
}

function FitBounds({
    officeLat, officeLng, radiusM, userLat, userLng, employees = [],
}: Required<Pick<Props, 'officeLat' | 'officeLng' | 'radiusM'>> & {
    userLat: number | null; userLng: number | null
    employees?: EmployeeMarker[]
}) {
    const map = useMap()
    useEffect(() => {
        const bounds = L.latLng(officeLat, officeLng).toBounds(radiusM * 2 * 1.4)
        if (userLat != null && userLng != null) {
            bounds.extend([userLat, userLng])
        }
        for (const e of employees) bounds.extend([e.lat, e.lng])
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 17 })
    }, [map, officeLat, officeLng, radiusM, userLat, userLng, employees])
    return null
}

export default function AttendanceGeofenceMap({
    officeLat, officeLng, radiusM, userLat, userLng, employees = [],
}: Props) {
    const [ready, setReady] = useState(false)
    useEffect(() => { setReady(true) }, [])

    const distanceM = useMemo(() => {
        if (userLat == null || userLng == null) return null
        const toRad = (d: number) => (d * Math.PI) / 180
        const R = 6_371_000
        const dLat = toRad(userLat - officeLat)
        const dLng = toRad(userLng - officeLng)
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(officeLat)) * Math.cos(toRad(userLat)) * Math.sin(dLng / 2) ** 2
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
    }, [officeLat, officeLng, userLat, userLng])

    const isOutside = distanceM != null && distanceM > radiusM
    const ringFill = isOutside ? OUTSIDE_COLOR : INSIDE_COLOR

    if (!ready) {
        return <div style={{ height: '100%', background: 'rgba(0,0,0,0.15)', borderRadius: 12 }} />
    }

    return (
        <MapContainer
            center={[officeLat, officeLng]}
            zoom={16}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            style={{ height: '100%', width: '100%', borderRadius: 12, background: '#dfe6e4' }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
                center={[officeLat, officeLng]}
                radius={radiusM}
                pathOptions={{ color: isOutside ? '#dc2626' : OFFICE_COLOR, fillColor: ringFill, fillOpacity: 1, weight: 2 }}
            />
            <Marker position={[officeLat, officeLng]} icon={officeIcon()} />
            {userLat != null && userLng != null && (
                <Marker position={[userLat, userLng]} icon={userIcon()} />
            )}
            {employees.map((e) => {
                const timeStr = e.checkInTime
                    ? new Date(e.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                    : null
                return (
                    <Marker
                        key={e.id}
                        position={[e.lat, e.lng]}
                        icon={employeeIcon(e.name, e.withinGeofence, e.avatarUrl)}
                        title={e.name}
                    >
                        <Popup>
                            <div style={{ minWidth: 210, fontFamily: 'inherit' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    {e.avatarUrl ? (
                                        <img
                                            src={e.avatarUrl}
                                            alt=""
                                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: e.withinGeofence === false ? '#dc2626' : '#0891b2',
                                            color: '#fff', fontSize: 15, fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {(e.name?.charAt(0) || '?').toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#183C38' }}>
                                            {e.name}
                                        </div>
                                        {e.role && (
                                            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                                                {e.role.replace('_', ' ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {timeStr && (
                                    <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                                        🕒 Checked in at <strong>{timeStr}</strong>
                                    </div>
                                )}
                                {e.address && (
                                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, lineHeight: 1.4 }}>
                                        📍 {e.address}
                                    </div>
                                )}
                                {e.distanceM != null && (
                                    <div style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: e.withinGeofence === false ? '#dc2626' : '#0891b2',
                                        marginTop: 6,
                                    }}>
                                        {e.withinGeofence === false
                                            ? `⚠ ${e.distanceM} m away — outside geofence`
                                            : `✓ ${e.distanceM} m from office`}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                )
            })}
            <FitBounds
                officeLat={officeLat}
                officeLng={officeLng}
                radiusM={radiusM}
                userLat={userLat}
                userLng={userLng}
                employees={employees}
            />
        </MapContainer>
    )
}
