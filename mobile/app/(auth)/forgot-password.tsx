import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { haptic } from '@/lib/haptics'
import { colors, radius, type as t } from '@/theme/colors'

/* ───── OTP Input Component ───── */

function OTPInput({
  code,
  setCode,
}: {
  code: string[]
  setCode: (c: string[]) => void
}) {
  const inputs = useRef<(TextInput | null)[]>([])

  const handleChange = (text: string, index: number) => {
    const next = [...code]
    next[index] = text.replace(/[^0-9]/g, '')
    setCode(next)
    if (text && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const next = [...code]
      next[index - 1] = ''
      setCode(next)
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <View style={s.otpRow}>
      {code.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref }}
          style={[s.otpBox, digit ? s.otpBoxActive : null]}
          value={digit}
          onChangeText={(txt) => handleChange(txt, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  )
}

/* ───── Main Component ───── */

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [email, setEmail] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)

  // Step 2
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(60)

  // Step 3
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newFocused, setNewFocused] = useState(false)
  const [confirmFocused, setConfirmFocused] = useState(false)

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(600)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 120, useNativeDriver: true }),
    ]).start()
  }, [fadeAnim, slideAnim])

  // Countdown for OTP resend
  useEffect(() => {
    if (step !== 2) return
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [step, countdown])

  const animateStep = (callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      callback()
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
    })
  }

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.')
      return
    }
    haptic.light()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (error) {
        haptic.error()
        Alert.alert('Error', error.message)
      } else {
        haptic.success()
        setCountdown(60)
        animateStep(() => setStep(2))
      }
    } catch (err: any) {
      haptic.error()
      Alert.alert('Error', err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    const code = otpCode.join('')
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the full 6-digit code.')
      return
    }
    haptic.light()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'recovery',
      })
      if (error) {
        haptic.error()
        Alert.alert('Verification Failed', error.message)
      } else {
        haptic.success()
        animateStep(() => setStep(3))
      }
    } catch (err: any) {
      haptic.error()
      Alert.alert('Error', err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both password fields.')
      return
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.')
      return
    }
    haptic.light()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        haptic.error()
        Alert.alert('Error', error.message)
      } else {
        haptic.success()
        animateStep(() => setStep(4))
      }
    } catch (err: any) {
      haptic.error()
      Alert.alert('Error', err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    haptic.light()
    try {
      await supabase.auth.resetPasswordForEmail(email.trim())
      setCountdown(60)
      Alert.alert('Code Sent', 'A new reset code has been sent.')
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to resend code')
    }
  }

  const inputBorder = (focused: boolean) => ({
    borderColor: focused ? colors.primary : colors.border,
    backgroundColor: focused ? colors.primary25 : colors.surfaceAlt,
  })

  /* ───── Step 1: Email Input ───── */
  const renderStep1 = () => (
    <>
      <Text style={[t.headlineSm, { textAlign: 'center', color: colors.textPrimary, marginBottom: 6 }]}>
        Forgot Password
      </Text>
      <Text style={[t.labelLg, { textAlign: 'center', color: colors.textSecondary, marginBottom: 28 }]}>
        Enter your email to receive a reset code
      </Text>

      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6 }]}>Email</Text>
      <View style={[s.inputWrap, inputBorder(emailFocused)]}>
        <Ionicons name="mail-outline" size={18} color={emailFocused ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />
      </View>

      <Pressable
        onPress={handleSendCode}
        disabled={loading}
        style={({ pressed }) => [s.gradientWrap, { marginTop: 28 }, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.gradientBtnText}>Send Reset Code</Text>
          )}
        </LinearGradient>
      </Pressable>

      <Pressable onPress={() => router.back()} style={{ marginTop: 20, alignSelf: 'center' }}>
        <Text style={[t.labelSm, { color: colors.primary }]}>Back to Sign In</Text>
      </Pressable>
    </>
  )

  /* ───── Step 2: OTP Verification ───── */
  const renderStep2 = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={s.iconCircle}>
        <Ionicons name="mail" size={32} color={colors.primary} />
      </View>
      <Text style={[t.headlineSm, { color: colors.textPrimary, marginTop: 20, marginBottom: 8 }]}>
        Enter Reset Code
      </Text>
      <Text style={[t.labelLg, { color: colors.textSecondary, textAlign: 'center', marginBottom: 28 }]}>
        Enter the code sent to{'\n'}
        <Text style={{ color: colors.primary }}>{email}</Text>
      </Text>

      <OTPInput code={otpCode} setCode={setOtpCode} />

      <Pressable onPress={handleResend} disabled={countdown > 0} style={{ marginTop: 20, marginBottom: 28 }}>
        <Text style={[t.labelSm, { color: countdown > 0 ? colors.textMuted : colors.primary }]}>
          {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleVerifyOTP}
        disabled={loading}
        style={({ pressed }) => [s.gradientWrap, { width: '100%' }, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.gradientBtnText}>Verify Code</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  )

  /* ───── Step 3: New Password ───── */
  const renderStep3 = () => (
    <>
      <Text style={[t.headlineSm, { textAlign: 'center', color: colors.textPrimary, marginBottom: 6 }]}>
        New Password
      </Text>
      <Text style={[t.labelLg, { textAlign: 'center', color: colors.textSecondary, marginBottom: 28 }]}>
        Create a new secure password
      </Text>

      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6 }]}>New Password</Text>
      <View style={[s.inputWrap, inputBorder(newFocused)]}>
        <Ionicons name="lock-closed-outline" size={18} color={newFocused ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="Enter new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showNew}
          value={newPassword}
          onChangeText={setNewPassword}
          onFocus={() => setNewFocused(true)}
          onBlur={() => setNewFocused(false)}
        />
        <Pressable onPress={() => setShowNew((p) => !p)} hitSlop={10}>
          <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6, marginTop: 16 }]}>Confirm Password</Text>
      <View style={[s.inputWrap, inputBorder(confirmFocused)]}>
        <Ionicons name="lock-closed-outline" size={18} color={confirmFocused ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onFocus={() => setConfirmFocused(true)}
          onBlur={() => setConfirmFocused(false)}
        />
        <Pressable onPress={() => setShowConfirm((p) => !p)} hitSlop={10}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={s.hintBox}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={[t.tiny, { color: colors.textMuted, marginLeft: 6, flex: 1 }]}>
          Password must be at least 8 characters with a mix of letters and numbers.
        </Text>
      </View>

      {newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
        <Text style={[t.tiny, { color: colors.danger, marginTop: 8 }]}>Passwords do not match</Text>
      )}

      <Pressable
        onPress={handleResetPassword}
        disabled={loading}
        style={({ pressed }) => [s.gradientWrap, { marginTop: 24 }, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.gradientBtnText}>Reset Password</Text>
          )}
        </LinearGradient>
      </Pressable>
    </>
  )

  /* ───── Step 4: Success ───── */
  const renderStep4 = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={[s.iconCircle, { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successLight }]}>
        <Ionicons name="checkmark" size={40} color={colors.success} />
      </View>
      <Text style={[t.headlineSm, { color: colors.textPrimary, marginTop: 24, marginBottom: 8 }]}>
        Password Reset!
      </Text>
      <Text style={[t.labelLg, { color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }]}>
        Your password has been successfully reset
      </Text>

      <Pressable
        onPress={() => {
          haptic.success()
          router.replace('/(auth)/login')
        }}
        style={({ pressed }) => [s.gradientWrap, { width: '100%' }, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.gradientBtn}
        >
          <Text style={s.gradientBtnText}>Go to Sign In</Text>
        </LinearGradient>
      </Pressable>
    </View>
  )

  return (
    <View style={s.root}>
      {/* Dark backdrop */}
      <View style={s.backdrop}>
        <View style={[s.backdropCard, { top: 120, left: 40, transform: [{ rotate: '-8deg' }] }]}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={[t.labelMd, { color: colors.textPrimary, marginTop: 6 }]}>Secure Reset</Text>
          <Text style={[t.tiny, { color: colors.textMuted, marginTop: 2 }]}>Your data is protected</Text>
        </View>
        <View style={[s.backdropCard, { top: 240, left: SCREEN_W - 180, transform: [{ rotate: '6deg' }] }]}>
          <Ionicons name="key" size={24} color={colors.warning} />
          <Text style={[t.labelMd, { color: colors.textPrimary, marginTop: 6 }]}>New Password</Text>
          <Text style={[t.tiny, { color: colors.textMuted, marginTop: 2 }]}>Choose a strong one</Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.handle} />

            <Animated.View style={{ opacity: fadeAnim }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1321' },
  backdrop: { flex: 1 },
  backdropCard: {
    position: 'absolute',
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 14,
  },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
  },
  sheetContent: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 40 },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary },

  gradientWrap: { borderRadius: radius.pill, overflow: 'hidden' },
  gradientBtn: { height: 48, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center' },
  gradientBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
  },
  otpBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary25,
  },

  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
  },
})
