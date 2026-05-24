import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { ScreenBackground } from '../../components/ui/ScreenBackground'
import { WorkoutDetailModal } from '../../components/workout/WorkoutDetailModal'
import { COLORS } from '../../lib/constants'

interface Workout {
  id: string
  name: string
  started_at: string
  finished_at: string
  total_volume_kg: number
  exerciseNames?: string[]
}

interface Template {
  id: string
  name: string
  exercises: { exerciseId: string; exerciseName: string; muscleGroup?: string }[]
}

export default function LogScreen() {
  const { profile } = useUserStore()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

  useFocusEffect(useCallback(() => {
    if (!profile) return
    loadData(profile.id)
  }, [profile?.id]))

  async function loadData(userId: string) {
    const [{ data: wData }, { data: tData }] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(10),
      supabase.from('workout_templates')
        .select('id, name, template_exercises(exercise_id, order_index, exercises(name, muscle_group))')
        .eq('user_id', userId)
        .order('created_at'),
    ])

    const workoutsList = (wData ?? []) as Workout[]
    if (workoutsList.length > 0) {
      const wIds = workoutsList.map(w => w.id)
      const { data: setRows } = await supabase
        .from('workout_sets')
        .select('workout_id, set_number, exercises(name)')
        .in('workout_id', wIds)
        .order('set_number')
      const namesByWorkout: Record<string, string[]> = {}
      for (const row of (setRows ?? []) as any[]) {
        const name = row.exercises?.name
        if (!name) continue
        if (!namesByWorkout[row.workout_id]) namesByWorkout[row.workout_id] = []
        if (!namesByWorkout[row.workout_id].includes(name)) namesByWorkout[row.workout_id].push(name)
      }
      for (const w of workoutsList) {
        w.exerciseNames = namesByWorkout[w.id] ?? []
      }
    }
    setWorkouts(workoutsList)
    setTemplates((tData ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      exercises: (t.template_exercises ?? [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((te: any) => ({ exerciseId: te.exercise_id, exerciseName: te.exercises?.name ?? '', muscleGroup: te.exercises?.muscle_group })),
    })))
  }

  async function deleteTemplate(id: string) {
    await supabase.from('workout_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return 'Tänään'
    if (diffDays === 1) return 'Eilen'
    return d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
  }

  function durationMinutes(start: string, end: string) {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  }

  return (
    <ScreenBackground variant="log">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>

          {/* Ohjelmat */}
          <View className="px-4 pt-6 pb-3 flex-row justify-between items-center">
            <Text className="text-white text-xl font-black">Ohjelmat</Text>
            <TouchableOpacity
              className="flex-row items-center gap-1.5"
              onPress={() => router.push('/(tabs)/create-template')}
            >
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: COLORS.accentDim,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="add" size={16} color={COLORS.accent} />
              </View>
              <Text className="text-accent text-sm font-bold">Luo</Text>
            </TouchableOpacity>
          </View>

          {templates.length === 0 ? (
            <TouchableOpacity
              className="mx-4 mb-6 rounded-2xl py-8 items-center"
              style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.cardEdge }}
              onPress={() => router.push('/(tabs)/create-template')}
            >
              <Ionicons name="barbell-outline" size={28} color={COLORS.muted} />
              <Text className="text-muted text-sm mt-2">Luo ensimmäinen ohjelmasi</Text>
            </TouchableOpacity>
          ) : (
            <View className="px-4 mb-6" style={{ gap: 10 }}>
              {templates.map(t => (
                <View
                  key={t.id}
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 14,
                    overflow: 'hidden',
                    flexDirection: 'row',
                  }}
                >
                  <View style={{ width: 3, backgroundColor: COLORS.accent }} />
                  <View style={{ padding: 14, flex: 1 }}>
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-white font-black text-base flex-1" numberOfLines={1}>
                        {t.name}
                      </Text>
                      <TouchableOpacity onPress={() => deleteTemplate(t.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.muted} />
                      </TouchableOpacity>
                    </View>

                    {t.exercises.length === 0 ? (
                      <Text className="text-muted text-xs">Ei liikkeitä</Text>
                    ) : (
                      <Text className="text-muted text-xs" numberOfLines={2}>
                        {t.exercises.map(e => e.exerciseName).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Historia */}
          <View className="px-4 mb-3">
            <Text className="text-white text-xl font-black">Viimeisimmät treenit</Text>
          </View>

          {workouts.length === 0 ? (
            <View className="mx-4 items-center py-10">
              <Ionicons name="calendar-outline" size={32} color={COLORS.muted} />
              <Text className="text-muted text-sm mt-2">Ei vielä treenejä.</Text>
            </View>
          ) : (
            <View className="px-4">
              {workouts.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedWorkout(item)}
                  className="flex-row py-3.5"
                  style={i < workouts.length - 1 ? { borderBottomWidth: 1, borderBottomColor: COLORS.card } : {}}
                >
                  <View style={{ width: 36, alignItems: 'center', paddingTop: 3 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent }} />
                    {i < workouts.length - 1 && (
                      <View style={{ width: 1, flex: 1, backgroundColor: COLORS.cardEdge, marginTop: 4 }} />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-baseline">
                      <Text className="text-white font-bold text-base">{item.name}</Text>
                      <Text className="text-muted text-xs">{formatDate(item.started_at)}</Text>
                    </View>
                    <Text className="text-muted text-xs mt-0.5">
                      {durationMinutes(item.started_at, item.finished_at)} min · {Math.round(item.total_volume_kg).toLocaleString()} kg
                    </Text>
                    {item.exerciseNames && item.exerciseNames.length > 0 && (
                      <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                        {item.exerciseNames.join(' · ')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <WorkoutDetailModal
            workoutId={selectedWorkout?.id ?? null}
            workoutName={selectedWorkout?.name ?? ''}
            startedAt={selectedWorkout?.started_at ?? ''}
            totalVolume={selectedWorkout?.total_volume_kg ?? 0}
            onClose={() => setSelectedWorkout(null)}
          />

        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  )
}
