import { Tabs } from 'expo-router'
import { CustomTabBar } from '../../components/ui/CustomTabBar'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index"    options={{ title: 'Koti' }} />
      <Tabs.Screen name="log"      options={{ title: 'Treeni' }} />
      <Tabs.Screen name="progress" options={{ title: 'Kehitys' }} />
      <Tabs.Screen name="social"   options={{ title: 'Kaverit' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profiili' }} />
      <Tabs.Screen name="active"          options={{ href: null }} />
      <Tabs.Screen name="create-template" options={{ href: null }} />
      <Tabs.Screen name="start-workout"   options={{ href: null }} />
    </Tabs>
  )
}
