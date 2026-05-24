import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { useUserStore } from '../../store/userStore'
import { XPBar } from '../../components/ui/XPBar'
import { ScreenBackground } from '../../components/ui/ScreenBackground'
import { RanksModal } from '../../components/ui/RanksModal'
import { RankBarbellIcon } from '../../components/ui/RankBarbellIcon'
import { WorkoutDetailModal } from '../../components/workout/WorkoutDetailModal'
import { getRankData, getSBDSubRank } from '../../lib/xp'
import { SBD_RANK_THRESHOLDS, COLORS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

interface SBDTotals { squat: number; bench: number; deadlift: number }
interface LastWorkout { id: string; name: string; started_at: string; total_volume_kg: number }
interface FriendPR {
  id: string
  user_id: string
  username: string
  exerciseName: string
  weight_kg: number
  reps: number
  recorded_at: string
  sbd_rank: import('../../lib/constants').RankName
}

export default function HomeScreen() {
  const { profile, loading, fetchProfile } = useUserStore()
  const [sbd, setSBD] = useState<SBDTotals>({ squat: 0, bench: 0, deadlift: 0 })
  const [lastWorkout, setLastWorkout] = useState<LastWorkout | null>(null)
  const [ranksVisible, setRanksVisible] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<LastWorkout | null>(null)
  const [friendPRs, setFriendPRs] = useState<FriendPR[]>([])

  const cardAnims = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current
  const progressBarAnim = useRef(new Animated.Value(0)).current

  useFocusEffect(useCallback(() => {
    if (!profile) return
    cardAnims.forEach(a => a.setValue(0))
    Animated.stagger(70, cardAnims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true })
    )).start()
    fetchSBD(profile.id)
    fetchLastWorkout(profile.id)
    fetchFriendPRs(profile.id)
  }, [profile?.id]))

  async function fetchFriendPRs(userId: string) {
    const { data: fs } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')
    if (!fs || fs.length === 0) { setFriendPRs([]); return }
    const friendIds = fs.map((f: any) => f.user_id === userId ? f.friend_id : f.user_id)
    const { data } = await supabase
      .from('personal_records')
      .select('id, user_id, weight_kg, reps, recorded_at, exercises!inner(name, is_sbd), users!inner(username, sbd_rank, hide_sbd)')
      .in('user_id', friendIds)
      .eq('exercises.is_sbd', true)
      .order('recorded_at', { ascending: false })
      .limit(10)
    const filtered = (data ?? [])
      .filter((r: any) => !r.users?.hide_sbd)
      .map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        username: r.users?.username ?? '?',
        exerciseName: r.exercises?.name ?? '?',
        weight_kg: r.weight_kg,
        reps: r.reps,
        recorded_at: r.recorded_at,
        sbd_rank: r.users?.sbd_rank ?? 'Aloittelija',
      })) as FriendPR[]
    setFriendPRs(filtered)
  }

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

  async function fetchLastWorkout(userId: string) {
    const { data } = await supabase
      .from('workouts')
      .select('id, name, started_at, total_volume_kg')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
    setLastWorkout(data?.[0] ?? null)
  }

  useEffect(() => { if (!profile && !loading) fetchProfile() }, [])

  const sbdRankData = getRankData(profile?.sbd_rank ?? 'Aloittelija')
  const total = sbd.squat + sbd.bench + sbd.deadlift
  const subRank = getSBDSubRank(total, profile?.bodyweight_kg ?? 0, profile?.gender !== 'female')

  const currentIdx = SBD_RANK_THRESHOLDS.findIndex(t => t.name === subRank.rank)
  const isMaxRank = currentIdx === SBD_RANK_THRESHOLDS.length - 1
  const nextRank = !isMaxRank ? SBD_RANK_THRESHOLDS[currentIdx + 1] : null
  const nextRankData = nextRank ? getRankData(nextRank.name) : null
  const rankProgress = nextRank
    ? Math.max(0, Math.min(1,
        (subRank.ratio - SBD_RANK_THRESHOLDS[currentIdx].bwMultiple) /
        (nextRank.bwMultiple - SBD_RANK_THRESHOLDS[currentIdx].bwMultiple)
      ))
    : 1

  useEffect(() => {
    if (!profile) return
    progressBarAnim.setValue(0)
    Animated.timing(progressBarAnim, {
      toValue: rankProgress,
      duration: 900,
      delay: 350,
      useNativeDriver: false,
    }).start()
  }, [rankProgress, profile?.id])

  if (!profile) return <SafeAreaView className="flex-1 bg-bg" />

  function card(idx: number) {
    return {
      opacity: cardAnims[idx],
      transform: [{
        translateY: cardAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [28, 0] }),
      }],
    }
  }

  return (
    <ScreenBackground variant="home">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 28 }}>

          {/* Rank hero */}
          <Animated.View style={[card(0), { borderRadius: 24, marginBottom: 12, overflow: 'hidden' }]}>
          <LinearGradient
            colors={[sbdRankData.color + '28', COLORS.card2, COLORS.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 20,
              shadowColor: sbdRankData.color,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>SBD RANK</Text>
                <RankBarbellIcon rank={profile.sbd_rank} width={80} height={80} />
                <Text style={{ color: sbdRankData.color, fontSize: 24, fontWeight: '900', letterSpacing: 1, marginTop: 8 }}>
                  {profile.sbd_rank.toUpperCase()}
                </Text>
                {total > 0 && (
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
                    {subRank.ratio.toFixed(2)}× kehonpaino
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: COLORS.accent, fontSize: 28, fontWeight: '900' }}>🔥{profile.streak}</Text>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>päivän putki</Text>
              </View>
            </View>
          </LinearGradient>
          </Animated.View>

          {/* XP */}
          <Animated.View style={[card(1), {
            backgroundColor: COLORS.card,
            borderRadius: 20,
            padding: 16,
            marginBottom: 12,
          }]}>
            <XPBar xp={profile.xp} />
          </Animated.View>

          {/* SBD progress */}
          {!isMaxRank && (
            <Animated.View style={[card(2), { marginBottom: 12 }]}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setRanksVisible(true)}
                style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 16 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2 }}>SEURAAVA RANK</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    {subRank.ratio.toFixed(2)}× / {nextRank!.bwMultiple}× BW  ›
                  </Text>
                </View>
                <View style={{ backgroundColor: COLORS.card2, borderRadius: 6, height: 8, marginBottom: 10 }}>
                  <Animated.View style={{
                    height: 8,
                    borderRadius: 6,
                    backgroundColor: sbdRankData.color,
                    width: progressBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: sbdRankData.color, fontSize: 13, fontWeight: '700' }}>
                    {profile.sbd_rank}
                  </Text>
                  <Text style={{ color: nextRankData!.color, fontSize: 13, fontWeight: '700' }}>
                    {nextRank!.name} →
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* SBD quick-start */}
          <Animated.View style={[card(3), { marginBottom: 12 }]}>
            <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>
              NOSTA • KIRJAA • KASVA
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([
                { label: 'SQ', name: 'SQUAT', value: sbd.squat },
                { label: 'BP', name: 'BENCH', value: sbd.bench },
                { label: 'DL', name: 'DEADLIFT', value: sbd.deadlift },
              ] as const).map(({ label, name, value }) => (
                <TouchableOpacity
                  key={label}
                  activeOpacity={0.75}
                  onPress={() => router.push('/(tabs)/start-workout')}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.card2,
                    borderRadius: 20,
                    paddingVertical: 14,
                    paddingHorizontal: 8,
                    alignItems: 'center',
                    borderBottomWidth: 3,
                    borderBottomColor: COLORS.accent,
                  }}
                >
                  <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>
                    {value > 0 ? `${value}` : '—'}
                  </Text>
                  {value > 0 && <Text style={{ color: COLORS.muted, fontSize: 11 }}>kg</Text>}
                  <Text style={{ color: COLORS.accent, fontSize: 10, marginTop: 4, fontWeight: '700' }}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Last workout */}
          {lastWorkout && (
            <Animated.View style={[card(4), { marginBottom: 12 }]}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setSelectedWorkout(lastWorkout)}
                style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 16 }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
                  VIIMEISIN TREENI  ›
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{lastWorkout.name}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    {new Date(lastWorkout.started_at).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
                  {Math.round(lastWorkout.total_volume_kg).toLocaleString()} kg volyymi
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Kaverien PR-feed */}
          {friendPRs.length > 0 && (
            <Animated.View style={[card(5)]}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>
                KAVERIEN ENNÄTYKSET
              </Text>
              {friendPRs.map(pr => {
                const rd = getRankData(pr.sbd_rank)
                const d = new Date(pr.recorded_at)
                const days = Math.floor((Date.now() - d.getTime()) / 86400000)
                const dateLabel = days === 0 ? 'Tänään' : days === 1 ? 'Eilen' : days < 7 ? `${days} pv` : d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
                return (
                  <TouchableOpacity
                    key={pr.id}
                    onPress={() => router.push(`/user/${pr.user_id}` as any)}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: rd.color,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{pr.username}</Text>
                      <Text style={{ color: COLORS.muted, fontSize: 11 }}>{dateLabel}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                      <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 22 }}>
                        {pr.weight_kg}<Text style={{ fontSize: 13, fontWeight: '400' }}>kg</Text>
                      </Text>
                      {pr.reps > 1 && (
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>× {pr.reps}</Text>
                      )}
                      <Text style={{ color: '#fff', fontSize: 13, marginLeft: 4 }}>{pr.exerciseName}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>

      <RanksModal
        visible={ranksVisible}
        onClose={() => setRanksVisible(false)}
        currentRank={profile.sbd_rank}
        currentTier={subRank.tier}
        ratio={subRank.ratio}
      />

      <WorkoutDetailModal
        workoutId={selectedWorkout?.id ?? null}
        workoutName={selectedWorkout?.name ?? ''}
        startedAt={selectedWorkout?.started_at ?? ''}
        totalVolume={selectedWorkout?.total_volume_kg ?? 0}
        onClose={() => setSelectedWorkout(null)}
      />
    </ScreenBackground>
  )
}
