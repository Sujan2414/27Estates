import React from 'react'
import { View, Text, Pressable, StyleSheet, Platform, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows, type as typography } from '../../theme/colors'
import { haptic } from '../../lib/haptics'

interface HeaderProps {
  title: string
  onBack?: () => void
  showBack?: boolean
  rightIcon?: keyof typeof Ionicons.glyphMap
  rightLabel?: string
  onRightPress?: () => void
}

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0

export function Header({
  title,
  onBack,
  showBack = true,
  rightIcon,
  rightLabel,
  onRightPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets()
  const topPadding = Math.max(insets.top, STATUS_BAR_HEIGHT)

  const handleBack = () => {
    haptic.light()
    onBack?.()
  }

  const handleRight = () => {
    haptic.light()
    onRightPress?.()
  }

  return (
    <View style={[styles.container, shadows.header, { paddingTop: topPadding }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {showBack && onBack && (
            <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.right}>
          {(rightIcon || rightLabel) && onRightPress && (
            <Pressable onPress={handleRight} hitSlop={12} style={styles.rightBtn}>
              {rightIcon && (
                <Ionicons name={rightIcon} size={22} color={colors.primary} />
              )}
              {rightLabel && <Text style={styles.rightLabel}>{rightLabel}</Text>}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.navBorder,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: 0.15,
  },
  rightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  rightLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 4,
  },
})
