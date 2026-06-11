import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { RANKS } from '../../lib/constants'
import type { RankName } from '../../lib/constants'

type Props = { rank: RankName; width?: number; height?: number }

// Heater shield: pointed top, curved bottom
const SHIELD = 'M 50 6 L 88 20 L 88 72 Q 88 110 50 116 Q 12 110 12 72 L 12 20 Z'
const INNER  = 'M 50 14 L 82 26 L 82 70 Q 82 103 50 108 Q 18 103 18 70 L 18 26 Z'

function adjust(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const clamp = (n: number) => Math.max(0, Math.min(255, n))
  const t = (s: string) => clamp(Math.round(parseInt(s, 16) + amount)).toString(16).padStart(2, '0')
  return `#${t(h.slice(0, 2))}${t(h.slice(2, 4))}${t(h.slice(4, 6))}`
}

function starPath(cx: number, cy: number, r: number): string {
  const ir = r * 0.4
  let d = ''
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2
    const rad = i % 2 === 0 ? r : ir
    d += `${i ? 'L' : 'M'} ${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)} `
  }
  return d + 'Z'
}

function crownPath(cx: number, cy: number, w: number, h: number): string {
  const hw = w / 2
  const base = cy + h * 0.22
  const v1y = cy - h * 0.28  // valley height
  const p1y = cy - h * 0.82  // side peaks
  const p2y = cy - h          // center peak
  return [
    `M ${cx - hw} ${base}`,
    `L ${cx - hw} ${cy}`,
    `L ${cx - hw * 0.66} ${p1y}`,
    `L ${cx - hw * 0.38} ${v1y}`,
    `L ${cx} ${p2y}`,
    `L ${cx + hw * 0.38} ${v1y}`,
    `L ${cx + hw * 0.66} ${p1y}`,
    `L ${cx + hw} ${cy}`,
    `L ${cx + hw} ${base}`,
    'Z',
  ].join(' ')
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <Path d={starPath(cx, cy, r)} fill="#fff" fillOpacity={0.92} />
}

function Crown({ cx, cy, w, h }: { cx: number; cy: number; w: number; h: number }) {
  return <Path d={crownPath(cx, cy, w, h)} fill="#fff" fillOpacity={0.92} />
}

function Laurel({ y, opacity = 0.75, sw = 2.5 }: { y: number; opacity?: number; sw?: number }) {
  return <Path
    d={`M 22 ${y} Q 36 ${y - 9} 50 ${y - 3} Q 64 ${y - 9} 78 ${y}`}
    fill="none" stroke="#fff" strokeOpacity={opacity} strokeWidth={sw} strokeLinecap="round"
  />
}

export function RankBarbellIcon({ rank, width = 56, height = 52 }: Props) {
  const color = RANKS.find(r => r.name === rank)?.color ?? '#708090'
  const light = adjust(color, 55)
  const dark  = adjust(color, -70)

  return (
    <Svg width={width} height={height} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="shieldGrad" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor={light} stopOpacity="1" />
          <Stop offset="1" stopColor={dark}  stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Shield body */}
      <Path d={SHIELD} fill="url(#shieldGrad)" stroke={dark} strokeWidth={2.5} />
      {/* Inner border */}
      <Path d={INNER} fill="none" stroke="#ffffff" strokeWidth={1} strokeOpacity={0.2} />
      {/* Top-left shine */}
      <Path d="M 50 14 L 26 22 L 18 50 Q 18 36 26 26 Z" fill="#ffffff" fillOpacity={0.12} />

      {rank === 'Harrastaja' && (
        <Star cx={50} cy={64} r={13} />
      )}

      {rank === 'Kilpailija' && (<>
        <Star cx={33} cy={65} r={12} />
        <Star cx={67} cy={65} r={12} />
      </>)}

      {rank === 'Alueellinen' && (<>
        <Star cx={24} cy={68} r={10} />
        <Star cx={50} cy={60} r={13} />
        <Star cx={76} cy={68} r={10} />
      </>)}

      {rank === 'Kansallinen' && (<>
        <Star cx={50} cy={60} r={18} />
        <Laurel y={87} />
      </>)}

      {rank === 'Kansainvälinen' && (<>
        <Star cx={50} cy={57} r={19} />
        <Star cx={26} cy={79} r={10} />
        <Star cx={74} cy={79} r={10} />
        <Laurel y={91} />
      </>)}

      {rank === 'Eliitti' && (<>
        <Crown cx={50} cy={52} w={44} h={25} />
        <Laurel y={85} />
        <Laurel y={92} opacity={0.45} sw={1.5} />
      </>)}

      {rank === 'Mestari' && (<>
        <Crown cx={50} cy={46} w={48} h={28} />
        <Star cx={28} cy={80} r={11} />
        <Star cx={50} cy={76} r={13} />
        <Star cx={72} cy={80} r={11} />
      </>)}

      {rank === 'Maailmaluokka' && (<>
        <Crown cx={50} cy={41} w={52} h={31} />
        <Star cx={26} cy={78} r={11} />
        <Star cx={50} cy={74} r={14} />
        <Star cx={74} cy={78} r={11} />
        <Laurel y={90} />
        <Laurel y={97} opacity={0.5} sw={1.8} />
      </>)}

      {rank === 'Legenda' && (<>
        <Crown cx={50} cy={37} w={56} h={33} />
        {/* 5-star arc */}
        <Star cx={21} cy={77} r={10} />
        <Star cx={36} cy={71} r={12} />
        <Star cx={50} cy={69} r={14} />
        <Star cx={64} cy={71} r={12} />
        <Star cx={79} cy={77} r={10} />
        <Laurel y={89} opacity={0.85} sw={3} />
        <Laurel y={96} opacity={0.55} sw={2} />
        {/* Crown jewels */}
        <Circle cx={50} cy={32} r={3.5} fill="#fff" fillOpacity={0.9} />
        <Circle cx={33} cy={38} r={2.5} fill="#fff" fillOpacity={0.8} />
        <Circle cx={67} cy={38} r={2.5} fill="#fff" fillOpacity={0.8} />
      </>)}
    </Svg>
  )
}
