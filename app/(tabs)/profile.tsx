import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUserStore } from '../../store/userStore'
import { RankBanner } from '../../components/profile/RankBanner'
import { SBDRow } from '../../components/profile/SBDRow'
import { BadgeRow } from '../../components/profile/BadgeRow'
import { supabase } from '../../lib/supabase'

interface PRMap { squat: number; bench: number; deadlift: number }

export default function ProfileScreen() {
  const { profile, signOut } = useUserStore()
  const [sbd, setSBD] = useState<PRMap>({ squat: 0, bench: 0, deadlift: 0 })
  const [totalWorkouts, setTotalWorkouts] = useState(0)

  useEffect(() => {
    if (!profile) return
    fetchData(profile.id)
  }, [profile?.id])

  async function fetchData(userId: string) {
    const [{ data: prData }, { count }] = await Promise.all([
      supabase.from('personal_records').select('weight_kg, exercises(name, is_sbd)').eq('user_id', userId),
      supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ])
    if (prData) {
      const totals = { squat: 0, bench: 0, deadlift: 0 }
      for (const pr of prData as any[]) {
        if (!pr.exercises?.is_sbd) continue
        const name: string = pr.exercises.name.toLowerCase()
        if (name.includes('squat')) totals.squat = pr.weight_kg
        else if (name.includes('bench')) totals.bench = pr.weight_kg
        else if (name.includes('deadlift')) totals.deadlift = pr.weight_kg
      }
      setSBD(totals)
    }
    setTotalWorkouts(count ?? 0)
  }

  if (!profile) return null

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <RankBanner xp={profile.xp} rank={profile.rank} />

        <View className="mb-4">
          <Text className="text-white text-xl font-black">{profile.username}</Text>
          {profile.bio ? <Text className="text-muted text-sm mt-1">{profile.bio}</Text> : null}
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1 bg-card rounded-2xl p-3 items-center">
            <Text className="text-white font-bold text-xl">{totalWorkouts}</Text>
            <Text className="text-muted text-xs">Workouts</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 items-center">
            <Text className="text-accent font-bold text-xl">🔥{profile.streak}</Text>
            <Text className="text-muted text-xs">Streak</Text>
          </View>
        </View>

        <SBDRow squat={sbd.squat} bench={sbd.bench} deadlift={sbd.deadlift} />

        <BadgeRow
          xp={profile.xp}
          streak={profile.streak}
          hasBenchPR={sbd.bench > 0}
          hasSquatPR={sbd.squat > 0}
          hasDeadliftPR={sbd.deadlift > 0}
          totalWorkouts={totalWorkouts}
        />

        <TouchableOpacity className="mt-6 items-center py-3" onPress={signOut}>
          <Text className="text-muted text-sm">Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
