import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, FlatList, SafeAreaView,
  StyleSheet, RefreshControl, Image,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, radius, type as t } from '@/theme/colors'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

const ICON_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }> = {
  task_due:          { icon: 'alarm-outline',        bg: colors.warningLight, color: colors.warning },
  escalation:        { icon: 'alert-circle-outline',  bg: colors.dangerLight,  color: colors.danger },
  postpone_request:  { icon: 'time-outline',          bg: colors.infoLight,    color: colors.info },
  site_visit:        { icon: 'location-outline',      bg: colors.primaryLight, color: colors.primary },
  lead_assigned:     { icon: 'person-add-outline',    bg: colors.successLight, color: colors.success },
  default:           { icon: 'notifications-outline',  bg: colors.primaryLight, color: colors.primary },
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: emp } = await supabase.from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let query = supabase.from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (emp) {
        query = query.or(`user_id.eq.${emp.id},user_id.is.null`)
      }

      const { data } = await query
      const list = data || []
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.is_read).length)
    } catch (e) {
      console.warn('Notifications load error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadNotifications() }, [loadNotifications]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
  }

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return ''
    }
  }

  const renderItem = ({ item }: { item: Notification }) => {
    const config = ICON_CONFIG[item.type] || ICON_CONFIG.default
    return (
      <Pressable
        style={({ pressed }) => [
          s.notifItem,
          !item.is_read && { backgroundColor: colors.primary25 },
          pressed && { backgroundColor: colors.surfaceHover },
        ]}
        onPress={() => {
          if (!item.is_read) markAsRead(item.id)
          if (item.link) {
            // Navigate to linked page if it's a valid mobile route
          }
        }}
      >
        <View style={[s.notifIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={s.notifContent}>
          <View style={s.notifTopRow}>
            <Text style={[s.notifTitle, !item.is_read && { fontWeight: '700' }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <View style={s.unreadDot} />}
          </View>
          <Text style={s.notifDesc} numberOfLines={2}>{item.body}</Text>
          <Text style={s.notifTime}>{formatTime(item.created_at)}</Text>
        </View>
      </Pressable>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={72} borderRadius={8} />)}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable style={s.markAllBtn} onPress={markAllRead} hitSlop={8}>
            <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={s.unreadBanner}>
          <Ionicons name="notifications" size={14} color={colors.primary} />
          <Text style={s.unreadBannerText}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Image
              source={require('../../../assets/illustrations/croods-feedback.png')}
              style={s.emptyImage}
              resizeMode="contain"
            />
            <Text style={s.emptyTitle}>No Notifications</Text>
            <Text style={s.emptyDesc}>You're all caught up! New notifications will appear here.</Text>
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
  markAllBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },

  unreadBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1, borderBottomColor: colors.primary100,
  },
  unreadBannerText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  notifItem: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
  },
  notifDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 72 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyImage: { width: 200, height: 180, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyDesc: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
})
