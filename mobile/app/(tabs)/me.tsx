import { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, SafeAreaView,
  StyleSheet, Alert,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, shadows, radius, type as t } from '@/theme/colors'

interface UserProfile {
  full_name: string
  role: string
  email?: string
  phone?: string
  avatar_url?: string
  department?: string
}

interface MenuItem {
  icon: string
  label: string
  color?: string
  onPress: () => void
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase.from('employees')
        .select('full_name, role, email, phone, avatar_url, department')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setProfile(data)
      } else {
        // Fallback to auth user
        setProfile({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'Employee',
          email: user.email,
        })
      }
    } catch (e) {
      console.warn('Profile loadData error:', e)
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadProfile() }, [loadProfile]))

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            router.replace('/(auth)' as any)
          },
        },
      ]
    )
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const menuSections: MenuItem[][] = [
    [
      {
        icon: 'person-outline',
        label: 'Personal Data',
        onPress: () => router.push('/(tabs)/hrms/personal-data' as any),
      },
      {
        icon: 'briefcase-outline',
        label: 'Office Assets',
        onPress: () => router.push('/(tabs)/hrms/office-assets' as any),
      },
      {
        icon: 'card-outline',
        label: 'Payroll',
        onPress: () => router.push('/(tabs)/hrms/payroll' as any),
      },
    ],
    [
      {
        icon: 'lock-closed-outline',
        label: 'Change Password',
        onPress: () => router.push('/(tabs)/hrms/change-password' as any),
      },
      {
        icon: 'log-out-outline',
        label: 'Sign Out',
        color: colors.danger,
        onPress: handleSignOut,
      },
    ],
  ]

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ padding: 24, alignItems: 'center', gap: 12, marginTop: 40 }}>
          <Skeleton width={80} height={80} borderRadius={40} />
          <Skeleton width={140} height={18} />
          <Skeleton width={80} height={14} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Header */}
        <View style={s.profileHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <Text style={s.userName}>{profile?.full_name || 'User'}</Text>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          </View>
          <Text style={s.userRole}>{profile?.role || 'Employee'}</Text>
          {profile?.department && (
            <Text style={s.userDept}>{profile.department}</Text>
          )}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={[s.menuCard, shadows.card]}>
            {section.map((item, iIdx) => (
              <Pressable
                key={iIdx}
                style={({ pressed }) => [
                  s.menuItem,
                  iIdx < section.length - 1 && s.menuItemBorder,
                  pressed && { backgroundColor: colors.surfaceHover },
                ]}
                onPress={item.onPress}
              >
                <View style={[s.menuIconWrap, item.color ? { backgroundColor: colors.dangerLight } : {}]}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color || colors.primary}
                  />
                </View>
                <Text style={[s.menuLabel, item.color ? { color: item.color } : {}]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        ))}

        {/* App Version */}
        <Text style={s.version}>21 Estates v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  profileHeader: {
    alignItems: 'center', paddingTop: 40, paddingBottom: 24,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    ...shadows.card,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  userRole: { fontSize: 13, fontWeight: '500', color: colors.primary, marginTop: 2 },
  userDept: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  menuCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    marginHorizontal: 16, marginTop: 16,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: {
    flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary,
  },

  version: {
    textAlign: 'center', fontSize: 11, color: colors.textMuted,
    marginTop: 24, marginBottom: 16,
  },
})
