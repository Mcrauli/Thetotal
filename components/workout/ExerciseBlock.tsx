import { useEffect, useState, memo } from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { showAlert } from '../../lib/alert'
import { useWorkoutStore, type WorkoutExercise } from '../../store/workoutStore'
import { SetRow } from './SetRow'
import { useT } from '../../lib/i18n'
import { COLORS } from '../../lib/constants'
import { setKind } from '../../lib/strongman'
import { isSbdLift } from '../../lib/sbd'
import type { PRPoint } from '../../lib/pr'

interface ExerciseBlockProps {
  exercise: WorkoutExercise
  lastBest: string | null
  lastNote?: string | null
  defaultWeight?: number
  defaultReps?: number
  defaultDurationS?: number
  defaultDistanceM?: number
  prHistory?: PRPoint[]
  onMount?: () => void
}

function ExerciseBlockImpl({ exercise, lastBest, lastNote, defaultWeight, defaultReps, defaultDurationS, defaultDistanceM, prHistory, onMount }: ExerciseBlockProps) {
  useEffect(() => { onMount?.() }, [])
  const t = useT()
  const addSet = useWorkoutStore(s => s.addSet)
  const copyLastSet = useWorkoutStore(s => s.copyLastSet)
  const removeExercise = useWorkoutStore(s => s.removeExercise)
  const setExerciseNote = useWorkoutStore(s => s.setExerciseNote)
  const [noteOpen, setNoteOpen] = useState(!!exercise.note)
  const kind = setKind(exercise.exerciseName, exercise.muscleGroup)
  const isCardio = kind === 'cardio'
  const isSbd = isSbdLift(exercise.exerciseName)

  function handleRemove() {
    showAlert(t('active.removeExercise'), t('active.removeExerciseBody', { name: exercise.exerciseName }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeExercise(exercise.exerciseId) },
    ])
  }

  function handleAddSet() {
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const fallbackWeight = isCardio ? 30 : 20
    addSet(
      exercise.exerciseId,
      lastSet?.weightKg ?? defaultWeight ?? fallbackWeight,
      kind === 'hold' || kind === 'carry' ? 1 : lastSet?.reps ?? defaultReps ?? 5,
      {
        durationS: lastSet?.durationS ?? defaultDurationS ?? (kind === 'hold' ? 30 : undefined),
        distanceM: lastSet?.distanceM ?? defaultDistanceM ?? (kind === 'carry' ? 20 : undefined),
      },
    )
  }

  const headers =
    kind === 'cardio' ? ['min', 'km'] :
    kind === 'hold' ? [t('set.kg'), t('set.seconds')] :
    kind === 'carry' ? [t('set.kg'), t('set.meters'), t('set.time')] :
    [t('set.kg'), t('set.reps')]

  return (
    <View className="bg-card rounded-2xl p-4 mb-4">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-accent font-bold text-base flex-1">{exercise.exerciseName}</Text>
        <TouchableOpacity onPress={handleRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-muted text-lg">×</Text>
        </TouchableOpacity>
      </View>
      {lastBest && (
        <Text className="text-muted text-xs mb-1">{lastBest}</Text>
      )}
      {lastNote && (
        <Text style={{ color: COLORS.gold, fontSize: 12, marginBottom: 4 }} numberOfLines={3}>{t('notes.last')} {lastNote}</Text>
      )}
      <View style={{ height: 8 }} />

      {exercise.sets.length > 0 && (
        <View className="flex-row mb-1 px-1" style={{ gap: 6 }}>
          <View style={{ width: 26 }} />
          {headers.map((h, i) => (
            <Text key={h} className="text-muted text-xs text-center" style={{ flex: kind === 'carry' ? (i === 0 ? 1.2 : 0.8) : i === 0 ? 1.2 : 1 }}>{h}</Text>
          ))}
          <View style={{ width: kind === 'reps' ? 80 : 30 }} />
        </View>
      )}

      {exercise.sets.map(set => (
        <SetRow key={set.id} set={set} exerciseId={exercise.exerciseId} kind={kind} isSbd={isSbd} prHistory={prHistory} />
      ))}

      {noteOpen && (
        <TextInput
          value={exercise.note ?? ''}
          onChangeText={v => setExerciseNote(exercise.exerciseId, v.slice(0, 500))}
          placeholder={t('notes.placeholder')}
          placeholderTextColor="#555"
          multiline
          style={{ backgroundColor: COLORS.bg, color: '#fff', borderRadius: 10, padding: 10, marginTop: 4, minHeight: 44, fontSize: 14 }}
        />
      )}

      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity
          className="flex-1 bg-card2 rounded-lg py-2 items-center"
          onPress={handleAddSet}
        >
          <Text className="text-white text-sm">{isCardio ? t('active.addInterval') : t('active.addSet')}</Text>
        </TouchableOpacity>
        {exercise.sets.length > 0 && (
          <TouchableOpacity
            className="flex-1 bg-card2 rounded-lg py-2 items-center"
            onPress={() => copyLastSet(exercise.exerciseId)}
          >
            <Text className="text-muted text-sm">{t('active.copyLast')}</Text>
          </TouchableOpacity>
        )}
        {!noteOpen && (
          <TouchableOpacity className="bg-card2 rounded-lg py-2 px-3 items-center" onPress={() => setNoteOpen(true)}>
            <Text className="text-muted text-sm">📝</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// onMount ajetaan vain kerran, joten sen vaihtuminen ei vaadi uutta piirtoa.
export const ExerciseBlock = memo(ExerciseBlockImpl, (a, b) =>
  a.exercise === b.exercise &&
  a.lastBest === b.lastBest &&
  a.lastNote === b.lastNote &&
  a.defaultWeight === b.defaultWeight &&
  a.defaultReps === b.defaultReps &&
  a.defaultDurationS === b.defaultDurationS &&
  a.defaultDistanceM === b.defaultDistanceM &&
  a.prHistory === b.prHistory
)
