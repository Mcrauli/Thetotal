import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, Dimensions, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { COLORS } from '../../lib/constants'
import { useT } from '../../lib/i18n'

const { width } = Dimensions.get('window')

const SLIDE_KEYS = [
  { icon: '🏋️', tKey: 's1' },
  { icon: '➕', tKey: 's2' },
  { icon: '💪', tKey: 's3' },
  { icon: '🏆', tKey: 's4' },
  { icon: '👥', tKey: 's5' },
] as const

export default function TutorialScreen() {
  const [page, setPage] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const t = useT()

  function next() {
    if (page < SLIDE_KEYS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: page + 1, animated: true })
      setPage(page + 1)
    } else {
      router.replace('/(tabs)/')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        ref={flatListRef}
        data={SLIDE_KEYS}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36, paddingBottom: 120 }}>
            <Text style={{ fontSize: 72, marginBottom: 28 }}>{item.icon}</Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: 0.5 }}>
              {t(`tutorial.${item.tKey}.title` as any)}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center', lineHeight: 24 }}>
              {t(`tutorial.${item.tKey}.body` as any)}
            </Text>
          </View>
        )}
      />

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {SLIDE_KEYS.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === page ? COLORS.accent : COLORS.card2,
              }}
            />
          ))}
        </View>
        <TouchableOpacity
          onPress={next}
          activeOpacity={0.8}
          style={{ backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
            {page < SLIDE_KEYS.length - 1 ? t('tutorial.next') : t('tutorial.start')}
          </Text>
        </TouchableOpacity>
        {page < SLIDE_KEYS.length - 1 && (
          <TouchableOpacity onPress={() => router.replace('/(tabs)/')} style={{ alignItems: 'center', paddingTop: 14 }}>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>{t('tutorial.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}
