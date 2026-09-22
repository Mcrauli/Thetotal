import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { useT } from '../../lib/i18n'
import { isStandalone, installPlatform } from '../../lib/pwa'

const DISMISSED_KEY = 'thetotal:installHintDismissed'

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

export function InstallHint() {
  const t = useT()
  const [dismissed, setDismissed] = useState(true)
  const [standalone, setStandalone] = useState(true)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    setDismissed(readDismissed())
    setStandalone(isStandalone(window))
    setPlatform(installPlatform(window.navigator.userAgent, window.navigator.maxTouchPoints))

    function onBeforeInstallPrompt(e: any) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  if (Platform.OS !== 'web' || standalone || dismissed) return null

  function close() {
    writeDismissed()
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <View className="bg-card rounded-xl p-4 mb-4">
      <View className="flex-row justify-between items-start">
        <Text className="text-white font-bold text-base flex-1 mr-2">{t('pwa.installTitle')}</Text>
        <TouchableOpacity onPress={close} className="min-w-11 min-h-11 items-center justify-center -mr-2 -mt-2">
          <Text className="text-muted text-base">✕</Text>
        </TouchableOpacity>
      </View>

      {platform === 'ios' ? (
        <View className="mt-2">
          <Text className="text-muted text-sm mb-1">{t('pwa.iosStep1')}</Text>
          <Text className="text-muted text-sm mb-1">{t('pwa.iosStep2')}</Text>
          <Text className="text-muted text-sm mb-2">{t('pwa.iosStep3')}</Text>
          <Text className="text-muted text-xs">{t('pwa.iosSafariOnly')}</Text>
        </View>
      ) : deferredPrompt ? (
        <TouchableOpacity className="bg-accent rounded-xl py-3 items-center mt-3" onPress={install}>
          <Text className="text-white font-bold text-sm">{t('pwa.installButton')}</Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-muted text-sm mt-2">{t('pwa.androidHint')}</Text>
      )}
    </View>
  )
}
