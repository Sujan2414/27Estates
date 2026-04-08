import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, SafeAreaView,
  StyleSheet, Modal, Platform,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/ui/Header'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']

interface ProfileData {
  full_name: string
  email: string
  phone: string
  gender: string
  date_of_birth: string
  address: string
}

export default function PersonalDataScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showGenderPicker, setShowGenderPicker] = useState(false)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    address: '',
  })

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase.from('employees')
        .select('id, full_name, email, phone, gender, date_of_birth, address')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setEmployeeId(data.id)
        setForm({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          gender: data.gender || '',
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
        })
      } else {
        setForm(prev => ({ ...prev, email: user.email || '' }))
      }
    } catch (e) {
      console.warn('PersonalData loadProfile error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadProfile() }, [loadProfile]))

  const handleSave = async () => {
    if (!employeeId) return
    setSaving(true)
    try {
      const { error } = await supabase.from('employees')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
          address: form.address,
        })
        .eq('id', employeeId)

      if (error) throw error
      setShowSuccess(true)
    } catch (e) {
      console.warn('PersonalData save error:', e)
    }
    setSaving(false)
  }

  const updateField = (key: keyof ProfileData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const initials = form.full_name
    ? form.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="Personal Data" onBack={() => router.back()} />
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 12, marginVertical: 20 }}>
            <Skeleton width={88} height={88} borderRadius={44} />
            <Skeleton width={100} height={14} />
          </View>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} height={48} borderRadius={8} />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <Header title="Personal Data" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Pressable style={s.changePhotoBtn}>
            <Ionicons name="camera-outline" size={16} color={colors.primary} />
            <Text style={s.changePhotoText}>Change Photo</Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={[s.formCard, shadows.card]}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={form.full_name}
            onChangeText={v => updateField('full_name', v)}
            leftIcon="person-outline"
          />

          <Input
            label="Email"
            placeholder="Email address"
            value={form.email}
            editable={false}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone"
            placeholder="Phone number"
            value={form.phone}
            onChangeText={v => updateField('phone', v)}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />

          {/* Gender Picker */}
          <View style={{ marginBottom: 16 }}>
            <Text style={s.fieldLabel}>Gender</Text>
            <Pressable
              style={s.pickerBtn}
              onPress={() => setShowGenderPicker(true)}
            >
              <Ionicons name="male-female-outline" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={[s.pickerText, !form.gender && { color: colors.textMuted }]}>
                {form.gender || 'Select gender'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={form.date_of_birth}
            onChangeText={v => updateField('date_of_birth', v)}
            leftIcon="calendar-outline"
          />

          <Input
            label="Address"
            placeholder="Enter your address"
            value={form.address}
            onChangeText={v => updateField('address', v)}
            leftIcon="location-outline"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <Button
          title="Update Profile"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />
      </ScrollView>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowGenderPicker(false)}>
          <View style={[s.modalContent, shadows.modal]}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Select Gender</Text>
            {GENDER_OPTIONS.map(option => (
              <Pressable
                key={option}
                style={[
                  s.optionRow,
                  form.gender === option && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => {
                  updateField('gender', option)
                  setShowGenderPicker(false)
                }}
              >
                <Text style={[
                  s.optionText,
                  form.gender === option && { color: colors.primary, fontWeight: '600' },
                ]}>
                  {option}
                </Text>
                {form.gender === option && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

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
            <Text style={s.successTitle}>Profile Updated</Text>
            <Text style={s.successDesc}>Your personal data has been saved successfully.</Text>
            <Button
              title="Done"
              onPress={() => setShowSuccess(false)}
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

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  pickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
    letterSpacing: 0.25,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
  },

  successModal: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
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
