import { View, Text } from 'react-native'
import { getLevelProgress } from '../../lib/xp'

interface XPBarProps {
  xp: number
}

export function XPBar({ xp }: XPBarProps) {
  const { level, progress, xpInLevel, xpNeeded } = getLevelProgress(xp)

  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-white text-xs font-bold">Level {level}</Text>
        <Text className="text-muted text-xs">{xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP</Text>
      </View>
      <View className="bg-card rounded-full h-2 overflow-hidden">
        <View
          className="h-2 rounded-full bg-accent"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </View>
    </View>
  )
}
