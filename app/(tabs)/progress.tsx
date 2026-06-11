import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, router } from 'expo-router'
import { LineChart } from 'react-native-gifted-charts'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { getRankData, getLevel } from '../../lib/xp'
import { COLORS } from '../../lib/constants'
import type { RankName } from '../../lib/constants'
import { ScreenBackground } from '../../components/ui/ScreenBackground'
import { useT } from '../../lib/i18n'

const CHART_WIDTH = Dimensions.get('window').width - 64

interface ExerciseProgress {
  name: string
  isSBD: boolean
  current: number
  points: { value: number }[]
  dates: string[]
}

interface LeaderboardEntry {
  id: string
  username: string
  sbd_rank: RankName
  xp: number
  sbd_total: number
  bodyweight_kg: number | null
}

export default function ProgressScreen() {
  const t = useT()
  const { profile } = useUserStore()
  const [tab, setTab] = useState<'progress' | 'leaderboard' | 'weekly'>('progress')
  const [lbFilter, setLbFilter] = useState<'sbd' | 'xp'>('sbd')
  const [lbScope, setLbScope] = useState<'all' | 'friends'>('all')
  const [exercises, setExercises] = useState<ExerciseProgress[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [progressFilter, setProgressFilter] = useState<'sbd' | 'all'>('sbd')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [loadingLB, setLoadingLB] = useState(false)
  const [weeklyCounts, setWeeklyCounts] = useState<Record<string, number>>({})
  const [loadingWeekly, setLoadingWeekly] = useState(false)

  useEffect(() => {
    if (!profile) return
    loadProgress(profile.id)
  }, [profile?.id])

  useFocusEffect(useCallback(() => {
    if (tab === 'leaderboard') loadLeaderboard()
    if (tab === 'weekly') loadWeekly()
  }, [tab]))

  useEffect(() => {
    if (tab === 'leaderboard' && leaderboard.length === 0) loadLeaderboard()
    if (tab === 'weekly') loadWeekly()
  }, [tab])

  function getWeekStart(): Date {
    const now = new Date()
    const day = (now.getDay() + 6) % 7
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - day)
    return d
  }

  async function loadWeekly() {
    setLoadingWeekly(true)
    if (leaderboard.length === 0) await loadLeaderboard()
    const start = getWeekStart().toISOString()
    const { data: ws } = await supabase
      .from('workouts')
      .select('user_id, started_at')
      .gte('started_at', start)
    const counts: Record<string, number> = {}
    for (const w of (ws ?? []) as any[]) counts[w.user_id] = (counts[w.user_id] ?? 0) + 1
    setWeeklyCounts(counts)
    setLoadingWeekly(false)
  }

  async function loadProgress(userId: string) {
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, started_at')
      .eq('user_id', userId)
    if (!workouts?.length) return

    const workoutIds = workouts.map(w => w.id)
    const dateByWorkout: Record<string, string> = {}
    workouts.forEach(w => { dateByWorkout[w.id] = w.started_at })

    const { data: sets } = await supabase
      .from('workout_sets')
      .select('weight_kg, workout_id, exercises!inner(name, is_sbd)')
      .in('workout_id', workoutIds)
    if (!sets) return

    const byExercise: Record<string, { isSBD: boolean; byDate: Record<string, number> }> = {}
    for (const s of sets as any[]) {
      const name: string = s.exercises.name
      const isSBD: boolean = s.exercises.is_sbd
      const date = dateByWorkout[s.workout_id]?.split('T')[0]
      if (!date) continue
      if (!byExercise[name]) byExercise[name] = { isSBD, byDate: {} }
      byExercise[name].byDate[date] = Math.max(byExercise[name].byDate[date] ?? 0, s.weight_kg)
    }

    const SBD_ORDER = ['Squat', 'Bench Press', 'Deadlift']
    const result: ExerciseProgress[] = Object.entries(byExercise)
      .map(([name, { isSBD, byDate }]) => {
        const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))
        const points = sorted.map(([, weight]) => ({ value: weight }))
        return { name, isSBD, current: Math.max(...Object.values(byDate)), points, dates: sorted.map(([d]) => d) }
      })
      .sort((a, b) => {
        const ai = SBD_ORDER.indexOf(a.name)
        const bi = SBD_ORDER.indexOf(b.name)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return a.name.localeCompare(b.name)
      })

    setExercises(result)
    if (result.length > 0 && !selectedExercise) {
      setSelectedExercise(result[0].name)
    }
  }

  async function loadLeaderboard() {
    setLoadingLB(true)
    const [{ data }, { data: fs }] = await Promise.all([
      supabase.from('users').select('id, username, sbd_rank, xp, sbd_total, bodyweight_kg').order('xp', { ascending: false }).limit(200),
      profile
        ? supabase.from('friendships').select('user_id, friend_id').or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`).eq('status', 'accepted')
        : Promise.resolve({ data: [] }),
    ])
    if (data) setLeaderboard(data as LeaderboardEntry[])
    if (fs && profile) {
      const ids = new Set((fs as any[]).map(f => f.user_id === profile.id ? f.friend_id : f.user_id))
      ids.add(profile.id)
      setFriendIds(ids)
    }
    setLoadingLB(false)
  }

  return (
    <ScreenBackground variant="progress">
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top tab switcher */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setTab('progress')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: tab === 'progress' ? COLORS.accent : COLORS.card }}
          >
            <Text style={{ color: tab === 'progress' ? '#fff' : COLORS.muted, fontWeight: '700', fontSize: 13 }}>{t('progress.tabProgress')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('leaderboard')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: tab === 'leaderboard' ? COLORS.accent : COLORS.card }}
          >
            <Text style={{ color: tab === 'leaderboard' ? '#fff' : COLORS.muted, fontWeight: '700', fontSize: 13 }}>{t('progress.tabLeaderboard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('weekly')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: tab === 'weekly' ? COLORS.accent : COLORS.card }}
          >
            <Text style={{ color: tab === 'weekly' ? '#fff' : COLORS.muted, fontWeight: '700', fontSize: 13 }}>{t('weekly.tab')}</Text>
          </TouchableOpacity>
        </View>

        {tab === 'progress' ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
            {exercises.length === 0 ? (
              <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center', margin: 16 }}>
                <Text style={{ color: COLORS.muted }}>{t('progress.noWorkouts')}</Text>
              </View>
            ) : (() => {
              const filtered = progressFilter === 'sbd'
                ? exercises.filter(e => e.isSBD)
                : exercises
              const visibleList = filtered.length > 0 ? filtered : exercises
              const active = visibleList.find(e => e.name === selectedExercise) ?? visibleList[0]
              const improvement = active && active.points.length >= 2
                ? active.points[active.points.length - 1].value - active.points[0].value
                : 0
              const impPct = active && active.points.length >= 2 && active.points[0].value > 0
                ? Math.round((improvement / active.points[0].value) * 100)
                : 0
              const fmt = (d: string) => new Date(d).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' })

              return (
                <>
                  {/* Filter toggle */}
                  <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
                    {(['sbd', 'all'] as const).map(f => (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setProgressFilter(f)}
                        style={{
                          paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10,
                          backgroundColor: progressFilter === f ? COLORS.accent : COLORS.card,
                        }}
                      >
                        <Text style={{ color: progressFilter === f ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>
                          {f === 'sbd' ? t('progress.filterSBD') : t('progress.filterAll')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Exercise selector */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
                    style={{ marginBottom: 12 }}
                  >
                    {visibleList.map(ex => (
                      <TouchableOpacity
                        key={ex.name}
                        onPress={() => setSelectedExercise(ex.name)}
                        style={{
                          paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
                          backgroundColor: selectedExercise === ex.name ? COLORS.card2 : COLORS.card,
                          borderWidth: selectedExercise === ex.name ? 1 : 0,
                          borderColor: COLORS.accent,
                        }}
                      >
                        <Text style={{
                          color: selectedExercise === ex.name ? '#fff' : COLORS.muted,
                          fontSize: 12, fontWeight: '700'
                        }}>{ex.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Active exercise card */}
                  {active && (
                    <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginHorizontal: 16, marginBottom: 12 }}>
                      {/* Header */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{active.name}</Text>
                        <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 24 }}>{active.current} kg</Text>
                      </View>

                      {/* Stats row */}
                      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>{active.points.length} treeniä</Text>
                        {improvement > 0 && (
                          <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700' }}>
                            ↑ +{improvement} kg{impPct > 0 ? ` (${impPct}%)` : ''}
                          </Text>
                        )}
                        {improvement < 0 && (
                          <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '700' }}>
                            ↓ {improvement} kg
                          </Text>
                        )}
                        {improvement === 0 && active.points.length === 1 && (
                          <Text style={{ color: COLORS.muted, fontSize: 12 }}>1 kirjaus</Text>
                        )}
                      </View>

                      {active.points.length >= 2 ? (
                        <>
                          <LineChart
                            data={active.points}
                            width={CHART_WIDTH}
                            height={140}
                            color={active.isSBD ? COLORS.accent : '#8b5cf6'}
                            thickness={2.5}
                            dataPointsColor={active.isSBD ? COLORS.gold : '#c4b5fd'}
                            dataPointsRadius={active.points.length <= 10 ? 4 : 2}
                            hideDataPoints={active.points.length > 20}
                            yAxisTextStyle={{ color: COLORS.muted, fontSize: 10 }}
                            hideXAxisText
                            backgroundColor="transparent"
                            rulesColor="#1e1e3a"
                            yAxisColor="transparent"
                            xAxisColor="#2a2a4a"
                            curved
                            areaChart
                            startFillColor={active.isSBD ? COLORS.accent : '#8b5cf6'}
                            startOpacity={0.2}
                            endOpacity={0.01}
                          />
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={{ color: COLORS.muted, fontSize: 11 }}>{fmt(active.dates[0])}</Text>
                            <Text style={{ color: COLORS.muted, fontSize: 11 }}>{fmt(active.dates[active.dates.length - 1])}</Text>
                          </View>
                        </>
                      ) : (
                        <View style={{ height: 50, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: COLORS.muted, fontSize: 12 }}>Tee vielä yksi treeni nähdäksesi kehityksen</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Mini cards for others */}
                  <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {visibleList.filter(e => e.name !== active?.name).map(ex => {
                      const imp = ex.points.length >= 2 ? ex.points[ex.points.length - 1].value - ex.points[0].value : 0
                      const trend = imp > 0 ? '↑' : imp < 0 ? '↓' : '→'
                      const trendColor = imp > 0 ? '#4ade80' : imp < 0 ? '#f87171' : COLORS.muted
                      return (
                        <TouchableOpacity
                          key={ex.name}
                          onPress={() => setSelectedExercise(ex.name)}
                          style={{ backgroundColor: COLORS.card, borderRadius: 14, padding: 14, width: (Dimensions.get('window').width - 48) / 2 }}
                        >
                          <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 6 }} numberOfLines={1}>{ex.name}</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{ex.current}<Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '400' }}> kg</Text></Text>
                            <Text style={{ color: trendColor, fontSize: 15, fontWeight: '700' }}>{trend}{Math.abs(imp) > 0 ? ` ${Math.abs(imp)}` : ''}</Text>
                          </View>
                          <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 4 }}>{ex.points.length} {t('progress.timesShort')}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </>
              )
            })()}
          </ScrollView>
        ) : tab === 'leaderboard' ? (
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Scope + Filter */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setLbScope('all')}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: lbScope === 'all' ? COLORS.accent : COLORS.card }}
              >
                <Text style={{ color: lbScope === 'all' ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{t('lb.scopeAll')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLbScope('friends')}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: lbScope === 'friends' ? COLORS.accent : COLORS.card }}
              >
                <Text style={{ color: lbScope === 'friends' ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{t('lb.scopeFriends')}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setLbFilter('sbd')}
                style={{ flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center', backgroundColor: lbFilter === 'sbd' ? COLORS.card2 : COLORS.card, borderWidth: lbFilter === 'sbd' ? 1 : 0, borderColor: COLORS.accent }}
              >
                <Text style={{ color: lbFilter === 'sbd' ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{t('lb.filterSBD')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLbFilter('xp')}
                style={{ flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center', backgroundColor: lbFilter === 'xp' ? COLORS.card2 : COLORS.card, borderWidth: lbFilter === 'xp' ? 1 : 0, borderColor: COLORS.accent }}
              >
                <Text style={{ color: lbFilter === 'xp' ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{t('lb.filterXP')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
              {lbFilter === 'sbd' ? t('lb.titleSBD') : t('lb.titleXP')}
            </Text>

            {loadingLB ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
            ) : (() => {
              const base = lbScope === 'friends'
                ? leaderboard.filter(e => friendIds.has(e.id))
                : leaderboard
              const sorted = lbFilter === 'sbd'
                ? [...base]
                    .filter(e => (e.sbd_total ?? 0) > 0)
                    .sort((a, b) => {
                      const ra = a.bodyweight_kg ? a.sbd_total / a.bodyweight_kg : -1
                      const rb = b.bodyweight_kg ? b.sbd_total / b.bodyweight_kg : -1
                      return rb - ra
                    })
                : [...base].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
              if (sorted.length === 0) return (
                <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.muted }}>{t('lb.empty')}</Text>
                </View>
              )
              return sorted.map((entry, i) => {
                const rd = getRankData(entry.sbd_rank)
                const isMe = entry.id === profile?.id
                const rightTop = lbFilter === 'sbd'
                  ? entry.bodyweight_kg && entry.sbd_total > 0
                    ? `${(entry.sbd_total / entry.bodyweight_kg).toFixed(2)}×`
                    : entry.sbd_total > 0 ? `${entry.sbd_total} kg` : '—'
                  : t('lb.level', { n: String(getLevel(entry.xp ?? 0)) })
                const rightSub = lbFilter === 'sbd' && entry.bodyweight_kg && entry.sbd_total > 0
                  ? `${entry.sbd_total} kg`
                  : null
                return (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => !isMe && router.push(`/user/${entry.id}` as any)}
                    activeOpacity={isMe ? 1 : 0.75}
                  >
                    <View style={{
                      backgroundColor: isMe ? COLORS.accentDim : COLORS.card,
                      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8,
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      borderWidth: isMe ? 1 : 0, borderColor: COLORS.accent,
                    }}>
                      <Text style={{ color: i < 3 ? COLORS.gold : COLORS.muted, fontWeight: '900', width: 28, fontSize: 14 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                          {entry.username}{isMe ? t('lb.youTag') : ''}
                        </Text>
                        <Text style={{ color: rd.color, fontSize: 12, marginTop: 1 }}>{t(`rank.${entry.sbd_rank}` as any)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{rightTop}</Text>
                        {rightSub && <Text style={{ color: COLORS.muted, fontSize: 11 }}>{rightSub}</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })
            })()}
          </ScrollView>
        ) : (
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
            {(() => {
              const weekStart = getWeekStart()
              const weekEnd = new Date(weekStart.getTime() + 7 * 86400000)
              const daysLeft = Math.max(1, Math.ceil((weekEnd.getTime() - Date.now()) / 86400000))
              return (
                <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                  <Text style={{ color: COLORS.accent, fontSize: 10, letterSpacing: 2, fontWeight: '900' }}>{t('weekly.title')}</Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{t('weekly.metric')}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>⏰ {t('weekly.daysLeft', { n: String(daysLeft) })}</Text>
                </View>
              )
            })()}

            {loadingWeekly ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
            ) : (() => {
              const userMap: Record<string, LeaderboardEntry> = {}
              for (const e of leaderboard) userMap[e.id] = e
              const sorted = Object.entries(weeklyCounts)
                .filter(([, c]) => c > 0)
                .sort(([, a], [, b]) => b - a)
              if (sorted.length === 0) return (
                <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.muted, textAlign: 'center' }}>{t('weekly.empty')}</Text>
                </View>
              )
              return sorted.map(([uid, count], i) => {
                const entry = userMap[uid]
                const isMe = uid === profile?.id
                const rd = entry ? getRankData(entry.sbd_rank) : null
                return (
                  <TouchableOpacity
                    key={uid}
                    onPress={() => !isMe && router.push(`/user/${uid}` as any)}
                    activeOpacity={isMe ? 1 : 0.75}
                  >
                    <View style={{
                      backgroundColor: isMe ? COLORS.accentDim : COLORS.card,
                      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8,
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      borderWidth: isMe ? 1 : 0, borderColor: COLORS.accent,
                    }}>
                      <Text style={{ color: i < 3 ? COLORS.gold : COLORS.muted, fontWeight: '900', width: 28, fontSize: 14 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                          {entry?.username ?? '?'}{isMe ? t('lb.youTag') : ''}
                        </Text>
                        {rd && <Text style={{ color: rd.color, fontSize: 12, marginTop: 1 }}>{t(`rank.${entry!.sbd_rank}` as any)}</Text>}
                      </View>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>🔥 {count}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })
            })()}
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenBackground>
  )
}
