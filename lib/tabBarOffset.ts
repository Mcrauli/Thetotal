import { Platform } from 'react-native'

function safeInset(side: 'top' | 'bottom'): number {
  const probe = document.createElement('div')
  probe.style.cssText = `position:fixed;top:0;left:0;visibility:hidden;padding-top:env(safe-area-inset-${side})`
  document.body.appendChild(probe)
  const value = parseFloat(getComputedStyle(probe).paddingTop) || 0
  probe.remove()
  return value
}

// iPhonen kotinäyttösovelluksessa sivu voi olla ruutua lyhyempi: alareunan
// kotipalkin kaista jää sivun ulkopuolelle. Palautetaan kaistan korkeus.
export function autoBottomGap(): number {
  if (Platform.OS !== 'web') return 0
  const standalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches
  if (!standalone) return 0
  const missing = Math.round(window.screen.height - window.innerHeight)
  if (missing <= 0 || missing > 120) return 0
  if (safeInset('top') <= 0) return 0
  return Math.min(missing, Math.round(safeInset('bottom')))
}

export function applyBottomGap() {
  if (Platform.OS !== 'web') return
  try {
    document.documentElement.style.setProperty('--tt-gap', `${autoBottomGap()}px`)
  } catch {
  }
}
