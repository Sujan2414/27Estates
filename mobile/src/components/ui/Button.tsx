import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, type as typography } from '../../theme/colors'
import { haptic } from '../../lib/haptics'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title: string
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const sizeMap: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 36, paddingHorizontal: 14, fontSize: 13 },
  md: { height: 48, paddingHorizontal: 20, fontSize: 14 },
  lg: { height: 56, paddingHorizontal: 28, fontSize: 16 },
}

const variantStyles: Record<ButtonVariant, {
  bg: string
  textColor: string
  borderColor?: string
  borderWidth?: number
}> = {
  primary: { bg: 'gradient', textColor: colors.textInverse },
  secondary: { bg: colors.primaryLight, textColor: colors.primary },
  outline: { bg: 'transparent', textColor: colors.primary, borderColor: colors.borderStrong, borderWidth: 1 },
  danger: { bg: colors.danger, textColor: colors.textInverse },
  ghost: { bg: 'transparent', textColor: colors.primary },
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const sizeConfig = sizeMap[size]
  const variantConfig = variantStyles[variant]
  const isDisabled = disabled || loading

  const handlePress = () => {
    if (isDisabled) return
    haptic.light()
    onPress?.()
  }

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantConfig.textColor}
          style={styles.loader}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 20}
              color={variantConfig.textColor}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              {
                color: variantConfig.textColor,
                fontSize: sizeConfig.fontSize,
                fontWeight: '600',
                letterSpacing: 0.1,
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  )

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    borderRadius: radius.pill,
    overflow: 'hidden',
    opacity: isDisabled ? 0.5 : 1,
    ...(fullWidth ? {} : { alignSelf: 'flex-start' as const }),
    ...(variantConfig.borderColor
      ? { borderColor: variantConfig.borderColor, borderWidth: variantConfig.borderWidth }
      : {}),
    ...(variant === 'primary' ? shadows.fab : {}),
  }

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={[containerStyle, fullWidth && styles.fullWidth, style]}
      >
        {({ pressed }) => (
          <LinearGradient
            colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradient,
              { height: sizeConfig.height, paddingHorizontal: sizeConfig.paddingHorizontal },
              pressed && styles.pressed,
            ]}
          >
            {content}
          </LinearGradient>
        )}
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        containerStyle,
        {
          backgroundColor: variantConfig.bg,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        pressed && styles.pressed,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  loader: {
    marginRight: 0,
  },
  pressed: {
    opacity: 0.85,
  },
  fullWidth: {
    width: '100%',
  },
})
