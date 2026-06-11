import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useT } from '../../lib/i18n'

export default function WelcomeScreen() {
  const t = useT()
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gold text-5xl font-black tracking-widest mb-2">
          THE TOTAL
        </Text>
        <Text className="text-muted text-sm tracking-widest mb-16">
          {t('auth.tagline')}
        </Text>

        <TouchableOpacity
          className="w-full bg-accent rounded-xl py-4 items-center mb-4"
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text className="text-white font-bold text-base tracking-wider">
            {t('auth.getStarted')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full border border-card2 rounded-xl py-4 items-center"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-muted font-semibold text-base">
            {t('auth.haveAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
