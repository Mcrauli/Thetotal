import { useCallback, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { ScreenBackground } from '../../components/ui/ScreenBackground'
import { getRankData } from '../../lib/xp'
import { COLORS } from '../../lib/constants'
import type { RankName } from '../../lib/constants'

interface UserProfile {
  id: string; username: string; sbd_rank: RankName; xp: number
  bodyweight_kg: number | null; sbd_total: number
}

interface Challenge {
  id: string; challenger_id: string; challenged_id: string
  exercise_name: string; target_weight: number; message: string | null
  status: string; created_at: string
  challenge_type?: string; duration_days?: number | null
  challenger_value?: number; challenged_value?: number
  challenger?: { username: string; sbd_rank: RankName }
  challenged?: { username: string }
}

const RANK_ORDER: RankName[] = ['Aloittelija','Harrastaja','Kilpailija','Alueellinen','Kansallinen','Kansainvälinen','Eliitti','Mestari','Maailmaluokka','Legenda']

export default function SocialScreen() {
  const { profile } = useUserStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserProfile[]>([])
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [pending, setPending] = useState<{ id: string; sender: UserProfile }[]>([])
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [searching, setSearching] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!profile) return
    loadSocial(profile.id)
  }, [profile?.id]))

  async function loadSocial(userId: string) {
    const { data: fs } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    if (!fs) return

    const friendIds = fs.filter(f => f.status === 'accepted')
      .map(f => f.user_id === userId ? f.friend_id : f.user_id)
    const pendingIncoming = fs.filter(f => f.status === 'pending' && f.friend_id === userId)
    setSentIds(new Set(fs.filter(f => f.status === 'pending' && f.user_id === userId).map(f => f.friend_id)))

    const [friendData, challengeData] = await Promise.all([
      friendIds.length > 0
        ? supabase.from('users').select('id, username, sbd_rank, xp, bodyweight_kg, sbd_total').in('id', friendIds)
        : { data: [] },
      supabase.from('friend_challenges')
        .select('id, challenger_id, challenged_id, exercise_name, target_weight, message, status, created_at, challenge_type, duration_days, challenger_value, challenged_value')
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .in('status', ['pending', 'beaten'])
        .order('created_at', { ascending: false }),
    ])

    setFriends((friendData.data ?? []) as UserProfile[])

    if (pendingIncoming.length > 0) {
      const { data } = await supabase.from('users').select('id, username, sbd_rank, xp, bodyweight_kg, sbd_total').in('id', pendingIncoming.map(f => f.user_id))
      const senderMap: Record<string, UserProfile> = {}
      ;(data ?? []).forEach((u: any) => { senderMap[u.id] = u })
      setPending(pendingIncoming.map(f => ({ id: f.id, sender: senderMap[f.user_id] })).filter(p => p.sender))
    } else {
      setPending([])
    }

    // Enrich challenges with usernames
    const rawChallenges = (challengeData.data ?? []) as Challenge[]
    const allIds = [...new Set(rawChallenges.flatMap(c => [c.challenger_id, c.challenged_id]).filter(id => id !== userId))]
    if (allIds.length > 0) {
      const { data: uData } = await supabase.from('users').select('id, username, sbd_rank').in('id', allIds)
      const uMap: Record<string, any> = {}
      ;(uData ?? []).forEach((u: any) => { uMap[u.id] = u })
      setChallenges(rawChallenges.map(c => ({
        ...c,
        challenger: uMap[c.challenger_id],
        challenged: uMap[c.challenged_id],
      })))
    } else {
      setChallenges(rawChallenges)
    }
  }

  async function searchUsers() {
    if (!query.trim() || !profile) return
    setSearching(true)
    const { data } = await supabase.from('users')
      .select('id, username, sbd_rank, xp, bodyweight_kg, sbd_total')
      .ilike('username', `%${query.trim()}%`)
      .neq('id', profile.id).limit(10)
    setResults((data ?? []) as UserProfile[])
    setSearching(false)
  }

  async function sendRequest(toId: string) {
    if (!profile) return
    await supabase.from('friendships').insert({ user_id: profile.id, friend_id: toId })
    setSentIds(prev => new Set(prev).add(toId))
  }

  async function acceptRequest(friendshipId: string) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    if (profile) loadSocial(profile.id)
  }

  async function declineRequest(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setPending(prev => prev.filter(p => p.id !== friendshipId))
  }

  const sortedFriends = [...friends].sort((a, b) => {
    const ratioA = a.bodyweight_kg ? (a.sbd_total ?? 0) / a.bodyweight_kg : 0
    const ratioB = b.bodyweight_kg ? (b.sbd_total ?? 0) / b.bodyweight_kg : 0
    return ratioB - ratioA || RANK_ORDER.indexOf(b.sbd_rank) - RANK_ORDER.indexOf(a.sbd_rank)
  })

  const myChallenges = challenges.filter(c => c.challenged_id === profile?.id && c.status === 'pending')
  const sentChallenges = challenges.filter(c => c.challenger_id === profile?.id)

  function RankTag({ rank }: { rank: RankName }) {
    const rd = getRankData(rank)
    return <Text style={{ color: rd.color, fontSize: 12, marginTop: 2 }}>{rank}</Text>
  }

  function ratio(f: UserProfile) {
    if (!f.bodyweight_kg || !f.sbd_total) return null
    return (f.sbd_total / f.bodyweight_kg).toFixed(2)
  }

  return (
    <ScreenBackground variant="log">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 16 }}>Kaverit</Text>

          {/* Search */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TextInput
              style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff' }}
              placeholder="Hae käyttäjänimellä..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchUsers}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={{ backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' }}
              onPress={searchUsers}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Hae</Text>
            </TouchableOpacity>
          </View>

          {searching && <ActivityIndicator color={COLORS.accent} style={{ marginBottom: 16 }} />}

          {results.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>HAKUTULOKSET</Text>
              {results.map(u => {
                const isFriend = friends.some(f => f.id === u.id)
                const isPending = sentIds.has(u.id)
                return (
                  <TouchableOpacity key={u.id} onPress={() => router.push(`/user/${u.id}` as any)} activeOpacity={0.8}>
                    <View style={{ backgroundColor: COLORS.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>{u.username}</Text>
                        <RankTag rank={u.sbd_rank} />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        {isFriend ? (
                          <Text style={{ color: COLORS.muted, fontSize: 12 }}>Kaveri ✓</Text>
                        ) : isPending ? (
                          <Text style={{ color: COLORS.muted, fontSize: 12 }}>Lähetetty</Text>
                        ) : (
                          <TouchableOpacity style={{ backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => sendRequest(u.id)}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>+ Lisää</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* Incoming friend requests */}
          {pending.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>KAVERIPYYNNÖT ({pending.length})</Text>
              {pending.map(p => (
                <View key={p.id} style={{ backgroundColor: COLORS.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{p.sender.username}</Text>
                    <RankTag rank={p.sender.sbd_rank} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={{ backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => acceptRequest(p.id)}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Hyväksy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: COLORS.card2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => declineRequest(p.id)}>
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>Hylkää</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Incoming challenges */}
          {myChallenges.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>HAASTEET ({myChallenges.length})</Text>
              {myChallenges.map(c => {
                const isDuel = c.challenge_type === 'volume' || c.challenge_type === 'workouts'
                const expiresAt = c.duration_days ? new Date(new Date(c.created_at).getTime() + c.duration_days * 86400000) : null
                const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null
                return (
                  <View key={c.id} style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: COLORS.accent }}>
                    <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                      {c.challenger?.username ?? '?'} haastaa sinut!
                    </Text>
                    {isDuel ? (
                      <>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                          {c.challenge_type === 'volume' ? '⚡ Volyymi' : '📅 Treeniputki'} — {c.duration_days} pv
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                          <View style={{ flex: 1, backgroundColor: COLORS.card2, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.muted, fontSize: 10 }}>Sinä</Text>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                              {c.challenge_type === 'volume' ? `${c.challenged_value ?? 0} kg` : `${c.challenged_value ?? 0}`}
                            </Text>
                          </View>
                          <View style={{ flex: 1, backgroundColor: COLORS.card2, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.muted, fontSize: 10 }}>{c.challenger?.username ?? '?'}</Text>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                              {c.challenge_type === 'volume' ? `${c.challenger_value ?? 0} kg` : `${c.challenger_value ?? 0}`}
                            </Text>
                          </View>
                        </View>
                        {daysLeft !== null && <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 6 }}>⏰ {daysLeft} päivää jäljellä</Text>}
                      </>
                    ) : (
                      <>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
                          {c.exercise_name} › {c.target_weight} kg
                        </Text>
                        {c.message ? <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>"{c.message}"</Text> : null}
                        <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 6 }}>Nosta enemmän voittaaksesi 💪</Text>
                      </>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* Sent challenges */}
          {sentChallenges.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>LÄHETETYT HAASTEET</Text>
              {sentChallenges.map(c => {
                const isDuel = c.challenge_type === 'volume' || c.challenge_type === 'workouts'
                const expiresAt = c.duration_days ? new Date(new Date(c.created_at).getTime() + c.duration_days * 86400000) : null
                const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null
                return (
                  <View key={c.id} style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 8 }}>
                    {isDuel ? (
                      <>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
                          {c.challenged?.username ?? '?'} — {c.challenge_type === 'volume' ? '⚡ Volyymi' : '📅 Treeniputki'} {c.duration_days} pv
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                          <View style={{ flex: 1, backgroundColor: COLORS.card2, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.muted, fontSize: 10 }}>Sinä</Text>
                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                              {c.challenge_type === 'volume' ? `${c.challenger_value ?? 0} kg` : `${c.challenger_value ?? 0}`}
                            </Text>
                          </View>
                          <View style={{ flex: 1, backgroundColor: COLORS.card2, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.muted, fontSize: 10 }}>{c.challenged?.username ?? '?'}</Text>
                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                              {c.challenge_type === 'volume' ? `${c.challenged_value ?? 0} kg` : `${c.challenged_value ?? 0}`}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                          {c.status === 'beaten' ? '✅ Päättynyt' : daysLeft !== null ? `⏰ ${daysLeft} pv jäljellä` : '⏳ Odottaa...'}
                        </Text>
                      </>
                    ) : (
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                          {c.challenged?.username ?? '?'} — {c.exercise_name} {c.target_weight}kg
                        </Text>
                        <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>
                          {c.status === 'beaten' ? '✅ Voitti!' : '⏳ Odottaa...'}
                        </Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* Leaderboard */}
          <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
            RANKING {sortedFriends.length > 0 ? `— ${sortedFriends.length} kaveria` : ''}
          </Text>
          {sortedFriends.length === 0 ? (
            <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center' }}>
              <Text style={{ color: COLORS.muted, textAlign: 'center' }}>Ei kavereita vielä.{'\n'}Hae käyttäjänimiä ylhäältä!</Text>
            </View>
          ) : (
            sortedFriends.map((f, i) => {
              const rd = getRankData(f.sbd_rank)
              const bwRatio = ratio(f)
              return (
                <TouchableOpacity key={f.id} onPress={() => router.push(`/user/${f.id}` as any)} activeOpacity={0.8}>
                  <View style={{ backgroundColor: COLORS.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ color: COLORS.muted, fontWeight: '700', width: 28, fontSize: 13 }}>#{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{f.username}</Text>
                      <Text style={{ color: rd.color, fontSize: 12, marginTop: 1 }}>{f.sbd_rank}</Text>
                    </View>
                    {bwRatio && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{bwRatio}×</Text>
                        <Text style={{ color: COLORS.muted, fontSize: 11 }}>BW</Text>
                      </View>
                    )}
                    <Text style={{ color: COLORS.muted, fontSize: 18 }}>›</Text>
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  )
}
