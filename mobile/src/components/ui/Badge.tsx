import React from 'react'
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '../../theme/colors'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  icon?: keyof typeof Ionicons.glyphMap
  style?: StyleProp<ViewStyle>
  size?: 'sm' | 'md'
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surfaceAlt, text: colors.textSecondary },
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
}

export function Badge({ label, variant = 'default', icon, style, size = 'sm' }: BadgeProps) {
  const config = variantMap[variant]
  const isMd = size === 'md'

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: isMd ? 10 : 8,
          paddingVertical: isMd ? 4 : 2,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={isMd ? 14 : 12}
          color={config.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isMd ? 12 : 11,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
    letterSpacing: -0.15,
  },
})
