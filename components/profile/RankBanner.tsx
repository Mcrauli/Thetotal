import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { XPBar } from '../ui/XPBar'
import { getRankData } from '../../lib/xp'
import type { RankName } from '../../lib/constants'
import { COLORS } from '../../lib/constants'

interface RankBannerProps {
  xp: number
  rank: RankName
}

export function RankBanner({ xp, rank }: RankBannerProps) {
  const rankData = getRankData(rank)

  return (
    <LinearGradient
      colors={[COLORS.card2, COLORS.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: rankData.color + '40' }}
    >
      <View className="items-center mb-4">
        <Text style={{ fontSize: 40 }}>{rankData.icon}</Text>
        <Text
          className="text-2xl font-black tracking-widest mt-1"
          style={{ color: rankData.color }}
        >
          {rank.toUpperCase()}
        </Text>
      </View>
      <XPBar xp={xp} rank={rank} />
    </LinearGradient>
  )
}
