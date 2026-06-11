import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { CHALLENGES } from '../../lib/challenges'
import { useT } from '../../lib/i18n'

interface ChallengesSectionProps {
  completedIds: string[]
}

export function ChallengesSection({ completedIds }: ChallengesSectionProps) {
  const t = useT()
  const [modalVisible, setModalVisible] = useState(false)
  const done = new Set(completedIds)
  const completedCount = CHALLENGES.filter(c => done.has(c.id)).length

  return (
    <>
      <TouchableOpacity
        className="bg-card rounded-2xl p-4 mb-4"
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-muted text-xs tracking-widest">{t('friends.challenges')}</Text>
          <Text className="text-muted text-xs">{completedCount}/{CHALLENGES.length} →</Text>
        </View>
        <View className="flex-row flex-wrap gap-1 mt-3">
          {CHALLENGES.slice(0, 8).map(c => (
            <Text key={c.id} style={{ fontSize: 18, opacity: done.has(c.id) ? 1 : 0.2 }}>
              {c.icon}
            </Text>
          ))}
          {completedCount > 8 && (
            <Text className="text-muted text-xs self-center ml-1">
              {t('challenges.more', { count: String(completedCount - 8) })}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-bg">
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
            <View>
              <Text className="text-white text-xl font-black">{t('challenges.title')}</Text>
              <Text className="text-muted text-xs">
                {t('challenges.completedOf', { done: String(completedCount), total: String(CHALLENGES.length) })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text className="text-muted text-base">{t('common.close')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {CHALLENGES.map(c => {
              const isComplete = done.has(c.id)
              return (
                <View
                  key={c.id}
                  className="flex-row items-center rounded-2xl p-4 mb-2"
                  style={{ backgroundColor: isComplete ? '#1a2e1a' : '#1a1a2e', opacity: isComplete ? 1 : 0.6 }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{c.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-sm">{c.name}</Text>
                    <Text className="text-muted text-xs mt-0.5">{c.description}</Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-xs font-bold"
                      style={{ color: isComplete ? '#2ecc71' : '#e63946' }}
                    >
                      {isComplete ? '✓' : `+${c.xp} XP`}
                    </Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}
