import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  SafeAreaView, FlatList, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { colors, shadows, radius } from '@/theme/colors'

/**
 * Lightweight map tab that works in Expo Go (no native Mapbox/Worklets).
 * Shows employee locations and properties as a list view.
 * The full Mapbox map is available in dev/production builds.
 */

interface EmployeeLocation {
  employee_id: string
  full_name: string
  role?: string
  lat: number
  lng: number
  updated_at?: string
}

interface Property {
  id: string
  name: string
  type: string
  city?: string
  lat?: number
  lng?: number
}

export default function MapTab() {
  const [employees, setEmployees] = useState<EmployeeLocation[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'employees' | 'properties'>('employees')

  const loadData = useCallback(async () => {
    try {
      const [empRes, propRes] = await Promise.all([
        supabase.from('employee_locations').select('*').limit(50),
        supabase.from('projects').select('id, name, type, city, lat, lng').limit(50),
      ])
      setEmployees(empRes.data || [])
      setProperties(propRes.data || [])
    } catch (e) {
      console.warn('Map loadData error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const getInitials = (name: string) =>
    name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Map</Text>
        <View style={s.liveChip}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>{employees.length} live</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <Pressable
          style={[s.tab, tab === 'employees' && s.tabActive]}
          onPress={() => setTab('employees')}
        >
          <Ionicons
            name="people"
            size={16}
            color={tab === 'employees' ? '#fff' : colors.textSecondary}
          />
          <Text style={[s.tabText, tab === 'employees' && s.tabTextActive]}>
            Team ({employees.length})
          </Text>
        </Pressable>
        <Pressable
          style={[s.tab, tab === 'properties' && s.tabActive]}
          onPress={() => setTab('properties')}
        >
          <Ionicons
            name="business"
            size={16}
            color={tab === 'properties' ? '#fff' : colors.textSecondary}
          />
          <Text style={[s.tabText, tab === 'properties' && s.tabTextActive]}>
            Properties ({properties.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tab === 'employees' ? (
        <FlatList
          data={employees}
          keyExtractor={item => item.employee_id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[s.card, shadows.xs]}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{getInitials(item.full_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{item.full_name}</Text>
                {item.role && <Text style={s.cardSub}>{item.role}</Text>}
              </View>
              <View style={s.coordBox}>
                <Ionicons name="location" size={12} color={colors.primary} />
                <Text style={s.coordText}>
                  {item.lat?.toFixed(4)}, {item.lng?.toFixed(4)}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={s.emptyText}>No team members online</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[s.card, shadows.xs]}>
              <View style={[s.propIcon, {
                backgroundColor: item.type === 'residential' ? colors.infoLight : colors.successLight
              }]}>
                <Ionicons
                  name={item.type === 'residential' ? 'home' : 'business'}
                  size={18}
                  color={item.type === 'residential' ? colors.info : colors.success}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{item.name}</Text>
                <Text style={s.cardSub}>{item.city || item.type}</Text>
              </View>
              {item.lat && (
                <View style={s.coordBox}>
                  <Ionicons name="navigate" size={12} color={colors.primary} />
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="business-outline" size={40} color={colors.textMuted} />
              <Text style={s.emptyText}>No properties found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  liveText: { fontSize: 11, fontWeight: '600', color: colors.success },

  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, backgroundColor: colors.surface,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: '#fff' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100, gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  propIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  cardSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  coordBox: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
  },
  coordText: { fontSize: 9, color: colors.primary, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 13, color: colors.textMuted },
})
