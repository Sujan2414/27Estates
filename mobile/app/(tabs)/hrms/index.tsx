import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, SafeAreaView,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native'
import * as Location from 'expo-location'
import { haptic } from '@/lib/haptics'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { stopLocationTracking } from '@/lib/location-tracker'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'

interface AttendanceRecord {
  id: string; date: string; status: string
  check_in?: string; check_out?: string
  check_in_address?: string; hours_worked?: number
  work_mode?: string; break_start?: string; break_end?: string
}

type ScreenState = 'not_clocked_in' | 'clocked_in' | 'on_break' | 'clocked_out'

export default function AttendanceScreen() {
  const [today, setToday] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState<'clock_in' | 'clock_out' | null>(null)
  const [payPeriodHours, setPayPeriodHours] = useState(0)

  // Determine screen state from today's record
  const isOnBreak = !!today?.break_start && !today?.break_end
  const screenState: ScreenState =
    today?.check_out ? 'clocked_out'
    : isOnBreak ? 'on_break'
    : today?.check_in ? 'clocked_in'
    : 'not_clocked_in'

  const getTodayHours = () => {
    if (today?.hours_worked) {
      const h = Math.floor(today.hours_worked)
      const m = Math.round((today.hours_worked % 1) * 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    if (today?.check_in && !today?.check_out) {
      const mins = Math.floor((Date.now() - new Date(today.check_in).getTime()) / 60000)
      return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    }
    return '00:00'
  }

  useFocusEffect(useCallback(() => { loadData() }, []))

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

      const [{ data: todayRec }, { data: monthRecs }] = await Promise.all([
        supabase.from('hrm_attendance').select('*')
          .eq('employee_id', user.id).eq('date', todayStr).maybeSingle(),
        supabase.from('hrm_attendance').select('*')
          .eq('employee_id', user.id).gte('date', monthStart)
          .order('date', { ascending: false }),
      ])

      setToday(todayRec ?? null)
      if (monthRecs) {
        setHistory(monthRecs.filter(r => r.date !== todayStr).slice(0, 10))
        setPayPeriodHours(monthRecs.reduce((s, r) => s + (Number(r.hours_worked) || 0), 0))
      }
    } catch (e) {
      console.warn('loadData error:', e)
    }
    setLoading(false)
  }

  const handleClockInPress = () => {
    haptic.medium()
    router.push('/(tabs)/hrms/clock-in')
  }

  const handleTakeBreak = async () => {
    if (!today) return
    haptic.medium(); setActionLoading(true)
    await supabase.from('hrm_attendance').update({
      break_start: new Date().toISOString(),
    }).eq('id', today.id)
    setActionLoading(false); haptic.success(); loadData()
  }

  const handleBackToWork = async () => {
    if (!today) return
    haptic.medium(); setActionLoading(true)
    const breakMins = today.break_start
      ? Math.round((Date.now() - new Date(today.break_start).getTime()) / 60000)
      : 0
    await supabase.from('hrm_attendance').update({
      break_end: new Date().toISOString(),
      break_minutes: breakMins,
    }).eq('id', today.id)
    setActionLoading(false); haptic.success(); loadData()
  }

  const handleClockOut = async () => {
    if (!today) return
    haptic.medium(); setActionLoading(true); setShowClockOutModal(false)
    try {
      const hrs = (Date.now() - new Date(today.check_in!).getTime()) / 3600000
      let lat = null, lng = null, addr = null
      try {
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, rej) => setTimeout(() => rej('timeout'), 5000)),
        ])
        lat = loc.coords.latitude; lng = loc.coords.longitude
        const [geo] = await Location.reverseGeocodeAsync(loc.coords)
        addr = [geo?.street, geo?.district, geo?.city].filter(Boolean).join(', ')
      } catch {}
      await supabase.from('hrm_attendance').update({
        check_out: new Date().toISOString(),
        check_out_lat: lat, check_out_lng: lng,
        check_out_address: addr,
        hours_worked: Math.round(hrs * 100) / 100,
        break_end: today.break_start && !today.break_end ? new Date().toISOString() : today.break_end,
      }).eq('id', today.id)
      await stopLocationTracking()
      haptic.success()
      setShowSuccessModal('clock_out')
    } catch {}
    setActionLoading(false); loadData()
  }

  const todayHours = getTodayHours()

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Gradient Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryMid, colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.headerGradient}
        >
          <View style={s.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Let's Clock-In!</Text>
              <Text style={s.headerSub}>Don't miss your clock in schedule</Text>
            </View>
            <View style={s.illustrationWrap}>
              <Ionicons name="paper-plane-outline" size={44} color="rgba(255,255,255,0.3)" style={{ transform: [{ rotate: '-30deg' }] }} />
              <View style={s.illustrationBubble}>
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.5)" />
              </View>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={s.skeletonWrap}>
            <Skeleton height={180} borderRadius={16} />
            <Skeleton height={80} borderRadius={12} />
          </View>
        ) : (
          <>
            {/* Working Hours Card */}
            <View style={[s.card, shadows.card]}>
              <Text style={s.cardTitle}>Total Working Hour</Text>
              <Text style={s.cardPeriod}>
                Paid Period {format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'd MMM yyyy')} - {format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'd MMM yyyy')}
              </Text>
              <View style={s.hoursRow}>
                <View style={s.hoursCol}>
                  <View style={s.dotRow}>
                    <View style={[s.dot, { backgroundColor: colors.textMuted }]} />
                    <Text style={s.dotLabel}>Today</Text>
                  </View>
                  <Text style={s.hoursVal}>{todayHours} Hrs</Text>
                </View>
                <View style={s.hoursDivider} />
                <View style={s.hoursCol}>
                  <View style={s.dotRow}>
                    <View style={[s.dot, { backgroundColor: colors.primary }]} />
                    <Text style={s.dotLabel}>This Pay Period</Text>
                  </View>
                  <Text style={s.hoursVal}>{payPeriodHours.toFixed(0)}:00 Hrs</Text>
                </View>
              </View>

              {screenState === 'not_clocked_in' && (
                <GradientButton label="Clock In Now" onPress={handleClockInPress} />
              )}
              {screenState === 'clocked_in' && (
                <View style={s.dualRow}>
                  <Pressable style={[s.outlineBtn, { flex: 1 }]} onPress={handleTakeBreak} disabled={actionLoading}>
                    <Text style={s.outlineBtnText}>Take A Break</Text>
                  </Pressable>
                  <Pressable style={[s.darkBtn, { flex: 1 }]} onPress={() => setShowClockOutModal(true)}>
                    <Text style={s.darkBtnText}>Clock Out</Text>
                  </Pressable>
                </View>
              )}
              {screenState === 'on_break' && (
                <GradientButton label="Back To Work" onPress={handleBackToWork} loading={actionLoading} />
              )}
              {screenState === 'clocked_out' && (
                <View style={[s.gradientBtnWrap, { opacity: 0.4 }]}>
                  <LinearGradient colors={['#98A2B3', '#6B7280']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gradientBtn}>
                    <Text style={s.gradientBtnText}>Clocked Out</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* History */}
            <View style={s.historyWrap}>
              {[...(today?.check_in ? [today] : []), ...history].map((rec, i) => (
                <View key={rec.id || i} style={s.historyItem}>
                  <View style={s.historyDateRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                    <Text style={s.historyDate}>{format(new Date(rec.date), 'd MMMM yyyy')}</Text>
                  </View>
                  <View style={s.historyInfoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.historyLabel}>Total Hours</Text>
                      <Text style={s.historyValue}>
                        {rec.hours_worked ? `${String(Math.floor(Number(rec.hours_worked))).padStart(2, '0')}:${String(Math.round((Number(rec.hours_worked) % 1) * 60)).padStart(2, '0')}:00 hrs` : '—'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.historyLabel}>Clock in & Out</Text>
                      <Text style={s.historyValue}>
                        {rec.check_in ? format(new Date(rec.check_in), 'hh:mm a') : '—'}
                        {' \u2014 '}
                        {rec.check_out ? format(new Date(rec.check_out), 'hh:mm a') : '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              {history.length === 0 && !today?.check_in && (
                <View style={s.empty}>
                  <Ionicons name="calendar-clear-outline" size={36} color={colors.textMuted} />
                  <Text style={s.emptyText}>No attendance records yet</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Clock Out Confirmation */}
      <Modal visible={showClockOutModal} transparent animationType="slide">
        <Pressable style={s.overlay} onPress={() => setShowClockOutModal(false)}>
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <View style={s.handle} />
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.sheetIcon}>
                <Ionicons name="time-outline" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.sheetTitle}>Confirm Clockout</Text>
            <Text style={s.sheetDesc}>Once you clock out, you won't be able to edit this. Double-check your hours.</Text>
            <View style={s.overtimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.overtimeLabel}>Total Hours</Text>
                <Text style={s.overtimeVal}>{todayHours} Hrs</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.overtimeLabel}>Overtime</Text>
                <Text style={s.overtimeVal}>00:00:00 Hrs</Text>
              </View>
            </View>
            <GradientButton label="Yes, Clock Out" onPress={handleClockOut} loading={actionLoading} style={{ marginTop: 16 }} />
            <Pressable onPress={() => setShowClockOutModal(false)} style={{ marginTop: 14, alignSelf: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>No, Let me check</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal !== null} transparent animationType="fade">
        <View style={[s.overlay, { justifyContent: 'center' }]}>
          <View style={[s.successBox, shadows.modal]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.sheetIcon}>
                <Ionicons name={showSuccessModal === 'clock_in' ? 'person-outline' : 'time-outline'} size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.sheetTitle}>
              {showSuccessModal === 'clock_in' ? 'Clock-In Successful!' : 'Clockout Successful!'}
            </Text>
            <Text style={s.sheetDesc}>
              {showSuccessModal === 'clock_in'
                ? "You're all set! Head over to your dashboard to see your assigned tasks."
                : "You've officially clocked out. Thank you for your hard work!"}
            </Text>
            <GradientButton label={showSuccessModal === 'clock_in' ? 'Go To Clock In Page' : 'Close Message'} onPress={() => setShowSuccessModal(null)} style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function GradientButton({ label, onPress, loading, style }: { label: string; onPress: () => void; loading?: boolean; style?: object }) {
  return (
    <Pressable style={({ pressed }) => [s.gradientBtnWrap, pressed && { opacity: 0.85 }, style]} onPress={onPress} disabled={loading}>
      <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gradientBtn}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.gradientBtnText}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerGradient: { paddingTop: 52, paddingBottom: 60, paddingHorizontal: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  illustrationWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  illustrationBubble: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  skeletonWrap: { padding: 16, gap: 12, marginTop: -40 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginHorizontal: 16, marginTop: -40, padding: 20, gap: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cardPeriod: { fontSize: 11, color: colors.textMuted, marginTop: -8 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  hoursCol: { flex: 1 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotLabel: { ...t.xs, color: colors.textMuted },
  hoursVal: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  hoursDivider: { width: 1, height: 50, backgroundColor: colors.border, marginHorizontal: 12 },
  gradientBtnWrap: { borderRadius: radius.pill, overflow: 'hidden' },
  gradientBtn: { height: 48, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center' },
  gradientBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  dualRow: { flexDirection: 'row', gap: 10 },
  outlineBtn: { height: 44, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  outlineBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  darkBtn: { height: 44, borderRadius: radius.pill, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center' },
  darkBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  historyWrap: { paddingHorizontal: 16, paddingTop: 20 },
  historyItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  historyDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  historyDate: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  historyInfoRow: { flexDirection: 'row' },
  historyLabel: { ...t.xs, color: colors.textMuted, marginBottom: 2 },
  historyValue: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { ...t.body, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  sheetIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  sheetDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  overtimeRow: { flexDirection: 'row', marginTop: 20, gap: 16 },
  overtimeLabel: { ...t.xs, color: colors.textMuted },
  overtimeVal: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  successBox: { backgroundColor: colors.surface, borderRadius: 24, marginHorizontal: 32, padding: 28 },
})
