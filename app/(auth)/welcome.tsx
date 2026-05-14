import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gold text-5xl font-black tracking-widest mb-2">
          THE TOTAL
        </Text>
        <Text className="text-muted text-sm tracking-widest mb-16">
          TRACK LIFTS. EARN RANK. COMPETE.
        </Text>

        <TouchableOpacity
          className="w-full bg-accent rounded-xl py-4 items-center mb-4"
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text className="text-white font-bold text-base tracking-wider">
            GET STARTED
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full border border-card2 rounded-xl py-4 items-center"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-muted font-semibold text-base">
            Already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
