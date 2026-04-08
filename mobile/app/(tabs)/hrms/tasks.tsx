import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, FlatList, SafeAreaView,
  StyleSheet, RefreshControl,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'

type FilterTab = 'all' | 'in_progress' | 'completed' | 'pending'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  progress?: number
  due_date?: string
  description?: string
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
]

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('all')

  const loadTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      let query = supabase.from('tasks').select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setTasks(data || [])
    } catch (e) {
      console.warn('Tasks loadData error:', e)
    }
    setLoading(false)
  }, [filter])

  useFocusEffect(useCallback(() => { loadTasks() }, [loadTasks]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadTasks()
    setRefreshing(false)
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

  const renderTask = ({ item }: { item: Task }) => {
    const statusC = getStatusColor(item.status)
    const priorityC = getPriorityColor(item.priority)
    const progress = item.progress ?? 0

    return (
      <View style={[s.taskCard, shadows.card]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={s.taskIcon}>
            <Ionicons name="flash" size={14} color="#fff" />
          </View>
          <Text style={s.taskName} numberOfLines={1}>{item.title}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          <View style={[s.pill, { backgroundColor: statusC.bg }]}>
            <Text style={[s.pillText, { color: statusC.text }]}>{item.status}</Text>
          </View>
          <View style={[s.pill, { backgroundColor: priorityC.bg }]}>
            <Text style={[s.pillText, { color: priorityC.text }]}>{item.priority}</Text>
          </View>
        </View>

        <View style={s.progressTrack}>
          <LinearGradient
            colors={[colors.gradientFrom, colors.gradientVia]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.progressFill, { width: `${Math.min(progress, 100)}%` as any }]}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {[colors.primary, colors.info].map((c, i) => (
              <View key={i} style={[s.stackAvatar, { backgroundColor: c, marginLeft: i > 0 ? -8 : 0, zIndex: 2 - i }]}>
                <Ionicons name="person" size={12} color="#fff" />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {item.due_date && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text style={s.metaText}>{format(new Date(item.due_date), 'dd MMM')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Tasks</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        {FILTER_TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[s.filterTab, filter === tab.key && s.filterTabActive]}
            onPress={() => { setFilter(tab.key); setLoading(true) }}
          >
            <Text style={[s.filterTabText, filter === tab.key && s.filterTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={120} borderRadius={12} />
          <Skeleton height={120} borderRadius={12} />
          <Skeleton height={120} borderRadius={12} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={renderTask}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="checkbox-outline" size={28} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No Tasks Found</Text>
              <Text style={s.emptyDesc}>
                {filter === 'all'
                  ? 'You have no tasks assigned yet.'
                  : `No ${filter.replace('_', ' ')} tasks.`}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable style={[s.fab, shadows.fab]} onPress={() => {/* Future: create task modal */}}>
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          style={s.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, backgroundColor: colors.surface,
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterTabText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  filterTabTextActive: { color: '#fff' },

  taskCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  taskIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  taskName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  pill: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: '600' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  stackAvatar: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  metaText: { fontSize: 11, color: colors.textMuted },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyDesc: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 90, right: 20,
    borderRadius: 28, overflow: 'hidden',
  },
  fabGradient: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
})
