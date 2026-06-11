import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { ExercisePicker } from '../../components/workout/ExercisePicker'
import { COLORS } from '../../lib/constants'
import { useT } from '../../lib/i18n'

export default function CreateTemplateScreen() {
  const t = useT()
  const { profile } = useUserStore()
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([])
  const [pickerVisible, setPickerVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!profile || !name.trim()) return
    setSaving(true)
    const { data: tmpl, error } = await supabase
      .from('workout_templates')
      .insert({ user_id: profile.id, name: name.trim() })
      .select()
      .single()
    if (error || !tmpl) {
      setSaving(false)
      Alert.alert(t('common.error'), error?.message ?? t('template.saveFailed'))
      return
    }
    if (exercises.length > 0) {
      const { error: exError } = await supabase.from('template_exercises').insert(
        exercises.map((ex, i) => ({ template_id: tmpl.id, exercise_id: ex.id, order_index: i }))
      )
      if (exError) {
        Alert.alert(t('template.exerciseError'), exError.message)
      }
    }
    setSaving(false)
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 pt-2 pb-3"
          style={{ borderBottomWidth: 1, borderBottomColor: COLORS.cardEdge }}>
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1">
            <Ionicons name="chevron-back" size={22} color={COLORS.muted} />
            <Text className="text-muted">{t('common.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={save}
            disabled={!name.trim() || saving}
            style={{ opacity: !name.trim() || saving ? 0.4 : 1 }}
          >
            <Text className="text-accent font-bold text-base">{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            className="text-white font-black mb-1"
            style={{ fontSize: 26 }}
            placeholder={t('template.namePlaceholder')}
            placeholderTextColor="#333"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
          />
          <View style={{ height: 2, backgroundColor: COLORS.accent, width: 48, marginBottom: 28 }} />

          <Text className="text-muted text-xs tracking-widest mb-4">{t('template.exercisesLabel')}</Text>

          {exercises.length === 0 && (
            <Text className="text-muted text-sm mb-4">{t('template.noExercises')}</Text>
          )}

          {exercises.map((ex, i) => (
            <View
              key={ex.id}
              className="flex-row items-center py-3.5"
              style={{ borderBottomWidth: 1, borderBottomColor: COLORS.card }}
            >
              <Text className="text-muted text-sm" style={{ width: 24 }}>{i + 1}</Text>
              <Text className="text-white flex-1 font-medium">{ex.name}</Text>
              <TouchableOpacity
                onPress={() => setExercises(prev => prev.filter((_, j) => j !== i))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={22} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            className="flex-row items-center gap-3 mt-4 py-2"
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: COLORS.accent,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </View>
            <Text className="text-accent font-bold">{t('template.addExercise')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={pickerVisible}
        onSelect={(id, exName) => {
          setExercises(prev => prev.find(e => e.id === id) ? prev : [...prev, { id, name: exName }])
          setPickerVisible(false)
        }}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  )
}
