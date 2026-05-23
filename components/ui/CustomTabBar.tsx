import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { COLORS } from '../../lib/constants'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const TAB_META: Record<string, { icon: IoniconName; activeIcon: IoniconName; label: string }> = {
  index:    { icon: 'home-outline',        activeIcon: 'home',        label: 'Koti' },
  log:      { icon: 'barbell-outline',     activeIcon: 'barbell',     label: 'Treeni' },
  progress: { icon: 'stats-chart-outline', activeIcon: 'stats-chart', label: 'Kehitys' },
  social:   { icon: 'people-outline',      activeIcon: 'people',      label: 'Kaverit' },
  profile:  { icon: 'trophy-outline',      activeIcon: 'trophy',      label: 'Profiili' },
}

const HIDE_ON = new Set(['active', 'create-template', 'start-workout'])

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const currentRoute = state.routes[state.index]?.name
  if (HIDE_ON.has(currentRoute)) return null
  const visible = state.routes.filter(r => TAB_META[r.name])
  const leftTabs = visible.slice(0, 2)
  const rightTabs = visible.slice(2)

  function go(routeName: string) {
    navigation.navigate(routeName as never)
  }

  function startNew() {
    router.push('/(tabs)/start-workout')
  }

  function renderTab(route: { key: string; name: string }) {
    const idx = state.routes.findIndex(r => r.key === route.key)
    const isFocused = state.index === idx
    const meta = TAB_META[route.name]
    return (
      <TouchableOpacity
        key={route.key}
        className="flex-1 items-center justify-center pt-3 pb-2"
        onPress={() => go(route.name)}
        activeOpacity={0.7}
      >
        {isFocused && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              width: 32,
              height: 3,
              borderRadius: 2,
              backgroundColor: COLORS.accent,
              shadowColor: COLORS.accent,
              shadowOpacity: 0.8,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        )}
        <Ionicons
          name={isFocused ? meta.activeIcon : meta.icon}
          size={22}
          color={isFocused ? COLORS.accent : COLORS.muted}
        />
        <Text
          style={{
            fontSize: 9,
            marginTop: 2,
            fontWeight: isFocused ? '700' : '500',
            letterSpacing: 0.5,
            color: isFocused ? COLORS.white : COLORS.muted,
          }}
        >
          {meta.label.toUpperCase()}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      <LinearGradient
        colors={[COLORS.card, '#0a0a14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ height: 1, backgroundColor: COLORS.cardEdge, opacity: 0.6 }} />
      <View className="flex-row items-end" style={{ height: 64 }}>
        {leftTabs.map(renderTab)}

        <View className="items-center justify-center" style={{ width: 72 }}>
          <TouchableOpacity
            onPress={startNew}
            activeOpacity={0.8}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
              shadowColor: COLORS.accent,
              shadowOpacity: 0.6,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={[COLORS.accent, '#a02230']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28 }}
            />
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {rightTabs.map(renderTab)}
      </View>
    </View>
  )
}
