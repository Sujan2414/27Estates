import { useState, useCallback, useMemo } from 'react'
import {
  View, Text, Pressable, FlatList, TextInput, SafeAreaView,
  StyleSheet, RefreshControl, Image,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'

interface Employee {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  role: string | null
  department: string | null
  avatar_url: string | null
}

const AVATAR_COLORS = [
  colors.primary, '#4A90D9', '#E67E22', '#27AE60', '#8E44AD',
  '#E74C3C', '#F39C12', '#1ABC9C', '#2C3E50', '#D35400',
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function MessagesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const loadEmployees = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: emp } = await supabase.from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (emp) setCurrentUserId(emp.id)

      const { data } = await supabase.from('employees')
        .select('id, full_name, email, phone, role, department, avatar_url')
        .order('full_name', { ascending: true })

      setEmployees(data || [])
    } catch (e) {
      console.warn('Messages loadEmployees error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadEmployees() }, [loadEmployees]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadEmployees()
    setRefreshing(false)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return employees.filter(e => e.id !== currentUserId)
    const q = search.toLowerCase()
    return employees
      .filter(e => e.id !== currentUserId)
      .filter(e =>
        e.full_name?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
      )
  }, [employees, search, currentUserId])

  const renderItem = ({ item }: { item: Employee }) => {
    const avatarColor = getAvatarColor(item.id)
    const initials = getInitials(item.full_name || 'Unknown')

    return (
      <Pressable
        style={({ pressed }) => [s.employeeItem, pressed && { backgroundColor: colors.surfaceHover }]}
        onPress={() => router.push({
          pathname: '/(tabs)/hrms/chat/[id]',
          params: { id: item.id, name: item.full_name || 'Unknown' },
        })}
      >
        {item.avatar_url ? (
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        ) : (
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        )}

        <View style={s.employeeInfo}>
          <Text style={s.employeeName} numberOfLines={1}>{item.full_name || 'Unknown'}</Text>
          <View style={s.metaRow}>
            {item.role ? (
              <View style={s.roleBadge}>
                <Text style={s.roleText}>{item.role}</Text>
              </View>
            ) : null}
            {item.department ? (
              <Text style={s.departmentText} numberOfLines={1}>{item.department}</Text>
            ) : null}
          </View>
        </View>

        <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
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
          <Text style={s.headerTitle}>Messages</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={44} borderRadius={22} />
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={64} borderRadius={8} />)}
        </View>
      </SafeAreaView>
    )
  }

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

      {/* Search Bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, role, or department..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Employee Count */}
      <View style={s.countRow}>
        <Ionicons name="people-outline" size={14} color={colors.textMuted} />
        <Text style={s.countText}>
          {filtered.length} team member{filtered.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
        </Text>
      </View>

      {/* Employee List */}
      <FlatList
        data={filtered}
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
              source={require('../../../assets/illustrations/croods-friends.png')}
              style={s.emptyImage}
              resizeMode="contain"
            />
            <Text style={s.emptyTitle}>
              {search ? 'No Results' : 'No Team Members'}
            </Text>
            <Text style={s.emptyDesc}>
              {search
                ? `No employees found matching "${search}"`
                : 'No employees found in the system.'}
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
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

  searchWrap: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: colors.textPrimary,
    paddingVertical: 0,
  },

  countRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  employeeItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 100,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  roleText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  departmentText: { fontSize: 12, color: colors.textMuted },

  separator: { height: 1, backgroundColor: colors.border, marginLeft: 76 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyImage: { width: 200, height: 180, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyDesc: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
})
