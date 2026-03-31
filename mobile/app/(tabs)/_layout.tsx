import { Tabs } from 'expo-router'
import { Platform, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface TabConfig {
  name: string
  title: string
  icon: IoniconsName
  iconFocused: IoniconsName
}

const TABS: TabConfig[] = [
  { name: 'index',  title: 'Home',       icon: 'home-outline',       iconFocused: 'home' },
  { name: 'hrms',   title: 'Attendance',  icon: 'calendar-outline',   iconFocused: 'calendar' },
  { name: 'crm',    title: 'CRM',         icon: 'clipboard-outline',  iconFocused: 'clipboard' },
  { name: 'map',    title: 'Map',         icon: 'map-outline',        iconFocused: 'map' },
  { name: 'cms',    title: 'Tasks',       icon: 'checkbox-outline',   iconFocused: 'checkbox' },
  { name: 'me',     title: 'Profile',     icon: 'layers-outline',     iconFocused: 'layers' },
]

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <View style={styles.iconWrap}>
                <Ionicons
                  name={focused ? tab.iconFocused : tab.icon}
                  size={24}
                  color={color}
                />
                {focused && <View style={styles.activeDot} />}
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBg,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 84 : 70,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 8,
    // Curved top edge
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
  },
  activeDot: {
    width: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.tabActive,
  },
})
