import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, FlatList, SafeAreaView,
  StyleSheet, RefreshControl, Modal, TextInput,
  Platform, KeyboardAvoidingView,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  status: string
  date: string
  description?: string
}

const CATEGORY_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  travel: { icon: 'car', bg: colors.infoLight, color: colors.info },
  food: { icon: 'restaurant', bg: colors.warningLight, color: colors.warning },
  office: { icon: 'business', bg: colors.primaryLight, color: colors.primary },
  equipment: { icon: 'hardware-chip', bg: colors.successLight, color: colors.success },
  default: { icon: 'receipt', bg: colors.surfaceAlt, color: colors.textSecondary },
}

const CATEGORIES = ['Travel', 'Food', 'Office', 'Equipment', 'Other']

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 })

  // Add expense state
  const [showAdd, setShowAdd] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [addDescription, setAddDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadExpenses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: emp } = await supabase.from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!emp) { setLoading(false); return }

      const { data } = await supabase.from('hrm_expenses').select('*')
        .eq('employee_id', emp.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const list = data || []
      setExpenses(list)

      const total = list.reduce((s, e) => s + (Number(e.amount) || 0), 0)
      const approved = list.filter(e => e.status === 'approved').length
      const pending = list.filter(e => e.status === 'pending').length
      const rejected = list.filter(e => e.status === 'rejected').length
      setSummary({ total, approved, pending, rejected })
    } catch (e) {
      console.warn('Expenses loadData error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadExpenses() }, [loadExpenses]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadExpenses()
    setRefreshing(false)
  }

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return { bg: colors.successLight, text: colors.success }
      case 'rejected': return { bg: colors.dangerLight, text: colors.danger }
      default: return { bg: colors.warningLight, text: colors.warning }
    }
  }

  const getCategoryConfig = (category: string) =>
    CATEGORY_ICONS[category?.toLowerCase()] || CATEGORY_ICONS.default

  const resetForm = () => {
    setAddTitle('')
    setAddAmount('')
    setAddCategory('')
    setAddDescription('')
  }

  const handleSubmitExpense = async () => {
    if (!addTitle || !addAmount || !addCategory) return
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: emp } = await supabase.from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!emp) return

      await supabase.from('hrm_expenses').insert({
        employee_id: emp.id,
        title: addTitle,
        amount: parseFloat(addAmount),
        category: addCategory.toLowerCase(),
        description: addDescription,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending',
      })

      setShowAdd(false)
      setShowSuccess(true)
      loadExpenses()
    } catch (e) {
      console.warn('Submit expense error:', e)
    }
    setSubmitting(false)
  }

  const renderExpense = ({ item }: { item: Expense }) => {
    const statusS = getStatusStyle(item.status)
    const catConfig = getCategoryConfig(item.category)

    return (
      <View style={[s.expenseCard, shadows.xs]}>
        <View style={[s.catIcon, { backgroundColor: catConfig.bg }]}>
          <Ionicons name={catConfig.icon as any} size={20} color={catConfig.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.expenseTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.expenseDate}>
            {item.date ? format(new Date(item.date), 'dd MMM yyyy') : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={s.expenseAmount}>Rs. {Number(item.amount).toLocaleString()}</Text>
          <View style={[s.statusBadge, { backgroundColor: statusS.bg }]}>
            <Text style={[s.statusBadgeText, { color: statusS.text }]}>
              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
            </Text>
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
        <Text style={s.headerTitle}>Expenses</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={100} borderRadius={16} />
          <Skeleton height={70} borderRadius={12} />
          <Skeleton height={70} borderRadius={12} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          renderItem={renderExpense}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={[s.summaryCard, shadows.card]}>
              <Text style={s.summaryLabel}>Total Expenses</Text>
              <Text style={s.summaryTotal}>Rs. {summary.total.toLocaleString()}</Text>
              <View style={s.summaryRow}>
                <View style={s.summaryItem}>
                  <View style={[s.summaryDot, { backgroundColor: colors.success }]} />
                  <Text style={s.summaryItemText}>Approved: {summary.approved}</Text>
                </View>
                <View style={s.summaryItem}>
                  <View style={[s.summaryDot, { backgroundColor: colors.warning }]} />
                  <Text style={s.summaryItemText}>Pending: {summary.pending}</Text>
                </View>
                <View style={s.summaryItem}>
                  <View style={[s.summaryDot, { backgroundColor: colors.danger }]} />
                  <Text style={s.summaryItemText}>Rejected: {summary.rejected}</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="receipt-outline" size={28} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No Expenses</Text>
              <Text style={s.emptyDesc}>You haven't submitted any expenses yet.</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable style={[s.fab, shadows.fab]} onPress={() => { resetForm(); setShowAdd(true) }}>
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          style={s.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* Add Expense Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={s.overlay} onPress={() => setShowAdd(false)}>
            <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
              <View style={s.handle} />
              <Text style={s.sheetTitle}>Add Expense</Text>

              <Text style={s.fieldLabel}>Title</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Cab fare to client meeting"
                placeholderTextColor={colors.textMuted}
                value={addTitle}
                onChangeText={setAddTitle}
              />

              <Text style={s.fieldLabel}>Amount (Rs.)</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={addAmount}
                onChangeText={setAddAmount}
              />

              <Text style={s.fieldLabel}>Category</Text>
              <Pressable style={s.selectBox} onPress={() => setShowCategoryPicker(true)}>
                <Text style={[s.selectText, !addCategory && { color: colors.textMuted }]}>
                  {addCategory || 'Select category'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </Pressable>

              <Text style={s.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[s.input, { height: 72, textAlignVertical: 'top' }]}
                placeholder="Add details..."
                placeholderTextColor={colors.textMuted}
                value={addDescription}
                onChangeText={setAddDescription}
                multiline
              />

              <Pressable
                style={[s.submitWrap, { marginTop: 20 }]}
                onPress={handleSubmitExpense}
                disabled={submitting || !addTitle || !addAmount || !addCategory}
              >
                <LinearGradient
                  colors={[colors.gradientFrom, colors.gradientTo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.submitBtn, (!addTitle || !addAmount || !addCategory) && { opacity: 0.5 }]}
                >
                  <Text style={s.submitBtnText}>
                    {submitting ? 'Submitting...' : 'Submit Expense'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Picker */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <Pressable style={[s.overlay, { justifyContent: 'center' }]} onPress={() => setShowCategoryPicker(false)}>
          <View style={[s.pickerBox, shadows.modal]}>
            <Text style={s.pickerTitle}>Select Category</Text>
            {CATEGORIES.map(cat => {
              const cfg = getCategoryConfig(cat)
              return (
                <Pressable
                  key={cat}
                  style={({ pressed }) => [
                    s.pickerOption,
                    addCategory === cat && { backgroundColor: colors.primaryLight },
                    pressed && { backgroundColor: colors.surfaceHover },
                  ]}
                  onPress={() => { setAddCategory(cat); setShowCategoryPicker(false) }}
                >
                  <View style={[s.pickerIcon, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                  </View>
                  <Text style={[s.pickerText, addCategory === cat && { color: colors.primary, fontWeight: '600' }]}>
                    {cat}
                  </Text>
                  {addCategory === cat && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={[s.overlay, { justifyContent: 'center' }]}>
          <View style={[s.successBox, shadows.modal]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.successIcon}>
                <Ionicons name="checkmark" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.successTitle}>Expense Submitted!</Text>
            <Text style={s.successDesc}>
              Your expense has been submitted and is awaiting approval.
            </Text>
            <Pressable style={[s.submitWrap, { marginTop: 16 }]} onPress={() => { setShowSuccess(false); resetForm() }}>
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitBtn}>
                <Text style={s.submitBtnText}>Close</Text>
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

  summaryCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  summaryLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  summaryTotal: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryItemText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  expenseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  catIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  expenseTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  expenseDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  statusBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyDesc: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  fab: { position: 'absolute', bottom: 90, right: 20, borderRadius: 28, overflow: 'hidden' },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
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
  submitWrap: { borderRadius: radius.pill, overflow: 'hidden' },
  submitBtn: {
    height: 52, borderRadius: radius.pill,
    justifyContent: 'center', alignItems: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Picker
  pickerBox: {
    backgroundColor: colors.surface, borderRadius: 16,
    marginHorizontal: 32, padding: 20,
  },
  pickerTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10,
  },
  pickerIcon: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  pickerText: { flex: 1, fontSize: 14, color: colors.textPrimary },

  // Success
  successBox: { backgroundColor: colors.surface, borderRadius: 24, marginHorizontal: 32, padding: 28 },
  successIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  successDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
})
