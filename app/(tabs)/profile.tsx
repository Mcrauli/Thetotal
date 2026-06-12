import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Switch, FlatList, Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, router } from 'expo-router'
import { useUserStore } from '../../store/userStore'
import { RankBanner } from '../../components/profile/RankBanner'
import { SBDRow } from '../../components/profile/SBDRow'
import { BadgeRow, ALL_BADGES, getUnlockedBadgeIds } from '../../components/profile/BadgeRow'
import { RanksModal } from '../../components/ui/RanksModal'
import { ScreenBackground } from '../../components/ui/ScreenBackground'
import { ChallengesSection } from '../../components/profile/ChallengesSection'
import { SBDEditModal } from '../../components/profile/SBDEditModal'
import { ShareRankModal } from '../../components/profile/ShareRankModal'
import { getSBDSubRank, getSBDRank } from '../../lib/xp'
import { calcDOTS } from '../../lib/dots'
import { StatNumber } from '../../components/ui/StatNumber'
import { estimateOneRepMax, shouldShowEstimatedOneRepMax } from '../../lib/pr'
import { getNewlyCompleted } from '../../lib/challenges'
import { useT, useLocaleStore } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { unblockUser } from '../../lib/moderation'
import { exportUserData } from '../../lib/dataExport'
import { COLORS } from '../../lib/constants'

interface PRMap { squat: number; bench: number; deadlift: number }

interface PRRecord {
  weight_kg: number
  reps: number
  recorded_at: string
  verified: boolean
  exercises: { name: string; is_sbd: boolean }
}

export default function ProfileScreen() {
  const t = useT()
  const localePref = useLocaleStore(s => s.pref)
  const setLocalePref = useLocaleStore(s => s.setPref)
  const { profile, signOut, loading, fetchProfile } = useUserStore()
  const [sbd, setSBD] = useState<PRMap>({ squat: 0, bench: 0, deadlift: 0 })
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [prRecords, setPrRecords] = useState<PRRecord[]>([])
  const [ranksVisible, setRanksVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([])
  const [duelWins, setDuelWins] = useState(0)
  const [shareVisible, setShareVisible] = useState(false)
  const [blockedVisible, setBlockedVisible] = useState(false)
  const [blockedList, setBlockedList] = useState<{ id: string; username: string }[]>([])
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!profile || exporting) return
    setExporting(true)
    try {
      await exportUserData(profile.id)
    } catch {
      Alert.alert(t('data.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  async function loadBlocked() {
    if (!profile) return
    const { data: blocks } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', profile.id)
    const ids = (blocks ?? []).map((b: any) => b.blocked_id)
    if (ids.length === 0) { setBlockedList([]); return }
    const { data: users } = await supabase.from('users').select('id, username').in('id', ids)
    const nameById: Record<string, string> = {}
    for (const u of (users ?? []) as any[]) nameById[u.id] = u.username
    setBlockedList(ids.map((id: string) => ({ id, username: nameById[id] ?? '?' })))
  }

  async function handleUnblock(blockedId: string) {
    if (!profile) return
    await unblockUser(profile.id, blockedId)
    setBlockedList(prev => prev.filter(b => b.id !== blockedId))
  }
  const [sbdEditVisible, setSbdEditVisible] = useState(false)
  const [bwInput, setBwInput] = useState('')
  const [usernameVisible, setUsernameVisible] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [pinnedPRs, setPinnedPRs] = useState<string[]>([])
  const [pinModalVisible, setPinModalVisible] = useState(false)
  const [pinnedBadges, setPinnedBadges] = useState<string[]>([])
  const [badgeModalVisible, setBadgeModalVisible] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!profile) return
    fetchData(profile.id)
    AsyncStorage.getItem(`pinned_prs_${profile.id}`).then(val => {
      if (val) setPinnedPRs(JSON.parse(val))
    })
    AsyncStorage.getItem(`pinned_badges_${profile.id}`).then(val => {
      if (val) setPinnedBadges(JSON.parse(val))
    })
  }, [profile?.id]))

  async function savePinnedPRs(names: string[]) {
    if (!profile) return
    setPinnedPRs(names)
    await AsyncStorage.setItem(`pinned_prs_${profile.id}`, JSON.stringify(names))
  }

  async function savePinnedBadges(ids: string[]) {
    if (!profile) return
    setPinnedBadges(ids)
    await AsyncStorage.setItem(`pinned_badges_${profile.id}`, JSON.stringify(ids))
  }

  async function fetchData(userId: string) {
    const [{ data: prData }, { count }] = await Promise.all([
      supabase.from('personal_records').select('weight_kg, reps, recorded_at, verified, exercises(name, is_sbd)').eq('user_id', userId).order('recorded_at', { ascending: false }),
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
      setPrRecords(prData as PRRecord[])
    }
    setTotalWorkouts(count ?? 0)
    const { data: challengeData } = await supabase
      .from('user_challenges').select('challenge_id').eq('user_id', userId)
    const alreadyDone = (challengeData ?? []).map((r: any) => r.challenge_id)

    const { data: duels } = await supabase
      .from('friend_challenges')
      .select('challenger_id, challenged_id, challenger_value, challenged_value')
      .eq('status', 'beaten')
      .in('challenge_type', ['volume', 'workouts'])
      .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    const wins = (duels ?? []).filter((d: any) => {
      const cv = d.challenger_value ?? 0, dv = d.challenged_value ?? 0
      if (cv === dv) return false
      const winnerId = cv > dv ? d.challenger_id : d.challenged_id
      return winnerId === userId
    }).length
    setDuelWins(wins)

    const newDuelChallenges = getNewlyCompleted(
      { totalWorkouts: 0, streak: 0, squat: 0, bench: 0, deadlift: 0, duelWins: wins },
      alreadyDone
    ).filter(c => c.id.startsWith('duel_win_'))
    if (newDuelChallenges.length > 0) {
      await supabase.from('user_challenges').insert(
        newDuelChallenges.map(c => ({ user_id: userId, challenge_id: c.id }))
      )
      setCompletedChallenges([...alreadyDone, ...newDuelChallenges.map(c => c.id)])
    } else {
      setCompletedChallenges(alreadyDone)
    }
  }

  async function saveUsername() {
    if (!profile) return
    const u = usernameInput.trim()
    if (!u || u.length < 3) { Alert.alert(t('profile.usernameShort')); return }
    setSaving(true)
    const { error } = await supabase.from('users').update({ username: u }).eq('id', profile.id)
    if (error) { Alert.alert(t('common.error'), error.message.includes('unique') ? t('profile.usernameTaken') : error.message); setSaving(false); return }
    await fetchProfile()
    setSaving(false)
    setUsernameVisible(false)
  }

  async function deleteAccount() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      await supabase.auth.signOut()
    } catch {
      Alert.alert(t('common.error'), t('profile.deleteFailed'))
    }
  }

  async function saveBodyweight() {
    if (!profile) return
    const bw = parseFloat(bwInput)
    if (!bw || bw <= 0) { Alert.alert(t('profile.enterValidWeight')); return }
    setSaving(true)
    const total = sbd.squat + sbd.bench + sbd.deadlift
    const isMale = profile.gender !== 'female'
    const newSBDRank = getSBDRank(total, bw, isMale)
    await supabase.from('users').update({ bodyweight_kg: bw, sbd_rank: newSBDRank }).eq('id', profile.id)
    await fetchProfile()
    setSaving(false)
    setEditVisible(false)
  }

  useEffect(() => { if (!profile && !loading) fetchProfile() }, [])
  if (!profile) return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center">
      <TouchableOpacity onPress={signOut} className="py-3 px-6">
        <Text className="text-muted">{t('profile.signOut')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )

  const sbdTotal = sbd.squat + sbd.bench + sbd.deadlift
  const isMale = profile.gender !== 'female'
  const subRank = getSBDSubRank(sbdTotal, profile.bodyweight_kg ?? 0, isMale)
  const dots = calcDOTS(sbdTotal, profile.bodyweight_kg ?? 0, isMale)

  return (
    <ScreenBackground variant="profile">
      <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <RankBanner
          xp={profile.xp}
          sbdRank={profile.sbd_rank}
          sbdTier={subRank.tier}
          onPressRank={() => setRanksVisible(true)}
        />
        <RanksModal
          visible={ranksVisible}
          onClose={() => setRanksVisible(false)}
          currentRank={profile.sbd_rank}
          currentTier={subRank.tier}
          ratio={subRank.ratio}
        />

        {dots > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 14, paddingVertical: 12, marginBottom: 8 }}>
            <Text style={{ color: COLORS.muted, fontSize: 11, letterSpacing: 2 }}>{t('dots.label')}</Text>
            <StatNumber value={dots} size={22} color={COLORS.gold} />
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShareVisible(true)}
          style={{ backgroundColor: COLORS.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 16 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{t('share.button')}</Text>
        </TouchableOpacity>

        <ShareRankModal
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          username={profile.username}
          sbdRank={profile.sbd_rank}
          tier={subRank.tier}
          ratio={subRank.ratio}
          sbdTotal={sbdTotal}
          streak={profile.streak}
          totalWorkouts={totalWorkouts}
          duelWins={duelWins}
          dots={dots}
        />

        <Modal visible={blockedVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBlockedVisible(false)}>
          <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{t('mod.blockedUsers')}</Text>
              <TouchableOpacity onPress={() => setBlockedVisible(false)}>
                <Text style={{ color: COLORS.muted, fontSize: 15 }}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {blockedList.length === 0 ? (
                <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 24 }}>{t('mod.noBlocked')}</Text>
              ) : blockedList.map(b => (
                <View key={b.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{b.username}</Text>
                  <TouchableOpacity onPress={() => handleUnblock(b.id)} style={{ backgroundColor: COLORS.card2, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
                    <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '700' }}>{t('mod.unblock')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>

        <TouchableOpacity
          className="mb-4 flex-row items-center gap-2"
          onPress={() => { setUsernameInput(profile.username); setUsernameVisible(true) }}
        >
          <Text className="text-white text-xl font-black">{profile.username}</Text>
          <Text className="text-muted text-xs">✎</Text>
        </TouchableOpacity>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-card rounded-2xl p-3 items-center">
            <StatNumber value={totalWorkouts} size={22} />
            <Text className="text-muted text-xs">{t('profile.workouts')}</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 items-center">
            <StatNumber value={profile.streak} size={22} color={COLORS.accent} style={{ marginLeft: 2 }} unit="" />
            <Text className="text-muted text-xs">🔥 {t('profile.streakLabel')}</Text>
          </View>
          <TouchableOpacity
            className="flex-1 bg-card rounded-2xl p-3 items-center"
            onPress={() => { setBwInput(profile.bodyweight_kg?.toString() ?? ''); setEditVisible(true) }}
          >
            {profile.bodyweight_kg ? (
              <StatNumber value={profile.bodyweight_kg} unit="kg" size={22} unitColor={COLORS.muted} />
            ) : (
              <Text className="text-white font-bold text-xl">—</Text>
            )}
            <Text className="text-muted text-xs">{t('profile.weightLabel')}</Text>
          </TouchableOpacity>
        </View>

        <SBDRow
          squat={sbd.squat}
          bench={sbd.bench}
          deadlift={sbd.deadlift}
          squatVerified={!!prRecords.find(r => r.exercises?.name === 'Squat')?.verified}
          benchVerified={!!prRecords.find(r => r.exercises?.name === 'Bench Press')?.verified}
          deadliftVerified={!!prRecords.find(r => r.exercises?.name === 'Deadlift')?.verified}
          onPress={() => setSbdEditVisible(true)}
        />
        <SBDEditModal
          visible={sbdEditVisible}
          onClose={() => setSbdEditVisible(false)}
          initial={sbd}
          onSaved={() => profile && fetchData(profile.id)}
        />

        {prRecords.length > 0 && (() => {
          const activePins = pinnedPRs.length > 0
            ? pinnedPRs
            : ['Squat', 'Bench Press', 'Deadlift']
          const pinned = activePins
            .map(name => prRecords.find(r => r.exercises?.name === name))
            .filter(Boolean) as PRRecord[]
          return (
            <View style={{ marginBottom: 16, backgroundColor: COLORS.card, borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2 }}>{t('profile.records')}</Text>
                <TouchableOpacity onPress={() => setPinModalVisible(true)}>
                  <Text style={{ color: COLORS.accent, fontSize: 12 }}>{t('profile.editPin')}</Text>
                </TouchableOpacity>
              </View>
              {pinned.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {pinned.map(pr => (
                    <View key={pr.exercises?.name} style={{ flex: 1, backgroundColor: COLORS.card2, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                      <StatNumber value={pr.weight_kg} unit="kg" size={24} color={COLORS.gold} unitColor={COLORS.muted} />
                      {pr.reps > 1 && (
                        <Text style={{ color: COLORS.muted, fontSize: 10 }}>{pr.reps} {t('profile.repsLabel')}</Text>
                      )}
                      {shouldShowEstimatedOneRepMax(pr.reps) && (
                        <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>≈ {estimateOneRepMax(pr.weight_kg, pr.reps)}kg 1RM</Text>
                      )}
                      <Text style={{ color: '#fff', fontSize: 11, marginTop: 2, textAlign: 'center' }} numberOfLines={1}>{pr.exercises?.name}</Text>
                      {pr.exercises?.is_sbd && (
                        pr.verified
                          ? <Text style={{ color: '#4ade80', fontSize: 9, marginTop: 3, fontWeight: '700' }}>{t('profile.verified')}</Text>
                          : <Text style={{ color: COLORS.muted, fontSize: 9, marginTop: 3, fontStyle: 'italic' }}>{t('profile.askVerification')}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })()}

        {duelWins > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 28, marginRight: 12 }}>🥊</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2 }}>{t('profile.duelWins')}</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 }}>{t('profile.duelWinsValue', { n: String(duelWins) })}</Text>
            </View>
          </View>
        )}

        <ChallengesSection completedIds={completedChallenges} />

        <BadgeRow
          xp={profile.xp}
          streak={profile.streak}
          hasBenchPR={sbd.bench > 0}
          hasSquatPR={sbd.squat > 0}
          hasDeadliftPR={sbd.deadlift > 0}
          totalWorkouts={totalWorkouts}
          featured={pinnedBadges}
          onEditPress={() => setBadgeModalVisible(true)}
          editLabel={t('profile.editPin')}
        />

        <View style={{ marginTop: 24, backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden' }}>
          <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, padding: 16, paddingBottom: 8 }}>{t('profile.privacySection')}</Text>
          {([
            { key: 'hide_sbd', label: t('profile.hideSBD') },
            { key: 'hide_weight', label: t('profile.hideWeight') },
          ] as const).map(({ key, label }, i) => (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: COLORS.card2 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{label}</Text>
              <Switch
                value={profile[key] ?? false}
                onValueChange={async (val) => {
                  await supabase.from('users').update({ [key]: val }).eq('id', profile.id)
                  await fetchProfile()
                }}
                trackColor={{ false: COLORS.card2, true: COLORS.accent }}
                thumbColor="#fff"
              />
            </View>
          ))}
          <TouchableOpacity
            onPress={() => { loadBlocked(); setBlockedVisible(true) }}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLORS.card2 }}
          >
            <Text style={{ color: '#fff', fontSize: 14 }}>{t('mod.blockedUsers')}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24, backgroundColor: COLORS.card, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>{t('language.section')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['system', 'fi', 'en'] as const).map(opt => {
              const active = localePref === opt
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setLocalePref(opt)}
                  style={{ flex: 1, backgroundColor: active ? COLORS.accent : COLORS.card2, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: active ? '#fff' : COLORS.muted, fontWeight: '700', fontSize: 13 }}>{t(`language.${opt}` as any)}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/tutorial')}
          style={{ marginTop: 16, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>📖 {t('profile.replayTutorial')}</Text>
          <Text style={{ color: COLORS.muted, fontSize: 16 }}>›</Text>
        </TouchableOpacity>

        {Platform.OS !== 'ios' && (
          <View style={{ marginTop: 24, backgroundColor: COLORS.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>☕</Text>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 }}>{t('profile.supportTitle')}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', marginBottom: 14 }}>
              {t('profile.supportBody')}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://ko-fi.com/thetotal')}
              style={{ backgroundColor: '#FF5E5B', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{t('profile.supportButton')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity className="mt-4 items-center py-3" onPress={signOut}>
          <Text className="text-muted text-sm">{t('profile.signOut')}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => Linking.openURL('https://mcrauli.github.io/Thetotal/terms.html')}>
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>{t('profile.terms')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://mcrauli.github.io/Thetotal/privacy.html')}>
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>{t('profile.privacy')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="items-center py-3" onPress={handleExport} disabled={exporting}>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>{exporting ? t('data.exporting') : t('data.export')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-8 items-center py-3"
          onPress={() => Alert.alert(
            t('profile.deleteTitle'),
            t('profile.deleteBody'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('profile.deleteTitle'), style: 'destructive', onPress: deleteAccount },
            ]
          )}
        >
          <Text style={{ color: '#ef4444', fontSize: 13 }}>{t('profile.deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={usernameVisible} transparent animationType="fade" onRequestClose={() => setUsernameVisible(false)}>
        <View className="flex-1 bg-black/70 justify-center px-8">
          <View className="bg-card rounded-2xl p-6">
            <Text className="text-white font-black text-lg mb-4">{t('profile.changeUsername')}</Text>
            <TextInput
              className="bg-bg rounded-xl px-4 py-3 text-white mb-4"
              placeholder={t('profile.newUsername')}
              placeholderTextColor="#888"
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 bg-bg rounded-xl py-3 items-center" onPress={() => setUsernameVisible(false)}>
                <Text className="text-muted">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-accent rounded-xl py-3 items-center ${saving ? 'opacity-50' : ''}`}
                onPress={saveUsername}
                disabled={saving}
              >
                <Text className="text-white font-bold">{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View className="flex-1 bg-black/70 justify-center px-8">
          <View className="bg-card rounded-2xl p-6">
            <Text className="text-white font-black text-lg mb-4">{t('profile.updateWeight')}</Text>
            <TextInput
              className="bg-bg rounded-xl px-4 py-3 text-white mb-4"
              placeholder={t('profile.weightPlaceholder')}
              placeholderTextColor="#888"
              value={bwInput}
              onChangeText={setBwInput}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text className="text-muted text-xs mb-4">{t('profile.weightHint')}</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 bg-bg rounded-xl py-3 items-center" onPress={() => setEditVisible(false)}>
                <Text className="text-muted">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-accent rounded-xl py-3 items-center ${saving ? 'opacity-50' : ''}`}
                onPress={saveBodyweight}
                disabled={saving}
              >
                <Text className="text-white font-bold">{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 20, maxHeight: '80%' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, marginBottom: 4 }}>Valitse 3 PR:ää</Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 16 }}>Nämä näkyvät kultaisina kortteina ({pinnedPRs.length}/3)</Text>
            <FlatList
              data={prRecords}
              keyExtractor={item => item.exercises?.name ?? ''}
              renderItem={({ item }) => {
                const name = item.exercises?.name ?? ''
                const selected = pinnedPRs.includes(name)
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (selected) {
                        savePinnedPRs(pinnedPRs.filter(n => n !== name))
                      } else if (pinnedPRs.length < 3) {
                        savePinnedPRs([...pinnedPRs, name])
                      }
                    }}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.card2 }}
                  >
                    <View>
                      <Text style={{ color: selected ? COLORS.gold : '#fff', fontWeight: selected ? '700' : '400', fontSize: 14 }}>{name}</Text>
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{item.weight_kg}kg{item.reps > 1 ? ` × ${item.reps}` : ''}</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? COLORS.gold : COLORS.muted, backgroundColor: selected ? COLORS.gold : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                      {selected && <Text style={{ color: COLORS.bg, fontSize: 12, fontWeight: '900' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                )
              }}
              style={{ marginBottom: 16 }}
            />
            <TouchableOpacity
              style={{ backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              onPress={() => setPinModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Valmis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={badgeModalVisible} transparent animationType="fade" onRequestClose={() => setBadgeModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 20 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, marginBottom: 4 }}>Valitse badget</Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 16 }}>
              {pinnedBadges.length === 0 ? 'Näytetään kaikki avoimet' : `Valittuna ${pinnedBadges.length} kpl`}
            </Text>
            {(() => {
              const unlockedIds = new Set(getUnlockedBadgeIds({
                xp: profile.xp, streak: profile.streak,
                hasBenchPR: sbd.bench > 0, hasSquatPR: sbd.squat > 0, hasDeadliftPR: sbd.deadlift > 0,
                totalWorkouts,
              }))
              return ALL_BADGES.map(b => {
                const unlocked = unlockedIds.has(b.id)
                const selected = pinnedBadges.includes(b.id)
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => {
                      if (!unlocked) return
                      if (selected) savePinnedBadges(pinnedBadges.filter(id => id !== b.id))
                      else savePinnedBadges([...pinnedBadges, b.id])
                    }}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.card2, opacity: unlocked ? 1 : 0.3 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 22 }}>{b.icon}</Text>
                      <Text style={{ color: selected ? COLORS.gold : '#fff', fontSize: 14 }}>{b.label}</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? COLORS.gold : COLORS.muted, backgroundColor: selected ? COLORS.gold : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                      {selected && <Text style={{ color: COLORS.bg, fontSize: 12, fontWeight: '900' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                )
              })
            })()}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => { savePinnedBadges([]); setBadgeModalVisible(false) }}
                style={{ flex: 1, backgroundColor: COLORS.card2, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Näytä kaikki</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBadgeModalVisible(false)}
                style={{ flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Valmis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      </SafeAreaView>
    </ScreenBackground>
  )
}
