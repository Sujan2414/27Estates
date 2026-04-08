import React from 'react'
import {
  View, Text, Pressable, Modal, StyleSheet,
  Dimensions, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, shadows, radius } from '../../theme/colors'

const { width: SCREEN_W } = Dimensions.get('window')

interface MoreMenuItem {
  icon: string
  label: string
  color: string
  bg: string
  route: string
}

const MENU_ITEMS: MoreMenuItem[] = [
  { icon: 'time-outline', label: 'Attendance', color: colors.primary, bg: colors.primaryLight, route: '/(tabs)/hrms/attendance' },
  { icon: 'receipt-outline', label: 'Expenses', color: colors.warning, bg: colors.warningLight, route: '/(tabs)/hrms/expenses' },
  { icon: 'calendar-outline', label: 'Leave', color: colors.info, bg: colors.infoLight, route: '/(tabs)/hrms/leaves' },
  { icon: 'card-outline', label: 'Payroll', color: colors.success, bg: colors.successLight, route: '/(tabs)/hrms/payroll' },
  { icon: 'chatbubbles-outline', label: 'Messages', color: '#8B5CF6', bg: '#F3EEFF', route: '/(tabs)/hrms/messages' },
  { icon: 'notifications-outline', label: 'Notifications', color: colors.danger, bg: colors.dangerLight, route: '/(tabs)/hrms/notifications' },
  { icon: 'clipboard-outline', label: 'CRM', color: '#0EA5E9', bg: '#F0F9FF', route: '/(tabs)/crm' },
  { icon: 'briefcase-outline', label: 'Assets', color: '#D97706', bg: '#FFFBEB', route: '/(tabs)/hrms/office-assets' },
  { icon: 'person-outline', label: 'Personal Data', color: colors.primary, bg: colors.primaryLight, route: '/(tabs)/hrms/personal-data' },
  { icon: 'flash-outline', label: 'My Tasks', color: '#EA580C', bg: '#FFF7ED', route: '/(tabs)/hrms/tasks' },
  { icon: 'lock-closed-outline', label: 'Password', color: '#6B7280', bg: '#F9FAFB', route: '/(tabs)/hrms/change-password' },
  { icon: 'analytics-outline', label: 'Reports', color: '#7C3AED', bg: '#F5F3FF', route: '/(tabs)/hrms/reports' },
]

interface MoreMenuProps {
  visible: boolean
  onClose: () => void
}

export function MoreMenu({ visible, onClose }: MoreMenuProps) {
  const handlePress = (route: string) => {
    onClose()
    setTimeout(() => {
      router.push(route as any)
    }, 150)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>More Options</Text>
            <Pressable style={s.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.grid}
          >
            {MENU_ITEMS.map((item, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  s.gridItem,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                ]}
                onPress={() => handlePress(item.route)}
              >
                <View style={[s.gridIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={s.gridLabel} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const ITEM_W = (SCREEN_W - 32 - 36) / 4 // 4 columns with gaps

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  gridItem: {
    width: ITEM_W,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  gridIcon: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
