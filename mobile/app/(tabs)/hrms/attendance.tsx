import { useState, useEffect } from 'react'
import {
  View, Text, SafeAreaView, StyleSheet, FlatList,
  Pressable, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { colors, radius, shadows } from '@/theme/colors'

interface AttendanceRecord {
  id: string
  clock_in: string
  clock_out: string | null
  status: string
  date: string
}

export default function AttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    loadAttendance()
  }, [month])

  async function loadAttendance() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!emp) { setLoading(false); return }

      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).toISOString()
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59).toISOString()

      const { data } = await supabase
        .from('hrm_attendance')
        .select('*')
        .eq('employee_id', emp.id)
        .gte('clock_in', startOfMonth)
        .lte('clock_in', endOfMonth)
        .order('clock_in', { ascending: false })

      setRecords(data || [])
    } catch (e) {
      console.log('Error loading attendance:', e)
    } finally {
      setLoading(false)
    }
  }

  const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const changeMonth = (delta: number) => {
    const next = new Date(month)
    next.setMonth(next.getMonth() + delta)
    setMonth(next)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const getHours = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return 'Active'
    const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime()
    const hrs = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return `${hrs}h ${mins}m`
  }

  // Stats
  const present = records.filter(r => r.clock_in).length
  const totalHrs = records.reduce((sum, r) => {
    if (!r.clock_out) return sum
    return sum + (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 3600000
  }, 0)

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Month navigator */}
      <View style={s.monthRow}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={s.monthText}>{monthName}</Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: colors.primaryLight }]}>
          <Text style={[s.statValue, { color: colors.primary }]}>{present}</Text>
          <Text style={s.statLabel}>Present</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.successLight }]}>
          <Text style={[s.statValue, { color: colors.success }]}>{totalHrs.toFixed(1)}</Text>
          <Text style={s.statLabel}>Total Hrs</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.warningLight }]}>
          <Text style={[s.statValue, { color: colors.warning }]}>0</Text>
          <Text style={s.statLabel}>Late</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.dangerLight }]}>
          <Text style={[s.statValue, { color: colors.danger }]}>0</Text>
          <Text style={s.statLabel}>Absent</Text>
        </View>
      </View>

      {/* Records list */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : records.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="calendar-outline" size={48} color={colors.border} />
          <Text style={s.emptyText}>No attendance records</Text>
          <Text style={s.emptySubtext}>for {monthName}</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={s.recordCard}>
              <View style={s.recordLeft}>
                <View style={[s.dayBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[s.dayText, { color: colors.primary }]}>
                    {new Date(item.clock_in).getDate()}
                  </Text>
                </View>
              </View>
              <View style={s.recordContent}>
                <Text style={s.recordDate}>{formatDate(item.clock_in)}</Text>
                <Text style={s.recordTime}>
                  {formatTime(item.clock_in)} → {item.clock_out ? formatTime(item.clock_out) : 'Active'}
                </Text>
              </View>
              <View style={s.recordRight}>
                <Text style={[
                  s.recordHrs,
                  { color: item.clock_out ? colors.success : colors.info }
                ]}>
                  {getHours(item.clock_in, item.clock_out)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 160,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 14,
    marginBottom: 8,
    ...shadows.sm,
  },
  recordLeft: {
    marginRight: 12,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
  },
  recordContent: {
    flex: 1,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recordTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordHrs: {
    fontSize: 14,
    fontWeight: '700',
  },
})
