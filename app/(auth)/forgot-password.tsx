import { useState } from 'react'
import { Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showAlert } from '../../lib/alert'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useT } from '../../lib/i18n'

export default function ForgotPasswordScreen() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://thetotal.vercel.app/reset-password',
    })
    setLoading(false)
    if (error) {
      showAlert(t('common.error'), error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <KeyboardAvoidingView className="flex-1 px-6 justify-center">
          <Text className="text-white text-2xl font-black mb-4">{t('auth.resetPassword')}</Text>
          <Text className="text-muted text-base mb-8">{t('auth.resetSent')}</Text>
          <TouchableOpacity className="items-center py-2" onPress={() => router.back()}>
            <Text className="text-muted">← {t('common.back')}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <Text className="text-white text-2xl font-black mb-8">{t('auth.resetPassword')}</Text>

        <Text className="text-muted text-xs mb-1 ml-1">{t('auth.email')}</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-8"
          placeholder="you@example.com"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          className={`bg-accent rounded-xl py-4 items-center ${loading ? 'opacity-50' : ''}`}
          onPress={handleSend}
          disabled={loading}
        >
          <Text className="text-white font-bold text-base">
            {loading ? t('auth.resetSending') : t('auth.resetSendLink')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
          <Text className="text-muted">← {t('common.back')}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
