import { useState } from 'react'
import { Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useT } from '../../lib/i18n'

export default function LoginScreen() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert(t('auth.loginFailed'), error.message)
    setLoading(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <Text className="text-white text-2xl font-black mb-8">{t('auth.welcomeBack')}</Text>

        <Text className="text-muted text-xs mb-1 ml-1">{t('auth.email')}</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-4"
          placeholder="you@example.com"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="text-muted text-xs mb-1 ml-1">{t('auth.password')}</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-8"
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className={`bg-accent rounded-xl py-4 items-center ${loading ? 'opacity-50' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-bold text-base">
            {loading ? t('auth.loggingIn') : t('auth.logIn')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
          <Text className="text-muted">← {t('common.back')}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
