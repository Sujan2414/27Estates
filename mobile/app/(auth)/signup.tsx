import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { colors, radius, shadows, type as t } from '@/theme/colors'

const { width: SCREEN_W } = Dimensions.get('window')

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

export default function SignupScreen() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1 fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Step 2 OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(60)

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(600)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 120, useNativeDriver: true }),
    ]).start()
  }, [fadeAnim, slideAnim])

  // Countdown timer for OTP resend
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

  const handleCreateAccount = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.')
      return
    }
    haptic.light()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: phone.trim(), // using phone as temporary password, real flow would have password field
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            company: company.trim(),
          },
        },
      })
      if (error) {
        haptic.error()
        Alert.alert('Sign Up Failed', error.message)
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

  const handleVerify = async () => {
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
        type: 'signup',
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

  const handleResend = async () => {
    if (countdown > 0) return
    haptic.light()
    try {
      await supabase.auth.resend({ type: 'signup', email: email.trim() })
      setCountdown(60)
      Alert.alert('Code Sent', 'A new verification code has been sent.')
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to resend code')
    }
  }

  const inputBorder = (field: string) => ({
    borderColor: focusedField === field ? colors.primary : colors.border,
    backgroundColor: focusedField === field ? colors.primary25 : colors.surfaceAlt,
  })

  /* ───── Step 1: Registration Form ───── */
  const renderStep1 = () => (
    <>
      <Text style={[t.headlineSm, { textAlign: 'center', color: colors.textPrimary, marginBottom: 6 }]}>
        Create Account
      </Text>
      <Text style={[t.labelLg, { textAlign: 'center', color: colors.textSecondary, marginBottom: 28 }]}>
        Register a new account
      </Text>

      {/* Full Name */}
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6 }]}>Full Name</Text>
      <View style={[s.inputWrap, inputBorder('name')]}>
        <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      {/* Email */}
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6, marginTop: 16 }]}>Email</Text>
      <View style={[s.inputWrap, inputBorder('email')]}>
        <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      {/* Phone */}
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6, marginTop: 16 }]}>Phone Number</Text>
      <View style={[s.inputWrap, inputBorder('phone')]}>
        <Ionicons name="call-outline" size={18} color={focusedField === 'phone' ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      {/* Company */}
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6, marginTop: 16 }]}>Company / Organization</Text>
      <View style={[s.inputWrap, inputBorder('company')]}>
        <Ionicons name="business-outline" size={18} color={focusedField === 'company' ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="Enter your company name"
          placeholderTextColor={colors.textMuted}
          value={company}
          onChangeText={setCompany}
          onFocus={() => setFocusedField('company')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      {/* Create Account button */}
      <Pressable
        onPress={handleCreateAccount}
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
            <Text style={s.gradientBtnText}>Create Account</Text>
          )}
        </LinearGradient>
      </Pressable>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={[t.labelSm, { color: colors.textSecondary }]}>Already have an account? </Text>
        <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8}>
          <Text style={[t.labelSm, { color: colors.primary, fontWeight: '600' }]}>Sign In</Text>
        </Pressable>
      </View>
    </>
  )

  /* ───── Step 2: OTP Verification ───── */
  const renderStep2 = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={s.iconCircle}>
        <Ionicons name="mail" size={32} color={colors.primary} />
      </View>
      <Text style={[t.headlineSm, { color: colors.textPrimary, marginTop: 20, marginBottom: 8 }]}>
        Verify Your Email
      </Text>
      <Text style={[t.labelLg, { color: colors.textSecondary, textAlign: 'center', marginBottom: 28 }]}>
        We've sent a verification code to{'\n'}
        <Text style={{ color: colors.primary }}>{email}</Text>
      </Text>

      <OTPInput code={otpCode} setCode={setOtpCode} />

      <Pressable onPress={handleResend} disabled={countdown > 0} style={{ marginTop: 20, marginBottom: 28 }}>
        <Text style={[t.labelSm, { color: countdown > 0 ? colors.textMuted : colors.primary }]}>
          {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleVerify}
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
            <Text style={s.gradientBtnText}>Verify</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  )

  /* ───── Step 3: Success ───── */
  const renderStep3 = () => (
    <View style={{ alignItems: 'center' }}>
      <View style={[s.iconCircle, { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successLight }]}>
        <Ionicons name="checkmark" size={40} color={colors.success} />
      </View>
      <Text style={[t.headlineSm, { color: colors.textPrimary, marginTop: 24, marginBottom: 8 }]}>
        Account Created!
      </Text>
      <Text style={[t.labelLg, { color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }]}>
        Your account has been successfully created
      </Text>

      <Pressable
        onPress={() => {
          haptic.success()
          router.replace('/(tabs)')
        }}
        style={({ pressed }) => [s.gradientWrap, { width: '100%' }, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.gradientBtn}
        >
          <Text style={s.gradientBtnText}>Get Started</Text>
        </LinearGradient>
      </Pressable>
    </View>
  )

  return (
    <View style={s.root}>
      {/* Dark backdrop */}
      <View style={s.backdrop}>
        <View style={[s.backdropCard, { top: 100, left: 30, transform: [{ rotate: '-10deg' }] }]}>
          <Text style={[t.labelMd, { color: colors.textPrimary }]}>New Lead Assigned</Text>
          <View style={[s.statusPill, { backgroundColor: colors.primary100, marginTop: 6 }]}>
            <Text style={[t.tiny, { color: colors.primary }]}>High Priority</Text>
          </View>
        </View>
        <View style={[s.backdropCard, { top: 200, left: SCREEN_W - 190, transform: [{ rotate: '7deg' }] }]}>
          <Text style={[t.labelMd, { color: colors.textPrimary }]}>Team Sync Call</Text>
          <Text style={[t.tiny, { color: colors.textMuted, marginTop: 4 }]}>Today at 3:00 PM</Text>
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
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 12,
    ...shadows.card,
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
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

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },

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
})
