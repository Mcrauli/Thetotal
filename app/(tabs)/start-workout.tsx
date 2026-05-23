import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { COLORS } from '../../lib/constants'

interface Template {
  id: string
  name: string
  exercises: { exerciseId: string; exerciseName: string }[]
}

export default function StartWorkoutScreen() {
  const { profile } = useUserStore()
  const { startWorkout, startFromTemplate } = useWorkoutStore()
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    if (!profile) return
    supabase
      .from('workout_templates')
      .select('id, name, template_exercises(exercise_id, order_index, exercises(name))')
      .eq('user_id', profile.id)
      .order('created_at')
      .then(({ data }) => {
        setTemplates((data ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          exercises: (t.template_exercises ?? [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((te: any) => ({ exerciseId: te.exercise_id, exerciseName: te.exercises?.name ?? '' })),
        })))
      })
  }, [profile?.id])

  function handleBlank() {
    startWorkout()
    router.replace('/(tabs)/active')
  }

  function handleTemplate(t: Template) {
    startFromTemplate(t.name, t.exercises)
    router.replace('/(tabs)/active')
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-4"
        style={{ borderBottomWidth: 1, borderBottomColor: COLORS.card }}>
        <Text className="text-white text-lg font-black">Aloita treeni</Text>
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
            <Text className="text-white font-black text-base">Tyhjä treeni</Text>
            <Text className="text-muted text-xs mt-0.5">Lisää liikkeet itse</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {templates.length > 0 && (
          <>
            <Text className="text-muted text-xs tracking-widest mb-3">OMAT OHJELMAT</Text>
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
            className="flex-row items-center gap-3 py-3"
            onPress={() => { router.back(); router.push('/(tabs)/create-template') }}
          >
            <Ionicons name="add-circle-outline" size={22} color={COLORS.muted} />
            <Text className="text-muted text-sm">Luo treeniohjelma</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}
