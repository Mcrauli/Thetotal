import { useState, useEffect, useRef, memo } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, Animated, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useWorkoutStore, type WorkoutSet } from '../../store/workoutStore'
import { COLORS } from '../../lib/constants'
import { useT } from '../../lib/i18n'
import { isSetPR, type PRPoint } from '../../lib/pr'
import type { SetKind } from '../../lib/strongman'

interface SetRowProps {
  set: WorkoutSet
  exerciseId: string
  kind: SetKind
  isSbd?: boolean
  prHistory?: PRPoint[]
}

function rpeColor(rpe: number) {
  if (rpe <= 6) return '#4ade80'
  if (rpe <= 8) return '#fb923c'
  return '#ef4444'
}

export function formColor(form: number) {
  if (form >= 4) return '#4ade80'
  if (form === 3) return '#fb923c'
  return '#ef4444'
}

const fieldText = { flex: 1, minWidth: 0, color: '#fff', textAlign: 'center' as const, paddingVertical: 6, fontSize: 15 }

function DecimalField({ value, onChange, integer }: { value: number | undefined; onChange: (v: number) => void; integer?: boolean }) {
  const [text, setText] = useState<string | null>(null)
  return (
    <TextInput
      style={fieldText}
      value={text ?? (value == null ? '' : String(value).replace('.', ','))}
      onChangeText={v => {
        const clean = integer ? v.replace(/[^0-9]/g, '') : v.replace(/[^0-9.,]/g, '')
        setText(clean)
        onChange(parseFloat(clean.replace(',', '.')) || 0)
      }}
      onBlur={() => setText(null)}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      inputMode={integer ? 'numeric' : 'decimal'}
      selectTextOnFocus
    />
  )
}

function Stepper({ value, step, onChange, integer, flex }: { value: number; step: number; onChange: (v: number) => void; integer?: boolean; flex: number }) {
  const [key, setKey] = useState(0)
  const bump = (d: number) => {
    const next = Math.round((value + d) * 10) / 10
    if (next >= 0) { onChange(next); setKey(k => k + 1) }
  }
  return (
    <View style={{ flex, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10 }}>
      <TouchableOpacity onPress={() => bump(-step)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>−</Text>
      </TouchableOpacity>
      <DecimalField key={key} value={value} onChange={onChange} integer={integer} />
      <TouchableOpacity onPress={() => bump(step)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

function PlainField({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <View style={{ flex: 0.8, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10, paddingHorizontal: 4 }}>
      <DecimalField value={value} onChange={onChange} />
    </View>
  )
}

function SetRowImpl({ set, exerciseId, kind, isSbd, prHistory }: SetRowProps) {
  const t = useT()
  const updateSet = useWorkoutStore(s => s.updateSet)
  const removeSet = useWorkoutStore(s => s.removeSet)
  const toggleSetDone = useWorkoutStore(s => s.toggleSetDone)
  const [pickerOpen, setPickerOpen] = useState(false)
  const isCardio = kind === 'cardio'

  const isNewPR = isSetPR(kind, { weight: set.weightKg, reps: set.reps, durationS: set.durationS, distanceM: set.distanceM }, prHistory ?? [])
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
    if (Platform.OS !== 'web') {
      if (turningOn && isNewPR) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      } else {
        Haptics.impactAsync(turningOn ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      }
    }
    toggleSetDone(exerciseId, set.id)
  }

  const bg = flash.interpolate({ inputRange: [0, 1], outputRange: ['transparent', COLORS.gold + '40'] })
  const update = (field: 'weightKg' | 'reps' | 'rpe' | 'durationS' | 'distanceM' | 'form') => (v: number | undefined) => updateSet(exerciseId, set.id, field, v)

  const showChip = kind === 'reps'
  const chipColor = set.rpe ? rpeColor(set.rpe) : set.form ? formColor(set.form) : null
  const chipLabel = [set.rpe ? `RPE ${set.rpe}` : null, isSbd && set.form ? `F${set.form}` : null].filter(Boolean).join(' · ') || (isSbd ? 'RPE/F' : 'RPE')

  return (
    <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderRadius: 10, backgroundColor: bg, opacity: set.done ? 0.55 : 1 }}>
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

      <Stepper flex={1.2} value={set.weightKg} step={isCardio ? 5 : 0.5} onChange={update('weightKg')} />

      {kind === 'hold' && <Stepper flex={1} value={set.durationS ?? 0} step={5} onChange={update('durationS')} />}
      {kind === 'carry' && <PlainField value={set.distanceM} onChange={update('distanceM')} />}
      {kind === 'carry' && <PlainField value={set.durationS} onChange={update('durationS')} />}
      {(kind === 'reps' || kind === 'cardio') && (
        <Stepper flex={1} value={set.reps} step={1} onChange={update('reps')} integer={kind === 'reps'} />
      )}

      {(set.isPR || isNewPR) && <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>PR!</Text>}
      {showChip && (
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={{
            backgroundColor: chipColor ? chipColor + '30' : 'transparent',
            borderWidth: 1,
            borderColor: chipColor ?? COLORS.cardEdge,
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
            minWidth: isSbd ? 64 : 38,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: chipColor ?? COLORS.muted, fontSize: 10, fontWeight: '700' }}>{chipLabel}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => removeSet(exerciseId, set.id)}>
        <Text style={{ color: COLORS.muted, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
      </TouchableOpacity>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, width: '85%', maxWidth: 360 }}>
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
                    onPress={() => { update('rpe')(selected ? undefined : n); if (!isSbd) setPickerOpen(false) }}
                    style={{
                      backgroundColor: selected ? rpeColor(n) : COLORS.card2,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      minWidth: 48,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{n}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {isSbd && (
              <>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 20, marginBottom: 4, textAlign: 'center' }}>{t('form.title')}</Text>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 12, textAlign: 'center' }}>{t('form.subtitle')}</Text>
                <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const selected = set.form === n
                    return (
                      <TouchableOpacity
                        key={n}
                        onPress={() => update('form')(selected ? undefined : n)}
                        style={{ backgroundColor: selected ? formColor(n) : COLORS.card2, borderRadius: 10, paddingVertical: 10, flex: 1, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{n}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: COLORS.muted, fontSize: 10 }}>{t('form.low')}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 10 }}>{t('form.high')}</Text>
                </View>
                <TouchableOpacity onPress={() => setPickerOpen(false)} style={{ marginTop: 16, backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('common.done')}</Text>
                </TouchableOpacity>
              </>
            )}

            {!isSbd && set.rpe !== undefined && (
              <TouchableOpacity onPress={() => { update('rpe')(undefined); setPickerOpen(false) }} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>{t('rpe.remove')}</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  )
}

export const SetRow = memo(SetRowImpl)
