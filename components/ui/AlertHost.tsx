import { Platform, View, Text, Pressable } from 'react-native'
import { useAlertStore, type AlertButton } from '../../lib/alert'

function sortButtons(buttons: AlertButton[]): AlertButton[] {
  return [...buttons].sort((a, b) => Number(a.style === 'cancel') - Number(b.style === 'cancel'))
}

export function AlertHost() {
  const current = useAlertStore(s => s.current)
  const press = useAlertStore(s => s.press)
  const dismiss = useAlertStore(s => s.dismiss)

  if (Platform.OS !== 'web' || !current) return null

  const buttons = sortButtons(current.buttons)
  const cancelButton = current.buttons.find(b => b.style === 'cancel')

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <Pressable
        onPress={() => (cancelButton ? press(cancelButton) : dismiss())}
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: '#000000aa' }}
      >
        <Pressable onPress={() => {}} className="w-full rounded-2xl bg-card2 border border-cardEdge p-5" style={{ maxWidth: 360 }}>
          <Text className="text-white text-lg font-black mb-2">{current.title}</Text>
          {current.message ? <Text className="text-muted text-sm mb-4">{current.message}</Text> : null}
          <View className="gap-2 mt-2">
            {buttons.map((b, i) => (
              <Pressable
                key={i}
                onPress={() => press(b)}
                className="rounded-xl items-center justify-center"
                style={{ minHeight: 44, backgroundColor: b.style === 'destructive' ? '#e63946' : '#ffffff14' }}
              >
                <Text className={`text-[15px] font-bold ${b.style === 'destructive' ? 'text-white' : b.style === 'cancel' ? 'text-muted' : 'text-white'}`}>
                  {b.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </View>
  )
}
