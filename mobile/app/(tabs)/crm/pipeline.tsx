import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Pressable,
  RefreshControl, SafeAreaView, StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'

const STAGES = [
  { key: 'new',         label: 'New',         color: colors.statusNew },
  { key: 'contacted',   label: 'Contacted',   color: colors.statusContacted },
  { key: 'qualified',   label: 'Qualified',   color: colors.statusQualified },
  { key: 'negotiation', label: 'Negotiation', color: colors.statusNegotiation },
  { key: 'site_visit',  label: 'Site Visit',  color: colors.statusSiteVisit },
  { key: 'converted',   label: 'Converted',   color: colors.statusConverted },
  { key: 'lost',        label: 'Lost',        color: colors.statusLost },
]

interface PipelineLead {
  id: string; name: string; phone: string | null
  priority: string; source: string
  projects?: { project_name: string } | null
  properties?: { title: string } | null
}

interface Stage {
  key: string; label: string; color: string
  leads: PipelineLead[]; count: number
}

export default function PipelineScreen() {
  const [stages, setStages]   = useState<Stage[]>(STAGES.map(s => ({ ...s, leads: [], count: 0 })))
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => { loadPipeline() }, [])

  async function loadPipeline() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('leads')
      .select('id, name, phone, priority, source, status, projects(project_name), properties(title)')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setStages(STAGES.map(s => ({
        ...s,
        leads: (data as any[]).filter(l => l.status === s.key).slice(0, 20),
        count: (data as any[]).filter(l => l.status === s.key).length,
      })))
    }
    setLoading(false)
    setRefreshing(false)
  }

  const activeStage = stages.find(s => s.key === selected) ?? null

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.title}>Pipeline</Text>
        <Pressable
          style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/(tabs)/crm/create')}
        >
          <Ionicons name="add" size={17} color="#fff" />
          <Text style={s.addBtnText}>Add Lead</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.skeletonWrap}>
          {[0,1,2,3].map(i => <Skeleton key={i} height={72} borderRadius={10} />)}
        </View>
      ) : (
        <>
          {/* ── Stage list ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPipeline() }} tintColor={colors.primary} />}
          >
            <View style={s.stageList}>
              {stages.map(stage => {
                const isOpen = selected === stage.key
                return (
                  <View key={stage.key}>
                    {/* Stage header row */}
                    <Pressable
                      style={({ pressed }) => [s.stageRow, isOpen && s.stageRowOpen, pressed && { opacity: 0.85 }]}
                      onPress={() => setSelected(isOpen ? null : stage.key)}
                    >
                      <View style={[s.stageColorBar, { backgroundColor: stage.color }]} />
                      <Text style={s.stageLabel}>{stage.label}</Text>
                      <View style={[s.stageBadge, { backgroundColor: stage.color + '20' }]}>
                        <Text style={[s.stageBadgeText, { color: stage.color }]}>{stage.count}</Text>
                      </View>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.textMuted}
                        style={{ marginLeft: 4 }}
                      />
                    </Pressable>

                    {/* Expanded leads */}
                    {isOpen && stage.leads.length > 0 && (
                      <View style={s.leadsInner}>
                        {stage.leads.map((lead, i) => (
                          <View key={lead.id}>
                            <Pressable
                              style={({ pressed }) => [s.leadRow, pressed && { backgroundColor: colors.surfaceAlt }]}
                              onPress={() => router.push(`/(tabs)/crm/lead/${lead.id}`)}
                            >
                              <View style={s.leadAvatar}>
                                <Text style={s.leadAvatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
                              </View>
                              <View style={s.leadInfo}>
                                <Text style={s.leadName} numberOfLines={1}>{lead.name}</Text>
                                <Text style={s.leadSub} numberOfLines={1}>
                                  {lead.projects?.project_name ?? lead.properties?.title ?? lead.source?.replace(/_/g, ' ')}
                                </Text>
                              </View>
                              <View style={[s.priorityDot, {
                                backgroundColor: lead.priority === 'hot' ? colors.hot : lead.priority === 'warm' ? colors.warm : colors.cold
                              }]} />
                              <Ionicons name="chevron-forward" size={14} color={colors.border} />
                            </Pressable>
                            {i < stage.leads.length - 1 && <View style={s.leadDivider} />}
                          </View>
                        ))}
                        {stage.count > 20 && (
                          <Pressable
                            style={s.moreBtn}
                            onPress={() => router.push('/(tabs)/crm')}
                          >
                            <Text style={s.moreBtnText}>+{stage.count - 20} more · View all</Text>
                          </Pressable>
                        )}
                      </View>
                    )}

                    {isOpen && stage.leads.length === 0 && (
                      <View style={s.emptyStage}>
                        <Text style={s.emptyStageText}>No leads in this stage</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
            <View style={{ height: 32 }} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    ...shadows.header,
  },
  title: { ...t.h3, color: colors.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.full,
    ...shadows.fab,
  },
  addBtnText: { ...t.smM, color: '#fff' },

  skeletonWrap: { padding: 16, gap: 10 },

  stageList: { padding: 14, gap: 8 },

  stageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  stageRowOpen: { borderColor: colors.primary, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  stageColorBar: { width: 4, height: 20, borderRadius: 2 },
  stageLabel: { flex: 1, ...t.bodyM, color: colors.textPrimary },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  stageBadgeText: { ...t.label },

  leadsInner: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderTopWidth: 0, borderColor: colors.primary,
    borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md,
    overflow: 'hidden',
    marginTop: -8,
  },
  leadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  leadAvatar: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  leadAvatarText: { ...t.smM, color: colors.textSecondary },
  leadInfo:       { flex: 1 },
  leadName:       { ...t.bodyM, color: colors.textPrimary },
  leadSub:        { ...t.xs, color: colors.textMuted, marginTop: 1, textTransform: 'capitalize' },
  priorityDot:    { width: 7, height: 7, borderRadius: 4 },
  leadDivider:    { height: 1, backgroundColor: colors.border, marginLeft: 58 },

  moreBtn: { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  moreBtnText: { ...t.smM, color: colors.primary },

  emptyStage: {
    paddingVertical: 16, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyStageText: { ...t.sm, color: colors.textMuted },
})
