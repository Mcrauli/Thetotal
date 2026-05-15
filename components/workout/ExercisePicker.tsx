import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

interface Exercise {
  id: string
  name: string
  category: string
  is_sbd: boolean
}

interface ExercisePickerProps {
  visible: boolean
  onSelect: (id: string, name: string) => void
  onClose: () => void
}

export function ExercisePicker({ visible, onSelect, onClose }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!visible) return
    supabase.from('exercises').select('*').order('name').then(({ data }) => {
      setExercises(data ?? [])
    })
  }, [visible])

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-bold">Add Exercise</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-muted text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-card rounded-xl px-4 py-3 text-white"
            placeholder="Search exercises..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="px-4 py-4 border-b border-card"
              onPress={() => { onSelect(item.id, item.name); onClose() }}
            >
              <Text className="text-white font-medium">{item.name}</Text>
              <Text className="text-muted text-xs capitalize mt-0.5">{item.category}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  )
}
