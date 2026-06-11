import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { PRESET_TEMPLATES, type PresetTemplate } from '../../lib/preset-templates'
import { COLORS } from '../../lib/constants'
import { useT } from '../../lib/i18n'

interface Template {
  id: string
  name: string
  exercises: { exerciseId: string; exerciseName: string; muscleGroup?: string }[]
}

export default function StartWorkoutScreen() {
  const t = useT()
  const { profile } = useUserStore()
  const { startWorkout, startFromTemplate } = useWorkoutStore()
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    if (!profile) return
    supabase
      .from('workout_templates')
      .select('id, name, template_exercises(exercise_id, order_index, exercises(name, muscle_group))')
      .eq('user_id', profile.id)
      .order('created_at')
      .then(({ data }) => {
        setTemplates((data ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          exercises: (t.template_exercises ?? [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((te: any) => ({ exerciseId: te.exercise_id, exerciseName: te.exercises?.name ?? '', muscleGroup: te.exercises?.muscle_group })),
        })))
      })
  }, [profile?.id])

  function handleBlank() {
    startWorkout()
    router.replace('/(tabs)/active')
  }

  async function handleTemplate(t: Template) {
    const ids = t.exercises.map(e => e.exerciseId)
    const lastWeights: Record<string, { weight: number; reps: number }> = {}

    if (ids.length > 0 && profile) {
      const { data } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, exercise_id, workout_id, workouts!inner(started_at, user_id)')
        .in('exercise_id', ids)
        .eq('workouts.user_id', profile.id)
        .order('workouts.started_at', { ascending: false })
        .limit(ids.length * 10)

      const seen = new Set<string>()
      for (const s of (data ?? []) as any[]) {
        if (!seen.has(s.exercise_id)) {
          seen.add(s.exercise_id)
          lastWeights[s.exercise_id] = { weight: s.weight_kg, reps: s.reps }
        }
      }
    }

    startFromTemplate(t.name, t.exercises, lastWeights)
    router.replace('/(tabs)/active')
  }

  async function resolvePresetToTemplate(p: PresetTemplate): Promise<Template | null> {
    const { data: exData } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .in('name', p.exerciseNames)
    if (!exData || exData.length === 0) {
      Alert.alert(t('common.error'), t('start.noExercises'))
      return null
    }
    const byName: Record<string, any> = {}
    for (const ex of exData as any[]) byName[ex.name] = ex
    const exercises = p.exerciseNames
      .filter(n => byName[n])
      .map(n => ({
        exerciseId: byName[n].id,
        exerciseName: byName[n].name,
        muscleGroup: byName[n].muscle_group,
      }))
    return { id: p.id, name: t(`preset.${p.id}.name` as any), exercises }
  }

  async function handlePresetStart(p: PresetTemplate) {
    const tmpl = await resolvePresetToTemplate(p)
    if (tmpl) handleTemplate(tmpl)
  }

  async function handlePresetSave(p: PresetTemplate) {
    if (!profile) return
    const tmpl = await resolvePresetToTemplate(p)
    if (!tmpl || tmpl.exercises.length === 0) return
    const { data: newTmpl, error } = await supabase
      .from('workout_templates')
      .insert({ user_id: profile.id, name: tmpl.name })
      .select('id')
      .single()
    if (error || !newTmpl) { Alert.alert(t('common.error'), ''); return }
    await supabase.from('template_exercises').insert(
      tmpl.exercises.map((ex, i) => ({ template_id: newTmpl.id, exercise_id: ex.exerciseId, order_index: i }))
    )
    setTemplates(prev => [...prev, { id: newTmpl.id, name: tmpl.name, exercises: tmpl.exercises }])
    Alert.alert(t('start.saved'), t('start.savedBody', { name: tmpl.name }))
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-4"
        style={{ borderBottomWidth: 1, borderBottomColor: COLORS.card }}>
        <Text className="text-white text-lg font-black">{t('start.title')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>

        <TouchableOpacity
          onPress={handleBlank}
          activeOpacity={0.8}
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 24,
            borderWidth: 1,
            borderColor: COLORS.accent,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: COLORS.accentDim,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="flash" size={22} color={COLORS.accent} />
          </View>
          <View>
            <Text className="text-white font-black text-base">{t('start.blank')}</Text>
            <Text className="text-muted text-xs mt-0.5">{t('start.blankDesc')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {templates.length > 0 && (
          <>
            <Text className="text-muted text-xs tracking-widest mb-3">{t('start.myPrograms')}</Text>
            {templates.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleTemplate(t)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: COLORS.card2,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="barbell" size={20} color={COLORS.accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">{t.name}</Text>
                  {t.exercises.length > 0 && (
                    <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                      {t.exercises.map(e => e.exerciseName).join(' · ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {templates.length === 0 && (
          <TouchableOpacity
            className="flex-row items-center gap-3 py-3 mb-4"
            onPress={() => { router.back(); router.push('/(tabs)/create-template') }}
          >
            <Ionicons name="add-circle-outline" size={22} color={COLORS.muted} />
            <Text className="text-muted text-sm">Luo treeniohjelma</Text>
          </TouchableOpacity>
        )}

        <Text className="text-muted text-xs tracking-widest mb-3" style={{ marginTop: templates.length > 0 ? 24 : 0 }}>
          {t('start.presets')}
        </Text>
        {PRESET_TEMPLATES.map(p => (
          <View
            key={p.id}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text className="text-white font-bold text-base mb-1">{t(`preset.${p.id}.name` as any)}</Text>
            <Text className="text-muted text-xs mb-2">{t(`preset.${p.id}.desc` as any)}</Text>
            <Text className="text-muted text-xs mb-3" numberOfLines={2}>
              {p.exerciseNames.join(' · ')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => handlePresetStart(p)}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.accent,
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t('start.startProgram')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePresetSave(p)}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.card2,
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.muted, fontWeight: '700', fontSize: 13 }}>{t('start.saveAsOwn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  )
}
