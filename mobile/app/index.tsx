import { Redirect } from 'expo-router'

export default function Index() {
  // Default entry — _layout.tsx will redirect to (tabs) or (auth)/onboarding
  // based on auth state. Show onboarding by default (safest fallback).
  return <Redirect href="/(auth)/onboarding" />
}
