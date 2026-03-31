import {
  View, Text, StyleSheet, ScrollView, Image,
  Pressable, Share, Dimensions,
} from 'react-native'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useMemo, useRef, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, type as t } from '@/theme/colors'

const { width: SCREEN_W } = Dimensions.get('window')

interface PropertyPinData {
  id: string
  type: 'property' | 'project' | 'commercial'
  title: string
  location: string | null
  city: string | null
  lat: number
  lng: number
  images: string[] | null
  price_text: string | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  sqft: number | null
  property_type: string | null
  category: string | null
  bhk_options: string[] | null
  min_price: string | null
  max_price: string | null
  [key: string]: any
}

interface Props {
  pin: PropertyPinData | null
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  property:   'Residential',
  project:    'Project',
  commercial: 'Commercial',
}

function formatFullPrice(pin: PropertyPinData): string {
  if (pin.price_text) return pin.price_text
  if (pin.min_price && pin.max_price) return `${pin.min_price} – ${pin.max_price}`
  if (pin.min_price) return `From ${pin.min_price}`
  const p = pin.price
  if (!p) return 'Price on Request'
  if (p >= 10_000_000) return `₹ ${(p / 10_000_000).toFixed(2)} Cr`
  if (p >= 100_000)    return `₹ ${(p / 100_000).toFixed(2)} L`
  return `₹ ${p.toLocaleString('en-IN')}`
}

async function sharePin(pin: PropertyPinData) {
  const price = formatFullPrice(pin)
  const message =
    `🏠 *${pin.title}*\n` +
    `📍 ${pin.location ?? pin.city ?? 'Location TBD'}\n` +
    `💰 ${price}\n` +
    (pin.bhk_options?.length ? `🛏 ${pin.bhk_options.join(', ')} BHK\n` : '') +
    (pin.bedrooms ? `🛏 ${pin.bedrooms} BHK  🚿 ${pin.bathrooms} Bath  📐 ${pin.sqft} sqft\n` : '') +
    `\n21 Estates — Contact us for a site visit.`
  await Share.share({ message })
}

export function PropertySheet({ pin, onClose }: Props) {
  const snapPoints = useMemo(() => ['45%', '85%'], [])
  const bottomSheetRef = useRef<BottomSheet>(null)

  useEffect(() => {
    if (pin) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [pin])

  if (!pin) return null

  const coverImage = pin.images?.[0] ?? null
  const typeLabel  = TYPE_LABEL[pin.type] ?? pin.type

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {coverImage && (
          <Image source={{ uri: coverImage }} style={styles.cover} />
        )}

        <View style={styles.header}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={[t.h2, { color: colors.textPrimary, marginTop: 8 }]}>
          {pin.title}
        </Text>
        {(pin.location || pin.city) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={[t.sm, { color: colors.textSecondary }]}>
              {[pin.location, pin.city].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        <Text style={styles.price}>{formatFullPrice(pin)}</Text>

        {(pin.bedrooms || pin.sqft || pin.bhk_options?.length) && (
          <View style={styles.statsRow}>
            {pin.bedrooms ? <StatChip icon="bed-outline" label={`${pin.bedrooms} BHK`} /> : null}
            {pin.bathrooms ? <StatChip icon="water-outline" label={`${pin.bathrooms} Bath`} /> : null}
            {pin.sqft ? <StatChip icon="expand-outline" label={`${pin.sqft} sqft`} /> : null}
            {pin.bhk_options?.map(b => (
              <StatChip key={b} icon="bed-outline" label={`${b} BHK`} />
            ))}
          </View>
        )}

        {pin.property_type && (
          <Text style={[t.sm, { color: colors.textMuted, marginTop: 8 }]}>
            {pin.property_type} · {pin.category}
          </Text>
        )}

        {(pin.images?.length ?? 0) > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {pin.images!.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.thumb} />
            ))}
          </ScrollView>
        )}

        <View style={styles.ctaRow}>
          <Pressable
            style={[styles.ctaBtn, styles.primaryBtn]}
            onPress={() => sharePin(pin)}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Share Brochure</Text>
          </Pressable>

          <Pressable style={[styles.ctaBtn, styles.secondaryBtn]}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>Contact</Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

function StatChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={colors.textSecondary} />
      <Text style={[t.sm, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.surface, borderRadius: 24 },
  handle:  { backgroundColor: colors.border, width: 40 },
  content: { padding: 20, paddingBottom: 48 },
  cover: {
    width: '100%', height: 200,
    borderRadius: radius.xl, marginBottom: 12,
    backgroundColor: colors.surfaceAlt,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  price: {
    fontSize: 22, fontWeight: '700', color: colors.primary, marginTop: 10,
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  gallery: { gap: 8, paddingVertical: 12 },
  thumb: { width: 100, height: 70, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  ctaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: radius.xl,
  },
  primaryBtn: { backgroundColor: colors.primary },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryBtn: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  secondaryBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
})
