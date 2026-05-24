import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, Dimensions, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { COLORS } from '../../lib/constants'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    icon: '🏋️',
    title: 'Tervetuloa TheTotaliin',
    body: 'Voimaharjoittelun seuranta + sosiaalinen vertailu. SBD-rankkisi perustuu kehonpainoosi nähden lyötyihin painoihin.',
  },
  {
    icon: '➕',
    title: 'Aloita treeni',
    body: 'Paina + nappia alapalkista. Valitse tyhjä treeni, oma ohjelma tai valmis esimerkkiohjelma (Full Body, 5×5, PPL).',
  },
  {
    icon: '💪',
    title: 'Kirjaa sarjat',
    body: 'Lisää liike, paino ja toistot. Vapaaehtoisesti voit merkitä RPE-rasituksen (5–10) jokaiselle sarjalle. Treenistäsi tallentuu volyymi, ennätykset ja XP.',
  },
  {
    icon: '🏆',
    title: 'Nouse rankissa',
    body: 'SBD-rankki kasvaa Aloittelijasta Legendaan kun parannat Kyykky + Penkki + Maastaveto -yhteistulosta suhteessa kehonpainoosi. Top 1 % saavuttaa Eliitin.',
  },
  {
    icon: '👥',
    title: 'Kaverit ja vahvistukset',
    body: 'Lisää kaverit Kaverit-välilehdeltä. Heidän PR:nsä näkyvät etusivun feedissä. Reagoi 🔥💪, kommentoi ja vahvista kavereiden SBD-ennätykset 🤝 — se on luotettavuuden mittari.',
  },
]

export default function TutorialScreen() {
  const [page, setPage] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  function next() {
    if (page < SLIDES.length - 1) {
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
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36, paddingBottom: 120 }}>
            <Text style={{ fontSize: 72, marginBottom: 28 }}>{item.icon}</Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: 0.5 }}>
              {item.title}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center', lineHeight: 24 }}>
              {item.body}
            </Text>
          </View>
        )}
      />

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
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
            {page < SLIDES.length - 1 ? 'SEURAAVA' : 'ALOITA'}
          </Text>
        </TouchableOpacity>
        {page < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => router.replace('/(tabs)/')} style={{ alignItems: 'center', paddingTop: 14 }}>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>Ohita</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}
