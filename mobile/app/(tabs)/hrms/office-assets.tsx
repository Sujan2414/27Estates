import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, SafeAreaView,
  StyleSheet, RefreshControl,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/ui/Header'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'

interface AssetRecord {
  id: string
  asset_name: string
  asset_type: string
  serial_number: string
  assigned_date: string
  condition: string
}

const ASSET_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  laptop: 'laptop-outline',
  phone: 'phone-portrait-outline',
  tablet: 'tablet-portrait-outline',
  monitor: 'desktop-outline',
  badge: 'id-card-outline',
  keyboard: 'keypad-outline',
  mouse: 'ellipse-outline',
  headset: 'headset-outline',
  chair: 'accessibility-outline',
  default: 'cube-outline',
}

function getAssetIcon(type: string): keyof typeof Ionicons.glyphMap {
  const key = type?.toLowerCase().trim()
  return ASSET_ICONS[key] || ASSET_ICONS.default
}

function getConditionStyle(condition: string) {
  switch (condition?.toLowerCase()) {
    case 'excellent':
    case 'good':
      return { bg: colors.successLight, text: colors.success }
    case 'fair':
      return { bg: colors.warningLight, text: colors.warning }
    case 'poor':
    case 'damaged':
      return { bg: colors.dangerLight, text: colors.danger }
    default:
      return { bg: colors.surfaceAlt, text: colors.textSecondary }
  }
}

export default function OfficeAssetsScreen() {
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAssets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: emp } = await supabase.from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!emp) { setLoading(false); return }

      const { data } = await supabase.from('hrm_assets')
        .select('*')
        .eq('employee_id', emp.id)
        .order('assigned_date', { ascending: false })

      if (data) {
        setAssets(data.map((d: any) => ({
          id: d.id,
          asset_name: d.asset_name || d.name || 'Unknown Asset',
          asset_type: d.asset_type || d.type || 'default',
          serial_number: d.serial_number || 'N/A',
          assigned_date: d.assigned_date || '',
          condition: d.condition || 'Good',
        })))
      }
    } catch (e) {
      console.warn('OfficeAssets loadData error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadAssets() }, [loadAssets]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAssets()
    setRefreshing(false)
  }

  const renderAsset = ({ item }: { item: AssetRecord }) => {
    const condStyle = getConditionStyle(item.condition)
    const icon = getAssetIcon(item.asset_type)

    return (
      <View style={[s.assetCard, shadows.xs]}>
        <View style={s.assetIconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={s.assetInfo}>
          <View style={s.assetTopRow}>
            <Text style={s.assetName} numberOfLines={1}>{item.asset_name}</Text>
            <View style={[s.condBadge, { backgroundColor: condStyle.bg }]}>
              <Text style={[s.condText, { color: condStyle.text }]}>
                {item.condition?.charAt(0).toUpperCase() + item.condition?.slice(1)}
              </Text>
            </View>
          </View>

          <View style={s.assetDetails}>
            <View style={s.detailItem}>
              <Ionicons name="barcode-outline" size={14} color={colors.textMuted} />
              <Text style={s.detailText}>{item.serial_number}</Text>
            </View>
            {item.assigned_date ? (
              <View style={s.detailItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={s.detailText}>
                  {format(new Date(item.assigned_date), 'dd MMM yyyy')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="Office Assets" onBack={() => router.back()} />
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height={88} borderRadius={12} />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <Header title="Office Assets" onBack={() => router.back()} />

      <FlatList
        data={assets}
        keyExtractor={item => item.id}
        renderItem={renderAsset}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          assets.length > 0 ? (
            <View style={[s.summaryCard, shadows.card]}>
              <View style={s.summaryIconWrap}>
                <Ionicons name="cube" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={s.summaryLabel}>Assigned Assets</Text>
                <Text style={s.summaryValue}>{assets.length} item{assets.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="No Assets Assigned"
            description="You don't have any office assets assigned to you yet."
          />
        }
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.primary100,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },

  assetCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  assetIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetInfo: {
    flex: 1,
  },
  assetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  condBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  condText: {
    fontSize: 10,
    fontWeight: '600',
  },

  assetDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },
})
