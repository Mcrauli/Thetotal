import { useState } from 'react'
import { Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from '../../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Login failed', error.message)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: makeRedirectUri({ scheme: 'thetotal' }),
        skipBrowserRedirect: true,
      },
    })
    if (error || !data.url) { Alert.alert('Error', error?.message ?? 'Could not start sign-in'); return }
    const result = await WebBrowser.openAuthSessionAsync(data.url, makeRedirectUri({ scheme: 'thetotal' }))
    if (result.type === 'success') {
      const url = result.url
      const params = new URLSearchParams(url.split('#')[1] ?? url.split('?')[1] ?? '')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
      }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <Text className="text-white text-2xl font-black mb-8">Welcome back</Text>

        <Text className="text-muted text-xs mb-1 ml-1">EMAIL</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-4"
          placeholder="you@example.com"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="text-muted text-xs mb-1 ml-1">PASSWORD</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-8"
          placeholder="Password"
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
            {loading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full border border-card2 rounded-xl py-4 items-center mt-3"
          onPress={handleGoogleLogin}
        >
          <Text className="text-white font-semibold">Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
          <Text className="text-muted">← Back</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
