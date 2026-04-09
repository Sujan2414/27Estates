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

/* ───── Floating backdrop cards ───── */

const BACKDROP_CARDS = [
  {
    title: 'Site Visit - Whitefield',
    status: 'In Progress',
    statusColor: '#3B82F6',
    avatars: 3,
    rotate: '-12deg',
    top: 90,
    left: 20,
  },
  {
    title: 'Follow Up - Mr. Sharma',
    status: 'Pending',
    statusColor: '#F59E0B',
    avatars: 2,
    rotate: '8deg',
    top: 180,
    left: SCREEN_W - 210,
  },
  {
    title: 'Quarterly Report',
    status: 'Completed',
    statusColor: '#10B981',
    avatars: 4,
    rotate: '-5deg',
    top: 300,
    left: 30,
  },
]

function BackdropCard({
  card,
  opacity,
}: {
  card: (typeof BACKDROP_CARDS)[0]
  opacity: Animated.Value
}) {
  return (
    <Animated.View
      style={[
        s.backdropCard,
        {
          top: card.top,
          left: card.left,
          transform: [{ rotate: card.rotate }],
          opacity,
        },
      ]}
    >
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 8 }]}>{card.title}</Text>
      <View style={s.cardMeta}>
        <View style={[s.statusPill, { backgroundColor: card.statusColor + '18' }]}>
          <Text style={[t.tiny, { color: card.statusColor }]}>{card.status}</Text>
        </View>
        <View style={s.avatarStack}>
          {Array.from({ length: card.avatars }).map((_, i) => (
            <View
              key={i}
              style={[
                s.miniAvatar,
                { marginLeft: i > 0 ? -6 : 0, backgroundColor: i % 2 === 0 ? colors.primary200 : colors.primary300 },
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  )
}

/* ───── Main Component ───── */

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetY = useRef(new Animated.Value(600)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 120 }),
    ]).start()
  }, [backdropOpacity, sheetY])

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.')
      return
    }
    haptic.light()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        haptic.error()
        Alert.alert('Sign In Failed', error.message)
      } else {
        haptic.success()
      }
    } catch (err: any) {
      haptic.error()
      Alert.alert('Error', err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputBorder = (focused: boolean) => ({
    borderColor: focused ? colors.primary : colors.border,
    backgroundColor: focused ? colors.primary25 : colors.surfaceAlt,
  })

  return (
    <View style={s.root}>
      {/* Dark backdrop */}
      <View style={s.backdrop}>
        {BACKDROP_CARDS.map((card, i) => (
          <BackdropCard key={i} card={card} opacity={backdropOpacity} />
        ))}
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }] }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <Text style={[t.headlineSm, { textAlign: 'center', color: colors.textPrimary, marginBottom: 6 }]}>
              Sign In
            </Text>
            <Text style={[t.labelLg, { textAlign: 'center', color: colors.textSecondary, marginBottom: 28 }]}>
              Sign in to my account
            </Text>

            {/* Email */}
            <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6 }]}>Email</Text>
            <View style={[s.inputWrap, inputBorder(emailFocused)]}>
              <Ionicons name="mail-outline" size={18} color={emailFocused ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input}
                placeholder="My Email"
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

            {/* Password */}
            <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6, marginTop: 16 }]}>Password</Text>
            <View style={[s.inputWrap, inputBorder(passwordFocused)]}>
              <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input}
                placeholder="My Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={10}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            {/* Remember / Forgot */}
            <View style={s.rememberRow}>
              <Pressable onPress={() => setRememberMe((p) => !p)} style={s.checkRow} hitSlop={8}>
                <View style={[s.checkbox, rememberMe && s.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={[t.labelSm, { color: colors.textSecondary }]}>Remember Me</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/forgot-password')} hitSlop={8}>
                <Text style={[t.labelSm, { color: colors.primary }]}>Forgot Password</Text>
              </Pressable>
            </View>

            {/* Sign In button */}
            <Pressable
              onPress={handleSignIn}
              disabled={loading}
              style={({ pressed }) => [s.gradientWrap, pressed && { opacity: 0.85 }]}
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
                  <Text style={s.gradientBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* OR divider */}
            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={[t.labelSm, { color: colors.textMuted, marginHorizontal: 12 }]}>OR</Text>
              <View style={s.orLine} />
            </View>

            {/* Alt sign in */}
            <Pressable style={({ pressed }) => [s.outlineBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="person-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[t.labelLg, { color: colors.primary }]}>Sign in With Employee ID</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [s.outlineBtn, pressed && { opacity: 0.7 }, { marginTop: 12 }]}>
              <Ionicons name="call-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[t.labelLg, { color: colors.primary }]}>Sign in With Phone</Text>
            </Pressable>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={[t.labelSm, { color: colors.textSecondary }]}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/signup')} hitSlop={8}>
                <Text style={[t.labelSm, { color: colors.primary, fontWeight: '600' }]}>Sign Up Here</Text>
              </Pressable>
            </View>
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
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 12,
    ...shadows.card,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  avatarStack: { flexDirection: 'row' },
  miniAvatar: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#fff' },

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

  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  gradientWrap: { borderRadius: radius.pill, overflow: 'hidden' },
  gradientBtn: { height: 48, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center' },
  gradientBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },

  outlineBtn: {
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
})
