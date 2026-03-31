import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { supabase } from '@/lib/supabase'

export const LOCATION_TASK = '21ESTATES_LOCATION_TASK'

// Background task definition — must be at module top-level
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.warn('[LocationTask] error:', error.message)
    return
  }
  const { locations } = data as { locations: Location.LocationObject[] }
  const latest = locations[locations.length - 1]
  if (!latest) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('employee_locations')
    .upsert(
      {
        employee_id: user.id,
        lat: latest.coords.latitude,
        lng: latest.coords.longitude,
        accuracy: latest.coords.accuracy,
        heading: latest.coords.heading,
        updated_at: new Date(latest.timestamp).toISOString(),
      },
      { onConflict: 'employee_id' }
    )
})

// Start tracking (call on clock-in)
export async function startLocationTracking(): Promise<boolean> {
  const { status } = await Location.requestBackgroundPermissionsAsync()
  if (status !== 'granted') {
    console.warn('[LocationTracker] background location permission denied')
    return false
  }

  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
  if (isRunning) return true

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30_000,
    distanceInterval: 50,
    foregroundService: {
      notificationTitle: '21 Estates',
      notificationBody: 'Location tracking active during your shift',
      notificationColor: '#183C38',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  })

  return true
}

// Stop tracking (call on clock-out)
export async function stopLocationTracking(): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
  if (!isRunning) return

  await Location.stopLocationUpdatesAsync(LOCATION_TASK)

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('employee_locations')
      .delete()
      .eq('employee_id', user.id)
  }
}
