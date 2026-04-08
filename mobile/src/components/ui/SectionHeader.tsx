import React from 'react'
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius } from '../../theme/colors'
import { haptic } from '../../lib/haptics'

interface SectionHeaderProps {
  title: string
  count?: number
  actionLabel?: string
  onAction?: () => void
  style?: StyleProp<ViewStyle>
}

export function SectionHeader({
  title,
  count,
  actionLabel = 'See All',
  onAction,
  style,
}: SectionHeaderProps) {
  const handleAction = () => {
    haptic.light()
    onAction?.()
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>

      {onAction && (
        <Pressable onPress={handleAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  action: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
    letterSpacing: -0.2,
  },
})
