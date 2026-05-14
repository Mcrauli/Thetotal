import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Fill in all fields')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { Alert.alert('Error', error.message); setLoading(false); return }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({ id: data.user.id, username: username.trim().toLowerCase() })
      if (profileError) { Alert.alert('Error', profileError.message); setLoading(false); return }
    }
    setLoading(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <Text className="text-white text-2xl font-black mb-8">Create Account</Text>

        <Text className="text-muted text-xs mb-1 ml-1">USERNAME</Text>
        <TextInput
          className="bg-card rounded-xl px-4 py-3 text-white mb-4"
          placeholder="mikko_lifts"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

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
          placeholder="Min. 6 characters"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className={`bg-accent rounded-xl py-4 items-center ${loading ? 'opacity-50' : ''}`}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text className="text-white font-bold text-base">
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
          <Text className="text-muted">← Back</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
