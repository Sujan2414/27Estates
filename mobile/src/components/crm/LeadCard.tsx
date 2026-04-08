/**
 * LeadCard — Zoho CRM-style list item
 * Pattern: left priority stripe | avatar | content | actions
 * Skill: uipro Architecture/Interior — Exaggerated Minimalism, single Gold accent
 */
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { isPast, isToday, parseISO, format } from 'date-fns'
import { colors, radius, shadows, type as t } from '@/theme/colors'
import { haptic } from '@/lib/haptics'

export interface Lead {
  id: string; name: string; phone: string | null; email: string | null
  source: string | null; status: string; priority: 'hot' | 'warm' | 'cold'
  property_interest: string | null; project_interest: string | null
  budget_min: number | null; budget_max: number | null
  next_follow_up_at: string | null; created_at: string
}

interface Props {
  lead: Lead
  onPress: () => void
  onCall: () => void
  onWhatsApp: () => void
}

const PRIORITY_COLOR = { hot: colors.hot, warm: colors.warm, cold: colors.cold }

const AVATAR_PALETTE = ['#C9930A','#1D4ED8','#0F766E','#7C3AED','#DC2626','#059669','#EA580C','#0891B2']
const avatarColor = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]

function fmtBudget(min: number | null, max: number | null) {
  if (!min && !max) return null
  const f = (n: number) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : `₹${(n/1e5).toFixed(0)}L`
  if (min && max) return `${f(min)}–${f(max)}`
  return min ? `From ${f(min)}` : `Upto ${f(max!)}`
}

function followUpLabel(dt: string | null): { label: string; urgent: boolean } | null {
  if (!dt) return null
  try {
    const d = parseISO(dt)
    if (isToday(d)) return { label: 'Due today', urgent: false }
    if (isPast(d))  return { label: `Overdue · ${format(d,'d MMM')}`, urgent: true }
    return null
  } catch { return null }
}

export function LeadCard({ lead, onPress, onCall, onWhatsApp }: Props) {
  const budget    = fmtBudget(lead.budget_min, lead.budget_max)
  const interest  = lead.project_interest ?? lead.property_interest
  const fuLabel   = followUpLabel(lead.next_follow_up_at)
  const ac        = avatarColor(lead.name)
  const stripeClr = PRIORITY_COLOR[lead.priority] ?? colors.cold
  const source    = lead.source?.replace(/_/g, ' ')

  return (
    <Pressable
      style={({ pressed }) => [s.card, shadows.card, pressed && { opacity: 0.9 }]}
      onPress={() => { haptic.light(); onPress() }}
      accessibilityRole="button"
      accessibilityLabel={`Lead: ${lead.name}`}
    >
      {/* ── Left priority stripe ── */}
      <View style={[s.stripe, { backgroundColor: stripeClr }]} />

      {/* ── Content ── */}
      <View style={s.body}>

        {/* Row 1: avatar + name + priority pill */}
        <View style={s.row1}>
          <View style={[s.avatar, { backgroundColor: ac }]}>
            <Text style={s.avatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={s.nameBlock}>
            <Text style={s.name} numberOfLines={1}>{lead.name}</Text>
            {lead.phone ? (
              <Text style={s.phone}>{lead.phone}</Text>
            ) : null}
          </View>
          <View style={[s.priorityPill, { backgroundColor: stripeClr + '18' }]}>
            <Text style={[s.priorityText, { color: stripeClr }]}>
              {lead.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Row 2: interest + budget chips */}
        {(interest || budget || source) ? (
          <View style={s.chips}>
            {interest ? (
              <View style={s.chip}>
                <Ionicons name="business-outline" size={10} color={colors.textMuted} />
                <Text style={s.chipText} numberOfLines={1}>{interest}</Text>
              </View>
            ) : null}
            {budget ? (
              <View style={s.chip}>
                <Ionicons name="cash-outline" size={10} color={colors.textMuted} />
                <Text style={s.chipText}>{budget}</Text>
              </View>
            ) : null}
            {source && !interest ? (
              <View style={s.chip}>
                <Text style={s.chipText}>{source}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Follow-up tag */}
        {fuLabel ? (
          <View style={[s.fuTag, fuLabel.urgent ? s.fuUrgent : s.fuNormal]}>
            <Ionicons name="alarm-outline" size={11} color={fuLabel.urgent ? colors.danger : colors.warning} />
            <Text style={[s.fuText, { color: fuLabel.urgent ? colors.danger : colors.warning }]}>
              {fuLabel.label}
            </Text>
          </View>
        ) : null}

        {/* ── Action row ── */}
        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.btn, s.btnGold, pressed && { opacity: 0.8 }]}
            onPress={() => { haptic.light(); onCall() }}
            accessibilityLabel="Call lead"
          >
            <Ionicons name="call" size={13} color="#fff" />
            <Text style={s.btnGoldText}>Call</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.btn, s.btnOutline, pressed && { opacity: 0.8 }]}
            onPress={() => { haptic.light(); onWhatsApp() }}
            accessibilityLabel="WhatsApp lead"
          >
            <Ionicons name="logo-whatsapp" size={13} color={colors.success} />
            <Text style={s.btnGreenText}>WhatsApp</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.btn, s.btnGhost, pressed && { opacity: 0.8 }]}
            onPress={() => { haptic.light(); onPress() }}
            accessibilityLabel="View lead details"
          >
            <Text style={s.btnGhostText}>View</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stripe: { width: 4 },
  body:   { flex: 1, padding: 14, gap: 10 },

  // Row 1
  row1:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:     { width: 40, height: 40, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  nameBlock:  { flex: 1, gap: 2 },
  name:       { ...t.h4, color: colors.textPrimary },
  phone:      { ...t.xs, color: colors.textMuted },
  priorityPill:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  priorityText:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Chips
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.xs, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { ...t.xs, color: colors.textSecondary, textTransform: 'capitalize' },

  // Follow-up tag
  fuTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: radius.xs, paddingHorizontal: 8, paddingVertical: 3 },
  fuNormal: { backgroundColor: colors.warningLight },
  fuUrgent: { backgroundColor: colors.dangerLight },
  fuText:   { ...t.xs, fontWeight: '600' },

  // Actions
  actions:     { flexDirection: 'row', gap: 8, paddingTop: 2 },
  btn:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full },
  btnGold:     { backgroundColor: colors.primary },
  btnOutline:  { borderWidth: 1.5, borderColor: colors.success },
  btnGhost:    { backgroundColor: colors.primaryLight },
  btnGoldText: { ...t.smM, color: '#fff' },
  btnGreenText:{ ...t.smM, color: colors.success },
  btnGhostText:{ ...t.smM, color: colors.primary },
})
