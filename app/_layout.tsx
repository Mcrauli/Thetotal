import '../global.css'
import { useEffect } from 'react'
import { Slot, router, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/userStore'
import { useLocaleStore } from '../lib/i18n'

async function registerPushToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '1e036675-e8c7-4700-895f-6d5f9de84d16',
    })).data
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('users').update({ push_token: token }).eq('id', session.user.id)
    }
  } catch {
  }
}

function useAuthGuard() {
  const segments = useSegments()
  const { fetchProfile } = useUserStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const inAuth = segments[0] === '(auth)'
      if (session) {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!existingProfile) {
          const fallbackUsername = session.user.email?.split('@')[0] ?? `user_${Date.now()}`
          await supabase.from('users').insert({
            id: session.user.id,
            username: fallbackUsername,
          })
        }
        const profile = await fetchProfile()
        registerPushToken()
        if (inAuth) {
          if (segments[1] === 'tutorial') return
          if (profile?.onboarded) router.replace('/(tabs)/')
          else router.replace('/(auth)/onboarding')
        }
      } else {
        if (!inAuth) router.replace('/(auth)/welcome')
      }
    })
    return () => subscription.unsubscribe()
  }, [segments])
}

export default function RootLayout() {
  useAuthGuard()
  useEffect(() => { useLocaleStore.getState().hydrate() }, [])
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  )
}
