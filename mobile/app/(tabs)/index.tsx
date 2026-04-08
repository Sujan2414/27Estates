import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, SafeAreaView,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'

interface UserProfile {
  full_name: string
  role: string
  avatar_url?: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  progress?: number
  due_date?: string
  assigned_to?: string
}

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time?: string
  attendees?: string[]
}

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const todayStr = format(new Date(), 'yyyy-MM-dd')

      const [profileRes, tasksRes, meetingsRes] = await Promise.all([
        supabase.from('employees').select('full_name, role, avatar_url')
          .eq('user_id', user.id).maybeSingle(),
        supabase.from('tasks').select('*')
          .eq('assigned_to', user.id)
          .gte('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(5),
        supabase.from('meetings').select('*')
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .order('start_time', { ascending: true })
          .limit(5),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (tasksRes.data) setTasks(tasksRes.data)
      if (meetingsRes.data) setMeetings(meetingsRes.data)
    } catch (e) {
      console.warn('Home loadData error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadData() }, [loadData]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return { bg: colors.successLight, text: colors.success }
      case 'in_progress': case 'in progress': return { bg: colors.warningLight, text: colors.warning }
      default: return { bg: colors.surfaceAlt, text: colors.textMuted }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': case 'urgent': return { bg: colors.dangerLight, text: colors.danger }
      case 'medium': return { bg: colors.warningLight, text: colors.warning }
      default: return { bg: colors.surfaceAlt, text: colors.textMuted }
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <View style={s.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={{ gap: 6 }}>
                <Skeleton width={120} height={16} />
                <Skeleton width={60} height={12} />
              </View>
            </View>
          </View>
          <Skeleton height={96} borderRadius={16} style={{ marginTop: 20 }} />
          <Skeleton height={200} borderRadius={16} style={{ marginTop: 20 }} />
          <Skeleton height={200} borderRadius={16} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={s.container}>
          {/* Nav Header */}
          <View style={s.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.userName}>{profile?.full_name || 'User'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                </View>
                <Text style={s.userRole}>{profile?.role || 'Employee'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={s.iconBtn} onPress={() => router.push('/(tabs)/hrms/messages')}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textPrimary} />
              </Pressable>
              <Pressable style={s.iconBtn} onPress={() => router.push('/(tabs)/hrms/notifications')}>
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Work Summary Banner */}
          <LinearGradient
            colors={[colors.gradientFrom, colors.gradientVia, colors.primary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={s.banner}
          >
            <View style={{ flex: 1, zIndex: 1 }}>
              <Text style={s.bannerTitle}>My Work Summary</Text>
              <Text style={s.bannerSub}>Today task & presence activity</Text>
            </View>
            {/* Decorative elements */}
            <View style={s.decoCircle1} />
            <View style={s.decoCircle2} />
            <Ionicons name="star" size={14} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', top: 16, right: 48 }} />
            <Ionicons name="star" size={10} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', bottom: 20, right: 24 }} />
          </LinearGradient>

          {/* Today Meeting Section */}
          <View style={[s.sectionCard, shadows.card]}>
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.sectionTitle}>Today Meeting</Text>
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{meetings.length}</Text>
                </View>
              </View>
              <Text style={s.sectionSub}>Your schedule for the day</Text>
            </View>

            {meetings.length === 0 ? (
              <EmptyState icon="videocam-outline" title="No Meetings Today" description="You have no scheduled meetings for today." />
            ) : (
              meetings.map(meeting => (
                <View key={meeting.id} style={s.meetingCard}>
                  <View style={s.meetingRow1}>
                    <View style={s.meetingIcon}>
                      <Ionicons name="videocam" size={16} color={colors.primary} />
                    </View>
                    <Text style={s.meetingName} numberOfLines={1}>{meeting.title}</Text>
                    <View style={s.timePill}>
                      <Text style={s.timePillText}>
                        {format(new Date(meeting.start_time), 'hh:mm a')}
                      </Text>
                    </View>
                  </View>
                  <View style={s.meetingRow2}>
                    <View style={s.avatarStack}>
                      {[colors.primary, colors.info, colors.warning].map((c, i) => (
                        <View key={i} style={[s.stackAvatar, { backgroundColor: c, marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}>
                          <Ionicons name="person" size={12} color="#fff" />
                        </View>
                      ))}
                    </View>
                    <Pressable style={s.joinBtn}>
                      <Text style={s.joinBtnText}>Join Meet</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Today Task Section */}
          <View style={[s.sectionCard, shadows.card]}>
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.sectionTitle}>Today Task</Text>
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{tasks.length}</Text>
                </View>
              </View>
              <Text style={s.sectionSub}>Your assigned tasks</Text>
            </View>

            {tasks.length === 0 ? (
              <EmptyState icon="flash-outline" title="No Tasks Assigned" description="You have no tasks assigned for today. Enjoy your free time!" />
            ) : (
              tasks.map(task => {
                const statusC = getStatusColor(task.status)
                const priorityC = getPriorityColor(task.priority)
                const progress = task.progress ?? 0

                return (
                  <View key={task.id} style={s.taskCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <View style={s.taskIcon}>
                        <Ionicons name="flash" size={14} color="#fff" />
                      </View>
                      <Text style={s.taskName} numberOfLines={1}>{task.title}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                      <View style={[s.pill, { backgroundColor: statusC.bg }]}>
                        <Text style={[s.pillText, { color: statusC.text }]}>{task.status}</Text>
                      </View>
                      <View style={[s.pill, { backgroundColor: priorityC.bg }]}>
                        <Text style={[s.pillText, { color: priorityC.text }]}>{task.priority}</Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={s.progressTrack}>
                      <LinearGradient
                        colors={[colors.gradientFrom, colors.gradientVia]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[s.progressFill, { width: `${Math.min(progress, 100)}%` as any }]}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <View style={s.avatarStack}>
                        {[colors.primary, colors.info].map((c, i) => (
                          <View key={i} style={[s.stackAvatar, { backgroundColor: c, marginLeft: i > 0 ? -8 : 0, zIndex: 2 - i }]}>
                            <Ionicons name="person" size={12} color="#fff" />
                          </View>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {task.due_date && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                            <Text style={s.metaText}>{format(new Date(task.due_date), 'dd MMM')}</Text>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
                          <Text style={s.metaText}>0</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon as any} size={28} color={colors.primary} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyDesc}>{description}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16 },

  // Header
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  userName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  userRole: { fontSize: 11, fontWeight: '500', color: colors.primary, marginTop: 1 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },

  // Banner
  banner: {
    height: 96, borderRadius: 16, marginTop: 16, paddingHorizontal: 20,
    justifyContent: 'center', overflow: 'hidden',
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  bannerSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  decoCircle1: {
    position: 'absolute', right: -20, top: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decoCircle2: {
    position: 'absolute', right: 20, bottom: -30,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Section card
  sectionCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginTop: 16, borderWidth: 1, borderColor: colors.border,
  },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sectionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  countBadge: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  // Meeting card
  meetingCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  meetingRow1: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  meetingIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  meetingName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  timePill: {
    backgroundColor: '#fff', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
  },
  timePillText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  meetingRow2: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  stackAvatar: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  joinBtn: {
    backgroundColor: colors.primary, borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  joinBtnText: { fontSize: 10, fontWeight: '600', color: '#fff' },

  // Task card
  taskCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  taskIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  taskName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  pill: {
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3,
  },
  pillText: { fontSize: 10, fontWeight: '600' },
  progressTrack: {
    height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3 },
  metaText: { fontSize: 11, color: colors.textMuted },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyDesc: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
})
