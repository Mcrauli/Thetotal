import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { getSBDSubRank } from '../../lib/xp'
import { useUserStore } from '../../store/userStore'
import { RankBanner } from '../../components/profile/RankBanner'
import { SBDRow } from '../../components/profile/SBDRow'
import { BadgeRow } from '../../components/profile/BadgeRow'
import { COLORS } from '../../lib/constants'
import type { RankName } from '../../lib/constants'

interface PublicProfile {
  id: string; username: string; sbd_rank: RankName; xp: number
  streak: number; bodyweight_kg: number | null; gender: string | null
  hide_sbd: boolean; hide_weight: boolean
}
interface SBDMap { squat: number; bench: number; deadlift: number }
interface Template {
  id: string; name: string
  exercises: { id: string; name: string }[]
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile: me } = useUserStore()
  const [user, setUser] = useState<PublicProfile | null>(null)
  const [sbd, setSBD] = useState<SBDMap>({ squat: 0, bench: 0, deadlift: 0 })
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [programsVisible, setProgramsVisible] = useState(false)
  const [copying, setCopying] = useState<string | null>(null)
  const [challengeVisible, setChallengeVisible] = useState(false)
  const [chalType, setChalType] = useState<'pr' | 'volume' | 'workouts'>('pr')
  const [chalExercise, setChalExercise] = useState('')
  const [chalWeight, setChalWeight] = useState('')
  const [chalDays, setChalDays] = useState(7)
  const [chalMessage, setChalMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('users').select('id, username, sbd_rank, xp, streak, bodyweight_kg, gender, hide_sbd, hide_weight').eq('id', id).single(),
      supabase.from('personal_records').select('weight_kg, exercises(name, is_sbd)').eq('user_id', id),
      supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', id),
      supabase.from('workout_templates').select('id, name, template_exercises(exercise_id, order_index, exercises(name))').eq('user_id', id).order('created_at'),
    ]).then(([{ data: u }, { data: prData }, { count }, { data: tmplData }]) => {
      if (u) setUser(u as PublicProfile)
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
      setTemplates((tmplData ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        exercises: (t.template_exercises ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((te: any) => ({ id: te.exercise_id, name: te.exercises?.name ?? '' })),
      })))
      setLoading(false)
    })
  }, [id])

  async function sendChallenge() {
    if (!me || !user) return
    setSending(true)
    if (chalType === 'pr') {
      if (!chalExercise.trim()) { setSending(false); Alert.alert('Kirjoita liike'); return }
      const w = parseFloat(chalWeight)
      if (!w || w <= 0) { setSending(false); Alert.alert('Syötä kelvollinen paino'); return }
      await supabase.from('friend_challenges').insert({
        challenger_id: me.id, challenged_id: user.id,
        challenge_type: 'pr', exercise_name: chalExercise.trim(),
        target_weight: w, message: chalMessage.trim() || null,
      })
    } else {
      await supabase.from('friend_challenges').insert({
        challenger_id: me.id, challenged_id: user.id,
        challenge_type: chalType,
        exercise_name: chalType === 'volume' ? 'Volyymi' : 'Treeniputki',
        target_weight: 0, duration_days: chalDays,
        message: chalMessage.trim() || null,
      })
    }
    setSending(false)
    setChallengeVisible(false)
    setChalExercise('')
    setChalWeight('')
    setChalMessage('')
    Alert.alert('Haaste lähetetty! 💪')
  }

  async function copyTemplate(t: Template) {
    if (!me) return
    setCopying(t.id)
    const { data: newTmpl, error } = await supabase
      .from('workout_templates')
      .insert({ user_id: me.id, name: t.name })
      .select()
      .single()
    if (error || !newTmpl) { setCopying(null); Alert.alert('Virhe', 'Kopiointi epäonnistui'); return }
    if (t.exercises.length > 0) {
      await supabase.from('template_exercises').insert(
        t.exercises.map((ex, i) => ({ template_id: newTmpl.id, exercise_id: ex.id, order_index: i }))
      )
    }
    setCopying(null)
    Alert.alert('Kopioitu!', `"${t.name}" lisätty omiin ohjelmiisi.`)
  }

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={COLORS.accent} />
    </SafeAreaView>
  )
  if (!user) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.muted }}>Käyttäjää ei löydy</Text>
    </SafeAreaView>
  )

  const subRank = getSBDSubRank(sbd.squat + sbd.bench + sbd.deadlift, user.bodyweight_kg ?? 0, user.gender !== 'female')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8, paddingRight: 16 }}>
          <Text style={{ color: COLORS.muted, fontSize: 15 }}>‹ Takaisin</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <RankBanner xp={user.xp} sbdRank={user.sbd_rank} sbdTier={subRank.tier} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{user.username}</Text>
          <TouchableOpacity
            onPress={() => setChallengeVisible(true)}
            style={{ backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>⚔️ Haasta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{totalWorkouts}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>Treeniä</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: COLORS.accent, fontWeight: '900', fontSize: 20 }}>🔥{user.streak}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>Putki</Text>
          </View>
          {!user.hide_weight && user.bodyweight_kg && (
            <View style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{user.bodyweight_kg}kg</Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>Paino</Text>
            </View>
          )}
        </View>

        {!user.hide_sbd && <SBDRow squat={sbd.squat} bench={sbd.bench} deadlift={sbd.deadlift} />}

        {templates.length > 0 && (
          <TouchableOpacity
            onPress={() => setProgramsVisible(true)}
            activeOpacity={0.8}
            style={{ backgroundColor: COLORS.card2, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Ohjelmat</Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>{templates.length} ohjelma{templates.length !== 1 ? 'a' : ''}</Text>
            </View>
            <Text style={{ color: COLORS.accent, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        )}

        <BadgeRow
          xp={user.xp} streak={user.streak}
          hasBenchPR={sbd.bench > 0} hasSquatPR={sbd.squat > 0} hasDeadliftPR={sbd.deadlift > 0}
          totalWorkouts={totalWorkouts}
        />
      </ScrollView>

      <Modal visible={challengeVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setChallengeVisible(false)}>
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Haasta {user.username}</Text>
            <TouchableOpacity onPress={() => setChallengeVisible(false)}>
              <Text style={{ color: COLORS.muted, fontSize: 15 }}>Peruuta</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>HAASTEEN TYYPPI</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {([
                { type: 'pr' as const, label: '🏆 PR', desc: 'Nosta paino' },
                { type: 'volume' as const, label: '⚡ Volyymi', desc: 'Enemmän kg' },
                { type: 'workouts' as const, label: '📅 Treenit', desc: 'Enemmän kertoja' },
              ]).map(({ type, label, desc }) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setChalType(type)}
                  style={{ flex: 1, backgroundColor: chalType === type ? COLORS.accent : COLORS.card, borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: chalType === type ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
                  <Text style={{ color: chalType === type ? 'rgba(255,255,255,0.65)' : COLORS.muted, fontSize: 10, marginTop: 2 }}>{desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {chalType === 'pr' && (
              <>
                <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>LIIKE</Text>
                <TextInput
                  style={{ backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 16, marginBottom: 10 }}
                  placeholder="esim. Squat"
                  placeholderTextColor="#555"
                  value={chalExercise}
                  onChangeText={setChalExercise}
                />
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                  {['Squat', 'Bench Press', 'Deadlift', 'OHP'].map(ex => (
                    <TouchableOpacity
                      key={ex}
                      onPress={() => setChalExercise(ex)}
                      style={{ backgroundColor: chalExercise === ex ? COLORS.accent : COLORS.card2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ color: chalExercise === ex ? '#fff' : COLORS.muted, fontSize: 12 }}>{ex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>TAVOITEPAINO (kg)</Text>
                <TextInput
                  style={{ backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20 }}
                  placeholder="esim. 140"
                  placeholderTextColor="#555"
                  value={chalWeight}
                  onChangeText={setChalWeight}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            {(chalType === 'volume' || chalType === 'workouts') && (
              <>
                <View style={{ backgroundColor: COLORS.card2, borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 13 }}>
                    {chalType === 'volume'
                      ? '⚡ Kumpi nostaa enemmän kiloja yhteensä aikarajan sisällä?'
                      : '📅 Kumpi tekee enemmän treenejä aikarajan sisällä?'}
                  </Text>
                </View>
                <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>KESTO</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                  {[7, 14, 28].map(d => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setChalDays(d)}
                      style={{ flex: 1, backgroundColor: chalDays === d ? COLORS.accent : COLORS.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                    >
                      <Text style={{ color: chalDays === d ? '#fff' : COLORS.muted, fontWeight: '700', fontSize: 14 }}>{d} pv</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>VIESTI (valinnainen)</Text>
            <TextInput
              style={{ backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', marginBottom: 28 }}
              placeholder="esim. Uskallatko yrittää?"
              placeholderTextColor="#555"
              value={chalMessage}
              onChangeText={setChalMessage}
            />
            <TouchableOpacity
              onPress={sendChallenge}
              disabled={sending}
              style={{ backgroundColor: sending ? COLORS.card2 : COLORS.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
                {sending ? 'Lähetetään...' : '⚔️ LÄHETÄ HAASTE'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={programsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setProgramsVisible(false)}>
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{user.username}n ohjelmat</Text>
            <TouchableOpacity onPress={() => setProgramsVisible(false)}>
              <Text style={{ color: COLORS.muted, fontSize: 15 }}>Sulje</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {templates.map(t => (
              <View key={t.id} style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 10 }}>{t.name}</Text>
                {t.exercises.map((ex, i) => (
                  <Text key={i} style={{ color: COLORS.muted, fontSize: 13, marginBottom: 4 }}>· {ex.name}</Text>
                ))}
                <TouchableOpacity
                  onPress={() => copyTemplate(t)}
                  disabled={copying === t.id}
                  style={{ marginTop: 14, backgroundColor: copying === t.id ? COLORS.card2 : COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                    {copying === t.id ? 'Kopioidaan...' : 'Kopioi ohjelma'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
