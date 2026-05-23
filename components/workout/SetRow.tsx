import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useWorkoutStore, type WorkoutSet } from '../../store/workoutStore'
import { COLORS } from '../../lib/constants'

interface SetRowProps {
  set: WorkoutSet
  exerciseId: string
}

export function SetRow({ set, exerciseId }: SetRowProps) {
  const { updateSet, removeSet } = useWorkoutStore()

  function stepWeight(delta: number) {
    const next = Math.round((set.weightKg + delta) * 10) / 10
    if (next >= 0) updateSet(exerciseId, set.id, 'weightKg', next)
  }

  function stepReps(delta: number) {
    const next = set.reps + delta
    if (next >= 1) updateSet(exerciseId, set.id, 'reps', next)
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Text style={{ color: COLORS.muted, width: 22, textAlign: 'center', fontSize: 12 }}>{set.setNumber}</Text>

      <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10 }}>
        <TouchableOpacity onPress={() => stepWeight(-0.5)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={{ flex: 1, color: '#fff', textAlign: 'center', paddingVertical: 6, fontSize: 15 }}
          value={String(set.weightKg)}
          onChangeText={v => updateSet(exerciseId, set.id, 'weightKg', parseFloat(v) || 0)}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <TouchableOpacity onPress={() => stepWeight(0.5)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10 }}>
        <TouchableOpacity onPress={() => stepReps(-1)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={{ flex: 1, color: '#fff', textAlign: 'center', paddingVertical: 6, fontSize: 15 }}
          value={String(set.reps)}
          onChangeText={v => updateSet(exerciseId, set.id, 'reps', parseInt(v) || 0)}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <TouchableOpacity onPress={() => stepReps(1)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      {set.isPR && <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>PR!</Text>}
      <TouchableOpacity onPress={() => removeSet(exerciseId, set.id)}>
        <Text style={{ color: COLORS.muted, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
      </TouchableOpacity>
    </View>
  )
}
