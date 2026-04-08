import * as Location from 'expo-location'
import { supabase } from '@/lib/supabase'

/**
 * Calculate the Haversine distance between two GPS coordinates.
 * Returns distance in metres.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_M = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

/**
 * Check whether the agent is within a geofence radius of a property.
 * Default radius is 150 metres.
 */
export function isWithinGeofence(
  agentLat: number,
  agentLng: number,
  propLat: number,
  propLng: number,
  radiusMetres: number = 150
): boolean {
  const distance = haversineDistance(agentLat, agentLng, propLat, propLng)
  return distance <= radiusMetres
}

/**
 * Format an Expo Location reverse-geocode result into a human-readable address.
 */
export function formatAddress(geocode: Location.LocationGeocodedAddress): string {
  const parts: string[] = []

  if (geocode.streetNumber) parts.push(geocode.streetNumber)
  if (geocode.street) parts.push(geocode.street)
  if (geocode.district) parts.push(geocode.district)
  if (geocode.subregion) parts.push(geocode.subregion)
  if (geocode.city) parts.push(geocode.city)
  if (geocode.region) parts.push(geocode.region)
  if (geocode.postalCode) parts.push(geocode.postalCode)
  if (geocode.country) parts.push(geocode.country)

  return parts.filter(Boolean).join(', ')
}

/**
 * Start a site visit record in Supabase.
 * Returns the newly created visit ID.
 */
export async function startSiteVisit(
  leadId: string,
  employeeId: string
): Promise<string> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Location permission denied. Cannot start site visit.')
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  })

  let address: string | null = null
  try {
    const [geocode] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    })
    if (geocode) address = formatAddress(geocode)
  } catch {
    // Non-critical — continue without address
  }

  const { data, error } = await supabase
    .from('site_visits')
    .insert({
      lead_id: leadId,
      employee_id: employeeId,
      start_time: new Date().toISOString(),
      start_lat: location.coords.latitude,
      start_lng: location.coords.longitude,
      start_address: address,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

/**
 * End a site visit: update the record with end time, duration, and photos.
 */
export async function endSiteVisit(
  visitId: string,
  photos: string[]
): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync()

  let endLat: number | null = null
  let endLng: number | null = null

  if (status === 'granted') {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      endLat = location.coords.latitude
      endLng = location.coords.longitude
    } catch {
      // Non-critical
    }
  }

  const endTime = new Date().toISOString()

  const { error } = await supabase
    .from('site_visits')
    .update({
      end_time: endTime,
      end_lat: endLat,
      end_lng: endLng,
      photos,
      status: 'completed',
    })
    .eq('id', visitId)

  if (error) throw new Error(error.message)
}
