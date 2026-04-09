import React from 'react'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius, shadows } from '../../theme/colors'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  bordered?: boolean
  padding?: number
}

export function Card({ children, style, bordered = false, padding = 16 }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        shadows.card,
        { padding },
        bordered && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
})
