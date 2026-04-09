import { useState, useEffect } from 'react'
import {
  View, Text, Pressable, SafeAreaView, StyleSheet, Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { colors, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'

export default function SelfieClockInScreen() {
  const { lat, lng, address } = useLocalSearchParams<{ lat: string; lng: string; address: string }>()
  const [photoTaken, setPhotoTaken] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const now = new Date()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('employees').select('full_name').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.full_name) setName(data.full_name) })
    })
  }, [])

  const takePhoto = () => {
    // Simulated photo capture
    setPhotoTaken(true)
  }

  const clockIn = async () => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!emp) throw new Error('Employee record not found')

      const { error } = await supabase.from('hrm_attendance').insert({
        employee_id: emp.id,
        clock_in: new Date().toISOString(),
        clock_in_lat: lat ? parseFloat(lat) : null,
        clock_in_lng: lng ? parseFloat(lng) : null,
        clock_in_address: address || null,
        status: 'present',
      })

      if (error) throw error

      Alert.alert('Clocked In', 'Your attendance has been recorded.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to clock in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Selfie To Clock In</Text>
        <View style={{ width: 36 }} />
      </View>

      {!photoTaken ? (
        /* Camera capture view */
        <View style={s.body}>
          {/* Camera placeholder */}
          <View style={s.cameraPreview}>
            <View style={s.cameraCircle}>
              <Ionicons name="camera" size={48} color={colors.textMuted} />
            </View>
            <Text style={s.cameraHint}>Position your face in the frame</Text>
            {/* Corner guides */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>

          {/* Info */}
          <View style={s.infoRow}>
            <Ionicons name="person" size={16} color={colors.primary} />
            <Text style={s.infoText}>{name || 'Employee'}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={s.infoText}>{format(now, 'd MMMM yyyy')}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={s.infoText} numberOfLines={1}>{address || 'Location unavailable'}</Text>
          </View>

          {/* Take photo button */}
          <Pressable style={({ pressed }) => [s.gradientWrap, pressed && { opacity: 0.85 }]} onPress={takePhoto}>
            <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gradientBtn}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={s.gradientBtnText}>Take Photo</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        /* Confirmation view */
        <View style={s.body}>
          {/* Selfie placeholder */}
          <View style={s.selfiePreview}>
            <View style={s.selfieIcon}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={s.selfieCaption}>Photo captured</Text>
          </View>

          {/* Employee info card */}
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={s.avatar}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.cardName}>{name || 'Employee'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={colors.info} />
                </View>
                <Text style={s.cardSub}>Verified</Text>
              </View>
            </View>

            <View style={s.cardDivider} />

            <View style={s.cardDetail}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={s.cardDetailText}>{format(now, 'd MMMM yyyy, hh:mm a')}</Text>
            </View>
            <View style={s.cardDetail}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={s.cardDetailText} numberOfLines={1}>{address || 'Location unavailable'}</Text>
            </View>
            {lat && lng && (
              <View style={s.cardDetail}>
                <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                <Text style={s.cardDetailText}>
                  Lat {parseFloat(lat).toFixed(5)}, Lng {parseFloat(lng).toFixed(5)}
                </Text>
              </View>
            )}
          </View>

          {/* Clock in button */}
          <Pressable
            style={({ pressed }) => [s.gradientWrap, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
            onPress={clockIn}
            disabled={submitting}
          >
            <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gradientBtn}>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={s.gradientBtnText}>{submitting ? 'Clocking In...' : 'Clock In & Start Day'}</Text>
            </LinearGradient>
          </Pressable>

          {/* Retake */}
          <Pressable style={s.retakeBtn} onPress={() => setPhotoTaken(false)}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={s.retakeText}>Retake Photo</Text>
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  body: { flex: 1, padding: 20, gap: 16 },

  /* Camera preview placeholder */
  cameraPreview: {
    height: 320, borderRadius: radius.lg, backgroundColor: '#E8ECF4',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  cameraCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(24,60,56,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(24,60,56,0.15)', borderStyle: 'dashed',
  },
  cameraHint: { fontSize: 13, color: colors.textMuted, marginTop: 16 },

  /* Corner guide marks */
  corner: { position: 'absolute', width: 28, height: 28, borderColor: colors.primary },
  cornerTL: { top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  /* Info rows */
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  infoText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

  /* Gradient button */
  gradientWrap: { borderRadius: radius.pill, overflow: 'hidden', marginTop: 'auto' },
  gradientBtn: {
    height: 52, borderRadius: radius.pill,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  gradientBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  /* Confirmation view */
  selfiePreview: {
    height: 240, borderRadius: radius.lg, backgroundColor: '#E8ECF4',
    justifyContent: 'center', alignItems: 'center',
  },
  selfieIcon: { marginBottom: 8 },
  selfieCaption: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },

  card: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    padding: 16, gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.success, marginTop: 1 },
  cardDivider: { height: 1, backgroundColor: colors.border },
  cardDetail: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardDetailText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

  retakeBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    paddingVertical: 12, marginBottom: 16,
  },
  retakeText: { fontSize: 14, fontWeight: '500', color: colors.primary },
})
