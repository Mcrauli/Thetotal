import { Alert, Platform } from 'react-native'
import { create } from 'zustand'
import { t } from './i18n'

export type AlertButton = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }
export type AlertRequest = { title: string; message?: string; buttons: AlertButton[] }

interface AlertState {
  current: AlertRequest | null
  queue: AlertRequest[]
  push: (r: AlertRequest) => void
  dismiss: () => void
  press: (button: AlertButton) => void
}

export const useAlertStore = create<AlertState>((set, get) => ({
  current: null,
  queue: [],
  push: (r) => {
    const { current, queue } = get()
    if (current) set({ queue: [...queue, r] })
    else set({ current: r })
  },
  dismiss: () => {
    const { queue } = get()
    const [next, ...rest] = queue
    set({ current: next ?? null, queue: rest })
  },
  press: (button) => {
    button.onPress?.()
    get().dismiss()
  },
}))

export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons)
    return
  }
  useAlertStore.getState().push({
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: t('common.ok') }],
  })
}
