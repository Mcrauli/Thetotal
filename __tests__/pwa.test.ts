import { isStandalone, installPlatform } from '../lib/pwa'

describe('installPlatform', () => {
  it('detects iPhone Safari', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
    expect(installPlatform(ua)).toBe('ios')
  })

  it('detects iPad reporting as Macintosh with touch support', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
    expect(installPlatform(ua, 5)).toBe('ios')
  })

  it('detects Android Chrome', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
    expect(installPlatform(ua)).toBe('android')
  })

  it('returns other for desktop Chrome', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    expect(installPlatform(ua)).toBe('other')
  })

  it('does not treat a Mac without touch support as iOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
    expect(installPlatform(ua, 0)).toBe('other')
  })
})

describe('isStandalone', () => {
  it('is true when display-mode matches standalone', () => {
    const win = { matchMedia: () => ({ matches: true }), navigator: {} } as unknown as Window
    expect(isStandalone(win)).toBe(true)
  })

  it('is true when navigator.standalone is true (iOS Safari)', () => {
    const win = { matchMedia: () => ({ matches: false }), navigator: { standalone: true } } as unknown as Window
    expect(isStandalone(win)).toBe(true)
  })

  it('is false when neither signal is set', () => {
    const win = { matchMedia: () => ({ matches: false }), navigator: {} } as unknown as Window
    expect(isStandalone(win)).toBe(false)
  })
})
