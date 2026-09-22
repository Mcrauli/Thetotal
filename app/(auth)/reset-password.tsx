import { useEffect, useState } from 'react'
import { Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showAlert } from '../../lib/alert'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useT } from '../../lib/i18n'

type Status = 'checking' | 'invalid' | 'ready'

async function resolveSessionFromUrl(): Promise<boolean> {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashParams = new URLSearchParams(hash)
  const errorDescription = hashParams.get('error_description')
  if (errorDescription) return false

  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    window.history.replaceState(null, '', window.location.pathname)
    return !error
  }

  const searchParams = new URLSearchParams(window.location.search)
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    window.history.replaceState(null, '', window.location.pathname)
    return !error
  }

  const { data: { session } } = await supabase.auth.getSession()
  return Boolean(session)
}

function ResetPasswordWeb() {
  const t = useT()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    resolveSessionFromUrl().then(ok => setStatus(ok ? 'ready' : 'invalid'))
  }, [])

  async function handleSubmit() {
    if (password.length < 6) {
      showAlert(t('common.error'), t('auth.minChars'))
      return
    }
    if (password !== confirmPassword) {
      showAlert(t('common.error'), t('auth.resetPasswordsNoMatch'))
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      showAlert(t('common.error'), error.message)
      return
    }
    showAlert(t('auth.resetSuccess'))
    router.replace('/(tabs)/')
  }

  if (status === 'checking') {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <KeyboardAvoidingView className="flex-1 px-6 justify-center" />
      </SafeAreaView>
    )
  }

  if (status === 'invalid') {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <KeyboardAvoidingView className="flex-1 px-6 justify-center">
          <Text className="text-white text-2xl font-black mb-4">{t('auth.resetPassword')}</Text>
          <Text className="text-muted text-base mb-8">{t('auth.resetLinkInvalid')}</Text>
          <TouchableOpacity
            className="bg-accent rounded-xl py-4 items-center"
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            <Text className="text-white font-bold text-base">{t('auth.resetRequestNew')}</Text>
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

        <Text className="text-muted text-xs mb-1 ml-1">{t('auth.resetNewPassword')}</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-4"
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text className="text-muted text-xs mb-1 ml-1">{t('auth.resetConfirmPassword')}</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-8"
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className={`bg-accent rounded-xl py-4 items-center ${submitting ? 'opacity-50' : ''}`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text className="text-white font-bold text-base">
            {submitting ? t('auth.resetSubmitting') : t('auth.resetSubmit')}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function ResetPasswordNative() {
  const t = useT()
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView className="flex-1 px-6 justify-center">
        <Text className="text-white text-2xl font-black mb-4">{t('auth.resetPassword')}</Text>
        <Text className="text-muted text-base">{t('auth.resetOnNative')}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default function ResetPasswordScreen() {
  return Platform.OS === 'web' ? <ResetPasswordWeb /> : <ResetPasswordNative />
}
