import { useEffect } from 'react'
import { router, Slot } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { supabase } from '@/lib/supabase'

export default function RootLayout() {
  useEffect(() => {
    let cancelled = false

    // Simple auth check with timeout — avoids Supabase lock hangs
    const timer = setTimeout(() => {
      if (!cancelled) {
        // If auth takes more than 2s, just go to onboarding
        router.replace('/(auth)/onboarding')
      }
    }, 2000)

    supabase.auth.getSession().then(({ data, error }) => {
      clearTimeout(timer)
      if (cancelled) return
      if (data?.session && !error) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(auth)/onboarding')
      }
    }).catch(() => {
      clearTimeout(timer)
      if (!cancelled) router.replace('/(auth)/onboarding')
    })

    // Listen for future sign-in / sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return
        if (event === 'SIGNED_IN' && session) router.replace('/(tabs)')
        else if (event === 'SIGNED_OUT') router.replace('/(auth)/onboarding')
      },
    )

    return () => {
      cancelled = true
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  )
}
