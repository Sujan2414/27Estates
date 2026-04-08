import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, FlatList, SafeAreaView,
  StyleSheet, RefreshControl,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'

interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  status: string
  temperature?: string
  source?: string
  created_at: string
  project_interest?: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: colors.statusNewBg, text: colors.statusNew },
  contacted: { bg: colors.statusContactedBg, text: colors.statusContacted },
  qualified: { bg: colors.statusQualifiedBg, text: colors.statusQualified },
  negotiation: { bg: colors.statusNegotiationBg, text: colors.statusNegotiation },
  site_visit: { bg: colors.statusSiteVisitBg, text: colors.statusSiteVisit },
  converted: { bg: colors.statusConvertedBg, text: colors.statusConverted },
  lost: { bg: colors.statusLostBg, text: colors.statusLost },
}

const TEMP_COLORS: Record<string, { bg: string; text: string }> = {
  hot: { bg: colors.hotBg, text: colors.hot },
  warm: { bg: colors.warmBg, text: colors.warm },
  cold: { bg: colors.coldBg, text: colors.cold },
  dead: { bg: colors.deadBg, text: colors.dead },
}

export default function CRMScreen() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [counts, setCounts] = useState({ total: 0, hot: 0, warm: 0, cold: 0 })

  const loadLeads = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase.from('leads').select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const list = data || []
      setLeads(list)
      setCounts({
        total: list.length,
        hot: list.filter(l => l.temperature === 'hot').length,
        warm: list.filter(l => l.temperature === 'warm').length,
        cold: list.filter(l => l.temperature === 'cold').length,
      })
    } catch (e) {
      console.warn('CRM loadLeads error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadLeads() }, [loadLeads]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadLeads()
    setRefreshing(false)
  }

  const getInitials = (name: string) =>
    name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

  const renderLead = ({ item }: { item: Lead }) => {
    const statusC = STATUS_COLORS[item.status?.toLowerCase()] || STATUS_COLORS.new
    const tempC = item.temperature ? TEMP_COLORS[item.temperature?.toLowerCase()] : null

    return (
      <Pressable style={[s.leadCard, shadows.xs]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={s.leadAvatar}>
            <Text style={s.leadAvatarText}>{getInitials(item.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.leadName} numberOfLines={1}>{item.name}</Text>
            {item.phone && <Text style={s.leadPhone}>{item.phone}</Text>}
            {item.project_interest && (
              <Text style={s.leadProject} numberOfLines={1}>{item.project_interest}</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          <View style={[s.pill, { backgroundColor: statusC.bg }]}>
            <Text style={[s.pillText, { color: statusC.text }]}>
              {item.status?.replace('_', ' ')?.charAt(0).toUpperCase() + item.status?.replace('_', ' ')?.slice(1)}
            </Text>
          </View>
          {tempC && (
            <View style={[s.pill, { backgroundColor: tempC.bg }]}>
              <View style={[s.tempDot, { backgroundColor: tempC.text }]} />
              <Text style={[s.pillText, { color: tempC.text }]}>
                {item.temperature?.charAt(0).toUpperCase() + item.temperature?.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>CRM</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={s.headerBtn}>
            <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={s.headerBtn}>
            <Ionicons name="filter-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={80} borderRadius={16} />
          <Skeleton height={90} borderRadius={12} />
          <Skeleton height={90} borderRadius={12} />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => item.id}
          renderItem={renderLead}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={[s.statsCard, shadows.card]}>
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{counts.total}</Text>
                  <Text style={s.statLabel}>Total</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.hot }]}>{counts.hot}</Text>
                  <Text style={s.statLabel}>Hot</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.warm }]}>{counts.warm}</Text>
                  <Text style={s.statLabel}>Warm</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.cold }]}>{counts.cold}</Text>
                  <Text style={s.statLabel}>Cold</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="clipboard-outline" size={28} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No Leads Yet</Text>
              <Text style={s.emptyDesc}>Your assigned leads will appear here.</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable style={[s.fab, shadows.fab]} onPress={() => {/* Future: add lead */}}>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },

  statsCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },

  leadCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  leadAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  leadAvatarText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  leadName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leadPhone: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  leadProject: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3,
  },
  pillText: { fontSize: 10, fontWeight: '600' },
  tempDot: { width: 6, height: 6, borderRadius: 3 },

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
