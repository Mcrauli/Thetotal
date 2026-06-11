import { useEffect, useState } from 'react'
import { View, Text, Modal, TextInput, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { getSBDRank } from '../../lib/xp'
import { useT } from '../../lib/i18n'

interface SBDEditModalProps {
  visible: boolean
  onClose: () => void
  initial: { squat: number; bench: number; deadlift: number }
  onSaved: () => void
}

export function SBDEditModal({ visible, onClose, initial, onSaved }: SBDEditModalProps) {
  const t = useT()
  const { profile, fetchProfile } = useUserStore()
  const [squat, setSquat] = useState('')
  const [bench, setBench] = useState('')
  const [deadlift, setDeadlift] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    setSquat(initial.squat > 0 ? String(initial.squat) : '')
    setBench(initial.bench > 0 ? String(initial.bench) : '')
    setDeadlift(initial.deadlift > 0 ? String(initial.deadlift) : '')
  }, [visible, initial.squat, initial.bench, initial.deadlift])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    const sq = parseFloat(squat) || 0
    const bp = parseFloat(bench) || 0
    const dl = parseFloat(deadlift) || 0

    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, name')
      .in('name', ['Squat', 'Bench Press', 'Deadlift'])

    if (exercises) {
      const upserts = []
      for (const ex of exercises) {
        const w = ex.name === 'Squat' ? sq : ex.name === 'Bench Press' ? bp : dl
        if (w > 0) {
          upserts.push({ user_id: profile.id, exercise_id: ex.id, weight_kg: w, reps: 1, verified: false })
        }
      }
      if (upserts.length > 0) {
        await supabase.from('personal_records').upsert(upserts, { onConflict: 'user_id,exercise_id' })
      }
    }

    const total = sq + bp + dl
    const isMale = profile.gender !== 'female'
    const newRank = getSBDRank(total, profile.bodyweight_kg ?? 0, isMale)
    await supabase.from('users').update({ sbd_rank: newRank }).eq('id', profile.id)

    await fetchProfile()
    onSaved()
    setSaving(false)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center px-6">
        <View className="bg-card rounded-3xl p-6 border border-cardEdge">
          <Text className="text-white font-black text-xl mb-1">{t('sbd.editTitle')}</Text>
          <Text className="text-muted text-xs mb-5">{t('sbd.editHint')}</Text>

          {[
            { label: t('sbd.squatKg'),    value: squat,    setter: setSquat },
            { label: t('sbd.benchKg'),    value: bench,    setter: setBench },
            { label: t('sbd.deadliftKg'), value: deadlift, setter: setDeadlift },
          ].map(({ label, value, setter }) => (
            <View key={label} className="mb-3">
              <Text className="text-muted text-xs mb-1 ml-1">{label}</Text>
              <TextInput
                className="bg-bg rounded-xl px-4 py-3 text-white border border-cardEdge"
                placeholder="0"
                placeholderTextColor="#555"
                value={value}
                onChangeText={setter}
                keyboardType="decimal-pad"
              />
            </View>
          ))}

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity className="flex-1 bg-bg rounded-xl py-3 items-center border border-cardEdge" onPress={onClose}>
              <Text className="text-muted font-bold">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 bg-accent rounded-xl py-3 items-center ${saving ? 'opacity-50' : ''}`}
              onPress={handleSave}
              disabled={saving}
            >
              <Text className="text-white font-bold">{saving ? t('common.saving') : t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
