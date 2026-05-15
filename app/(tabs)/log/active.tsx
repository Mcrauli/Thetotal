import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useWorkoutStore } from '../../../store/workoutStore'
import { useUserStore } from '../../../store/userStore'
import { ExerciseBlock } from '../../../components/workout/ExerciseBlock'
import { ExercisePicker } from '../../../components/workout/ExercisePicker'
import { supabase } from '../../../lib/supabase'
import { detectPRs } from '../../../lib/pr'
import { calculateXPGain, getRankForXP } from '../../../lib/xp'

export default function ActiveWorkoutScreen() {
  const { exercises, workoutName, startedAt, setWorkoutName, addExercise, clearWorkout } = useWorkoutStore()
  const { profile, fetchProfile } = useUserStore()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [previousBests, setPreviousBests] = useState<Record<string, string>>({})

  async function fetchPreviousBest(exerciseId: string) {
    if (!profile || previousBests[exerciseId]) return
    const { data } = await supabase
      .from('personal_records')
      .select('weight_kg, reps')
      .eq('user_id', profile.id)
      .eq('exercise_id', exerciseId)
      .single()
    if (data) {
      setPreviousBests(prev => ({
        ...prev,
        [exerciseId]: `Last PR: ${data.weight_kg}kg × ${data.reps}`,
      }))
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (startedAt) setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  async function handleFinish() {
    if (exercises.length === 0) { Alert.alert('Add at least one exercise'); return }
    if (!profile) return
    setSaving(true)

    const finishedAt = new Date()
    const totalVolume = exercises.flatMap(e => e.sets).reduce((sum, s) => sum + s.weightKg * s.reps, 0)

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: profile.id,
        name: workoutName,
        started_at: startedAt?.toISOString(),
        finished_at: finishedAt.toISOString(),
        total_volume_kg: totalVolume,
      })
      .select()
      .single()

    if (workoutError || !workout) { Alert.alert('Error saving workout', workoutError?.message); setSaving(false); return }

    const allSets = exercises.flatMap(ex =>
      ex.sets.map(s => ({
        workout_id: workout.id,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        weight_kg: s.weightKg,
        reps: s.reps,
        is_pr: false,
      }))
    )
    await supabase.from('workout_sets').insert(allSets)

    const { data: existingPRData } = await supabase
      .from('personal_records')
      .select('exercise_id, weight_kg, reps')
      .eq('user_id', profile.id)

    const existingPRs = (existingPRData ?? []).map(r => ({
      exerciseId: r.exercise_id,
      weight: r.weight_kg,
      reps: r.reps,
    }))

    const newSetRecords = exercises.flatMap(ex =>
      ex.sets.map(s => ({ exerciseId: s.exerciseId, weight: s.weightKg, reps: s.reps }))
    )

    const prs = detectPRs(newSetRecords, existingPRs)

    const sbdExerciseIds = new Set(
      exercises.filter(e =>
        ['squat', 'bench press', 'deadlift'].includes(e.exerciseName.toLowerCase())
      ).map(e => e.exerciseId)
    )

    let sbdPRCount = 0
    for (const pr of prs) {
      await supabase.from('personal_records').upsert({
        user_id: profile.id,
        exercise_id: pr.exerciseId,
        weight_kg: pr.weight,
        reps: pr.reps,
        recorded_at: finishedAt.toISOString(),
      }, { onConflict: 'user_id,exercise_id' })
      if (sbdExerciseIds.has(pr.exerciseId)) sbdPRCount++
    }

    const today = finishedAt.toISOString().split('T')[0]
    const lastDate = profile.last_workout_date
    const yesterday = new Date(finishedAt)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const newStreak = lastDate === yesterdayStr ? profile.streak + 1
                    : lastDate === today          ? profile.streak
                    : 1

    const xpGain = calculateXPGain({ prCount: sbdPRCount, streakDays: newStreak })
    const newXP = profile.xp + xpGain
    const newRank = getRankForXP(newXP)

    await supabase.from('users').update({
      xp: newXP,
      rank: newRank,
      streak: newStreak,
      last_workout_date: today,
    }).eq('id', profile.id)

    await fetchProfile()
    clearWorkout()
    setSaving(false)

    Alert.alert(
      'Workout complete! 💪',
      `+${xpGain} XP${prs.length > 0 ? `\n${prs.length} new PR${prs.length > 1 ? 's' : ''}! 🎉` : ''}`,
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/') }]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
        <TextInput
          className="text-white text-xl font-bold flex-1"
          value={workoutName}
          onChangeText={setWorkoutName}
          style={{ color: '#fff' }}
        />
        <Text className="text-muted text-sm">{formatTime(elapsed)}</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {exercises.map(ex => (
          <ExerciseBlock
            key={ex.exerciseId}
            exercise={ex}
            lastBest={previousBests[ex.exerciseId] ?? null}
            onMount={() => fetchPreviousBest(ex.exerciseId)}
          />
        ))}

        <TouchableOpacity
          className="border border-dashed border-card2 rounded-2xl py-4 items-center mt-2"
          onPress={() => setPickerVisible(true)}
        >
          <Text className="text-muted">+ Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-bg">
        <TouchableOpacity
          className={`bg-accent rounded-2xl py-4 items-center ${saving ? 'opacity-50' : ''}`}
          onPress={handleFinish}
          disabled={saving}
        >
          <Text className="text-white font-black tracking-wider">
            {saving ? 'SAVING...' : 'FINISH WORKOUT'}
          </Text>
        </TouchableOpacity>
      </View>

      <ExercisePicker
        visible={pickerVisible}
        onSelect={(id, name) => addExercise(id, name)}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  )
}
