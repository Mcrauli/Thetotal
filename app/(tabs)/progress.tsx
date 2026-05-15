import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LineChart } from 'react-native-gifted-charts'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { COLORS } from '../../lib/constants'

interface PRRecord {
  exercise_name: string
  is_sbd: boolean
  weight_kg: number
  reps: number
  recorded_at: string
}

interface ChartPoint { value: number; label?: string }

const SBD_NAMES = ['Squat', 'Bench Press', 'Deadlift']

export default function ProgressScreen() {
  const { profile } = useUserStore()
  const [prs, setPRs] = useState<PRRecord[]>([])

  useEffect(() => {
    if (!profile) return
    supabase
      .from('personal_records')
      .select('weight_kg, reps, recorded_at, exercises(name, is_sbd)')
      .eq('user_id', profile.id)
      .order('recorded_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        setPRs((data as any[]).map(d => ({
          exercise_name: d.exercises.name,
          is_sbd: d.exercises.is_sbd,
          weight_kg: d.weight_kg,
          reps: d.reps,
          recorded_at: d.recorded_at,
        })))
      })
  }, [profile?.id])

  function prForExercise(name: string): PRRecord | undefined {
    return prs.filter(p => p.exercise_name === name).sort((a, b) =>
      new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    )[0]
  }

  const sbdChartData: ChartPoint[] = SBD_NAMES.map(name => ({
    value: prForExercise(name)?.weight_kg ?? 0,
    label: name.split(' ')[0],
  }))

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-white text-xl font-black mb-4">Progress</Text>

        <View className="bg-card rounded-2xl p-4 mb-6">
          <Text className="text-muted text-xs tracking-widest mb-4">SBD BEST LIFTS</Text>
          {sbdChartData.every(d => d.value === 0) ? (
            <Text className="text-muted text-center py-4">No lifts logged yet.</Text>
          ) : (
            <LineChart
              data={sbdChartData}
              width={260}
              height={120}
              color={COLORS.accent}
              dataPointsColor={COLORS.gold}
              xAxisLabelTextStyle={{ color: COLORS.muted, fontSize: 10 }}
              yAxisTextStyle={{ color: COLORS.muted, fontSize: 10 }}
              backgroundColor="transparent"
              rulesColor="#2a2a4a"
              yAxisColor="transparent"
              xAxisColor="#2a2a4a"
              hideDataPoints={false}
              curved
            />
          )}
        </View>

        <Text className="text-muted text-xs tracking-widest mb-3">PERSONAL RECORDS</Text>
        {prs.length === 0 ? (
          <View className="bg-card rounded-2xl p-6 items-center">
            <Text className="text-muted">No PRs yet. Log a workout to set some!</Text>
          </View>
        ) : (
          [...new Set(prs.map(p => p.exercise_name))].map(name => {
            const pr = prForExercise(name)!
            return (
              <View key={name} className="bg-card rounded-2xl px-4 py-3 mb-2 flex-row justify-between items-center">
                <Text className="text-white font-medium">{name}</Text>
                <Text className="text-gold font-bold">{pr.weight_kg}kg × {pr.reps}</Text>
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
