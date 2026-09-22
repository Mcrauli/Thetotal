export function isStandalone(win: Window): boolean {
  return Boolean(win.matchMedia?.('(display-mode: standalone)').matches || (win.navigator as any).standalone === true)
}

export function installPlatform(userAgent: string, maxTouchPoints: number = 0): 'ios' | 'android' | 'other' {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios'
  if (userAgent.includes('Macintosh') && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  return 'other'
}
