import { useEffect, useRef } from 'react'
import { Animated, View, type ViewStyle } from 'react-native'
import { COLORS } from '../../lib/constants'

interface SkeletonProps {
  width?: number | string
  height?: number
  radius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])
  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius: radius, backgroundColor: COLORS.card2, opacity: pulse }, style]}
    />
  )
}

export function LeaderboardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: 14, padding: 14 }}>
          <Skeleton width={24} height={24} radius={12} />
          <Skeleton width={40} height={40} radius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="30%" height={10} />
          </View>
          <Skeleton width={48} height={20} />
        </View>
      ))}
    </View>
  )
}
