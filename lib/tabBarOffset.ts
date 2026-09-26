import { create } from 'zustand'
import { Platform } from 'react-native'

const KEY = 'thetotal:tabBarOffset'

function read(): number {
  if (Platform.OS !== 'web') return 0
  try {
    const raw = window.localStorage.getItem(KEY)
    const n = raw === null ? 0 : Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

interface OffsetState {
  offset: number
  setOffset: (value: number) => void
}

export function applyOffset(value: number) {
  if (Platform.OS !== 'web') return
  try {
    document.documentElement.style.setProperty('--tt-bottom', `${value}px`)
  } catch {
  }
}

export const useTabBarOffset = create<OffsetState>((set) => ({
  offset: read(),
  setOffset: (value: number) => {
    const clamped = Math.max(-120, Math.min(120, Math.round(value)))
    try {
      window.localStorage.setItem(KEY, String(clamped))
    } catch {
    }
    applyOffset(clamped)
    set({ offset: clamped })
  },
}))

export function layoutReport(insets: { top: number; bottom: number }): string {
  if (Platform.OS !== 'web') return ''
  const vv = window.visualViewport
  const root = document.getElementById('root')?.getBoundingClientRect()
  const standalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches
  return [
    `inset ${Math.round(insets.top)}/${Math.round(insets.bottom)}`,
    `inner ${Math.round(window.innerHeight)}`,
    `screen ${Math.round(window.screen.height)}`,
    `vv ${vv ? Math.round(vv.height) : '-'}`,
    `root ${root ? Math.round(root.height) : '-'}`,
    `dvh ${Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tt-dvh') || '0'))}`,
    standalone ? 'standalone' : 'browser',
  ].join(' · ')
}
