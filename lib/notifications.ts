import { supabase } from './supabase'

interface PushParams {
  toUserIds: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function sendPushToUsers({ toUserIds, title, body, data }: PushParams) {
  if (toUserIds.length === 0) return
  const { data: users } = await supabase
    .from('users')
    .select('push_token')
    .in('id', toUserIds)
    .not('push_token', 'is', null)
  const tokens = (users ?? []).map((u: any) => u.push_token).filter(Boolean)
  if (tokens.length === 0) return
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens.map((to: string) => ({ to, title, body, data }))),
    })
  } catch {
  }
}
