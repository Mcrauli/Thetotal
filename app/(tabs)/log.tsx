import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function LogScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted">Log — coming soon</Text>
      </View>
    </SafeAreaView>
  )
}
