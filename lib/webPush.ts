import { Platform } from 'react-native'
import { supabase } from './supabase'
import { isStandalone, installPlatform } from './pwa'

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64Safe)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function subscriptionToRow(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  return {
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  }
}

export function webPushSupport(): 'unsupported' | 'needs-install' | 'supported' {
  if (Platform.OS !== 'web') return 'unsupported'
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) return 'supported'
  if (installPlatform(window.navigator.userAgent, window.navigator.maxTouchPoints) === 'ios' && !isStandalone(window)) {
    return 'needs-install'
  }
  return 'unsupported'
}

export function webPushPermission(): 'default' | 'granted' | 'denied' | 'unsupported' {
  if (Platform.OS !== 'web' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function registerServiceWorker(): Promise<void> {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch {
  }
}

export async function enableWebPush(userId: string): Promise<'granted' | 'denied' | 'error'> {
  if (Platform.OS !== 'web') return 'error'
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'error'
    const registration = await navigator.serviceWorker.ready
    let sub = await registration.pushManager.getSubscription()
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY!).buffer as ArrayBuffer,
      })
    }
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    await supabase.from('web_push_subscriptions').upsert(subscriptionToRow(userId, json), { onConflict: 'endpoint' })
    return 'granted'
  } catch {
    return 'error'
  }
}

export async function syncWebPush(userId: string): Promise<void> {
  if (Platform.OS !== 'web') return
  if (webPushPermission() !== 'granted') return
  try {
    const registration = await navigator.serviceWorker.ready
    let sub = await registration.pushManager.getSubscription()
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY!).buffer as ArrayBuffer,
      })
    }
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    await supabase.from('web_push_subscriptions').upsert(subscriptionToRow(userId, json), { onConflict: 'endpoint' })
  } catch {
  }
}

export async function disableWebPush(): Promise<void> {
  if (Platform.OS !== 'web') return
  try {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      await supabase.from('web_push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
  } catch {
  }
}
