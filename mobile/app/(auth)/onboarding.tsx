import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { haptic } from '@/lib/haptics'
import { colors, radius, shadows, type as t } from '@/theme/colors'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

const PAGES = [
  {
    title: 'Welcome to Workmate!',
    subtitle:
      'Make Smart Decisions! Set clear timelines for projects and celebrate your achievements!',
  },
  {
    title: 'Manage Stress Effectively',
    subtitle:
      'Stay Balanced! Track your workload and maintain a healthy stress level with ease.',
  },
  {
    title: 'Plan for Success',
    subtitle:
      'Your Journey Starts Here! Earn achievement badges as you conquer your tasks. Let\'s get started!',
  },
  {
    title: 'Navigate Your Work Journey Efficient & Easy',
    subtitle:
      'Increase your work management & career development radically',
  },
]

/* ───── Floating card components ───── */

function MeetingCard({ animY, animO }: { animY: Animated.Value; animO: Animated.Value }) {
  return (
    <Animated.View
      style={[
        s.floatingCard,
        { transform: [{ rotate: '-8deg' }, { translateY: animY }], opacity: animO },
      ]}
    >
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 8 }]}>Today Meeting</Text>
      {[
        { time: '09:00', label: 'Standup with Team', color: colors.primary100 },
        { time: '11:30', label: 'Client Site Visit', color: colors.warningLight },
        { time: '14:00', label: 'Design Review', color: colors.infoLight },
      ].map((m, i) => (
        <View key={i} style={[s.meetingRow, { backgroundColor: m.color }]}>
          <Text style={[t.xs, { color: colors.textSecondary }]}>{m.time}</Text>
          <Text style={[t.labelSm, { color: colors.textPrimary, marginLeft: 8, flex: 1 }]}>{m.label}</Text>
          <View style={s.avatar} />
        </View>
      ))}
    </Animated.View>
  )
}

function ChartCard({ animY, animO }: { animY: Animated.Value; animO: Animated.Value }) {
  const bars = [60, 85, 45, 70, 90, 55, 75]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <Animated.View
      style={[
        s.floatingCard,
        { transform: [{ rotate: '5deg' }, { translateY: animY }], opacity: animO },
      ]}
    >
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 10 }]}>Working Period</Text>
      <View style={s.chartRow}>
        {bars.map((h, i) => (
          <View key={i} style={s.chartCol}>
            <View style={[s.chartBar, { height: h * 0.6, backgroundColor: i === 4 ? colors.primary : colors.primary200 }]} />
            <Text style={[t.tiny, { color: colors.textMuted, marginTop: 4 }]}>{days[i]}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  )
}

function AchievementCard({ animY, animO }: { animY: Animated.Value; animO: Animated.Value }) {
  return (
    <Animated.View
      style={[
        s.floatingCard,
        { transform: [{ rotate: '-4deg' }, { translateY: animY }], opacity: animO },
      ]}
    >
      <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 8 }]}>Achievements</Text>
      {[
        { icon: 'trophy' as const, label: 'Top Performer', pct: 92 },
        { icon: 'flame' as const, label: '7-Day Streak', pct: 100 },
        { icon: 'star' as const, label: 'Task Master', pct: 68 },
      ].map((a, i) => (
        <View key={i} style={s.achieveRow}>
          <View style={[s.achieveIcon, { backgroundColor: i === 1 ? colors.warningLight : colors.primaryLight }]}>
            <Ionicons name={a.icon} size={14} color={i === 1 ? colors.warning : colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[t.labelSm, { color: colors.textPrimary }]}>{a.label}</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${a.pct}%` }]} />
            </View>
          </View>
          <Text style={[t.tiny, { color: colors.textSecondary }]}>{a.pct}%</Text>
        </View>
      ))}
    </Animated.View>
  )
}

function CombinedCards({ animY, animO }: { animY: Animated.Value; animO: Animated.Value }) {
  return (
    <Animated.View style={[{ alignItems: 'center', opacity: animO, transform: [{ translateY: animY }] }]}>
      <View style={[s.floatingCard, { transform: [{ rotate: '-6deg' }], marginBottom: -30, zIndex: 2 }]}>
        <Text style={[t.labelMd, { color: colors.textPrimary, marginBottom: 6 }]}>My Tasks</Text>
        {[
          { label: 'Follow up with buyer', status: 'In Progress', statusColor: colors.info },
          { label: 'Schedule site visit', status: 'Pending', statusColor: colors.warning },
        ].map((tk, i) => (
          <View key={i} style={s.taskRow}>
            <View style={[s.taskDot, { backgroundColor: tk.statusColor }]} />
            <Text style={[t.labelSm, { color: colors.textPrimary, flex: 1 }]}>{tk.label}</Text>
            <View style={[s.statusPill, { backgroundColor: tk.statusColor + '18' }]}>
              <Text style={[t.tiny, { color: tk.statusColor }]}>{tk.status}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={[s.floatingCard, { transform: [{ rotate: '4deg' }], zIndex: 1 }]}>
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={[t.headlineSm, { color: colors.primary }]}>24</Text>
            <Text style={[t.tiny, { color: colors.textMuted }]}>Leads</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[t.headlineSm, { color: colors.success }]}>8</Text>
            <Text style={[t.tiny, { color: colors.textMuted }]}>Visits</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[t.headlineSm, { color: colors.warning }]}>3</Text>
            <Text style={[t.tiny, { color: colors.textMuted }]}>Closings</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

/* ───── Main Component ───── */

export default function OnboardingScreen() {
  const flatRef = useRef<FlatList>(null)
  const [currentPage, setCurrentPage] = useState(0)

  // One animation pair per page
  const anims = useRef(
    PAGES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(40),
    })),
  ).current

  const animateIn = useCallback(
    (index: number) => {
      const a = anims[index]
      a.opacity.setValue(0)
      a.translateY.setValue(40)
      Animated.parallel([
        Animated.timing(a.opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(a.translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start()
    },
    [anims],
  )

  useEffect(() => {
    animateIn(0)
  }, [animateIn])

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      const idx = viewableItems[0].index
      setCurrentPage(idx)
      animateIn(idx)
    }
  })

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 })

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_W,
      offset: SCREEN_W * index,
      index,
    }),
    [],
  )

  const goTo = (index: number) => {
    if (index < 0 || index >= PAGES.length) return
    haptic.light()
    flatRef.current?.scrollToIndex({ index, animated: true })
  }

  const cardForPage = (index: number) => {
    const a = anims[index]
    switch (index) {
      case 0:
        return <MeetingCard animY={a.translateY} animO={a.opacity} />
      case 1:
        return <ChartCard animY={a.translateY} animO={a.opacity} />
      case 2:
        return <AchievementCard animY={a.translateY} animO={a.opacity} />
      case 3:
        return <CombinedCards animY={a.translateY} animO={a.opacity} />
      default:
        return null
    }
  }

  const renderItem = ({ item, index }: { item: (typeof PAGES)[0]; index: number }) => (
    <View style={s.page}>
      {/* Gradient blob */}
      <LinearGradient
        colors={[colors.gradientFrom, '#FFFFFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={s.gradientBlob}
      />

      {/* Floating cards */}
      <View style={s.cardZone}>{cardForPage(index)}</View>

      {/* Text content */}
      <View style={s.textZone}>
        <Text style={[t.headlineSm, { color: colors.textPrimary, textAlign: 'center', marginBottom: 12 }]}>
          {item.title}
        </Text>
        <Text style={[t.sm, { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  )

  const isLastPage = currentPage === 3

  return (
    <View style={s.container}>
      <FlatList
        ref={flatRef}
        data={PAGES}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        getItemLayout={getItemLayout}
        bounces={false}
      />

      {/* Page dots */}
      <View style={s.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              s.dot,
              { backgroundColor: currentPage >= i && currentPage < 3 ? colors.primary500 : colors.primary100 },
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={s.btnRow}>
        {isLastPage ? (
          <>
            <Pressable
              onPress={() => {
                haptic.light()
                router.push('/(auth)/login')
              }}
              style={({ pressed }) => [s.btnGradientWrap, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.btnGradient}
              >
                <Text style={s.btnGradientText}>Sign In</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                haptic.light()
                router.push('/(auth)/signup')
              }}
              style={({ pressed }) => [s.btnOutline, pressed && { opacity: 0.7 }]}
            >
              <Text style={s.btnOutlineText}>Sign Up</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => goTo(currentPage + 1)}
              style={({ pressed }) => [s.btnGradientWrap, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.btnGradient}
              >
                <Text style={s.btnGradientText}>Next</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => goTo(3)}
              style={({ pressed }) => [s.btnOutline, pressed && { opacity: 0.7 }]}
            >
              <Text style={s.btnOutlineText}>Skip</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { width: SCREEN_W, flex: 1 },
  gradientBlob: {
    position: 'absolute',
    top: -60,
    left: SCREEN_W / 2 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.35,
  },
  cardZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  floatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    padding: 12,
    width: SCREEN_W - 100,
    ...shadows.onboard,
  },
  textZone: { paddingHorizontal: 36, paddingBottom: 8 },

  /* meeting card */
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xs,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary200,
  },

  /* chart card */
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBar: { width: 14, borderRadius: 4 },

  /* achievement card */
  achieveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  achieveIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },

  /* combined */
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  taskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
  statBox: { alignItems: 'center' },

  /* dots */
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 2, marginBottom: 16 },
  dot: { width: 20, height: 4, borderRadius: 2 },

  /* buttons */
  btnRow: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  btnGradientWrap: { borderRadius: radius.pill, overflow: 'hidden' },
  btnGradient: {
    height: 48,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGradientText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  btnOutline: {
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
})
