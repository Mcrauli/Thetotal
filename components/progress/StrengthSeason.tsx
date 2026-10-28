import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Modal, TextInput, Dimensions, ScrollView } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { LineChart } from 'react-native-gifted-charts'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { useT } from '../../lib/i18n'
import { estimateOneRepMax } from '../../lib/pr'
import { mainLiftOf, type SbdLift } from '../../lib/sbd'
import { showAlert } from '../../lib/alert'

interface Season {
  id: string
  name: string
  start_date: string
  target_date: string
  goal_squat: number | null
  goal_bench: number | null
  goal_deadlift: number | null
}

interface LiftDay {
  date: string
  e1rm: number
  form: number | null
}

const LIFTS: SbdLift[] = ['squat', 'bench', 'deadlift']
const LIFT_NAMES = ['Squat', 'Bench Press', 'Deadlift', 'Sumo Deadlift']
const WEEK_OPTIONS = [4, 6, 8, 10, 12, 16]
const DAY = 86400000
const CHART_WIDTH = Math.min(Dimensions.get('window').width, 480) - 88

function e1rmOf(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0 || reps > 10) return 0
  return estimateOneRepMax(weight, reps)
}

function goalOf(s: Season, lift: SbdLift): number | null {
  return lift === 'squat' ? s.goal_squat : lift === 'bench' ? s.goal_bench : s.goal_deadlift
}

export function StrengthSeason({ userId }: { userId: string }) {
  const t = useT()
  const [season, setSeason] = useState<Season | null | undefined>(undefined)
  const [days, setDays] = useState<Record<SbdLift, LiftDay[]>>({ squat: [], bench: [], deadlift: [] })
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    const [{ data: s }, { data: sets }] = await Promise.all([
      supabase.from('strength_seasons').select('*').eq('user_id', userId).eq('active', true).maybeSingle(),
      supabase
        .from('workout_sets')
        .select('weight_kg, reps, form, workouts!inner(user_id, started_at), exercises!inner(name)')
        .eq('workouts.user_id', userId)
        .in('exercises.name', LIFT_NAMES),
    ])
    setSeason((s as Season | null) ?? null)
    const acc: Record<SbdLift, Record<string, { e1rm: number; forms: number[] }>> = { squat: {}, bench: {}, deadlift: {} }
    for (const r of (sets ?? []) as any[]) {
      const lift = mainLiftOf(r.exercises?.name ?? '')
      const date = (r.workouts?.started_at ?? '').split('T')[0]
      if (!lift || !date) continue
      const d = (acc[lift][date] ??= { e1rm: 0, forms: [] })
      d.e1rm = Math.max(d.e1rm, e1rmOf(Number(r.weight_kg), Number(r.reps)))
      if (r.form) d.forms.push(Number(r.form))
    }
    const out = { squat: [], bench: [], deadlift: [] } as Record<SbdLift, LiftDay[]>
    for (const lift of LIFTS) {
      out[lift] = Object.entries(acc[lift])
        .filter(([, v]) => v.e1rm > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, e1rm: v.e1rm, form: v.forms.length ? v.forms.reduce((a, b) => a + b, 0) / v.forms.length : null }))
    }
    setDays(out)
  }, [userId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (season === undefined) return null

  const now = Date.now()
  const fromDate = season ? season.start_date : new Date(now - 84 * DAY).toISOString().split('T')[0]

  async function endSeason() {
    if (!season) return
    showAlert(t('season.endTitle'), t('season.endBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('season.end'), style: 'destructive', onPress: async () => {
        await supabase.from('strength_seasons').update({ active: false }).eq('id', season.id)
        load()
      } },
    ])
  }

  const totalWeeks = season ? Math.max(1, Math.round((Date.parse(season.target_date) - Date.parse(season.start_date)) / (7 * DAY))) : 0
  const weekNow = season ? Math.min(totalWeeks, Math.max(1, Math.floor((now - Date.parse(season.start_date)) / (7 * DAY)) + 1)) : 0
  const daysLeft = season ? Math.ceil((Date.parse(season.target_date) + DAY - now) / DAY) : 0

  return (
    <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 18, marginHorizontal: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ color: COLORS.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>{t('season.label')}</Text>
        {season && (
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <TouchableOpacity onPress={() => setEditing(true)}><Text style={{ color: COLORS.muted, fontSize: 12 }}>{t('common.edit')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={endSeason}><Text style={{ color: COLORS.muted, fontSize: 12 }}>{t('season.end')}</Text></TouchableOpacity>
          </View>
        )}
      </View>

      {season ? (
        <>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{season.name}</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2, marginBottom: 14 }}>
            {daysLeft > 0 ? t('season.weekOf', { week: weekNow, total: totalWeeks, days: daysLeft }) : t('season.dayReached')}
          </Text>
        </>
      ) : (
        <>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2, marginBottom: 12 }}>{t('season.pitch')}</Text>
          <TouchableOpacity onPress={() => setEditing(true)} style={{ backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{t('season.start')}</Text>
          </TouchableOpacity>
        </>
      )}

      {(season || LIFTS.some(l => days[l].length > 0)) && LIFTS.map(lift => {
        const all = days[lift]
        const inRange = all.filter(d => d.date >= fromDate)
        const before = all.filter(d => d.date < fromDate)
        const current = inRange.length ? Math.max(...inRange.map(d => d.e1rm)) : 0
        const startVal = before.length ? before[before.length - 1].e1rm : inRange[0]?.e1rm ?? 0
        const goal = season ? goalOf(season, lift) : null
        const pct = goal && goal > startVal ? Math.max(0, Math.min(1, (current - startVal) / (goal - startVal))) : 0
        const forms = inRange.filter(d => d.form != null).map(d => d.form as number)
        const formAvg = forms.length ? forms.reduce((a, b) => a + b, 0) / forms.length : null
        const formRecent = forms.length >= 2 ? forms.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, forms.length) : null
        return (
          <View key={lift} style={{ borderTopWidth: 1, borderTopColor: COLORS.cardEdge, paddingTop: 12, marginTop: 4, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t(`season.${lift}` as any)}</Text>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>
                {current > 0 ? `${current} kg` : '—'}
                {goal ? <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '400' }}>{` / ${goal} kg`}</Text> : null}
              </Text>
            </View>
            <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>
              {t('season.e1rm')}{startVal > 0 && current > 0 && current !== startVal ? ` · ${current > startVal ? '+' : ''}${current - startVal} kg` : ''}
              {formAvg != null ? ` · ${t('season.formAvg', { avg: formAvg.toFixed(1) })}` : ''}
              {formRecent != null && formAvg != null && Math.abs(formRecent - formAvg) >= 0.3 ? (formRecent > formAvg ? ' ↑' : ' ↓') : ''}
            </Text>
            {goal ? (
              <View style={{ height: 6, backgroundColor: COLORS.bg, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: pct >= 1 ? COLORS.gold : COLORS.accent }} />
              </View>
            ) : null}
            {inRange.length >= 2 && (
              <View style={{ marginTop: 8, marginLeft: -10 }}>
                <LineChart
                  data={inRange.map(d => ({ value: d.e1rm }))}
                  width={CHART_WIDTH}
                  height={70}
                  color={COLORS.accent}
                  thickness={2}
                  dataPointsColor={COLORS.gold}
                  dataPointsRadius={3}
                  hideDataPoints={inRange.length > 16}
                  yAxisTextStyle={{ color: COLORS.muted, fontSize: 9 }}
                  noOfSections={2}
                  backgroundColor="transparent"
                  rulesColor="#1e1e3a"
                  yAxisColor="transparent"
                  xAxisColor="#2a2a4a"
                  curved
                  {...(goal ? { showReferenceLine1: true, referenceLine1Position: goal, referenceLine1Config: { color: COLORS.gold, dashWidth: 4, dashGap: 4 } } : {})}
                />
              </View>
            )}
          </View>
        )
      })}

      <SeasonEditor
        visible={editing}
        season={season}
        userId={userId}
        suggestions={Object.fromEntries(LIFTS.map(l => [l, days[l].length ? Math.max(...days[l].slice(-6).map(d => d.e1rm)) : 0])) as Record<SbdLift, number>}
        onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); load() }}
      />
    </View>
  )
}

function SeasonEditor({ visible, season, userId, suggestions, onClose, onSaved }: {
  visible: boolean
  season: Season | null
  userId: string
  suggestions: Record<SbdLift, number>
  onClose: () => void
  onSaved: () => void
}) {
  const t = useT()
  const [name, setName] = useState('')
  const [weeks, setWeeks] = useState(12)
  const [goals, setGoals] = useState<Record<SbdLift, string>>({ squat: '', bench: '', deadlift: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onShow() {
    setError(null)
    if (season) {
      setName(season.name)
      setWeeks(Math.max(1, Math.round((Date.parse(season.target_date) - Date.parse(season.start_date)) / (7 * DAY))))
      setGoals({ squat: season.goal_squat ? String(season.goal_squat) : '', bench: season.goal_bench ? String(season.goal_bench) : '', deadlift: season.goal_deadlift ? String(season.goal_deadlift) : '' })
    } else {
      setName(t('season.defaultName'))
      setWeeks(12)
      setGoals({ squat: '', bench: '', deadlift: '' })
    }
  }

  useEffect(() => { if (visible) onShow() }, [visible])

  const num = (v: string) => { const n = parseFloat(v.replace(',', '.')); return n > 0 ? n : null }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const start = season?.start_date ?? new Date().toISOString().split('T')[0]
    const target = new Date(Date.parse(start) + weeks * 7 * DAY).toISOString().split('T')[0]
    const row = { name: name.trim().slice(0, 60), target_date: target, goal_squat: num(goals.squat), goal_bench: num(goals.bench), goal_deadlift: num(goals.deadlift) }
    const { error: e } = season
      ? await supabase.from('strength_seasons').update(row).eq('id', season.id)
      : await supabase.from('strength_seasons').insert({ ...row, user_id: userId, start_date: start })
    setSaving(false)
    if (e) { setError(e.message); return }
    onSaved()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 20, width: '100%', maxWidth: 420, alignSelf: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, marginBottom: 14 }}>{season ? t('season.editTitle') : t('season.start')}</Text>

            <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 6 }}>{t('season.name')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={60}
              style={{ backgroundColor: COLORS.bg, color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 14 }}
            />

            <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 6 }}>{t('season.length')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {WEEK_OPTIONS.map(w => (
                <TouchableOpacity key={w} onPress={() => setWeeks(w)} style={{ backgroundColor: weeks === w ? COLORS.accent : COLORS.card2, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t('season.weeks', { n: w })}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 6 }}>{t('season.goals')}</Text>
            {LIFTS.map(lift => (
              <View key={lift} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Text style={{ color: '#fff', width: 90 }}>{t(`season.${lift}` as any)}</Text>
                <TextInput
                  value={goals[lift]}
                  onChangeText={v => setGoals(g => ({ ...g, [lift]: v.replace(/[^0-9.,]/g, '') }))}
                  placeholder={suggestions[lift] ? String(Math.round(suggestions[lift] * 1.05 / 2.5) * 2.5) : 'kg'}
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  style={{ flex: 1, minWidth: 0, backgroundColor: COLORS.bg, color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 }}
                />
                <Text style={{ color: COLORS.muted }}>kg</Text>
              </View>
            ))}
            <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{t('season.goalHint')}</Text>

            {error && <Text style={{ color: COLORS.accent, marginTop: 10 }}>{error}</Text>}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, backgroundColor: COLORS.card2, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={saving || !name.trim()} style={{ flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: saving || !name.trim() ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}
