import { View, Image, Text, StyleSheet } from 'react-native'
import { colors, radius, shadows } from '@/theme/colors'

interface EmployeeLocation {
  employee_id: string
  lat: number
  lng: number
  updated_at: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

interface Props {
  employee: EmployeeLocation
}

export function EmployeePin({ employee }: Props) {
  const initials = (employee.full_name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <View style={styles.wrapper}>
      <View style={styles.ring}>
        {employee.avatar_url ? (
          <Image
            source={{ uri: employee.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.fallback]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.triangle} />
      <View style={styles.label}>
        <Text style={styles.labelText} numberOfLines={1}>
          {employee.full_name?.split(' ')[0] ?? 'Employee'}
        </Text>
      </View>
    </View>
  )
}

const PIN_SIZE = 44

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ring: {
    width: PIN_SIZE + 4,
    height: PIN_SIZE + 4,
    borderRadius: (PIN_SIZE + 4) / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  avatar: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -1,
  },
  label: {
    marginTop: 3,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    ...shadows.xs,
    maxWidth: 90,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
})
