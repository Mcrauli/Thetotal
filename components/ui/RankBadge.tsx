import { View, Text } from 'react-native'
import { getRankData } from '../../lib/xp'
import type { RankName } from '../../lib/constants'

export function RankBadge({ rank }: { rank: RankName }) {
  const data = getRankData(rank)
  return (
    <View className="flex-row items-center gap-1 px-3 py-1 rounded-full bg-card">
      <Text style={{ fontSize: 14 }}>{data.icon}</Text>
      <Text className="font-bold text-sm" style={{ color: data.color }}>
        {rank.toUpperCase()}
      </Text>
    </View>
  )
}
