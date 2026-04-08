import { View, Text, Pressable, FlatList, SafeAreaView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows, radius, type as t } from '@/theme/colors'

interface Message {
  id: string
  name: string
  preview: string
  time: string
  avatarColor: string
  unread: boolean
}

const MESSAGES: Message[] = [
  {
    id: '1', name: 'Sarah Johnson', preview: 'Can you review the property listing for Plot 21?',
    time: '2m ago', avatarColor: colors.primary, unread: true,
  },
  {
    id: '2', name: 'Raj Patel', preview: 'The client meeting has been rescheduled to 3 PM.',
    time: '15m ago', avatarColor: colors.info, unread: true,
  },
  {
    id: '3', name: 'Priya Sharma', preview: 'I have uploaded the site inspection photos.',
    time: '1h ago', avatarColor: colors.success, unread: false,
  },
  {
    id: '4', name: 'Amit Desai', preview: 'The expense report has been approved.',
    time: '3h ago', avatarColor: colors.warning, unread: false,
  },
  {
    id: '5', name: 'Team 21 Estates', preview: 'Monthly target update: 78% achieved so far.',
    time: 'Yesterday', avatarColor: colors.danger, unread: false,
  },
]

export default function MessagesScreen() {
  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const renderItem = ({ item }: { item: Message }) => (
    <Pressable
      style={({ pressed }) => [s.messageItem, pressed && { backgroundColor: colors.surfaceHover }]}
      onPress={() => router.push({ pathname: '/(tabs)/hrms/chat/[id]', params: { id: item.id, name: item.name } })}
    >
      <View style={[s.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={s.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={s.messageContent}>
        <View style={s.messageTop}>
          <Text style={[s.messageName, item.unread && { fontWeight: '700' }]}>{item.name}</Text>
          <Text style={s.messageTime}>{item.time}</Text>
        </View>
        <Text style={[s.messagePreview, item.unread && { color: colors.textPrimary }]} numberOfLines={1}>
          {item.preview}
        </Text>
      </View>
      {item.unread && <View style={s.unreadDot} />}
    </Pressable>
  )

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Messages</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={MESSAGES}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyText}>No messages yet</Text>
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

  messageItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  messageContent: { flex: 1 },
  messageTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 3,
  },
  messageName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  messageTime: { fontSize: 11, color: colors.textMuted },
  messagePreview: { fontSize: 12, color: colors.textSecondary },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
  },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 72 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { ...t.body, color: colors.textMuted },
})
