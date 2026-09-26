import type { ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  children?: ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
}

export function TopSafeArea({ children, className, style }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View className={className} style={[{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }, style]}>
      {children}
    </View>
  )
}
