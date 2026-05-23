import { useEffect, useState } from 'react'
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

interface SetRow { set_number: number; weight_kg: number; reps: number }
interface ExerciseGroup { name: string; sets: SetRow[] }

interface Props {
  workoutId: string | null
  workoutName: string
  startedAt: string
  totalVolume: number
  onClose: () => void
}

export function WorkoutDetailModal({ workoutId, workoutName, startedAt, totalVolume, onClose }: Props) {
  const [groups, setGroups] = useState<ExerciseGroup[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!workoutId) return
    setLoading(true)
    supabase
      .from('workout_sets')
      .select('set_number, weight_kg, reps, exercises(name)')
      .eq('workout_id', workoutId)
      .order('set_number')
      .then(({ data }) => {
        const map: Record<string, ExerciseGroup> = {}
        for (const row of (data ?? []) as any[]) {
          const name: string = row.exercises?.name ?? '?'
          if (!map[name]) map[name] = { name, sets: [] }
          map[name].sets.push({ set_number: row.set_number, weight_kg: row.weight_kg, reps: row.reps })
        }
        setGroups(Object.values(map))
        setLoading(false)
      })
  }, [workoutId])

  return (
    <Modal visible={!!workoutId} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{workoutName}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
              {new Date(startedAt).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long' })}
              {'  ·  '}{Math.round(totalVolume).toLocaleString()} kg
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: COLORS.muted, fontSize: 15 }}>Sulje</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {groups.map(group => (
              <View key={group.name} style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 12 }}>{group.name}</Text>
                {group.sets.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: COLORS.muted, fontSize: 12, width: 28 }}>S{s.set_number}</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                      {s.weight_kg} kg
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 14, marginLeft: 6 }}>
                      × {s.reps}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}
