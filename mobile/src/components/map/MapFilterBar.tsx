import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '@/theme/colors'

interface MapFilters {
  type: 'property' | 'project' | 'commercial' | 'all'
  city: string | 'all'
}

interface Props {
  filters: MapFilters
  cities: string[]
  onChange: (f: MapFilters) => void
  employeeCount: number
  showEmployees: boolean
  onToggleEmployees: () => void
}

const TYPE_OPTIONS: { key: MapFilters['type']; label: string; icon: any }[] = [
  { key: 'all',        label: 'All',        icon: 'apps-outline' },
  { key: 'property',   label: 'Residential', icon: 'home-outline' },
  { key: 'project',    label: 'Projects',   icon: 'business-outline' },
  { key: 'commercial', label: 'Commercial', icon: 'storefront-outline' },
]

export function MapFilterBar({
  filters, cities, onChange, employeeCount, showEmployees, onToggleEmployees,
}: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Pressable
          onPress={onToggleEmployees}
          style={[styles.pill, showEmployees && styles.pillActive]}
        >
          <Ionicons
            name="people-outline"
            size={14}
            color={showEmployees ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.pillText, showEmployees && styles.pillTextActive]}>
            Team ({employeeCount})
          </Text>
        </Pressable>

        {TYPE_OPTIONS.map(opt => (
          <Pressable
            key={opt.key}
            onPress={() => onChange({ ...filters, type: opt.key })}
            style={[styles.pill, filters.type === opt.key && styles.pillActive]}
          >
            <Ionicons
              name={opt.icon}
              size={14}
              color={filters.type === opt.key ? '#fff' : colors.textSecondary}
            />
            <Text style={[
              styles.pillText,
              filters.type === opt.key && styles.pillTextActive,
            ]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => onChange({ ...filters, city: 'all' })}
          style={[styles.pill, filters.city === 'all' && styles.pillActive]}
        >
          <Text style={[styles.pillText, filters.city === 'all' && styles.pillTextActive]}>
            All Cities
          </Text>
        </Pressable>
        {cities.map(city => (
          <Pressable
            key={city}
            onPress={() => onChange({ ...filters, city })}
            style={[styles.pill, filters.city === city && styles.pillActive]}
          >
            <Text style={[styles.pillText, filters.city === city && styles.pillTextActive]}>
              {city}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10,
  },
  scroll: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: '#fff' },
})
