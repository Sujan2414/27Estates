import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, SafeAreaView,
  StyleSheet, RefreshControl,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius } from '@/theme/colors'
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

interface SiteVisit {
  id: string
  lead_name?: string
  project_name?: string
  visit_date: string
  visit_time?: string
  status?: string
  location?: string
}

const QUICK_ACTIONS = [
  {
    label: 'Clock In',
    icon: 'time-outline' as const,
    bg: '#0BAB7A',
    bgLight: '#ECFDF5',
    route: '/(tabs)/hrms' as const,
  },
  {
    label: 'Site Visits',
    icon: 'calendar-outline' as const,
    bg: '#2563EB',
    bgLight: '#EFF6FF',
    route: '/(tabs)/crm' as const,
  },
  {
    label: 'My Tasks',
    icon: 'checkmark-circle-outline' as const,
    bg: '#D97706',
    bgLight: '#FFFBEB',
    route: '/(tabs)/cms' as const,
  },
]

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const todayStr = format(new Date(), 'yyyy-MM-dd')

      const [profileRes, tasksRes, visitsRes] = await Promise.all([
        supabase.from('employees').select('full_name, role, avatar_url')
          .eq('user_id', user.id).maybeSingle(),
        supabase.from('tasks').select('*')
          .eq('assigned_to', user.id)
          .gte('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(5),
        supabase.from('site_visits').select('*')
          .eq('visit_date', todayStr)
          .order('visit_time', { ascending: true })
          .limit(5),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (tasksRes.data) setTasks(tasksRes.data)
      if (visitsRes.data) setSiteVisits(visitsRes.data)
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

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
          <Skeleton height={100} borderRadius={16} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Skeleton width={110} height={100} borderRadius={16} />
            <Skeleton width={110} height={100} borderRadius={16} />
            <Skeleton width={110} height={100} borderRadius={16} />
          </View>
          <Skeleton height={180} borderRadius={16} style={{ marginTop: 20 }} />
          <Skeleton height={180} borderRadius={16} style={{ marginTop: 20 }} />
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
          {/* Greeting Header */}
          <LinearGradient
            colors={[colors.gradientFrom, colors.gradientVia, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.greetingHeader}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View>
                  <Text style={s.greetingLabel}>{getGreeting()}</Text>
                  <Text style={s.greetingName}>{profile?.full_name || 'User'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={s.headerIconBtn} onPress={() => router.push('/(tabs)/hrms/messages')}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                </Pressable>
                <Pressable style={s.headerIconBtn} onPress={() => router.push('/(tabs)/hrms/notifications')}>
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
            <View style={s.roleChip}>
              <Text style={s.roleChipText}>{profile?.role || 'Employee'}</Text>
            </View>
            {/* Decorative elements */}
            <View style={s.decoCircle1} />
            <View style={s.decoCircle2} />
          </LinearGradient>

          {/* Quick Actions */}
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={s.quickActionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                style={[s.quickActionCard, shadows.card]}
                onPress={() => router.push(action.route)}
              >
                <View style={[s.quickActionIconWrap, { backgroundColor: action.bgLight }]}>
                  <Ionicons name={action.icon} size={24} color={action.bg} />
                </View>
                <Text style={s.quickActionLabel}>{action.label}</Text>
                <View style={[s.quickActionArrow, { backgroundColor: action.bg }]}>
                  <Ionicons name="arrow-forward" size={12} color="#fff" />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Today's Schedule - Site Visits */}
          <View style={[s.sectionCard, shadows.card]}>
            <View style={s.sectionCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={s.sectionCardTitle}>Today's Schedule</Text>
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{siteVisits.length}</Text>
                </View>
              </View>
              <Text style={s.sectionCardSub}>Upcoming site visits for today</Text>
            </View>

            {siteVisits.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No Site Visits Today"
                description="You have no scheduled site visits for today."
              />
            ) : (
              siteVisits.map(visit => (
                <View key={visit.id} style={s.visitCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <View style={s.visitIcon}>
                      <Ionicons name="location" size={14} color={colors.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.visitName} numberOfLines={1}>
                        {visit.lead_name || visit.project_name || 'Site Visit'}
                      </Text>
                      {visit.location && (
                        <Text style={s.visitLocation} numberOfLines={1}>{visit.location}</Text>
                      )}
                    </View>
                    {visit.visit_time && (
                      <View style={s.timePill}>
                        <Ionicons name="time-outline" size={10} color={colors.textSecondary} />
                        <Text style={s.timePillText}>{visit.visit_time}</Text>
                      </View>
                    )}
                  </View>
                  {visit.status && (
                    <View style={[s.visitStatusPill, {
                      backgroundColor: visit.status === 'completed' ? colors.successLight : colors.warningLight,
                    }]}>
                      <Text style={[s.visitStatusText, {
                        color: visit.status === 'completed' ? colors.success : colors.warning,
                      }]}>
                        {visit.status}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Recent Tasks */}
          <View style={[s.sectionCard, shadows.card]}>
            <View style={s.sectionCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={s.sectionCardTitle}>Recent Tasks</Text>
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{tasks.length}</Text>
                </View>
              </View>
              <Text style={s.sectionCardSub}>Your assigned tasks</Text>
            </View>

            {tasks.length === 0 ? (
              <EmptyState
                icon="flash-outline"
                title="No Tasks Assigned"
                description="You have no tasks assigned for today. Enjoy your free time!"
              />
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
                      <Text style={s.progressText}>{progress}% complete</Text>
                      {task.due_date && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                          <Text style={s.metaText}>{format(new Date(task.due_date), 'dd MMM')}</Text>
                        </View>
                      )}
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

  // Greeting Header
  greetingHeader: {
    borderRadius: radius.lg,
    padding: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  greetingLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  greetingName: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 14,
    zIndex: 1,
  },
  roleChipText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  decoCircle1: {
    position: 'absolute', right: -20, top: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle2: {
    position: 'absolute', right: 30, bottom: -30,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Quick Actions
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  quickActionsRow: {
    flexDirection: 'row', gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 12, fontWeight: '600', color: colors.textPrimary,
    textAlign: 'center', marginBottom: 8,
  },
  quickActionArrow: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Section card
  sectionCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    marginTop: 16, borderWidth: 1, borderColor: colors.border,
  },
  sectionCardHeader: { marginBottom: 12 },
  sectionCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sectionCardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginLeft: 24 },
  countBadge: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  // Site Visit card
  visitCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  visitIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.infoLight, justifyContent: 'center', alignItems: 'center',
  },
  visitName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  visitLocation: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  timePillText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  visitStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 4,
  },
  visitStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  // Task card
  taskCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  taskIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  taskName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  pill: {
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  pillText: { fontSize: 10, fontWeight: '600' },
  progressTrack: {
    height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3 },
  progressText: { fontSize: 11, color: colors.textMuted },
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
