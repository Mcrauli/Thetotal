import { View, Text } from 'react-native'
import { PLATES } from '../../lib/plates'
import { COLORS } from '../../lib/constants'

const COLOR_BY_KG: Record<number, { color: string; text: string }> = {}
for (const p of PLATES) COLOR_BY_KG[p.kg] = { color: p.color, text: p.text }

function plateHeight(kg: number): number {
  if (kg >= 25) return 64
  if (kg >= 20) return 58
  if (kg >= 15) return 50
  if (kg >= 10) return 44
  if (kg >= 5) return 34
  if (kg >= 2.5) return 26
  return 22
}

// Näyttää tangon + levyt yhdellä puolella (raskain sisimpänä).
export function PlateBar({ plates }: { plates: number[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 70 }}>
      {/* tangon holkki */}
      <View style={{ width: 18, height: 8, backgroundColor: '#9aa0a6', borderRadius: 2 }} />
      {plates.map((kg, i) => {
        const c = COLOR_BY_KG[kg] ?? { color: COLORS.muted, text: '#fff' }
        return (
          <View
            key={i}
            style={{
              width: kg >= 10 ? 16 : 12,
              height: plateHeight(kg),
              backgroundColor: c.color,
              borderRadius: 3,
              marginLeft: 2,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: kg === 5 ? 1 : 0,
              borderColor: '#bbb',
            }}
          >
            <Text style={{ color: c.text, fontSize: 7, fontWeight: '900', transform: [{ rotate: '-90deg' }] }}>
              {kg}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
