import { View, Text, Pressable, FlatList, SafeAreaView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, type as t } from '@/theme/colors'

interface Notification {
  id: string
  type: 'task' | 'expense' | 'meeting'
  title: string
  description: string
  time: string
  read: boolean
}

const ICON_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  task: { icon: 'clipboard', bg: colors.primaryLight, color: colors.primary },
  expense: { icon: 'checkmark-circle', bg: colors.successLight, color: colors.success },
  meeting: { icon: 'videocam', bg: colors.infoLight, color: colors.info },
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1', type: 'task', title: 'New Task Assigned',
    description: 'You have been assigned "Review property documents for Plot A-12".',
    time: '5m ago', read: false,
  },
  {
    id: '2', type: 'expense', title: 'Expense Approved',
    description: 'Your travel expense claim of Rs. 3,500 has been approved.',
    time: '30m ago', read: false,
  },
  {
    id: '3', type: 'meeting', title: 'Meeting Invitation',
    description: 'You are invited to "Site Inspection - Green Valley" at 3:00 PM today.',
    time: '1h ago', read: false,
  },
  {
    id: '4', type: 'task', title: 'Task Deadline Reminder',
    description: 'Task "Update CRM leads" is due tomorrow.',
    time: '3h ago', read: true,
  },
  {
    id: '5', type: 'expense', title: 'Expense Rejected',
    description: 'Your expense "Office Supplies" was rejected. Please add receipts.',
    time: 'Yesterday', read: true,
  },
]

export default function NotificationsScreen() {
  const renderItem = ({ item }: { item: Notification }) => {
    const config = ICON_CONFIG[item.type] || ICON_CONFIG.task
    return (
      <Pressable
        style={({ pressed }) => [
          s.notifItem,
          !item.read && { backgroundColor: colors.primary25 },
          pressed && { backgroundColor: colors.surfaceHover },
        ]}
      >
        <View style={[s.notifIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={s.notifContent}>
          <Text style={s.notifTitle}>{item.title}</Text>
          <Text style={s.notifDesc} numberOfLines={2}>{item.description}</Text>
          <Text style={s.notifTime}>{item.time}</Text>
        </View>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyText}>No notifications</Text>
          </View>
        }
      />
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

  notifItem: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  notifIcon: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  notifDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 76 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { ...t.body, color: colors.textMuted },
})
