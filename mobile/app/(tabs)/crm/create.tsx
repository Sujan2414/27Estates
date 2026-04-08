import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { haptic } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import { colors, radius, shadows, type as t } from '@/theme/colors'

type Priority = 'hot' | 'warm' | 'cold'
type Source    = 'website' | 'meta_ads' | 'google_ads' | '99acres' | 'magicbricks' | 'housing' | 'justdial' | 'manual' | 'referral'

const SOURCES: { key: Source; label: string }[] = [
  { key: 'website',     label: 'Website' },
  { key: 'meta_ads',    label: 'Meta Ads' },
  { key: 'google_ads',  label: 'Google Ads' },
  { key: '99acres',     label: '99acres' },
  { key: 'magicbricks', label: 'MagicBricks' },
  { key: 'housing',     label: 'Housing.com' },
  { key: 'justdial',    label: 'JustDial' },
  { key: 'manual',      label: 'Manual Entry' },
  { key: 'referral',    label: 'Referral' },
]

const PROPERTY_TYPES = [
  { key: 'apartment',  label: 'Apartment' },
  { key: 'villa',      label: 'Villa' },
  { key: 'plot',       label: 'Plot' },
  { key: 'commercial', label: 'Commercial' },
]

const PRIORITIES: { key: Priority; label: string; color: string; bg: string }[] = [
  { key: 'hot',  label: 'Hot',  color: colors.hot,  bg: colors.hotBg },
  { key: 'warm', label: 'Warm', color: colors.warm, bg: colors.warmBg },
  { key: 'cold', label: 'Cold', color: colors.cold, bg: colors.coldBg },
]

export default function CreateLeadScreen() {
  const [saving, setSaving] = useState(false)
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [email, setEmail]   = useState('')
  const [source, setSource] = useState<Source>('manual')
  const [priority, setPriority]   = useState<Priority>('warm')
  const [showSource, setShowSource]       = useState(false)
  const [propertyInterest, setPropertyInterest] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [propertyType, setPropertyType] = useState('apartment')
  const [showPropType, setShowPropType] = useState(false)
  const [notes, setNotes] = useState('')

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Name is required.'); return }
    if (!phone.trim()) { Alert.alert('Required', 'Phone number is required.'); return }
    haptic.light()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { Alert.alert('Error', 'Not logged in.'); setSaving(false); return }
      const toNum = (s: string) => s ? parseFloat(s.replace(/[^0-9.]/g, '')) * 100000 : null
      const { error } = await supabase.from('leads').insert({
        name: name.trim(), phone: phone.trim(), email: email.trim() || null,
        source, priority, status: 'new',
        property_interest: propertyInterest.trim() || null,
        property_type: propertyType,
        preferred_location: preferredLocation.trim() || null,
        budget_min: toNum(budgetMin), budget_max: toNum(budgetMax),
        notes: notes.trim() || null,
        assigned_to: user.id, created_by: user.id,
      })
      if (error) throw error
      haptic.success()
      router.replace('/(tabs)/crm')
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save lead.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>New Lead</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* CONTACT INFO */}
          <SectionLabel title="Contact Info" />
          <View style={[s.card, shadows.card]}>
            <FormField label="Full Name *">
              <TextInput style={s.input} placeholder="e.g. Rajesh Kumar" placeholderTextColor={colors.textMuted}
                value={name} onChangeText={setName} autoCapitalize="words" />
            </FormField>
            <RowDivider />
            <FormField label="Phone *">
              <TextInput style={s.input} placeholder="+91 98765 43210" placeholderTextColor={colors.textMuted}
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </FormField>
            <RowDivider />
            <FormField label="Email">
              <TextInput style={s.input} placeholder="email@example.com" placeholderTextColor={colors.textMuted}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </FormField>
          </View>

          {/* LEAD INFO */}
          <SectionLabel title="Lead Info" />
          <View style={[s.card, shadows.card]}>
            {/* Source picker */}
            <FormField label="Source">
              <Pressable style={s.picker} onPress={() => setShowSource(!showSource)}>
                <Text style={s.pickerText}>{SOURCES.find(x => x.key === source)?.label}</Text>
                <Ionicons name={showSource ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
              </Pressable>
            </FormField>
            {showSource && (
              <View style={s.dropDown}>
                {SOURCES.map((src, i) => (
                  <View key={src.key}>
                    {i > 0 && <RowDivider />}
                    <Pressable
                      style={({ pressed }) => [s.dropItem, source === src.key && s.dropItemActive, pressed && { backgroundColor: colors.surfaceAlt }]}
                      onPress={() => { setSource(src.key); setShowSource(false); haptic.light() }}
                    >
                      <Text style={[s.dropItemText, source === src.key && s.dropItemTextActive]}>{src.label}</Text>
                      {source === src.key && <Ionicons name="checkmark" size={14} color={colors.primary} />}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <RowDivider />

            {/* Priority */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Priority</Text>
              <View style={s.priorityRow}>
                {PRIORITIES.map(p => {
                  const active = priority === p.key
                  return (
                    <Pressable
                      key={p.key}
                      style={({ pressed }) => [
                        s.priorityBtn,
                        { borderColor: active ? p.color : colors.border, backgroundColor: active ? p.bg : colors.surface },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => { setPriority(p.key); haptic.light() }}
                    >
                      <View style={[s.priorityDot, { backgroundColor: p.color }]} />
                      <Text style={[s.priorityLabel, { color: active ? p.color : colors.textSecondary }]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </View>

          {/* PROPERTY INTEREST */}
          <SectionLabel title="Property Interest" />
          <View style={[s.card, shadows.card]}>
            <FormField label="Project / Property">
              <TextInput style={s.input} placeholder="e.g. 3BHK in Greenview Apartments"
                placeholderTextColor={colors.textMuted} value={propertyInterest} onChangeText={setPropertyInterest} />
            </FormField>
            <RowDivider />
            <View style={s.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Budget Min (L)</Text>
                <TextInput style={[s.input, s.halfInput]} placeholder="e.g. 50" placeholderTextColor={colors.textMuted}
                  value={budgetMin} onChangeText={setBudgetMin} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Budget Max (L)</Text>
                <TextInput style={[s.input, s.halfInput]} placeholder="e.g. 90" placeholderTextColor={colors.textMuted}
                  value={budgetMax} onChangeText={setBudgetMax} keyboardType="decimal-pad" />
              </View>
            </View>
            <RowDivider />
            <FormField label="Preferred Location">
              <TextInput style={s.input} placeholder="e.g. Whitefield, Bengaluru"
                placeholderTextColor={colors.textMuted} value={preferredLocation} onChangeText={setPreferredLocation} />
            </FormField>
            <RowDivider />
            <FormField label="Property Type">
              <Pressable style={s.picker} onPress={() => setShowPropType(!showPropType)}>
                <Text style={s.pickerText}>{PROPERTY_TYPES.find(x => x.key === propertyType)?.label}</Text>
                <Ionicons name={showPropType ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
              </Pressable>
            </FormField>
            {showPropType && (
              <View style={s.dropDown}>
                {PROPERTY_TYPES.map((pt, i) => (
                  <View key={pt.key}>
                    {i > 0 && <RowDivider />}
                    <Pressable
                      style={({ pressed }) => [s.dropItem, propertyType === pt.key && s.dropItemActive, pressed && { backgroundColor: colors.surfaceAlt }]}
                      onPress={() => { setPropertyType(pt.key); setShowPropType(false); haptic.light() }}
                    >
                      <Text style={[s.dropItemText, propertyType === pt.key && s.dropItemTextActive]}>{pt.label}</Text>
                      {propertyType === pt.key && <Ionicons name="checkmark" size={14} color={colors.primary} />}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* NOTES */}
          <SectionLabel title="Notes" />
          <View style={[s.card, shadows.card]}>
            <TextInput
              style={s.textarea}
              placeholder="Add any notes about this lead..."
              placeholderTextColor={colors.textMuted}
              value={notes} onChangeText={setNotes}
              multiline numberOfLines={4} textAlignVertical="top"
            />
          </View>

          {/* SAVE */}
          <Pressable
            style={({ pressed }) => [s.saveBtn, shadows.fab, saving && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Save Lead</Text>
                </>
            }
          </Pressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={s.sectionLabel}>{title.toUpperCase()}</Text>
}
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={s.fieldGroup}><Text style={s.fieldLabel}>{label}</Text>{children}</View>
}
function RowDivider() {
  return <View style={{ height: 1, backgroundColor: colors.border }} />
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },

  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, ...shadows.header },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', ...t.h4, color: colors.textPrimary },

  content:      { paddingBottom: 20 },
  sectionLabel: { ...t.label, color: colors.textMuted, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },

  card: {
    marginHorizontal: 16, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  fieldGroup: { paddingHorizontal: 16, paddingVertical: 13 },
  fieldLabel: { ...t.label, color: colors.textMuted, marginBottom: 6 },
  input: { ...t.body, color: colors.textPrimary, minHeight: 24 },
  halfInput: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4, marginTop: 4 },
  rowFields: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingVertical: 13 },
  textarea: { ...t.body, color: colors.textPrimary, minHeight: 96, paddingHorizontal: 16, paddingVertical: 13, lineHeight: 22 },

  // Picker
  picker:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  pickerText:      { ...t.body, color: colors.textPrimary },
  dropDown:        { borderTopWidth: 1, borderTopColor: colors.border },
  dropItem:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11 },
  dropItemActive:  { backgroundColor: colors.primaryLight },
  dropItemText:    { ...t.body, color: colors.textPrimary },
  dropItemTextActive: { color: colors.primary, fontWeight: '600' },

  // Priority — dot + label, no emoji
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  priorityBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1.5 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { ...t.smM },

  saveBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 24, height: 52, backgroundColor: colors.primary, borderRadius: radius.md },
  saveBtnText: { ...t.h4, color: '#fff' },
})
