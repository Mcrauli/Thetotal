import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '../../lib/constants'

interface ScreenBackgroundProps {
  children: React.ReactNode
  variant?: 'home' | 'profile' | 'log' | 'progress'
}

export function ScreenBackground({ children, variant = 'home' }: ScreenBackgroundProps) {
  const gradients: Record<string, [string, string, string]> = {
    home:     [COLORS.bg, COLORS.bg2, COLORS.bg],
    profile:  [COLORS.bg, COLORS.bg3, COLORS.bg],
    log:      [COLORS.bg, '#1a0d20', COLORS.bg],
    progress: [COLORS.bg, '#0d1a28', COLORS.bg],
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient
        colors={gradients[variant]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={[COLORS.accent + '20', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  )
}
