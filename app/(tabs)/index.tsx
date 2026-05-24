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
import { PRCommentsModal } from '../../components/ui/PRCommentsModal'
import { sendPushToUsers } from '../../lib/notifications'
import { useT } from '../../lib/i18n'
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
  verified: boolean
  verifiedByMe: boolean
}

type ReactionEmoji = 'fire' | 'muscle' | 'clap' | 'eyes'
const EMOJI_LABELS: Record<ReactionEmoji, string> = {
  fire: '🔥',
  muscle: '💪',
  clap: '👏',
  eyes: '👀',
}
interface ReactionCount { count: number; mine: boolean }
type ReactionMap = Record<string, Partial<Record<ReactionEmoji, ReactionCount>>>

export default function HomeScreen() {
  const { profile, loading, fetchProfile } = useUserStore()
  const t = useT()
  const [sbd, setSBD] = useState<SBDTotals>({ squat: 0, bench: 0, deadlift: 0 })
  const [lastWorkout, setLastWorkout] = useState<LastWorkout | null>(null)
  const [ranksVisible, setRanksVisible] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<LastWorkout | null>(null)
  const [friendPRs, setFriendPRs] = useState<FriendPR[]>([])
  const [reactions, setReactions] = useState<ReactionMap>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [commentPR, setCommentPR] = useState<FriendPR | null>(null)

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
    let friendIds = fs.map((f: any) => f.user_id === userId ? f.friend_id : f.user_id)

    const { data: blocked } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId)
    const blockedIds = new Set((blocked ?? []).map((b: any) => b.blocked_id))
    friendIds = friendIds.filter(id => !blockedIds.has(id))
    if (friendIds.length === 0) { setFriendPRs([]); return }
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data } = await supabase
      .from('personal_records')
      .select('id, user_id, weight_kg, reps, recorded_at, verified, exercises!inner(name, is_sbd), users!inner(username, sbd_rank, hide_sbd)')
      .in('user_id', friendIds)
      .eq('exercises.is_sbd', true)
      .eq('verified', true)
      .gte('recorded_at', sevenDaysAgo)
      .order('recorded_at', { ascending: false })
      .limit(10)
    const baseFiltered = (data ?? [])
      .filter((r: any) => !r.users?.hide_sbd)
    let myVerified = new Set<string>()
    if (baseFiltered.length > 0) {
      const { data: vData } = await supabase
        .from('pr_verifications')
        .select('pr_id')
        .eq('verifier_id', userId)
        .in('pr_id', baseFiltered.map((r: any) => r.id))
      myVerified = new Set((vData ?? []).map((v: any) => v.pr_id))
    }
    const filtered = baseFiltered.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      username: r.users?.username ?? '?',
      exerciseName: r.exercises?.name ?? '?',
      weight_kg: r.weight_kg,
      reps: r.reps,
      recorded_at: r.recorded_at,
      sbd_rank: r.users?.sbd_rank ?? 'Aloittelija',
      verified: !!r.verified,
      verifiedByMe: myVerified.has(r.id),
    })) as FriendPR[]
    setFriendPRs(filtered)

    if (filtered.length > 0) {
      const prIds = filtered.map(p => p.id)
      const [{ data: rData }, { data: cData }] = await Promise.all([
        supabase.from('pr_reactions').select('pr_id, user_id, emoji').in('pr_id', prIds),
        supabase.from('pr_comments').select('pr_id').in('pr_id', prIds),
      ])
      const map: ReactionMap = {}
      for (const r of (rData ?? []) as any[]) {
        if (!map[r.pr_id]) map[r.pr_id] = {}
        const slot = map[r.pr_id][r.emoji as ReactionEmoji] ?? { count: 0, mine: false }
        slot.count++
        if (r.user_id === userId) slot.mine = true
        map[r.pr_id][r.emoji as ReactionEmoji] = slot
      }
      setReactions(map)
      const counts: Record<string, number> = {}
      for (const c of (cData ?? []) as any[]) {
        counts[c.pr_id] = (counts[c.pr_id] ?? 0) + 1
      }
      setCommentCounts(counts)
    } else {
      setReactions({})
      setCommentCounts({})
    }
  }

  async function verifyPR(pr: FriendPR) {
    if (!profile || pr.verifiedByMe) return
    setFriendPRs(prev => prev.map(p => p.id === pr.id ? { ...p, verified: true, verifiedByMe: true } : p))
    const { error } = await supabase.from('pr_verifications').insert({ pr_id: pr.id, verifier_id: profile.id })
    if (error) {
      setFriendPRs(prev => prev.map(p => p.id === pr.id ? { ...p, verifiedByMe: false } : p))
      return
    }
    await sendPushToUsers({
      toUserIds: [pr.user_id],
      title: `🤝 ${profile.username} vahvisti`,
      body: `${pr.exerciseName} ${pr.weight_kg}kg PR:si on nyt vahvistettu`,
    })
  }

  async function toggleReaction(prId: string, emoji: ReactionEmoji) {
    if (!profile) return
    const current = reactions[prId]?.[emoji]
    const isAdding = !current?.mine

    setReactions(prev => {
      const next = { ...prev }
      if (!next[prId]) next[prId] = {}
      const slot = next[prId][emoji] ?? { count: 0, mine: false }
      next[prId] = {
        ...next[prId],
        [emoji]: {
          count: slot.count + (isAdding ? 1 : -1),
          mine: isAdding,
        },
      }
      return next
    })

    if (isAdding) {
      await supabase.from('pr_reactions').insert({ pr_id: prId, user_id: profile.id, emoji })
      const pr = friendPRs.find(p => p.id === prId)
      if (pr && pr.user_id !== profile.id) {
        await sendPushToUsers({
          toUserIds: [pr.user_id],
          title: `${EMOJI_LABELS[emoji]} ${profile.username}`,
          body: `Reagoi ${pr.exerciseName} ${pr.weight_kg}kg PR:ääsi`,
        })
      }
    } else {
      await supabase.from('pr_reactions').delete().eq('pr_id', prId).eq('user_id', profile.id).eq('emoji', emoji)
    }
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
                <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>{t('home.sbdRank')}</Text>
                <RankBarbellIcon rank={profile.sbd_rank} width={80} height={80} />
                <Text style={{ color: sbdRankData.color, fontSize: 24, fontWeight: '900', letterSpacing: 1, marginTop: 8 }}>
                  {t(`rank.${profile.sbd_rank}` as any).toUpperCase()}
                </Text>
                {total > 0 && (
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
                    {subRank.ratio.toFixed(2)}{t('home.bodyweightRatio')}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: COLORS.accent, fontSize: 28, fontWeight: '900' }}>🔥{profile.streak}</Text>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{t('home.streak')}</Text>
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
                  <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2 }}>{t('home.nextRank')}</Text>
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
                    {t(`rank.${profile.sbd_rank}` as any)}
                  </Text>
                  <Text style={{ color: nextRankData!.color, fontSize: 13, fontWeight: '700' }}>
                    {t(`rank.${nextRank!.name}` as any)} →
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* SBD quick-start */}
          <Animated.View style={[card(3), { marginBottom: 12 }]}>
            <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>
              {t('home.liftLogGrow')}
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
                  {t('home.lastWorkout')}  ›
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{lastWorkout.name}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    {new Date(lastWorkout.started_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
                  {Math.round(lastWorkout.total_volume_kg).toLocaleString()} kg {t('home.volume')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Kaverien PR-feed */}
          {friendPRs.length > 0 && (
            <Animated.View style={[card(5)]}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>
                {t('home.friendPRs')}
              </Text>
              {friendPRs.map(pr => {
                const rd = getRankData(pr.sbd_rank)
                const d = new Date(pr.recorded_at)
                const days = Math.floor((Date.now() - d.getTime()) / 86400000)
                const dateLabel = days === 0 ? t('common.today') : days === 1 ? t('common.yesterday') : days < 7 ? `${days} ${t('common.days')}` : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                return (
                  <View
                    key={pr.id}
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: rd.color,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/user/${pr.user_id}` as any)}
                      activeOpacity={0.75}
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
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {(Object.keys(EMOJI_LABELS) as ReactionEmoji[]).map(emoji => {
                        const data = reactions[pr.id]?.[emoji]
                        const count = data?.count ?? 0
                        const mine = data?.mine ?? false
                        return (
                          <TouchableOpacity
                            key={emoji}
                            onPress={() => toggleReaction(pr.id, emoji)}
                            activeOpacity={0.7}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: mine ? COLORS.accentDim : COLORS.card2,
                              borderRadius: 14,
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderWidth: mine ? 1 : 0,
                              borderColor: mine ? COLORS.accent : 'transparent',
                            }}
                          >
                            <Text style={{ fontSize: 14 }}>{EMOJI_LABELS[emoji]}</Text>
                            {count > 0 && (
                              <Text style={{ color: mine ? COLORS.accent : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{count}</Text>
                            )}
                          </TouchableOpacity>
                        )
                      })}
                      <TouchableOpacity
                        onPress={() => setCommentPR(pr)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: COLORS.card2,
                          borderRadius: 14,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          marginLeft: 'auto',
                        }}
                      >
                        <Text style={{ fontSize: 14 }}>💬</Text>
                        <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700' }}>
                          {commentCounts[pr.id] ?? 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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

      <PRCommentsModal
        visible={!!commentPR}
        prId={commentPR?.id ?? null}
        prOwnerId={commentPR?.user_id}
        prLabel={commentPR ? `${commentPR.username} · ${commentPR.exerciseName} ${commentPR.weight_kg}kg` : undefined}
        onClose={() => {
          const closingPRId = commentPR?.id
          setCommentPR(null)
          if (closingPRId && profile) {
            supabase.from('pr_comments').select('id', { count: 'exact', head: true }).eq('pr_id', closingPRId)
              .then(({ count }) => {
                setCommentCounts(prev => ({ ...prev, [closingPRId]: count ?? 0 }))
              })
          }
        }}
      />
    </ScreenBackground>
  )
}
