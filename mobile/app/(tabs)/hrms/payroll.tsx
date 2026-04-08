import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, SafeAreaView,
  StyleSheet, RefreshControl,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/ui/Header'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'
import { format } from 'date-fns'

interface PayrollData {
  id: string
  month: string
  basic_salary: number
  hra: number
  other_allowances: number
  pf_deduction: number
  tax_deduction: number
  other_deductions: number
  net_salary: number
}

export default function PayrollScreen() {
  const [payroll, setPayroll] = useState<PayrollData | null>(null)
  const [payStubs, setPayStubs] = useState<PayrollData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPayroll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase.from('hrm_payroll')
        .select('*')
        .eq('employee_id', user.id)
        .order('month', { ascending: false })
        .limit(12)

      if (data && data.length > 0) {
        const latest = data[0]
        setPayroll({
          id: latest.id,
          month: latest.month || '',
          basic_salary: latest.basic_salary || 0,
          hra: latest.hra || 0,
          other_allowances: latest.other_allowances || 0,
          pf_deduction: latest.pf_deduction || 0,
          tax_deduction: latest.tax_deduction || 0,
          other_deductions: latest.other_deductions || 0,
          net_salary: latest.net_salary || 0,
        })
        setPayStubs(data.map((d: any) => ({
          id: d.id,
          month: d.month || '',
          basic_salary: d.basic_salary || 0,
          hra: d.hra || 0,
          other_allowances: d.other_allowances || 0,
          pf_deduction: d.pf_deduction || 0,
          tax_deduction: d.tax_deduction || 0,
          other_deductions: d.other_deductions || 0,
          net_salary: d.net_salary || 0,
        })))
      }
    } catch (e) {
      console.warn('Payroll loadData error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadPayroll() }, [loadPayroll]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadPayroll()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatMonth = (monthStr: string) => {
    try {
      const date = new Date(monthStr + '-01')
      return format(date, 'MMMM yyyy')
    } catch {
      return monthStr
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="Payroll Info" onBack={() => router.back()} />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={180} borderRadius={16} />
          <Skeleton height={120} borderRadius={16} />
          <Skeleton height={60} borderRadius={12} />
          <Skeleton height={60} borderRadius={12} />
        </View>
      </SafeAreaView>
    )
  }

  const totalEarnings = payroll
    ? payroll.basic_salary + payroll.hra + payroll.other_allowances
    : 0
  const totalDeductions = payroll
    ? payroll.pf_deduction + payroll.tax_deduction + payroll.other_deductions
    : 0

  return (
    <SafeAreaView style={s.safe}>
      <Header title="Payroll Info" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {!payroll ? (
          <EmptyState
            icon="card-outline"
            title="No Payroll Data"
            description="Your payroll information will appear here once available."
          />
        ) : (
          <>
            {/* Current Month Salary Card */}
            <View style={[s.salaryCardWrap, shadows.card]}>
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.salaryCard}
              >
                <Text style={s.salaryCardLabel}>
                  {payroll.month ? formatMonth(payroll.month) : 'Current Month'}
                </Text>

                <View style={s.earningRow}>
                  <Text style={s.earningLabel}>Basic Salary</Text>
                  <Text style={s.earningValue}>{formatCurrency(payroll.basic_salary)}</Text>
                </View>
                <View style={s.earningRow}>
                  <Text style={s.earningLabel}>HRA</Text>
                  <Text style={s.earningValue}>{formatCurrency(payroll.hra)}</Text>
                </View>
                <View style={s.earningRow}>
                  <Text style={s.earningLabel}>Other Allowances</Text>
                  <Text style={s.earningValue}>{formatCurrency(payroll.other_allowances)}</Text>
                </View>

                <View style={s.divider} />

                <View style={s.earningRow}>
                  <Text style={[s.earningLabel, { fontWeight: '700' }]}>Total Earnings</Text>
                  <Text style={[s.earningValue, { fontWeight: '800', fontSize: 18 }]}>
                    {formatCurrency(totalEarnings)}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Deductions Section */}
            <View style={[s.sectionCard, shadows.card]}>
              <Text style={s.sectionTitle}>Deductions</Text>

              <View style={s.deductionRow}>
                <View style={s.deductionIconWrap}>
                  <Ionicons name="shield-outline" size={16} color={colors.warning} />
                </View>
                <Text style={s.deductionLabel}>Provident Fund (PF)</Text>
                <Text style={s.deductionValue}>- {formatCurrency(payroll.pf_deduction)}</Text>
              </View>

              <View style={s.deductionRow}>
                <View style={s.deductionIconWrap}>
                  <Ionicons name="receipt-outline" size={16} color={colors.danger} />
                </View>
                <Text style={s.deductionLabel}>Tax</Text>
                <Text style={s.deductionValue}>- {formatCurrency(payroll.tax_deduction)}</Text>
              </View>

              <View style={s.deductionRow}>
                <View style={s.deductionIconWrap}>
                  <Ionicons name="remove-circle-outline" size={16} color={colors.textMuted} />
                </View>
                <Text style={s.deductionLabel}>Other Deductions</Text>
                <Text style={s.deductionValue}>- {formatCurrency(payroll.other_deductions)}</Text>
              </View>

              <View style={[s.sectionDivider, { marginTop: 8 }]} />

              <View style={s.deductionRow}>
                <View style={{ width: 28 }} />
                <Text style={[s.deductionLabel, { fontWeight: '600' }]}>Total Deductions</Text>
                <Text style={[s.deductionValue, { fontWeight: '700', color: colors.danger }]}>
                  - {formatCurrency(totalDeductions)}
                </Text>
              </View>
            </View>

            {/* Net Salary */}
            <View style={[s.netCard, shadows.card]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={s.netIcon}>
                  <Ionicons name="wallet" size={20} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.netLabel}>Net Salary</Text>
                  <Text style={s.netValue}>{formatCurrency(payroll.net_salary)}</Text>
                </View>
              </View>
            </View>

            {/* Pay Stubs */}
            {payStubs.length > 1 && (
              <View style={s.stubsSection}>
                <Text style={s.sectionTitle}>Pay Stubs</Text>
                {payStubs.map((stub) => (
                  <View key={stub.id} style={[s.stubRow, shadows.xs]}>
                    <View style={s.stubIconWrap}>
                      <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.stubMonth}>{formatMonth(stub.month)}</Text>
                      <Text style={s.stubAmount}>Net: {formatCurrency(stub.net_salary)}</Text>
                    </View>
                    <Pressable hitSlop={8} style={s.downloadBtn}>
                      <Ionicons name="download-outline" size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // Salary Card
  salaryCardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  salaryCard: {
    padding: 20,
    borderRadius: 16,
  },
  salaryCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  earningLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
  },
  earningValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 10,
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },

  // Deductions
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  deductionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deductionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  deductionValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },

  // Net Salary
  netCard: {
    backgroundColor: colors.successLight,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 20,
  },
  netIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  netValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.success,
  },

  // Pay Stubs
  stubsSection: {
    marginTop: 4,
  },
  stubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  stubIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stubMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stubAmount: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
