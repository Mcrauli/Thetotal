import { Image } from 'react-native'
import type { RankName } from '../../lib/constants'

type Props = { rank: RankName; width?: number; height?: number }

const IMAGES: Record<RankName, ReturnType<typeof require>> = {
  'Aloittelija':    require('../../assets/ranks/squat1.png'),
  'Harrastaja':     require('../../assets/ranks/squat1.png'),
  'Kilpailija':     require('../../assets/ranks/squat2.png'),
  'Alueellinen':    require('../../assets/ranks/bench1.png'),
  'Kansallinen':    require('../../assets/ranks/bench2.png'),
  'Kansainvälinen': require('../../assets/ranks/bench3.png'),
  'Eliitti':        require('../../assets/ranks/deadlift1.png'),
  'Mestari':        require('../../assets/ranks/deadlift2.png'),
  'Maailmaluokka':  require('../../assets/ranks/deadlift3.png'),
  'Legenda':        require('../../assets/ranks/deadlift3.png'),
}

export function RankBarbellIcon({ rank, width = 56, height = 52 }: Props) {
  return (
    <Image
      source={IMAGES[rank]}
      style={{ width, height, borderRadius: 8 }}
      resizeMode="contain"
    />
  )
}
