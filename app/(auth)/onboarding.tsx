import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { getRankForXP, getSBDRank, getRankData } from '../../lib/xp'

function xpFromRatio(ratio: number): number {
  if (ratio >= 8)    return 30000
  if (ratio >= 7.5)  return 18000
  if (ratio >= 7)    return 11000
  if (ratio >= 6.25) return 6500
  if (ratio >= 5.5)  return 3500
  if (ratio >= 4.5)  return 1800
  if (ratio >= 3.5)  return 800
  if (ratio >= 2.5)  return 300
  return 0
}

export default function OnboardingScreen() {
  const { profile, fetchProfile } = useUserStore()
  const [squat, setSquat] = useState('')
  const [bench, setBench] = useState('')
  const [deadlift, setDeadlift] = useState('')
  const [bodyweight, setBodyweight] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [loading, setLoading] = useState(false)

  const sq = parseFloat(squat) || 0
  const bp = parseFloat(bench) || 0
  const dl = parseFloat(deadlift) || 0
  const bw = parseFloat(bodyweight) || 0
  const total = sq + bp + dl

  const ratio = bw > 0 && total > 0 ? total / bw : 0
  const startingXP = xpFromRatio(ratio)
  const startingRank = getRankForXP(startingXP)
  const startingSBDRank = getSBDRank(total, bw, gender === 'male')
  const rankData = getRankData(startingSBDRank)

  async function handleFinish() {
    if (!profile) return
    setLoading(true)

    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, name')
      .in('name', ['Squat', 'Bench Press', 'Deadlift'])

    if (exercises) {
      const prsToInsert = []
      for (const ex of exercises) {
        const weight = ex.name === 'Squat' ? sq : ex.name === 'Bench Press' ? bp : dl
        if (weight > 0) {
          prsToInsert.push({ user_id: profile.id, exercise_id: ex.id, weight_kg: weight, reps: 1 })
        }
      }
      if (prsToInsert.length > 0) {
        await supabase.from('personal_records').upsert(prsToInsert, { onConflict: 'user_id,exercise_id' })
      }
    }

    const updates: Record<string, any> = {
      xp: startingXP,
      rank: startingRank,
      sbd_rank: startingSBDRank,
      gender,
      onboarded: true,
    }
    if (bw > 0) updates.bodyweight_kg = bw
    if (parseFloat(height) > 0) updates.height_cm = parseFloat(height)

    await supabase.from('users').update(updates).eq('id', profile.id)
    await fetchProfile()
    setLoading(false)
    router.replace('/(auth)/tutorial')
  }

  async function handleSkip() {
    if (!profile) return
    await supabase.from('users').update({ onboarded: true }).eq('id', profile.id)
    await fetchProfile()
    router.replace('/(auth)/tutorial')
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 48, paddingBottom: 32 }}>
        <Text className="text-white text-2xl font-black mb-2">Aseta profiilisi</Text>
        <Text className="text-muted text-sm mb-8">Kaikki kentät valinnaisia. Mitä enemmän annat, sitä tarkempi lähtörankkisi.</Text>

        <Text className="text-muted text-xs tracking-widest mb-3">SUKUPUOLI</Text>
        <View className="flex-row gap-3 mb-6">
          {(['male', 'female'] as const).map(g => (
            <TouchableOpacity
              key={g}
              className="flex-1 rounded-xl py-3 items-center"
              style={{ backgroundColor: gender === g ? '#e63946' : '#1a1a2e' }}
              onPress={() => setGender(g)}
            >
              <Text className="font-bold" style={{ color: gender === g ? '#fff' : '#888' }}>
                {g === 'male' ? 'Mies' : 'Nainen'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-muted text-xs tracking-widest mb-3">KEHON MITAT</Text>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Text className="text-muted text-xs mb-1 ml-1">PAINO (kg)</Text>
            <TextInput
              className="bg-card rounded-xl px-4 py-3 text-white"
              placeholder="80"
              placeholderTextColor="#888"
              value={bodyweight}
              onChangeText={setBodyweight}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-muted text-xs mb-1 ml-1">PITUUS (cm)</Text>
            <TextInput
              className="bg-card rounded-xl px-4 py-3 text-white"
              placeholder="178"
              placeholderTextColor="#888"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Text className="text-muted text-xs tracking-widest mb-3">PARHAAT TULOKSET (kg)</Text>
        {[
          { label: 'KYYKKY', value: squat, setter: setSquat },
          { label: 'PENKKIPUNNERRUS', value: bench, setter: setBench },
          { label: 'MAASTAVETO', value: deadlift, setter: setDeadlift },
        ].map(({ label, value, setter }) => (
          <View key={label} className="mb-4">
            <Text className="text-muted text-xs mb-1 ml-1">{label}</Text>
            <TextInput
              className="bg-card rounded-xl px-4 py-3 text-white"
              placeholder="0"
              placeholderTextColor="#888"
              value={value}
              onChangeText={setter}
              keyboardType="decimal-pad"
            />
          </View>
        ))}

        {total > 0 && (
          <View className="bg-card rounded-2xl p-4 mb-6 items-center">
            <Text className="text-muted text-xs tracking-widest mb-2">LÄHTÖRANKKISI</Text>
            <Text style={{ fontSize: 36 }}>{rankData.icon}</Text>
            <Text className="text-xl font-black mt-1" style={{ color: rankData.color }}>
              {startingSBDRank.toUpperCase()}
            </Text>
            {ratio > 0 && (
              <Text className="text-muted text-xs mt-2">{ratio.toFixed(2)}× BW · total {total}kg</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          className={`bg-accent rounded-xl py-4 items-center mb-3 ${loading ? 'opacity-50' : ''}`}
          onPress={handleFinish}
          disabled={loading}
        >
          <Text className="text-white font-bold text-base">
            {total > 0 ? `Aloita rankkina ${startingSBDRank}` : 'Aloita (Aloittelija)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center py-2" onPress={handleSkip}>
          <Text className="text-muted text-sm">Ohita toistaiseksi</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
