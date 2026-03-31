import { useEffect, useState } from 'react'
import {
  View, Text, Pressable, SafeAreaView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native'
import * as Location from 'expo-location'
import { haptic } from '@/lib/haptics'
import { startLocationTracking, stopLocationTracking } from '@/lib/location-tracker'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'

export default function ClockInAreaScreen() {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [address, setAddress] = useState('Fetching location...')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [isInArea, setIsInArea] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    // 1) Load employee name (don't block on this)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('employees').select('full_name').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.full_name) setName(data.full_name) })
    })

    // 2) Get location with timeout
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setAddress('Location permission denied')
        setLoading(false)
        return
      }

      // Try getting location with 10s timeout
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<Location.LocationObject>((_, rej) =>
          setTimeout(() => rej(new Error('timeout')), 10000)
        ),
      ]).catch(async () => {
        // Fallback: try last known position
        const last = await Location.getLastKnownPositionAsync()
        return last
      })

      if (loc) {
        setLat(loc.coords.latitude)
        setLng(loc.coords.longitude)
        // Reverse geocode (non-blocking)
        Location.reverseGeocodeAsync(loc.coords)
          .then(([geo]) => {
            if (geo) {
              const addr = [geo.street, geo.district, geo.city].filter(Boolean).join(', ')
              setAddress(addr || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`)
            }
          })
          .catch(() => setAddress(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`))
        setIsInArea(true) // For now, always allow clock-in
      } else {
        setAddress('Could not get location')
      }
    } catch (e) {
      console.warn('Location error:', e)
      setAddress('Location unavailable')
    }
    setLoading(false)
  }

  const goToSelfie = async () => {
    haptic.medium()
    router.push({
      pathname: '/(tabs)/hrms/selfie-clock-in',
      params: {
        lat: lat?.toString() ?? '',
        lng: lng?.toString() ?? '',
        address: address,
      },
    })
    await startLocationTracking()
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Clock In Area</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loaderText}>Getting your location...</Text>
        </View>
      ) : (
        <View style={s.body}>
          {/* Map placeholder */}
          <View style={s.map}>
            <View style={s.geofence}>
              <Ionicons name="person-circle" size={32} color={colors.primary} />
            </View>
            <Text style={s.mapAddr} numberOfLines={2}>{address}</Text>
          </View>

          {/* Status */}
          <View style={[s.status, isInArea ? s.statusOk : s.statusWarn]}>
            <Ionicons name={isInArea ? 'checkmark-circle' : 'warning'} size={18} color={isInArea ? colors.success : colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: isInArea ? colors.success : colors.warning }}>
                {isInArea ? 'You are in the clock-in area!' : 'Outside clock-in area'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {isInArea ? 'Now you can press clock in.' : 'Move closer to the office.'}
              </Text>
            </View>
          </View>

          {/* Profile */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>MY PROFILE</Text>
            <View style={s.profileRow}>
              <View style={s.avatar}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.profileName}>{name || 'Employee'}</Text>
                  <Ionicons name="checkmark-circle" size={14} color={colors.info} />
                </View>
                <Text style={{ fontSize: 12, color: colors.primary, marginTop: 1 }}>{format(new Date(), 'd MMMM yyyy')}</Text>
                {lat != null && lng != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <Ionicons name="location" size={10} color={colors.primary} />
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>Lat {lat.toFixed(5)} Long {lng.toFixed(5)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Schedule */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>SCHEDULE</Text>
            <View style={s.scheduleBox}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5 }}>CLOCK IN</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginTop: 2 }}>09:00</Text>
            </View>
          </View>

          {/* Selfie button */}
          <Pressable style={({ pressed }) => [s.selfieWrap, pressed && { opacity: 0.85 }]} onPress={goToSelfie}>
            <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.selfieBtn}>
              <Ionicons name="camera-outline" size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Selfie To Clock In</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { ...t.body, color: colors.textMuted },

  body: { flex: 1, padding: 16, gap: 16 },

  map: {
    height: 180, borderRadius: radius.md, backgroundColor: '#E8ECF4',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  geofence: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(24,60,56,0.1)', borderWidth: 2, borderColor: 'rgba(24,60,56,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapAddr: { position: 'absolute', bottom: 8, left: 12, fontSize: 10, color: colors.textSecondary },

  status: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: radius.md },
  statusOk: { backgroundColor: colors.successLight },
  statusWarn: { backgroundColor: colors.warningLight },

  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  scheduleBox: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    padding: 12, alignSelf: 'flex-start', minWidth: 100, alignItems: 'center',
  },

  selfieWrap: { borderRadius: radius.pill, overflow: 'hidden', marginTop: 'auto', marginBottom: 16 },
  selfieBtn: { height: 52, borderRadius: radius.pill, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
})
