import { useState } from 'react'
import {
  View, Text, ScrollView, SafeAreaView,
  StyleSheet, Modal,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/ui/Header'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { colors, shadows, radius, type as t } from '@/theme/colors'

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: colors.borderStrong }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { level: 1, label: 'Weak', color: colors.danger }
  if (score === 2) return { level: 2, label: 'Fair', color: colors.warning }
  if (score === 3) return { level: 3, label: 'Good', color: colors.info }
  return { level: 4, label: 'Strong', color: colors.success }
}

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  const strength = getPasswordStrength(newPassword)

  const validate = (): string | null => {
    if (!currentPassword.trim()) return 'Please enter your current password.'
    if (newPassword.length < 8) return 'New password must be at least 8 characters.'
    if (newPassword !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleUpdate = async () => {
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      // Verify current password by signing in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('User not found')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) {
        setError('Current password is incorrect.')
        setSaving(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) throw updateError

      setShowSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setError(e?.message || 'Failed to update password.')
    }
    setSaving(false)
  }

  return (
    <SafeAreaView style={s.safe}>
      <Header title="Change Password" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Illustration */}
        <View style={s.iconSection}>
          <View style={s.lockCircle}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
          </View>
          <Text style={s.subtitle}>
            Create a strong password to keep your account secure
          </Text>
        </View>

        {/* Form */}
        <View style={[s.formCard, shadows.card]}>
          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
          />

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={v => { setNewPassword(v); setError('') }}
            secureTextEntry
            leftIcon="key-outline"
          />

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={s.strengthSection}>
              <View style={s.strengthBar}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      s.strengthSegment,
                      {
                        backgroundColor: i <= strength.level
                          ? strength.color
                          : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[s.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          <Input
            label="Confirm Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={v => { setConfirmPassword(v); setError('') }}
            secureTextEntry
            leftIcon="shield-checkmark-outline"
            error={confirmPassword.length > 0 && newPassword !== confirmPassword
              ? 'Passwords do not match'
              : undefined
            }
          />

          {error ? (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Hints */}
        <View style={s.hints}>
          <Text style={s.hintsTitle}>Password Requirements</Text>
          {[
            { check: newPassword.length >= 8, text: 'At least 8 characters' },
            { check: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
            { check: /[0-9]/.test(newPassword), text: 'One number' },
            { check: /[^A-Za-z0-9]/.test(newPassword), text: 'One special character' },
          ].map((rule, i) => (
            <View key={i} style={s.hintRow}>
              <Ionicons
                name={rule.check ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={rule.check ? colors.success : colors.textMuted}
              />
              <Text style={[s.hintText, rule.check && { color: colors.success }]}>
                {rule.text}
              </Text>
            </View>
          ))}
        </View>

        <Button
          title="Update Password"
          onPress={handleUpdate}
          loading={saving}
          fullWidth
          size="lg"
          style={{ marginTop: 16 }}
        />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.successModal, shadows.modal]}>
            <View style={s.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={s.successTitle}>Password Changed</Text>
            <Text style={s.successDesc}>
              Your password has been updated successfully. Use your new password for future logins.
            </Text>
            <Button
              title="Done"
              onPress={() => {
                setShowSuccess(false)
                router.back()
              }}
              fullWidth
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  iconSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  strengthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: -8,
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 48,
    textAlign: 'right',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },

  hints: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  hintsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center',
    width: '85%',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
