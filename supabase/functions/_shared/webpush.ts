import webpush from 'npm:web-push@3.6.7'

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

const PUSH_HOST_SUFFIXES = ['fcm.googleapis.com', 'push.apple.com', 'push.services.mozilla.com', 'notify.windows.com']

export function isPushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint)
    const host = u.hostname.toLowerCase()
    return u.protocol === 'https:' && !u.port && PUSH_HOST_SUFFIXES.some((s) => host === s || host.endsWith('.' + s))
  } catch {
    return false
  }
}

export async function sendWebPush(
  admin: any,
  userIds: string[],
  message: (userId: string) => { title: string; body: string; url?: string } | null,
): Promise<number> {
  if (userIds.length === 0) return 0
  const { data: subs } = await admin
    .from('web_push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)
  let sent = 0
  for (const s of subs ?? []) {
    if (!isPushEndpoint(s.endpoint)) {
      await admin.from('web_push_subscriptions').delete().eq('id', s.id)
      continue
    }
    const m = message(s.user_id)
    if (!m) continue
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: m.title, body: m.body, url: m.url ?? '/' }),
      )
      sent++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await admin.from('web_push_subscriptions').delete().eq('id', s.id)
      } else {
        console.error('web push failed', status)
      }
    }
  }
  return sent
}
