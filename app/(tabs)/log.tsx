import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { ScreenBackground } from '../../components/ui/ScreenBackground'
import { WorkoutDetailModal } from '../../components/workout/WorkoutDetailModal'
import { COLORS } from '../../lib/constants'

interface Workout {
  id: string
  name: string
  started_at: string
  finished_at: string
  total_volume_kg: number
}

interface Template {
  id: string
  name: string
  exercises: { exerciseId: string; exerciseName: string; muscleGroup?: string }[]
}

export default function LogScreen() {
  const { profile } = useUserStore()
  const { startFromTemplate, startWorkout } = useWorkoutStore()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

  useFocusEffect(useCallback(() => {
    if (!profile) return
    loadData(profile.id)
  }, [profile?.id]))

  async function loadData(userId: string) {
    const [{ data: wData }, { data: tData }] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', userId).order('started_at', { ascending: false }),
      supabase.from('workout_templates')
        .select('id, name, template_exercises(exercise_id, order_index, exercises(name, muscle_group))')
        .eq('user_id', userId)
        .order('created_at'),
    ])
    setWorkouts(wData ?? [])
    setTemplates((tData ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      exercises: (t.template_exercises ?? [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((te: any) => ({ exerciseId: te.exercise_id, exerciseName: te.exercises?.name ?? '', muscleGroup: te.exercises?.muscle_group })),
    })))
  }

  async function handleStartTemplate(t: Template) {
    const ids = t.exercises.map(e => e.exerciseId)
    const lastWeights: Record<string, { weight: number; reps: number }> = {}

    if (ids.length > 0 && profile) {
      const { data } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, exercise_id, workout_id, workouts!inner(started_at, user_id)')
        .in('exercise_id', ids)
        .eq('workouts.user_id', profile.id)
        .order('workouts.started_at', { ascending: false })
        .limit(ids.length * 10)

      const seen = new Set<string>()
      for (const s of (data ?? []) as any[]) {
        if (!seen.has(s.exercise_id)) {
          seen.add(s.exercise_id)
          lastWeights[s.exercise_id] = { weight: s.weight_kg, reps: s.reps }
        }
      }
    }

    startFromTemplate(t.name, t.exercises, lastWeights)
    router.push('/(tabs)/active')
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

          {/* Vapaa treeni */}
          <View className="px-4 pt-6 pb-4">
            <TouchableOpacity
              style={{ backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
              onPress={() => { startWorkout(); router.push('/(tabs)/active') }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>▶ Aloita vapaa treeni</Text>
            </TouchableOpacity>
          </View>

          {/* Ohjelmat */}
          <View className="px-4 pb-3 flex-row justify-between items-center">
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 12 }}
              className="mb-6"
            >
              {templates.map(t => (
                <View
                  key={t.id}
                  style={{
                    width: 180,
                    backgroundColor: COLORS.card,
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ height: 3, backgroundColor: COLORS.accent }} />
                  <View style={{ padding: 14, flex: 1 }}>
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-white font-black text-base flex-1" numberOfLines={1}>
                        {t.name}
                      </Text>
                      <TouchableOpacity onPress={() => deleteTemplate(t.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={14} color={COLORS.muted} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ minHeight: 60, marginBottom: 12 }}>
                      {t.exercises.length === 0 ? (
                        <Text className="text-muted text-xs">Ei liikkeitä</Text>
                      ) : (
                        t.exercises.slice(0, 4).map((ex, i) => (
                          <Text key={i} className="text-muted text-xs mb-0.5" numberOfLines={1}>
                            · {ex.exerciseName}
                          </Text>
                        ))
                      )}
                      {t.exercises.length > 4 && (
                        <Text className="text-muted text-xs">+{t.exercises.length - 4} lisää</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={{
                        backgroundColor: COLORS.accent,
                        borderRadius: 10,
                        paddingVertical: 8,
                        alignItems: 'center',
                      }}
                      onPress={() => handleStartTemplate(t)}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>▶ Aloita</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={{
                  width: 120,
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: COLORS.cardEdge,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 24,
                }}
                onPress={() => router.push('/(tabs)/create-template')}
              >
                <Ionicons name="add-circle-outline" size={28} color={COLORS.muted} />
                <Text className="text-muted text-xs mt-1">Uusi</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Historia */}
          <View className="px-4 mb-3">
            <Text className="text-white text-xl font-black">Historia</Text>
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
