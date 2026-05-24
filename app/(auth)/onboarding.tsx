import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { getRankForXP, getSBDRank, getRankData } from '../../lib/xp'
import { useT } from '../../lib/i18n'

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
  const t = useT()
  const [squat, setSquat] = useState('')
  const [bench, setBench] = useState('')
  const [deadlift, setDeadlift] = useState('')
  const [bodyweight, setBodyweight] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [accepted, setAccepted] = useState(false)
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
    if (!accepted) { Alert.alert(t('onboarding.acceptRequired'), t('onboarding.acceptRequiredBody')); return }
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
          prsToInsert.push({ user_id: profile.id, exercise_id: ex.id, weight_kg: weight, reps: 1, verified: false })
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
    if (!accepted) { Alert.alert(t('onboarding.acceptRequired'), t('onboarding.acceptRequiredBody')); return }
    await supabase.from('users').update({ onboarded: true }).eq('id', profile.id)
    await fetchProfile()
    router.replace('/(auth)/tutorial')
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 48, paddingBottom: 32 }}>
        <Text className="text-white text-2xl font-black mb-2">{t('onboarding.title')}</Text>
        <Text className="text-muted text-sm mb-8">{t('onboarding.subtitle')}</Text>

        <Text className="text-muted text-xs tracking-widest mb-3">{t('onboarding.gender')}</Text>
        <View className="flex-row gap-3 mb-6">
          {(['male', 'female'] as const).map(g => (
            <TouchableOpacity
              key={g}
              className="flex-1 rounded-xl py-3 items-center"
              style={{ backgroundColor: gender === g ? '#e63946' : '#1a1a2e' }}
              onPress={() => setGender(g)}
            >
              <Text className="font-bold" style={{ color: gender === g ? '#fff' : '#888' }}>
                {g === 'male' ? t('onboarding.male') : t('onboarding.female')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-muted text-xs tracking-widest mb-3">{t('onboarding.body')}</Text>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Text className="text-muted text-xs mb-1 ml-1">{t('onboarding.weight')}</Text>
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
            <Text className="text-muted text-xs mb-1 ml-1">{t('onboarding.height')}</Text>
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

        <Text className="text-muted text-xs tracking-widest mb-3">{t('onboarding.bestResults')}</Text>
        {[
          { label: t('onboarding.squat'), value: squat, setter: setSquat },
          { label: t('onboarding.bench'), value: bench, setter: setBench },
          { label: t('onboarding.deadlift'), value: deadlift, setter: setDeadlift },
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
            <Text className="text-muted text-xs tracking-widest mb-2">{t('onboarding.startingRank')}</Text>
            <Text style={{ fontSize: 36 }}>{rankData.icon}</Text>
            <Text className="text-xl font-black mt-1" style={{ color: rankData.color }}>
              {startingSBDRank.toUpperCase()}
            </Text>
            {ratio > 0 && (
              <Text className="text-muted text-xs mt-2">{ratio.toFixed(2)}× BW · total {total}kg</Text>
            )}
          </View>
        )}

        <View style={{ backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 16, marginTop: 8 }}>
          <Text style={{ color: '#ffa726', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>{t('onboarding.healthWarning')}</Text>
          <Text style={{ color: '#aaa', fontSize: 12, lineHeight: 17 }}>
            {t('onboarding.healthBody')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setAccepted(v => !v)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingVertical: 4 }}
        >
          <View
            style={{
              width: 22, height: 22, borderRadius: 5,
              borderWidth: 2,
              borderColor: accepted ? '#e63946' : '#666',
              backgroundColor: accepted ? '#e63946' : 'transparent',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 10, marginTop: 1,
            }}
          >
            {accepted && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', lineHeight: 16 }}>✓</Text>}
          </View>
          <Text style={{ color: '#ccc', fontSize: 13, flex: 1, lineHeight: 18 }}>
            {t('onboarding.acceptPre')}{' '}
            <Text style={{ color: '#e63946', textDecorationLine: 'underline' }} onPress={() => Linking.openURL('https://mcrauli.github.io/Thetotal/terms.html')}>
              {t('onboarding.acceptTerms')}
            </Text>
            {' '}{t('onboarding.acceptAnd')}{' '}
            <Text style={{ color: '#e63946', textDecorationLine: 'underline' }} onPress={() => Linking.openURL('https://mcrauli.github.io/Thetotal/privacy.html')}>
              {t('onboarding.acceptPrivacy')}
            </Text>
            {t('onboarding.acceptPost')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`bg-accent rounded-xl py-4 items-center mb-3 ${(loading || !accepted) ? 'opacity-50' : ''}`}
          onPress={handleFinish}
          disabled={loading || !accepted}
        >
          <Text className="text-white font-bold text-base">
            {total > 0 ? `${t('onboarding.startAs')} ${t(`rank.${startingSBDRank}` as any)}` : t('onboarding.startBeginner')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center py-2" onPress={handleSkip} disabled={!accepted}>
          <Text className="text-muted text-sm" style={{ opacity: accepted ? 1 : 0.5 }}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
