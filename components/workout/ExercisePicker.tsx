import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Modal, SectionList, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

interface Exercise {
  id: string
  name: string
  muscle_group: string
  is_sbd: boolean
}

interface ExercisePickerProps {
  visible: boolean
  onSelect: (id: string, name: string, muscleGroup: string) => void
  onClose: () => void
}

export function ExercisePicker({ visible, onSelect, onClose }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!visible) return
    supabase.from('exercises').select('id, name, muscle_group, is_sbd').order('name').then(({ data }) => {
      setExercises(data ?? [])
    })
  }, [visible])

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, e) => {
    const group = e.muscle_group ?? 'Muut'
    if (!acc[group]) acc[group] = []
    acc[group].push(e)
    return acc
  }, {})

  const sections = Object.keys(grouped).sort().map(key => ({
    title: key,
    data: grouped[key],
  }))

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-lg font-bold">Lisää liike</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-muted text-base">Peruuta</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-card rounded-xl px-4 py-3 text-white"
            placeholder="Hae liike..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View className="bg-bg px-4 py-1">
              <Text className="text-muted text-xs tracking-widest">{section.title.toUpperCase()}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="px-4 py-3 border-b border-card flex-row items-center justify-between"
              onPress={() => { onSelect(item.id, item.name, item.muscle_group); onClose(); setSearch('') }}
            >
              <Text className="text-white font-medium">{item.name}</Text>
              {item.is_sbd && <Text className="text-gold text-xs">SBD</Text>}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  )
}
