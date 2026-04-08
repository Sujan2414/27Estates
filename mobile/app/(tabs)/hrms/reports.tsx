import { useState } from 'react'
import {
  View, Text, SafeAreaView, StyleSheet, ScrollView,
  Pressable, Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows } from '@/theme/colors'

const { width: SCREEN_W } = Dimensions.get('window')

const REPORT_CARDS = [
  {
    title: 'Attendance Report',
    subtitle: 'Monthly clock-in/out summary',
    icon: 'time-outline' as const,
    color: colors.primary,
    bg: colors.primaryLight,
    value: '96%',
    label: 'This Month',
  },
  {
    title: 'Leave Summary',
    subtitle: 'Leave balance & usage',
    icon: 'calendar-outline' as const,
    color: colors.info,
    bg: colors.infoLight,
    value: '24',
    label: 'Remaining',
  },
  {
    title: 'Expense Report',
    subtitle: 'Monthly expense breakdown',
    icon: 'receipt-outline' as const,
    color: colors.warning,
    bg: colors.warningLight,
    value: '$0',
    label: 'This Month',
  },
  {
    title: 'Task Performance',
    subtitle: 'Completion rate & stats',
    icon: 'checkmark-circle-outline' as const,
    color: colors.success,
    bg: colors.successLight,
    value: '0%',
    label: 'Completion',
  },
  {
    title: 'Payroll History',
    subtitle: 'Past salary statements',
    icon: 'card-outline' as const,
    color: '#7C3AED',
    bg: '#F5F3FF',
    value: '--',
    label: 'Last Pay',
  },
  {
    title: 'CRM Analytics',
    subtitle: 'Lead conversion & pipeline',
    icon: 'analytics-outline' as const,
    color: '#0EA5E9',
    bg: '#F0F9FF',
    value: '0',
    label: 'Leads',
  },
]

export default function ReportsScreen() {
  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary bar */}
        <View style={s.summaryRow}>
          <View style={[s.summaryItem, { backgroundColor: colors.primaryLight }]}>
            <Text style={[s.summaryValue, { color: colors.primary }]}>6</Text>
            <Text style={s.summaryLabel}>Reports</Text>
          </View>
          <View style={[s.summaryItem, { backgroundColor: colors.infoLight }]}>
            <Text style={[s.summaryValue, { color: colors.info }]}>Apr</Text>
            <Text style={s.summaryLabel}>Period</Text>
          </View>
          <View style={[s.summaryItem, { backgroundColor: colors.successLight }]}>
            <Text style={[s.summaryValue, { color: colors.success }]}>2026</Text>
            <Text style={s.summaryLabel}>Year</Text>
          </View>
        </View>

        {/* Report cards */}
        {REPORT_CARDS.map((card, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.cardIcon, { backgroundColor: card.bg }]}>
              <Ionicons name={card.icon} size={24} color={card.color} />
            </View>
            <View style={s.cardContent}>
              <Text style={s.cardTitle}>{card.title}</Text>
              <Text style={s.cardSubtitle}>{card.subtitle}</Text>
            </View>
            <View style={s.cardRight}>
              <Text style={[s.cardValue, { color: card.color }]}>{card.value}</Text>
              <Text style={s.cardLabel}>{card.label}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
})
