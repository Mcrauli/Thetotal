import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, Animated } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useWorkoutStore, type WorkoutSet } from '../../store/workoutStore'
import { COLORS } from '../../lib/constants'
import { useT } from '../../lib/i18n'

interface SetRowProps {
  set: WorkoutSet
  exerciseId: string
  isCardio?: boolean
  prWeight?: number
}

function rpeColor(rpe: number) {
  if (rpe <= 6) return '#4ade80'
  if (rpe <= 8) return '#fb923c'
  return '#ef4444'
}

export function SetRow({ set, exerciseId, isCardio, prWeight }: SetRowProps) {
  const t = useT()
  const { updateSet, removeSet, toggleSetDone } = useWorkoutStore()
  const [rpePickerOpen, setRpePickerOpen] = useState(false)
  const weightStep = isCardio ? 5 : 0.5
  const repsStep = 1

  const isNewPR = !isCardio && prWeight != null && set.weightKg > prWeight && set.weightKg > 0
  const flash = useRef(new Animated.Value(0)).current
  const wasPR = useRef(false)

  useEffect(() => {
    if (isNewPR && !wasPR.current) {
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.timing(flash, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]).start()
    }
    wasPR.current = isNewPR
  }, [isNewPR])

  function handleToggleDone() {
    const turningOn = !set.done
    if (turningOn && isNewPR) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } else {
      Haptics.impactAsync(turningOn ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
    toggleSetDone(exerciseId, set.id)
  }

  const bg = flash.interpolate({ inputRange: [0, 1], outputRange: ['transparent', COLORS.gold + '40'] })

  function stepWeight(delta: number) {
    const next = Math.round((set.weightKg + delta) * 10) / 10
    if (next >= 0) updateSet(exerciseId, set.id, 'weightKg', next)
  }

  function stepReps(delta: number) {
    const next = set.reps + delta
    if (next >= 0) updateSet(exerciseId, set.id, 'reps', next)
  }

  function setRpe(value: number | undefined) {
    updateSet(exerciseId, set.id, 'rpe', value)
    setRpePickerOpen(false)
  }

  return (
    <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderRadius: 10, backgroundColor: bg, opacity: set.done ? 0.55 : 1, borderLeftWidth: isNewPR ? 3 : 0, borderLeftColor: COLORS.gold, paddingLeft: isNewPR ? 4 : 0 }}>
      <TouchableOpacity
        onPress={handleToggleDone}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={{
          width: 24, height: 24, borderRadius: 12, marginRight: 2,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: set.done ? COLORS.green : 'transparent',
          borderWidth: set.done ? 0 : 1, borderColor: COLORS.cardEdge,
        }}
      >
        <Text style={{ color: set.done ? '#fff' : COLORS.muted, fontSize: set.done ? 13 : 12, fontWeight: '700' }}>
          {set.done ? '✓' : set.setNumber}
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10 }}>
        <TouchableOpacity onPress={() => stepWeight(-weightStep)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={{ flex: 1, color: '#fff', textAlign: 'center', paddingVertical: 6, fontSize: 15 }}
          value={String(set.weightKg)}
          onChangeText={v => updateSet(exerciseId, set.id, 'weightKg', parseFloat(v) || 0)}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <TouchableOpacity onPress={() => stepWeight(weightStep)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10 }}>
        <TouchableOpacity onPress={() => stepReps(-repsStep)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={{ flex: 1, color: '#fff', textAlign: 'center', paddingVertical: 6, fontSize: 15 }}
          value={String(set.reps)}
          onChangeText={v => updateSet(exerciseId, set.id, 'reps', isCardio ? (parseFloat(v) || 0) : (parseInt(v) || 0))}
          keyboardType={isCardio ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
        />
        <TouchableOpacity onPress={() => stepReps(repsStep)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      {(set.isPR || isNewPR) && <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>PR!</Text>}
      {!isCardio && (
        <TouchableOpacity
          onPress={() => setRpePickerOpen(true)}
          style={{
            backgroundColor: set.rpe ? rpeColor(set.rpe) + '30' : 'transparent',
            borderWidth: 1,
            borderColor: set.rpe ? rpeColor(set.rpe) : COLORS.cardEdge,
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
            minWidth: 38,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: set.rpe ? rpeColor(set.rpe) : COLORS.muted, fontSize: 10, fontWeight: '700' }}>
            {set.rpe ? `RPE ${set.rpe}` : 'RPE'}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => removeSet(exerciseId, set.id)}>
        <Text style={{ color: COLORS.muted, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
      </TouchableOpacity>

      <Modal visible={rpePickerOpen} transparent animationType="fade" onRequestClose={() => setRpePickerOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setRpePickerOpen(false)}
        >
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, width: '85%', maxWidth: 360 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4, textAlign: 'center' }}>{t('rpe.title')}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 16, textAlign: 'center' }}>
              {t('rpe.subtitle')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {[5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(n => {
                const selected = set.rpe === n
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setRpe(n)}
                    style={{
                      backgroundColor: selected ? rpeColor(n) : COLORS.card2,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      minWidth: 48,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: selected ? '#fff' : '#fff', fontWeight: '700', fontSize: 14 }}>{n}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {set.rpe !== undefined && (
              <TouchableOpacity
                onPress={() => setRpe(undefined)}
                style={{ marginTop: 16, alignItems: 'center' }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>{t('rpe.remove')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  )
}
