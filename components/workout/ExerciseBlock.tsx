import { useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useWorkoutStore, type WorkoutExercise } from '../../store/workoutStore'
import { SetRow } from './SetRow'

interface ExerciseBlockProps {
  exercise: WorkoutExercise
  lastBest: string | null
  defaultWeight?: number
  defaultReps?: number
  onMount?: () => void
}

export function ExerciseBlock({ exercise, lastBest, defaultWeight, defaultReps, onMount }: ExerciseBlockProps) {
  useEffect(() => { onMount?.() }, [])
  const { addSet, copyLastSet, removeExercise } = useWorkoutStore()
  const isCardio = exercise.muscleGroup === 'Kardio'

  function handleRemove() {
    Alert.alert('Poista liike', `Poistetaanko ${exercise.exerciseName}?`, [
      { text: 'Peruuta', style: 'cancel' },
      { text: 'Poista', style: 'destructive', onPress: () => removeExercise(exercise.exerciseId) },
    ])
  }

  function handleAddSet() {
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const fallbackWeight = isCardio ? 30 : 20
    const fallbackReps = isCardio ? 5 : 5
    addSet(
      exercise.exerciseId,
      lastSet?.weightKg ?? defaultWeight ?? fallbackWeight,
      lastSet?.reps ?? defaultReps ?? fallbackReps
    )
  }

  return (
    <View className="bg-card rounded-2xl p-4 mb-4">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-accent font-bold text-base flex-1">{exercise.exerciseName}</Text>
        <TouchableOpacity onPress={handleRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-muted text-lg">×</Text>
        </TouchableOpacity>
      </View>
      {lastBest && (
        <Text className="text-muted text-xs mb-3">{lastBest}</Text>
      )}

      {exercise.sets.length > 0 && (
        <View className="flex-row mb-1 px-1">
          <Text className="text-muted text-xs w-6" />
          <Text className="flex-1 text-muted text-xs text-center">{isCardio ? 'min' : 'kg'}</Text>
          <Text className="flex-1 text-muted text-xs text-center">{isCardio ? 'km' : 'reps'}</Text>
          <View className="w-16" />
        </View>
      )}

      {exercise.sets.map(set => (
        <SetRow key={set.id} set={set} exerciseId={exercise.exerciseId} isCardio={isCardio} />
      ))}

      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity
          className="flex-1 bg-card2 rounded-lg py-2 items-center"
          onPress={handleAddSet}
        >
          <Text className="text-white text-sm">+ {isCardio ? 'Lisää erä' : 'Lisää sarja'}</Text>
        </TouchableOpacity>
        {exercise.sets.length > 0 && (
          <TouchableOpacity
            className="flex-1 bg-card2 rounded-lg py-2 items-center"
            onPress={() => copyLastSet(exercise.exerciseId)}
          >
            <Text className="text-muted text-sm">Kopioi edellinen</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
