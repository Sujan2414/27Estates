import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, StyleSheet, Pressable,
  ActivityIndicator, Text,
} from 'react-native'
import Mapbox, { Camera, MarkerView, MapView } from '@rnmapbox/maps'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows } from '@/theme/colors'
import { EmployeePin } from './EmployeePin'
import { PropertyPin } from './PropertyPin'
import { PropertySheet } from './PropertySheet'
import { MapFilterBar } from './MapFilterBar'
import {
  fetchEmployeeLocations,
  fetchPropertyPins,
  fetchCities,
  type EmployeeLocation,
  type PropertyPin as PropertyPinData,
  type MapFilters,
} from '@/lib/map-data'
import { MAP_STYLE_URL } from '@/lib/mapbox-style'
import { supabase } from '@/lib/supabase'

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!)

const DEFAULT_CENTER: [number, number] = [77.5946, 12.9716]
const DEFAULT_ZOOM = 11

export function MapScreen() {
  const cameraRef = useRef<Camera>(null)

  const [loading, setLoading]             = useState(true)
  const [employees, setEmployees]         = useState<EmployeeLocation[]>([])
  const [properties, setProperties]       = useState<PropertyPinData[]>([])
  const [cities, setCities]               = useState<string[]>([])
  const [selectedPin, setSelectedPin]     = useState<PropertyPinData | null>(null)
  const [showEmployees, setShowEmployees] = useState(true)
  const [filters, setFilters]             = useState<MapFilters>({ type: 'all', city: 'all' })

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    loadProperties()
  }, [filters])

  useEffect(() => {
    const channel = supabase
      .channel('employee_locations_map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_locations' },
        () => { loadEmployees() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadEmployees(), loadProperties(), loadCities()])
    setLoading(false)
  }

  async function loadEmployees() {
    const data = await fetchEmployeeLocations()
    setEmployees(data)
  }

  async function loadProperties() {
    const data = await fetchPropertyPins(filters)
    setProperties(data)
  }

  async function loadCities() {
    const data = await fetchCities()
    setCities(data)
  }

  const handlePropertyPress = useCallback((pin: PropertyPinData) => {
    setSelectedPin(pin)
    cameraRef.current?.flyTo([pin.lng, pin.lat], 1000)
    cameraRef.current?.zoomTo(15, 800)
  }, [])

  const handleSheetClose = useCallback(() => {
    setSelectedPin(null)
  }, [])

  const flyToCurrentLocation = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const mine = employees.find(e => e.employee_id === user.id)
    if (mine) {
      cameraRef.current?.flyTo([mine.lng, mine.lat], 800)
      cameraRef.current?.zoomTo(16, 600)
    }
  }, [employees])

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={MAP_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassPosition={{ top: 120, right: 16 }}
        scaleBarEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={DEFAULT_CENTER}
          zoomLevel={DEFAULT_ZOOM}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {showEmployees && employees.map(emp => (
          <MarkerView
            key={`emp-${emp.employee_id}`}
            coordinate={[emp.lng, emp.lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <EmployeePin employee={emp} />
          </MarkerView>
        ))}

        {properties.map(pin => (
          <MarkerView
            key={`pin-${pin.type}-${pin.id}`}
            coordinate={[pin.lng, pin.lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <PropertyPin
              pin={pin}
              onPress={handlePropertyPress}
              selected={selectedPin?.id === pin.id}
            />
          </MarkerView>
        ))}
      </MapView>

      <MapFilterBar
        filters={filters}
        cities={cities}
        onChange={setFilters}
        employeeCount={employees.length}
        showEmployees={showEmployees}
        onToggleEmployees={() => setShowEmployees(v => !v)}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      <View style={styles.fabStack}>
        <Pressable style={styles.fab} onPress={loadAll}>
          <Ionicons name="refresh-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable style={styles.fab} onPress={flyToCurrentLocation}>
          <Ionicons name="locate-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {employees.length > 0 && (
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{employees.length} live</Text>
        </View>
      )}

      <PropertySheet pin={selectedPin} onClose={handleSheetClose} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabStack: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 10,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  liveChip: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    ...shadows.xs,
  },
  liveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
})
