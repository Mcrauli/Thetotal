import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { useT } from '../../lib/i18n'
import { useUserStore } from '../../store/userStore'
import { webPushSupport, webPushPermission, enableWebPush } from '../../lib/webPush'
import { InstallHint } from './InstallHint'

const DISMISSED_KEY = 'thetotal:notifPromptDismissed'

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
  }
}

export function NotificationPrompt() {
  const t = useT()
  const profile = useUserStore(s => s.profile)
  const [dismissed, setDismissed] = useState(true)
  const [support, setSupport] = useState<'unsupported' | 'needs-install' | 'supported'>('unsupported')
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('unsupported')
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    setDismissed(readDismissed())
    setSupport(webPushSupport())
    setPermission(webPushPermission())
  }, [])

  if (Platform.OS !== 'web' || dismissed || support === 'unsupported' || permission !== 'default') return null

  function close() {
    writeDismissed()
    setDismissed(true)
  }

  async function enable() {
    if (!profile) return
    const result = await enableWebPush(profile.id)
    if (result === 'granted') {
      close()
    } else if (result === 'denied') {
      setBlocked(true)
      setPermission('denied')
    }
  }

  return (
    <View className="bg-card rounded-xl p-4 mb-4">
      <View className="flex-row justify-between items-start">
        <Text className="text-white font-bold text-base flex-1 mr-2">{t('notif.promptTitle')}</Text>
        <TouchableOpacity onPress={close} className="min-w-11 min-h-11 items-center justify-center -mr-2 -mt-2">
          <Text className="text-muted text-base">✕</Text>
        </TouchableOpacity>
      </View>

      {support === 'needs-install' ? (
        <View className="mt-2">
          <Text className="text-muted text-sm mb-2">{t('notif.promptNeedsInstall')}</Text>
          <InstallHint />
        </View>
      ) : blocked ? (
        <Text className="text-muted text-sm mt-2">{t('notif.promptBlocked')}</Text>
      ) : (
        <View className="mt-2">
          <Text className="text-muted text-sm mb-2">{t('notif.promptBody')}</Text>
          <TouchableOpacity className="bg-accent rounded-xl py-3 items-center mt-1" onPress={enable}>
            <Text className="text-white font-bold text-sm">{t('notif.promptEnable')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
