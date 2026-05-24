import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useWorkoutStore } from '../../store/workoutStore'
import { useUserStore } from '../../store/userStore'
import { ExerciseBlock } from '../../components/workout/ExerciseBlock'
import { ExercisePicker } from '../../components/workout/ExercisePicker'
import { WorkoutResults, type ImprovementResult, type ChallengeResult } from '../../components/workout/WorkoutResults'
import { supabase } from '../../lib/supabase'
import { detectPRs } from '../../lib/pr'
import { calculateXPGain, getRankForXP, getSBDRank } from '../../lib/xp'
import { getNewlyCompleted } from '../../lib/challenges'

export default function ActiveWorkoutScreen() {
  const { exercises, workoutName, startedAt, setWorkoutName, addExercise, clearWorkout } = useWorkoutStore()
  const { profile, fetchProfile } = useUserStore()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [results, setResults] = useState<{ xpGain: number; xpBreakdown: { base: number; prBonus: number; streakBonus: number; challengeBonus: number }; improvements: ImprovementResult[]; challenges: ChallengeResult[] } | null>(null)
  const [lastSets, setLastSets] = useState<Record<string, { text: string; weight: number; reps: number } | null>>({})

  async function fetchLastSets(exerciseId: string) {
    if (!profile || exerciseId in lastSets) return
    const { data } = await supabase
      .from('workout_sets')
      .select('weight_kg, reps, set_number, workout_id, workouts!inner(started_at, user_id)')
      .eq('exercise_id', exerciseId)
      .eq('workouts.user_id', profile.id)
      .order('workouts.started_at', { ascending: false })
      .limit(20)
    if (!data?.length) { setLastSets(prev => ({ ...prev, [exerciseId]: null })); return }
    const recentId = (data[0] as any).workout_id
    const recent = (data as any[])
      .filter(s => s.workout_id === recentId)
      .sort((a, b) => a.set_number - b.set_number)
    const best = recent.reduce((b: any, s: any) =>
      s.weight_kg > b.weight_kg || (s.weight_kg === b.weight_kg && s.reps > b.reps) ? s : b
    , recent[0])
    const isCardio = exercises.find(e => e.exerciseId === exerciseId)?.muscleGroup === 'Kardio'
    setLastSets(prev => ({
      ...prev,
      [exerciseId]: {
        text: 'Viimeksi: ' + recent.map((s: any) => isCardio ? `${s.weight_kg}min ${s.reps}km` : `${s.weight_kg}×${s.reps}`).join('  '),
        weight: best.weight_kg,
        reps: best.reps,
      },
    }))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (startedAt) setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  async function handleFinish() {
    if (exercises.length === 0) { Alert.alert('Lisää ensin liike'); return }
    if (!profile) return
    setSaving(true)

    const finishedAt = new Date()
    const startedAtISO = startedAt ? new Date(startedAt).toISOString() : finishedAt.toISOString()
    const totalVolume = exercises
      .filter(e => e.muscleGroup !== 'Kardio')
      .flatMap(e => e.sets)
      .reduce((sum, s) => sum + s.weightKg * s.reps, 0)

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: profile.id,
        name: workoutName,
        started_at: startedAtISO,
        finished_at: finishedAt.toISOString(),
        total_volume_kg: totalVolume,
      })
      .select()
      .single()

    if (workoutError || !workout) {
      Alert.alert('Virhe', workoutError?.message)
      setSaving(false)
      return
    }

    const allSets = exercises.flatMap(ex =>
      ex.sets.map(s => ({
        workout_id: workout.id,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        weight_kg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe ?? null,
        is_pr: false,
      }))
    )

    const [, { data: existingPRData }, { count: workoutCount }, { data: doneData }] =
      await Promise.all([
        supabase.from('workout_sets').insert(allSets),
        supabase.from('personal_records').select('exercise_id, weight_kg, reps, exercises(name, is_sbd)').eq('user_id', profile.id),
        supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('user_challenges').select('challenge_id').eq('user_id', profile.id),
      ])

    const existingPRs = (existingPRData ?? []).map((r: any) => ({
      exerciseId: r.exercise_id, weight: r.weight_kg, reps: r.reps,
    }))
    const prs = detectPRs(
      exercises
        .filter(ex => ex.muscleGroup !== 'Kardio')
        .flatMap(ex => ex.sets.map(s => ({ exerciseId: s.exerciseId, weight: s.weightKg, reps: s.reps }))),
      existingPRs
    )

    if (prs.length > 0) {
      await supabase.from('personal_records').upsert(
        prs.map(pr => ({
          user_id: profile.id,
          exercise_id: pr.exerciseId,
          weight_kg: pr.weight,
          reps: pr.reps,
          recorded_at: finishedAt.toISOString(),
          verified: true,
        })),
        { onConflict: 'user_id,exercise_id' }
      )
    }

    const prMap: Record<string, { weight: number; isSBD: boolean; name: string }> = {}
    for (const r of (existingPRData ?? []) as any[]) {
      prMap[r.exercise_id] = { weight: r.weight_kg, isSBD: r.exercises?.is_sbd ?? false, name: r.exercises?.name?.toLowerCase() ?? '' }
    }
    for (const pr of prs) {
      if (prMap[pr.exerciseId]) prMap[pr.exerciseId].weight = pr.weight
    }

    let sbdTotal = 0
    const sbdMap: Record<string, number> = {}
    for (const val of Object.values(prMap)) {
      if (!val.isSBD) continue
      sbdTotal += val.weight
      if (val.name.includes('squat')) sbdMap.squat = val.weight
      else if (val.name.includes('bench')) sbdMap.bench = val.weight
      else if (val.name.includes('deadlift')) sbdMap.deadlift = val.weight
    }


    const today = finishedAt.toISOString().split('T')[0]
    const yesterday = new Date(finishedAt)
    yesterday.setDate(yesterday.getDate() - 1)
    const newStreak = profile.last_workout_date === yesterday.toISOString().split('T')[0] ? profile.streak + 1
                    : profile.last_workout_date === today ? profile.streak : 1

    const { total: xpGain, base: xpBase, prBonus, streakBonus } = calculateXPGain({ prCount: prs.length, streakDays: newStreak })
    const newXP = profile.xp + xpGain
    const newSBDRank = getSBDRank(sbdTotal, profile.bodyweight_kg ?? 0, profile.gender !== 'female')

    const alreadyDone = (doneData ?? []).map((r: any) => r.challenge_id)
    const newChallenges = getNewlyCompleted({
      totalWorkouts: workoutCount ?? 0, streak: newStreak,
      squat: sbdMap.squat ?? 0, bench: sbdMap.bench ?? 0, deadlift: sbdMap.deadlift ?? 0,
    }, alreadyDone)

    const challengeXP = newChallenges.reduce((s, c) => s + c.xp, 0)
    const totalXP = newXP + challengeXP
    const finalRank = getRankForXP(totalXP)

    const exerciseNameById: Record<string, string> = {}
    exercises.forEach(e => { exerciseNameById[e.exerciseId] = e.exerciseName })

    const sbdPRs = prs.filter(pr => existingPRData?.some((r: any) => r.exercise_id === pr.exerciseId && r.exercises?.is_sbd))
    if (sbdPRs.length > 0) {
      const { data: friends } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
        .eq('status', 'accepted')
      if (friends && friends.length > 0) {
        const friendIds = friends.map((f: any) => f.user_id === profile.id ? f.friend_id : f.user_id)
        const { data: friendProfiles } = await supabase
          .from('users').select('push_token').in('id', friendIds).not('push_token', 'is', null)
        const tokens = (friendProfiles ?? []).map((u: any) => u.push_token).filter(Boolean)
        if (tokens.length > 0) {
          const prName = exerciseNameById[sbdPRs[0].exerciseId] ?? 'SBD'
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokens.map((to: string) => ({
              to,
              title: `${profile.username} löi ennätyksen! 💪`,
              body: `${prName}: ${sbdPRs[0].weight} kg`,
            }))),
          })
        }
      }
    }

    // Check friend challenges
    const { data: pendingChallenges } = await supabase
      .from('friend_challenges')
      .select('id, exercise_name, target_weight')
      .eq('challenged_id', profile.id)
      .eq('status', 'pending')
    const beatenIds: string[] = []
    if (pendingChallenges) {
      for (const ch of pendingChallenges as any[]) {
        const exerciseName: string = ch.exercise_name.toLowerCase()
        const beatingPR = prs.find(pr => {
          const name = (exerciseNameById[pr.exerciseId] ?? '').toLowerCase()
          return name.includes(exerciseName) || exerciseName.includes(name.split(' ')[0])
        })
        if (beatingPR && beatingPR.weight > ch.target_weight) beatenIds.push(ch.id)
      }
    }

    await Promise.all([
      supabase.from('users').update({
        xp: totalXP, rank: finalRank, sbd_rank: newSBDRank,
        streak: newStreak, last_workout_date: today,
        sbd_total: sbdTotal,
      }).eq('id', profile.id),
      newChallenges.length > 0
        ? supabase.from('user_challenges').insert(newChallenges.map(c => ({ user_id: profile.id, challenge_id: c.id })))
        : Promise.resolve(),
      beatenIds.length > 0
        ? supabase.from('friend_challenges').update({ status: 'beaten' }).in('id', beatenIds)
        : Promise.resolve(),
    ])

    const prExerciseIdSet = new Set(prs.map(pr => pr.exerciseId))
    const improvements: ImprovementResult[] = []
    const listedExerciseIds = new Set<string>()

    for (const ex of exercises) {
      if (ex.sets.length === 0) continue
      if (ex.muscleGroup === 'Kardio') continue
      const last = lastSets[ex.exerciseId]
      if (!last) continue
      const bestSet = ex.sets.reduce((b, s) =>
        s.weightKg > b.weightKg || (s.weightKg === b.weightKg && s.reps > b.reps) ? s : b
      )
      const improved = bestSet.weightKg > last.weight || (bestSet.weightKg === last.weight && bestSet.reps > last.reps)
      if (improved) {
        improvements.push({
          exerciseName: ex.exerciseName,
          prevWeight: last.weight,
          prevReps: last.reps,
          newWeight: bestSet.weightKg,
          newReps: bestSet.reps,
          isAllTimePR: prExerciseIdSet.has(ex.exerciseId),
        })
        listedExerciseIds.add(ex.exerciseId)
      }
    }

    for (const pr of prs) {
      if (!listedExerciseIds.has(pr.exerciseId)) {
        improvements.push({
          exerciseName: exerciseNameById[pr.exerciseId] ?? pr.exerciseId,
          prevWeight: 0,
          prevReps: 0,
          newWeight: pr.weight,
          newReps: pr.reps,
          isAllTimePR: true,
        })
      }
    }

    const challengeResults: ChallengeResult[] = newChallenges.map(c => ({ name: c.name, xp: c.xp }))

    // Update volume/workouts duel challenges
    const { data: activeDuels } = await supabase
      .from('friend_challenges')
      .select('id, challenge_type, challenger_id, challenged_id, challenger_value, challenged_value, created_at, duration_days')
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .in('challenge_type', ['volume', 'workouts'])
      .eq('status', 'pending')
    if (activeDuels && activeDuels.length > 0) {
      const now = new Date()
      const duelOps = (activeDuels as any[]).filter(duel => {
        const expires = new Date(duel.created_at)
        expires.setDate(expires.getDate() + (duel.duration_days ?? 7))
        return now <= expires
      }).map(duel => {
        const isChallenger = duel.challenger_id === profile.id
        const add = duel.challenge_type === 'volume' ? totalVolume : 1
        return supabase.from('friend_challenges').update(
          isChallenger
            ? { challenger_value: (duel.challenger_value ?? 0) + add }
            : { challenged_value: (duel.challenged_value ?? 0) + add }
        ).eq('id', duel.id)
      })
      if (duelOps.length > 0) await Promise.all(duelOps)
    }

    const displayXPGain = xpGain + challengeXP
    const challengeBonus = challengeXP
    await fetchProfile()
    setSaving(false)
    setResults({ xpGain: displayXPGain, xpBreakdown: { base: xpBase, prBonus, streakBonus, challengeBonus }, improvements, challenges: challengeResults })
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <WorkoutResults
        visible={!!results}
        xpGain={results?.xpGain ?? 0}
        xpBreakdown={results?.xpBreakdown ?? { base: 0, prBonus: 0, streakBonus: 0, challengeBonus: 0 }}
        improvements={results?.improvements ?? []}
        challenges={results?.challenges ?? []}
        onDismiss={() => { clearWorkout(); setResults(null); router.replace('/(tabs)/') }}
      />

      <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
        <TextInput
          className="text-white text-xl font-bold flex-1"
          value={workoutName}
          onChangeText={setWorkoutName}
          style={{ color: '#fff' }}
        />
        <TouchableOpacity
          onPress={() => Alert.alert('Lopeta treeni', 'Haluatko lopettaa treenin? Kaikki sarjat menetetään.', [
            { text: 'Peruuta', style: 'cancel' },
            { text: 'Lopeta', style: 'destructive', onPress: () => { clearWorkout(); router.replace('/(tabs)/') } },
          ])}
        >
          <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700' }}>✕ Lopeta</Text>
        </TouchableOpacity>
      </View>
      <View className="items-center pb-1">
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 }}>{formatTime(elapsed)}</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {exercises.map(ex => (
          <ExerciseBlock
            key={ex.exerciseId}
            exercise={ex}
            lastBest={lastSets[ex.exerciseId]?.text ?? null}
            defaultWeight={lastSets[ex.exerciseId]?.weight ?? ex.defaultWeight}
            defaultReps={lastSets[ex.exerciseId]?.reps ?? ex.defaultReps}
            onMount={() => fetchLastSets(ex.exerciseId)}
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
        onSelect={(id, name, mg) => addExercise(id, name, mg)}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  )
}
