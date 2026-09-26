import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { acceptInvite, inviteOwner, rememberInvite } from '../../lib/invite'
import { showAlert } from '../../lib/alert'
import { useT } from '../../lib/i18n'
import { COLORS } from '../../lib/constants'

export default function InviteScreen() {
  const t = useT()
  const { code } = useLocalSearchParams<{ code: string }>()
  const [inviter, setInviter] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'invalid' | 'guest'>('loading')

  useEffect(() => {
    if (!code) { setState('invalid'); return }
    let active = true
    ;(async () => {
      const owner = await inviteOwner(code)
      if (!active) return
      if (!owner) { setState('invalid'); return }
      setInviter(owner)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const name = await acceptInvite(code)
        if (!active) return
        if (name) showAlert(t('invite.acceptedTitle'), t('invite.acceptedBody', { name }))
        router.replace('/(tabs)/social')
        return
      }
      await rememberInvite(code)
      if (active) setState('guest')
    })()
    return () => { active = false }
  }, [code])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: COLORS.gold, fontSize: 40, fontWeight: '900', letterSpacing: 6, marginBottom: 24 }}>THE TOTAL</Text>
        {state === 'loading' && <ActivityIndicator color={COLORS.accent} />}
        {state === 'invalid' && (
          <>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 24 }}>{t('invite.invalid')}</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/welcome')}
              style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, borderRadius: 14, backgroundColor: COLORS.accent }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('invite.continue')}</Text>
            </TouchableOpacity>
          </>
        )}
        {state === 'guest' && (
          <>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
              {t('invite.title', { name: inviter ?? '' })}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
              {t('invite.body')}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/signup')}
              style={{ alignSelf: 'stretch', minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: COLORS.accent }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 1 }}>{t('invite.signup')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              style={{ alignSelf: 'stretch', minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: COLORS.cardEdge }}
            >
              <Text style={{ color: COLORS.muted, fontWeight: '700' }}>{t('invite.login')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}
