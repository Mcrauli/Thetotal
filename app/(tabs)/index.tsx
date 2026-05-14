import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useUserStore } from '../../store/userStore'
import { XPBar } from '../../components/ui/XPBar'
import { getRankData } from '../../lib/xp'
import { supabase } from '../../lib/supabase'

interface SBDTotals { squat: number; bench: number; deadlift: number }

export default function HomeScreen() {
  const { profile } = useUserStore()
  const [sbd, setSBD] = useState<SBDTotals>({ squat: 0, bench: 0, deadlift: 0 })

  useEffect(() => {
    if (!profile) return
    fetchSBD(profile.id)
  }, [profile?.id])

  async function fetchSBD(userId: string) {
    const { data } = await supabase
      .from('personal_records')
      .select('weight_kg, exercises(name, is_sbd)')
      .eq('user_id', userId)
    if (!data) return
    const totals = { squat: 0, bench: 0, deadlift: 0 }
    for (const pr of data as any[]) {
      if (!pr.exercises?.is_sbd) continue
      const name: string = pr.exercises.name.toLowerCase()
      if (name.includes('squat')) totals.squat = pr.weight_kg
      else if (name.includes('bench')) totals.bench = pr.weight_kg
      else if (name.includes('deadlift')) totals.deadlift = pr.weight_kg
    }
    setSBD(totals)
  }

  if (!profile) return null

  const rankData = getRankData(profile.rank)
  const total = sbd.squat + sbd.bench + sbd.deadlift

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>

        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-muted text-xs tracking-widest">RANK</Text>
            <Text className="text-2xl font-black" style={{ color: rankData.color }}>
              {rankData.icon} {profile.rank.toUpperCase()}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-muted text-xs">Streak</Text>
            <Text className="text-accent text-xl font-bold">🔥 {profile.streak}d</Text>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-4 mb-4">
          <XPBar xp={profile.xp} rank={profile.rank} />
        </View>

        <View className="bg-card rounded-2xl p-4 mb-6">
          <Text className="text-muted text-xs tracking-widest mb-3">SBD TOTAL</Text>
          <View className="flex-row gap-2">
            {[
              { label: 'SQ', value: sbd.squat },
              { label: 'BP', value: sbd.bench },
              { label: 'DL', value: sbd.deadlift },
            ].map(({ label, value }) => (
              <View key={label} className="flex-1 bg-card2 rounded-xl p-3 items-center">
                <Text className="text-muted text-xs">{label}</Text>
                <Text className="text-white font-bold text-lg">
                  {value > 0 ? `${value}kg` : '—'}
                </Text>
              </View>
            ))}
            <View className="flex-1 bg-card2 border border-gold rounded-xl p-3 items-center">
              <Text className="text-gold text-xs">TTL</Text>
              <Text className="text-gold font-bold text-lg">
                {total > 0 ? `${total}kg` : '—'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="bg-accent rounded-2xl py-5 items-center"
          onPress={() => router.push('/(tabs)/log/active')}
        >
          <Text className="text-white font-black text-base tracking-widest">+ START WORKOUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}
