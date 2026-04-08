import { View, Text, StyleSheet } from 'react-native'
import { colors, radius } from '@/theme/colors'

type Temperature = 'hot' | 'warm' | 'cold' | 'dead'

const CONFIG: Record<Temperature, { label: string; bg: string; text: string }> = {
  hot:  { label: 'HOT',  bg: colors.hotBg,  text: colors.hot },
  warm: { label: 'WARM', bg: colors.warmBg, text: colors.warm },
  cold: { label: 'COLD', bg: colors.coldBg, text: colors.cold },
  dead: { label: 'DEAD', bg: colors.deadBg, text: colors.dead },
}

export function TemperaturePill({ temperature, size = 'sm' }: { temperature: Temperature; size?: 'sm' | 'md' }) {
  const c = CONFIG[temperature] ?? CONFIG.cold
  return (
    <View style={[s.pill, { backgroundColor: c.bg }, size === 'md' && s.pillMd]}>
      <View style={[s.dot, { backgroundColor: c.text }]} />
      <Text style={[s.label, { color: c.text }, size === 'md' && s.labelMd]}>{c.label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  pill:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
  pillMd: { paddingHorizontal: 12, paddingVertical: 5 },
  dot:    { width: 5, height: 5, borderRadius: 3 },
  label:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  labelMd:{ fontSize: 12 },
})
