import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useWorkoutStore, type WorkoutSet } from '../../store/workoutStore'

interface SetRowProps {
  set: WorkoutSet
  exerciseId: string
}

export function SetRow({ set, exerciseId }: SetRowProps) {
  const { updateSet, removeSet } = useWorkoutStore()

  return (
    <View className="flex-row items-center gap-2 mb-2">
      <Text className="text-muted w-6 text-center text-xs">{set.setNumber}</Text>
      <TextInput
        className="flex-1 bg-bg rounded-lg px-3 py-2 text-white text-center"
        value={String(set.weightKg)}
        onChangeText={v => updateSet(exerciseId, set.id, 'weightKg', parseFloat(v) || 0)}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />
      <TextInput
        className="flex-1 bg-bg rounded-lg px-3 py-2 text-white text-center"
        value={String(set.reps)}
        onChangeText={v => updateSet(exerciseId, set.id, 'reps', parseInt(v) || 0)}
        keyboardType="number-pad"
        selectTextOnFocus
      />
      {set.isPR && <Text className="text-gold text-xs font-bold">PR!</Text>}
      <TouchableOpacity onPress={() => removeSet(exerciseId, set.id)}>
        <Text className="text-muted text-lg px-1">×</Text>
      </TouchableOpacity>
    </View>
  )
}
