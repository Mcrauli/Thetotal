import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useUserStore } from '../../../store/userStore'
import { useWorkoutStore } from '../../../store/workoutStore'

interface Workout {
  id: string
  name: string
  started_at: string
  finished_at: string
  total_volume_kg: number
}

export default function LogHistoryScreen() {
  const { profile } = useUserStore()
  const { startWorkout } = useWorkoutStore()
  const [workouts, setWorkouts] = useState<Workout[]>([])

  useEffect(() => {
    if (!profile) return
    supabase
      .from('workouts')
      .select('*')
      .eq('user_id', profile.id)
      .order('started_at', { ascending: false })
      .then(({ data }) => setWorkouts(data ?? []))
  }, [profile?.id])

  function handleStart() {
    startWorkout()
    router.push('/(tabs)/log/active')
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
  }

  function durationMinutes(start: string, end: string) {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-4 pt-6 pb-2 flex-row justify-between items-center">
        <Text className="text-white text-xl font-black">Workouts</Text>
        <TouchableOpacity className="bg-accent rounded-xl px-4 py-2" onPress={handleStart}>
          <Text className="text-white font-bold">+ Start</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-muted text-base">No workouts yet.</Text>
            <Text className="text-muted text-sm mt-1">Start your first workout!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-bold text-base">{item.name}</Text>
              <Text className="text-muted text-xs">{formatDate(item.started_at)}</Text>
            </View>
            <View className="flex-row gap-4 mt-1">
              <Text className="text-muted text-xs">
                {durationMinutes(item.started_at, item.finished_at)} min
              </Text>
              <Text className="text-muted text-xs">
                {Math.round(item.total_volume_kg).toLocaleString()} kg volume
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}
