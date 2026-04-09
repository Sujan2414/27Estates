import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, FlatList, SafeAreaView,
  StyleSheet, RefreshControl, Modal, TextInput, ScrollView,
  Platform, KeyboardAvoidingView, Image,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'

interface LeaveRecord {
  id: string
  type: string
  start_date: string
  end_date: string
  status: string
  reason?: string
  days?: number
}

interface LeaveBalance {
  total: number
  used: number
  remaining: number
}

const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Privilege', 'Maternity', 'Paternity']

export default function LeavesScreen() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [balance, setBalance] = useState<LeaveBalance>({ total: 24, used: 0, remaining: 24 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Apply leave state
  const [showApply, setShowApply] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showTypeSelect, setShowTypeSelect] = useState(false)
  const [applyType, setApplyType] = useState('')
  const [applyStart, setApplyStart] = useState('')
  const [applyEnd, setApplyEnd] = useState('')
  const [applyReason, setApplyReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadLeaves = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Look up employee record by auth user_id
      const { data: emp } = await supabase.from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!emp) { setLoading(false); return }

      const { data } = await supabase.from('hrm_leaves').select('*')
        .eq('employee_id', emp.id)
        .order('start_date', { ascending: false })
        .limit(50)

      const list = data || []
      setLeaves(list)

      const approved = list.filter(l => l.status === 'approved')
      const usedDays = approved.reduce((sum, l) => sum + (l.days || 1), 0)
      setBalance({ total: 24, used: usedDays, remaining: Math.max(0, 24 - usedDays) })
    } catch (e) {
      console.warn('Leaves loadData error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadLeaves() }, [loadLeaves]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadLeaves()
    setRefreshing(false)
  }

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return { bg: colors.successLight, text: colors.success }
      case 'rejected': return { bg: colors.dangerLight, text: colors.danger }
      default: return { bg: colors.warningLight, text: colors.warning }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'sick': return 'medkit'
      case 'casual': return 'sunny'
      case 'earned': case 'privilege': return 'star'
      case 'maternity': case 'paternity': return 'heart'
      default: return 'calendar'
    }
  }

  const resetApplyForm = () => {
    setApplyType('')
    setApplyStart('')
    setApplyEnd('')
    setApplyReason('')
  }

  const handleApplyPress = () => {
    resetApplyForm()
    setShowApply(true)
  }

  const handleReviewLeave = () => {
    if (!applyType || !applyStart || !applyReason) return
    setShowApply(false)
    setShowConfirm(true)
  }

  const handleSubmitLeave = async () => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: emp } = await supabase.from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!emp) return

      const startDate = applyStart || format(new Date(), 'yyyy-MM-dd')
      const endDate = applyEnd || startDate

      await supabase.from('hrm_leaves').insert({
        employee_id: emp.id,
        type: applyType.toLowerCase(),
        start_date: startDate,
        end_date: endDate,
        reason: applyReason,
        status: 'pending',
        days: 1,
      })

      setShowConfirm(false)
      setShowSuccess(true)
      loadLeaves()
    } catch (e) {
      console.warn('Submit leave error:', e)
    }
    setSubmitting(false)
  }

  const renderLeave = ({ item }: { item: LeaveRecord }) => {
    const statusS = getStatusStyle(item.status)

    return (
      <View style={[s.leaveCard, shadows.xs]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={[s.leaveIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name={getTypeIcon(item.type) as any} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={s.leaveType}>
                {item.type?.charAt(0).toUpperCase() + item.type?.slice(1)} Leave
              </Text>
              <View style={[s.statusBadge, { backgroundColor: statusS.bg }]}>
                <Text style={[s.statusBadgeText, { color: statusS.text }]}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={s.leaveDates}>
              {item.start_date ? format(new Date(item.start_date), 'dd MMM yyyy') : ''}
              {item.end_date && item.end_date !== item.start_date
                ? ` - ${format(new Date(item.end_date), 'dd MMM yyyy')}`
                : ''}
            </Text>
            {item.reason ? (
              <Text style={s.leaveReason} numberOfLines={2}>{item.reason}</Text>
            ) : null}
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Leave</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={100} borderRadius={16} />
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
        </View>
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={item => item.id}
          renderItem={renderLeave}
          contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={[s.balanceCard, shadows.card]}>
              <View style={s.balanceRow}>
                <View style={s.balanceItem}>
                  <Text style={s.balanceLabel}>Total Leave</Text>
                  <Text style={s.balanceValue}>{balance.total}</Text>
                </View>
                <View style={s.balanceDivider} />
                <View style={s.balanceItem}>
                  <Text style={s.balanceLabel}>Used</Text>
                  <Text style={[s.balanceValue, { color: colors.warning }]}>{balance.used}</Text>
                </View>
                <View style={s.balanceDivider} />
                <View style={s.balanceItem}>
                  <Text style={s.balanceLabel}>Remaining</Text>
                  <Text style={[s.balanceValue, { color: colors.success }]}>{balance.remaining}</Text>
                </View>
              </View>
              <View style={s.leaveProgress}>
                <View
                  style={[
                    s.leaveProgressFill,
                    { width: `${Math.min((balance.used / balance.total) * 100, 100)}%` as any },
                  ]}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Image
                source={require('../../../assets/illustrations/croods-peaceful.png')}
                style={s.emptyImage}
                resizeMode="contain"
              />
              <Text style={s.emptyTitle}>No Leave Records</Text>
              <Text style={s.emptyDesc}>You haven't applied for any leaves yet.</Text>
            </View>
          }
        />
      )}

      {/* Apply Leave Button */}
      <View style={s.bottomBar}>
        <Pressable style={s.applyWrap} onPress={handleApplyPress}>
          <LinearGradient
            colors={[colors.gradientFrom, colors.gradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.applyBtn}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={s.applyBtnText}>Apply Leave</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Apply Leave Form Modal */}
      <Modal visible={showApply} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={s.overlay} onPress={() => setShowApply(false)}>
            <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
              <View style={s.handle} />
              <Text style={s.sheetTitle}>Apply Leave</Text>

              {/* Leave Type */}
              <Text style={s.fieldLabel}>Leave Type</Text>
              <Pressable
                style={s.selectBox}
                onPress={() => setShowTypeSelect(true)}
              >
                <Text style={[s.selectText, !applyType && { color: colors.textMuted }]}>
                  {applyType || 'Select leave type'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </Pressable>

              {/* Start Date */}
              <Text style={s.fieldLabel}>Start Date</Text>
              <TextInput
                style={s.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={applyStart}
                onChangeText={setApplyStart}
              />

              {/* End Date */}
              <Text style={s.fieldLabel}>End Date (optional)</Text>
              <TextInput
                style={s.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={applyEnd}
                onChangeText={setApplyEnd}
              />

              {/* Reason */}
              <Text style={s.fieldLabel}>Reason</Text>
              <TextInput
                style={[s.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Enter reason for leave..."
                placeholderTextColor={colors.textMuted}
                value={applyReason}
                onChangeText={setApplyReason}
                multiline
              />

              {/* Submit */}
              <Pressable
                style={[s.applyWrap, { marginTop: 16 }]}
                onPress={handleReviewLeave}
              >
                <LinearGradient
                  colors={[colors.gradientFrom, colors.gradientTo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.applyBtn, (!applyType || !applyStart || !applyReason) && { opacity: 0.5 }]}
                >
                  <Text style={s.applyBtnText}>Review & Submit</Text>
                </LinearGradient>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Leave Type Picker Modal */}
      <Modal visible={showTypeSelect} transparent animationType="fade">
        <Pressable style={[s.overlay, { justifyContent: 'center' }]} onPress={() => setShowTypeSelect(false)}>
          <View style={[s.typePickerBox, shadows.modal]}>
            <Text style={s.typePickerTitle}>Select Leave Type</Text>
            {LEAVE_TYPES.map(type => (
              <Pressable
                key={type}
                style={({ pressed }) => [
                  s.typeOption,
                  applyType === type && { backgroundColor: colors.primaryLight },
                  pressed && { backgroundColor: colors.surfaceHover },
                ]}
                onPress={() => { setApplyType(type); setShowTypeSelect(false) }}
              >
                <Ionicons
                  name={getTypeIcon(type) as any}
                  size={18}
                  color={applyType === type ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  s.typeOptionText,
                  applyType === type && { color: colors.primary, fontWeight: '600' },
                ]}>{type}</Text>
                {applyType === type && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Confirm Submit Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={[s.overlay, { justifyContent: 'center' }]}>
          <View style={[s.confirmBox, shadows.modal]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientTo]}
                style={s.confirmIcon}
              >
                <Ionicons name="layers" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.confirmTitle}>Submit Leave</Text>
            <Text style={s.confirmDesc}>
              Double-check your leave details to ensure everything is correct. Do you want to proceed?
            </Text>

            {/* Leave details summary */}
            <View style={s.confirmDetails}>
              <View style={s.confirmRow}>
                <Text style={s.confirmLabel}>Type</Text>
                <Text style={s.confirmVal}>{applyType} Leave</Text>
              </View>
              <View style={s.confirmRow}>
                <Text style={s.confirmLabel}>Date</Text>
                <Text style={s.confirmVal}>
                  {applyStart}{applyEnd ? ` to ${applyEnd}` : ''}
                </Text>
              </View>
            </View>

            {/* Yes, Submit */}
            <Pressable style={s.applyWrap} onPress={handleSubmitLeave} disabled={submitting}>
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.applyBtn}
              >
                <Text style={s.applyBtnText}>
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* No, Let me check */}
            <Pressable
              style={s.outlineBtn}
              onPress={() => { setShowConfirm(false); setShowApply(true) }}
            >
              <Text style={s.outlineBtnText}>No, Let me check</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={[s.overlay, { justifyContent: 'center' }]}>
          <View style={[s.confirmBox, shadows.modal]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientTo]}
                style={s.confirmIcon}
              >
                <Ionicons name="checkmark" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.confirmTitle}>Leave Submitted!</Text>
            <Text style={s.confirmDesc}>
              Your leave request has been submitted successfully. You'll be notified once it's approved.
            </Text>
            <Pressable
              style={[s.applyWrap, { marginTop: 16 }]}
              onPress={() => { setShowSuccess(false); resetApplyForm() }}
            >
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.applyBtn}
              >
                <Text style={s.applyBtnText}>Close</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  balanceCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 4 },
  balanceValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  balanceDivider: { width: 1, height: 40, backgroundColor: colors.border },
  leaveProgress: {
    height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 16, overflow: 'hidden',
  },
  leaveProgressFill: { height: 6, borderRadius: 3, backgroundColor: colors.warning },

  leaveCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  leaveIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  leaveType: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leaveDates: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  leaveReason: { fontSize: 11, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  statusBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyImage: { width: 200, height: 180, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyDesc: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  bottomBar: { position: 'absolute', bottom: 90, left: 16, right: 16 },
  applyWrap: { borderRadius: radius.pill, overflow: 'hidden' },
  applyBtn: {
    height: 52, borderRadius: radius.pill,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Modal styles
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, fontSize: 14, color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
  },
  selectBox: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: colors.surfaceAlt,
  },
  selectText: { fontSize: 14, color: colors.textPrimary },

  // Type picker
  typePickerBox: {
    backgroundColor: colors.surface, borderRadius: 16,
    marginHorizontal: 32, padding: 20, overflow: 'hidden',
  },
  typePickerTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10,
  },
  typeOptionText: { flex: 1, fontSize: 14, color: colors.textPrimary },

  // Confirm modal
  confirmBox: {
    backgroundColor: colors.surface, borderRadius: 24,
    marginHorizontal: 32, padding: 28,
  },
  confirmIcon: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  confirmDesc: {
    fontSize: 13, color: colors.textSecondary, textAlign: 'center',
    marginTop: 8, lineHeight: 20,
  },
  confirmDetails: {
    backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 14,
    marginTop: 16, gap: 8,
  },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmLabel: { fontSize: 12, color: colors.textMuted },
  confirmVal: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  outlineBtn: {
    height: 48, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
})
