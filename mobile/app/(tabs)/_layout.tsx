import { useState } from 'react'
import { Tabs } from 'expo-router'
import {
  Platform, Pressable, StyleSheet, View, Text,
  type LayoutChangeEvent,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { MoreMenu } from '@/components/ui/MoreMenu'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

// Visible tabs: 2 left + 2 right
const VISIBLE_TABS: { name: string; title: string; icon: IoniconsName; iconFocused: IoniconsName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { name: 'cms', title: 'Tasks', icon: 'document-text-outline', iconFocused: 'document-text' },
  // gap for center button
  { name: 'map', title: 'Map', icon: 'map-outline', iconFocused: 'map' },
  { name: 'me', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
]

// Hidden tabs — still routable but not shown in tab bar
const HIDDEN_TABS = ['hrms', 'crm']

function CustomTabBar({ state, descriptors, navigation }: any) {
  const [moreVisible, setMoreVisible] = useState(false)
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8)

  // Filter to only visible tabs
  const visibleRoutes = state.routes.filter((r: any) =>
    VISIBLE_TABS.some(t => t.name === r.name)
  )

  // Split into left 2 and right 2
  const leftRoutes = visibleRoutes.slice(0, 2)
  const rightRoutes = visibleRoutes.slice(2, 4)

  const renderTab = (route: any) => {
    const tabConfig = VISIBLE_TABS.find(t => t.name === route.name)
    if (!tabConfig) return null

    const routeIndex = state.routes.findIndex((r: any) => r.key === route.key)
    const isFocused = state.index === routeIndex
    const color = isFocused ? colors.tabActive : colors.tabInactive

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      })
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name)
      }
    }

    return (
      <Pressable
        key={route.key}
        style={styles.tab}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={tabConfig.title}
      >
        <View style={styles.tabInner}>
          <Ionicons
            name={isFocused ? tabConfig.iconFocused : tabConfig.icon}
            size={22}
            color={color}
          />
          {isFocused && <View style={styles.activeDot} />}
        </View>
        <Text style={[styles.tabLabel, { color }]}>{tabConfig.title}</Text>
      </Pressable>
    )
  }

  return (
    <>
      <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
        {/* Left 2 tabs */}
        <View style={styles.tabGroup}>
          {leftRoutes.map(renderTab)}
        </View>

        {/* Center spacer for the floating button */}
        <View style={styles.centerSpacer} />

        {/* Right 2 tabs */}
        <View style={styles.tabGroup}>
          {rightRoutes.map(renderTab)}
        </View>
      </View>

      {/* Floating Center More Button — sits above the tab bar */}
      <Pressable
        style={({ pressed }) => [
          styles.centerBtnOuter,
          { bottom: bottomPad + 28 },
          pressed && { transform: [{ scale: 0.9 }] },
        ]}
        onPress={() => setMoreVisible(true)}
      >
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerBtn}
        >
          <Ionicons name="grid" size={26} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* More Menu */}
      <MoreMenu visible={moreVisible} onClose={() => setMoreVisible(false)} />
    </>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Visible tabs */}
      {VISIBLE_TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        />
      ))}

      {/* Hidden tabs — routable via push, not shown in bar */}
      {HIDDEN_TABS.map(name => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null }}
        />
      ))}
    </Tabs>
  )
}

const CENTER_SIZE = 64

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.tabBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 56,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tabActive,
  },
  centerSpacer: {
    width: CENTER_SIZE + 8,
  },
  centerBtnOuter: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -CENTER_SIZE / 2,
    zIndex: 100,
  },
  centerBtn: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
})
