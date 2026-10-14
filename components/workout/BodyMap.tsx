import { View, Text } from 'react-native'
import Svg, { Circle, Ellipse, Rect, Path } from 'react-native-svg'
import { COLORS } from '../../lib/constants'
import { muscleLabel } from '../../lib/muscleGroups'
import { useLocaleStore } from '../../lib/i18n'

export interface MuscleShare {
  group: string
  pct: number
}

type Region =
  | 'chest' | 'delts' | 'biceps' | 'triceps' | 'abs' | 'quads' | 'hamstrings'
  | 'glutes' | 'calves' | 'back' | 'traps' | 'lowerBack' | 'forearms'

const GROUP_REGIONS: Record<string, Region[]> = {
  Rinta: ['chest'],
  Selkä: ['back'],
  Jalat: ['quads'],
  Hartiat: ['delts'],
  Hauikset: ['biceps', 'forearms'],
  Ojentajat: ['triceps'],
  Takareidet: ['hamstrings'],
  Pakarat: ['glutes'],
  Pohjelihas: ['calves'],
  Calves: ['calves'],
  Vatsa: ['abs'],
  Traps: ['traps'],
  'Lower Back': ['lowerBack'],
  'Full Body': ['chest', 'back', 'quads', 'delts', 'glutes', 'hamstrings', 'abs'],
  Voimamies: ['back', 'quads', 'glutes', 'hamstrings', 'traps', 'lowerBack', 'forearms'],
}

const BASE = '#252538'

function regionIntensity(shares: MuscleShare[]): Partial<Record<Region, number>> {
  const raw: Partial<Record<Region, number>> = {}
  for (const s of shares) {
    for (const r of GROUP_REGIONS[s.group] ?? []) raw[r] = (raw[r] ?? 0) + s.pct
  }
  const max = Math.max(0, ...Object.values(raw).map(v => v ?? 0))
  const out: Partial<Record<Region, number>> = {}
  if (max > 0) for (const k of Object.keys(raw) as Region[]) out[k] = (raw[k] ?? 0) / max
  return out
}

function Figure({ side, intensity }: { side: 'front' | 'back'; intensity: Partial<Record<Region, number>> }) {
  const fill = (r: Region) => {
    const v = intensity[r] ?? 0
    return { fill: v > 0 ? COLORS.accent : BASE, fillOpacity: v > 0 ? 0.3 + 0.7 * v : 1 }
  }
  const base = { fill: BASE }
  return (
    <Svg width={110} height={210} viewBox="0 0 100 192">
      <Circle cx={50} cy={13} r={10} {...base} />
      <Rect x={45} y={22} width={10} height={8} {...base} />
      {side === 'back' && <Path d="M38 30 L50 22 L62 30 L58 36 L42 36 Z" {...fill('traps')} />}
      <Ellipse cx={31} cy={37} rx={8} ry={7} {...fill('delts')} />
      <Ellipse cx={69} cy={37} rx={8} ry={7} {...fill('delts')} />
      {side === 'front' ? (
        <>
          <Rect x={33} y={31} width={16.5} height={17} rx={5} {...fill('chest')} />
          <Rect x={50.5} y={31} width={16.5} height={17} rx={5} {...fill('chest')} />
          <Rect x={38} y={50} width={24} height={30} rx={5} {...fill('abs')} />
          <Rect x={33} y={50} width={4} height={28} rx={2} {...base} />
          <Rect x={63} y={50} width={4} height={28} rx={2} {...base} />
          <Rect x={21} y={44} width={9} height={22} rx={4.5} {...fill('biceps')} />
          <Rect x={70} y={44} width={9} height={22} rx={4.5} {...fill('biceps')} />
        </>
      ) : (
        <>
          <Path d="M33 37 L67 37 L64 62 L36 62 Z" {...fill('back')} />
          <Rect x={39} y={63} width={22} height={17} rx={4} {...fill('lowerBack')} />
          <Rect x={21} y={44} width={9} height={22} rx={4.5} {...fill('triceps')} />
          <Rect x={70} y={44} width={9} height={22} rx={4.5} {...fill('triceps')} />
        </>
      )}
      <Rect x={17} y={68} width={9} height={24} rx={4.5} {...fill('forearms')} />
      <Rect x={74} y={68} width={9} height={24} rx={4.5} {...fill('forearms')} />
      {side === 'front' ? (
        <>
          <Rect x={36} y={81} width={28} height={10} rx={4} {...base} />
          <Rect x={35.5} y={92} width={13.5} height={44} rx={6} {...fill('quads')} />
          <Rect x={51} y={92} width={13.5} height={44} rx={6} {...fill('quads')} />
        </>
      ) : (
        <>
          <Ellipse cx={43} cy={89} rx={8} ry={9} {...fill('glutes')} />
          <Ellipse cx={57} cy={89} rx={8} ry={9} {...fill('glutes')} />
          <Rect x={35.5} y={99} width={13.5} height={37} rx={6} {...fill('hamstrings')} />
          <Rect x={51} y={99} width={13.5} height={37} rx={6} {...fill('hamstrings')} />
        </>
      )}
      <Rect x={37.5} y={139} width={10} height={38} rx={5} {...fill('calves')} />
      <Rect x={52.5} y={139} width={10} height={38} rx={5} {...fill('calves')} />
      <Ellipse cx={42.5} cy={182} rx={6} ry={3} {...base} />
      <Ellipse cx={57.5} cy={182} rx={6} ry={3} {...base} />
    </Svg>
  )
}

export function BodyMap({ shares }: { shares: MuscleShare[] }) {
  const locale = useLocaleStore(s => s.locale)
  const intensity = regionIntensity(shares)
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        <Figure side="front" intensity={intensity} />
        <Figure side="back" intensity={intensity} />
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
