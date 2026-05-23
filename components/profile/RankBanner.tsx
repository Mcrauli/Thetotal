import { View, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { XPBar } from '../ui/XPBar'
import { RankBarbellIcon } from '../ui/RankBarbellIcon'
import { getRankData, TIER_ROMAN } from '../../lib/xp'
import type { RankName } from '../../lib/constants'
import { COLORS } from '../../lib/constants'

const RANK_GRADIENTS: Record<RankName, [string, string, string]> = {
  Aloittelija:    ['#4a5568', '#2d3748', COLORS.card],
  Harrastaja:     ['#718096', '#2d3748', COLORS.card],
  Kilpailija:     ['#92400e', '#3d2010', COLORS.card],
  Alueellinen:    ['#1a4a2e', '#0d2318', COLORS.card],
  Kansallinen:    ['#92650a', '#3d2a00', COLORS.card],
  Kansainvälinen: ['#1a4a6e', '#0d2236', COLORS.card],
  Eliitti:        ['#7c0a14', '#3d0206', COLORS.card],
  Mestari:        ['#7c2d12', '#3d1206', COLORS.card],
  Maailmaluokka:  ['#5b21b6', '#2e1065', COLORS.card],
  Legenda:        ['#991b1b', '#450a0a', COLORS.card],
}

interface RankBannerProps {
  xp: number
  sbdRank: RankName
  sbdTier?: 1 | 2 | 3 | 4
  onPressRank?: () => void
}

export function RankBanner({ xp, sbdRank, sbdTier, onPressRank }: RankBannerProps) {
  const rankData = getRankData(sbdRank)
  const tierLabel = sbdTier ? ` ${TIER_ROMAN[sbdTier]}` : ''
  const gradientColors = RANK_GRADIENTS[sbdRank] ?? [rankData.color + '28', COLORS.card2, COLORS.card]

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: rankData.color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <TouchableOpacity className="items-center mb-4" onPress={onPressRank} activeOpacity={onPressRank ? 0.7 : 1}>
        <RankBarbellIcon rank={sbdRank} width={100} height={100} />
        <Text className="text-2xl font-black tracking-widest mt-3" style={{ color: rankData.color }}>
          {sbdRank.toUpperCase()}{tierLabel}
        </Text>
        <Text className="text-muted text-xs mt-1">SBD RANK{onPressRank ? '  ›' : ''}</Text>
      </TouchableOpacity>
      <XPBar xp={xp} />
    </LinearGradient>
  )
}
