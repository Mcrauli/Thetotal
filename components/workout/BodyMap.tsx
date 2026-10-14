import { View, Text } from 'react-native'
import Body, { type ExtendedBodyPart } from 'react-native-body-highlighter'
import { COLORS } from '../../lib/constants'
import { muscleLabel } from '../../lib/muscleGroups'
import { useLocaleStore } from '../../lib/i18n'

export interface MuscleShare {
  group: string
  pct: number
}

type Slug = ExtendedBodyPart['slug']

const GROUP_SLUGS: Record<string, Slug[]> = {
  Rinta: ['chest'],
  Selkä: ['upper-back', 'trapezius'],
  Jalat: ['quadriceps', 'adductors', 'gluteal'],
  Hartiat: ['deltoids'],
  Hauikset: ['biceps', 'forearm'],
  Ojentajat: ['triceps'],
  Takareidet: ['hamstring'],
  Pakarat: ['gluteal'],
  Pohjelihas: ['calves'],
  Calves: ['calves'],
  Vatsa: ['abs', 'obliques'],
  Traps: ['trapezius'],
  'Lower Back': ['lower-back'],
  'Full Body': ['chest', 'upper-back', 'quadriceps', 'deltoids', 'gluteal', 'hamstring', 'abs'],
  Voimamies: ['upper-back', 'quadriceps', 'gluteal', 'hamstring', 'trapezius', 'lower-back', 'forearm'],
}

const SHADES = ['#5a1e26', '#8a2832', '#b8303c', COLORS.accent]

function bodyData(shares: MuscleShare[]): ExtendedBodyPart[] {
  const raw = new Map<Slug, number>()
  for (const s of shares) {
    for (const slug of GROUP_SLUGS[s.group] ?? []) raw.set(slug, (raw.get(slug) ?? 0) + s.pct)
  }
  const max = Math.max(0, ...raw.values())
  return [...raw.entries()].map(([slug, v]) => ({ slug, intensity: Math.max(1, Math.ceil((v / max) * SHADES.length)) }))
}

export function BodyMap({ shares }: { shares: MuscleShare[] }) {
  const locale = useLocaleStore(s => s.locale)
  const data = bodyData(shares)
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {(['front', 'back'] as const).map(side => (
          <Body key={side} data={data} side={side} gender="male" scale={0.75} colors={SHADES} defaultFill="#2a2a40" border="none" />
        ))}
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        {shares.map(s => (
          <View key={s.group} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: '#fff', fontSize: 13, width: 92 }} numberOfLines={1}>{muscleLabel(s.group, locale)}</Text>
            <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.bg, overflow: 'hidden' }}>
              <View style={{ width: `${s.pct}%`, height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 }} />
            </View>
            <Text style={{ color: COLORS.muted, fontSize: 12, width: 38, textAlign: 'right' }}>{s.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
