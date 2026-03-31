import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows } from '@/theme/colors'

interface PropertyPinData {
  id: string
  type: 'property' | 'project' | 'commercial'
  title: string
  price: number | null
  min_price: string | null
  [key: string]: any
}

interface Props {
  pin: PropertyPinData
  onPress: (pin: PropertyPinData) => void
  selected?: boolean
}

const PIN_CONFIG = {
  property:   { icon: 'home' as const,       color: colors.primary,  bg: colors.primaryLight },
  project:    { icon: 'business' as const,   color: '#7C3AED',       bg: '#F5F3FF' },
  commercial: { icon: 'storefront' as const, color: colors.gold,     bg: colors.goldLight },
}

function formatPriceShort(pin: PropertyPinData): string {
  const p = pin.price
  if (!p && !pin.min_price) return 'On Request'
  if (pin.min_price) return `${pin.min_price}`
  if (!p) return 'On Request'
  if (p >= 10_000_000) return `₹${(p / 10_000_000).toFixed(1)}Cr`
  if (p >= 100_000)    return `₹${(p / 100_000).toFixed(0)}L`
  return `₹${p.toLocaleString('en-IN')}`
}

export function PropertyPin({ pin, onPress, selected = false }: Props) {
  const cfg = PIN_CONFIG[pin.type]

  return (
    <Pressable onPress={() => onPress(pin)} style={styles.wrapper}>
      <View style={[
        styles.bubble,
        { backgroundColor: selected ? cfg.color : colors.surface },
        selected && styles.bubbleSelected,
        shadows.card,
      ]}>
        <Ionicons
          name={cfg.icon}
          size={14}
          color={selected ? '#fff' : cfg.color}
        />
        <Text style={[
          styles.priceText,
          { color: selected ? '#fff' : colors.textPrimary },
        ]}>
          {formatPriceShort(pin)}
        </Text>
      </View>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleSelected: {
    borderColor: 'transparent',
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
})
