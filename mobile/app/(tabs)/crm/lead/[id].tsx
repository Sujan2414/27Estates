import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Pressable,
  SafeAreaView, StyleSheet, ActivityIndicator,
  Linking,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { haptic } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import { colors, shadows, radius } from '@/theme/colors'
import { TemperaturePill } from '@/components/crm/TemperaturePill'
import { format } from 'date-fns'

interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  status: string
  priority: 'hot' | 'warm' | 'cold'
  property_interest: string | null
  project_interest: string | null
  budget_min: number | null
  budget_max: number | null
  preferred_location: string | null
  notes: string | null
  score: number | null
  next_follow_up_at: string | null
  last_contacted_at: string | null
  created_at: string
}

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const STATUS_STEPS = ['new', 'contacted', 'qualified', 'negotiation', 'site_visit', 'converted']
const STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  negotiation: 'Negotiation', site_visit: 'Site Visit', converted: 'Converted',
}

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) fetchLead() }, [id])

  async function fetchLead() {
    const [{ data: leadData }, { data: actData }] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase.from('lead_activities')
        .select('id,type,title,description,metadata,created_at')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setLead(leadData as Lead)
    setActivities((actData as Activity[]) ?? [])
    setLoading(false)
  }

  async function updateStatus(status: string) {
    haptic.light()
    await supabase.from('leads').update({ status }).eq('id', id)
    setLead(prev => prev ? { ...prev, status } : prev)
  }

  function formatBudget() {
    if (!lead) return null
    const { budget_min, budget_max } = lead
    if (!budget_min && !budget_max) return null
    const fmt = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : `₹${(n / 100000).toFixed(0)}L`
    if (budget_min && budget_max) return `${fmt(budget_min)} – ${fmt(budget_max)}`
    return budget_min ? `From ${fmt(budget_min)}` : `Up to ${fmt(budget_max!)}`
  }

  function activityIcon(type: string) {
    const icons: Record<string, string> = {
      call: '📞', email_sent: '📧', email_received: '📩', whatsapp: '💬',
      site_visit: '🏠', note: '📝', status_change: '🔄', system: '⚙️',
    }
    return icons[type] ?? '•'
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    )
  }

  if (!lead) return null

  const currentStatusIndex = STATUS_STEPS.indexOf(lead.status)

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Sticky Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{lead.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Identity Card ── */}
        <View style={[styles.card, shadows.card]}>
          <View style={styles.identityTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.leadName}>{lead.name}</Text>
              {lead.phone && <Text style={styles.leadPhone}>{lead.phone}</Text>}
              {lead.email && <Text style={styles.leadEmail} numberOfLines={1}>{lead.email}</Text>}
            </View>
          </View>

          <View style={styles.pillRow}>
            <TemperaturePill temperature={lead.priority} size="md" />
            {lead.score && (
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>Score {lead.score}</Text>
              </View>
            )}
            <View style={styles.sourcePill}>
              <Text style={styles.sourceText}>{lead.source?.replace('_', ' ')}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <ActionBtn icon="📞" label="Call" color={colors.success}
              onPress={() => lead.phone && Linking.openURL(`tel:${lead.phone}`)} />
            <ActionBtn icon="💬" label="WhatsApp" color="#25D366"
              onPress={() => lead.phone && Linking.openURL(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)} />
            <ActionBtn icon="✉️" label="Email" color={colors.info}
              onPress={() => lead.email && Linking.openURL(`mailto:${lead.email}`)} />
          </View>
        </View>

        {/* ── Pre-Call Brief ── */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Pre-Call Brief</Text>
          <View style={styles.briefGrid}>
            {lead.project_interest && <BriefItem label="Project" value={lead.project_interest} />}
            {lead.property_interest && <BriefItem label="Property" value={lead.property_interest} />}
            {formatBudget() && <BriefItem label="Budget" value={formatBudget()!} />}
            {lead.preferred_location && <BriefItem label="Location" value={lead.preferred_location} />}
          </View>
          {lead.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{lead.notes}</Text>
            </View>
          )}
        </View>

        {/* ── Pipeline Status ── */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Pipeline Stage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.pipeline}>
              {STATUS_STEPS.map((step, index) => {
                const isActive = index === currentStatusIndex
                const isDone = index < currentStatusIndex
                return (
                  <Pressable
                    key={step}
                    style={styles.pipelineStepWrap}
                    onPress={() => updateStatus(step)}
                  >
                    <View style={[
                      styles.pipelineStep,
                      isDone && styles.pipelineStepDone,
                      isActive && styles.pipelineStepActive,
                    ]}>
                      <Text style={[
                        styles.pipelineStepText,
                        (isDone || isActive) && styles.pipelineStepTextActive,
                      ]}>
                        {STATUS_LABELS[step]}
                      </Text>
                    </View>
                    {index < STATUS_STEPS.length - 1 && (
                      <View style={[styles.pipelineConnector, isDone && styles.pipelineConnectorDone]} />
                    )}
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── Activity Timeline ── */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Activity</Text>
          {activities.length === 0 && (
            <Text style={styles.emptyText}>No activity yet.</Text>
          )}
          {activities.map((act, i) => (
            <View key={act.id} style={styles.activityItem}>
              <View style={styles.activityIconWrap}>
                <Text style={styles.activityIcon}>{activityIcon(act.type)}</Text>
                {i < activities.length - 1 && <View style={styles.activityLine} />}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{act.title}</Text>
                {act.description && (
                  <Text style={styles.activityDesc} numberOfLines={3}>{act.description}</Text>
                )}
                {/* AI Summary if present */}
                {act.metadata?.temperature && (
                  <View style={styles.aiSummaryBadge}>
                    <Text style={styles.aiSummaryText}>
                      AI: {act.metadata.temperature as string}
                    </Text>
                  </View>
                )}
                <Text style={styles.activityTime}>
                  {format(new Date(act.created_at), 'dd MMM · hh:mm a')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function ActionBtn({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.actionBtnContainer, { borderColor: color + '30' }]} onPress={onPress} >
      <View style={[styles.actionBtnIcon, { backgroundColor: color + '15' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[styles.actionBtnLabel, { color }]}>{label}</Text>
    </Pressable>
  )
}

function BriefItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.briefItem}>
      <Text style={styles.briefLabel}>{label}</Text>
      <Text style={styles.briefValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 14, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 },

  identityTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  leadName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  leadPhone: { fontSize: 14, color: colors.textSecondary },
  leadEmail: { fontSize: 13, color: colors.textMuted },

  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.primaryLight, borderRadius: radius.xs },
  scoreText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  sourcePill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.xs },
  sourceText: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'capitalize' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtnContainer: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1 },
  actionBtnIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionBtnLabel: { fontSize: 12, fontWeight: '700' },

  briefGrid: { gap: 8 },
  briefItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  briefLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  briefValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'right' },
  notesBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: 12, marginTop: 4 },
  notesText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  pipeline: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4 },
  pipelineStepWrap: { flexDirection: 'row', alignItems: 'center' },
  pipelineStep: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5, borderColor: colors.border,
  },
  pipelineStepDone: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  pipelineStepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pipelineStepText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  pipelineStepTextActive: { color: colors.primaryDark },
  pipelineConnector: { width: 16, height: 2, backgroundColor: colors.border },
  pipelineConnectorDone: { backgroundColor: colors.primary },

  activityItem: { flexDirection: 'row', gap: 12 },
  activityIconWrap: { alignItems: 'center', width: 32 },
  activityIcon: { fontSize: 18 },
  activityLine: { width: 1.5, flex: 1, backgroundColor: colors.border, marginTop: 4, minHeight: 20 },
  activityContent: { flex: 1, paddingBottom: 16, gap: 4 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  activityDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  activityTime: { fontSize: 12, color: colors.textMuted },
  aiSummaryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xs,
  },
  aiSummaryText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
})
