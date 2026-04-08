import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, type as typography } from '../../theme/colors'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: keyof typeof Ionicons.glyphMap
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightIconPress?: () => void
  containerStyle?: StyleProp<ViewStyle>
  multiline?: boolean
  numberOfLines?: number
  phoneMode?: boolean
  countryCode?: string
  onCountryCodePress?: () => void
  secureTextEntry?: boolean
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  multiline = false,
  numberOfLines = 4,
  phoneMode = false,
  countryCode = '+91',
  onCountryCodePress,
  secureTextEntry: secureTextEntryProp,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const [secureVisible, setSecureVisible] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const isSecure = secureTextEntryProp !== undefined
  const actualSecure = isSecure && !secureVisible

  const hasError = !!error
  const borderColor = hasError
    ? colors.danger
    : focused
      ? colors.primary
      : colors.borderStrong
  const bgColor = focused && !hasError ? colors.primaryLight : colors.surface
  const iconColor = focused ? colors.primary : colors.textMuted

  const wrapperHeight = multiline ? undefined : 48
  const minHeight = multiline ? numberOfLines * 24 + 24 : undefined

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.wrapper,
          {
            borderColor,
            backgroundColor: bgColor,
            height: wrapperHeight,
            minHeight,
          },
          multiline && styles.wrapperMultiline,
        ]}
      >
        {phoneMode && (
          <Pressable onPress={onCountryCodePress} style={styles.countryCode}>
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <View style={styles.divider} />
          </Pressable>
        )}

        {leftIcon && !phoneMode && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          ref={inputRef}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          textAlignVertical={multiline ? 'top' : 'center'}
          secureTextEntry={actualSecure}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            phoneMode && styles.inputPhone,
          ]}
          {...rest}
        />

        {isSecure && (
          <Pressable
            onPress={() => setSecureVisible((v) => !v)}
            style={styles.rightIcon}
            hitSlop={8}
          >
            <Ionicons
              name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={iconColor}
            />
          </Pressable>
        )}

        {rightIcon && !isSecure && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={8}
          >
            <Ionicons name={rightIcon} size={20} color={iconColor} />
          </Pressable>
        )}
      </Pressable>

      {hasError && <Text style={styles.error}>{error}</Text>}
      {hint && !hasError && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  wrapperMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
    letterSpacing: 0.25,
    lineHeight: 20,
    padding: 0,
  },
  inputMultiline: {
    paddingTop: 0,
    textAlignVertical: 'top',
  },
  inputPhone: {
    marginLeft: 0,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: 8,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderStrong,
  },
  error: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.danger,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: -0.2,
  },
})
