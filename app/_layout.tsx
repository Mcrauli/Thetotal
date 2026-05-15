import '../global.css'
import { useEffect } from 'react'
import { Slot, router, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/userStore'

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
        await fetchProfile()
        if (inAuth) router.replace('/(tabs)/')
      } else {
        if (!inAuth) router.replace('/(auth)/welcome')
      }
    })
    return () => subscription.unsubscribe()
  }, [segments])
}

export default function RootLayout() {
  useAuthGuard()
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  )
}
