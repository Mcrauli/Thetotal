import { View, Text } from 'react-native'
import { RANKS, type RankName } from '../../lib/constants'
import { getXPToNextRank, getRankData } from '../../lib/xp'

interface XPBarProps {
  xp: number
  rank: RankName
}

export function XPBar({ xp, rank }: XPBarProps) {
  const rankData = getRankData(rank)
  const rankIdx = RANKS.findIndex(r => r.name === rank)
  const isMax = rankIdx === RANKS.length - 1
  const nextRank = isMax ? null : RANKS[rankIdx + 1]
  const xpToNext = getXPToNextRank(xp)
  const xpInCurrentRank = xp - rankData.xpRequired
  const xpNeededForRank = nextRank ? nextRank.xpRequired - rankData.xpRequired : 1
  const progress = isMax ? 1 : Math.min(xpInCurrentRank / xpNeededForRank, 1)

  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-muted text-xs">
          {xp.toLocaleString()} XP
        </Text>
        <Text className="text-muted text-xs">
          {isMax ? 'MAX RANK' : `${xpToNext.toLocaleString()} → ${nextRank?.name}`}
        </Text>
      </View>
      <View className="bg-card rounded-full h-2 overflow-hidden">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: rankData.color,
          }}
        />
      </View>
    </View>
  )
}
