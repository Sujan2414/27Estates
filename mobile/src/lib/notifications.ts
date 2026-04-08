import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'

// Configure how notifications are presented when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * Request notification permissions and register for an Expo push token.
 * Saves the push token to the current employee's record in Supabase.
 * Returns the push token string, or null if permissions were denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // expo-notifications does not work in Expo Go simulators for remote push tokens,
  // but local notifications work fine. We proceed regardless.


  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission was denied.')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '21 Estates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9930A',
    })
  }

  let token: string | null = null
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync()
    token = tokenData.data
  } catch (err) {
    console.error('Failed to get push token:', err)
    return null
  }

  if (!token) return null

  // Save to Supabase employees table
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('employees')
        .update({ push_token: token })
        .eq('user_id', user.id)
    }
  } catch (err) {
    // Non-critical — token can be saved on next app launch
    console.warn('Could not save push token to Supabase:', err)
  }

  return token
}

/**
 * Schedule a local notification reminder for a follow-up call.
 */
export async function scheduleFollowUpReminder(
  leadName: string,
  leadId: string,
  followUpAt: Date
): Promise<void> {
  const now = new Date()
  if (followUpAt <= now) {
    // If the date is already past, schedule immediately (5 seconds from now)
    followUpAt = new Date(now.getTime() + 5000)
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📞 Follow-up Reminder',
      body: `Time to follow up with ${leadName}`,
      data: {
        leadId,
        type: 'follow_up',
      },
      sound: true,
    },
    trigger: {
      date: followUpAt,
    },
  })
}

/**
 * Cancel all currently scheduled local notifications.
 */
export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}
