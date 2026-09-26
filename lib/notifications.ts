import { supabase } from './supabase'

interface PushParams {
  toUserIds: string[]
  title: string
  body: string
  data?: Record<string, unknown>
  url?: string
}

// Lähetys tapahtuu palvelimella (send-push). Client ei koskaan lue muiden tokeneita.
export async function sendPushToUsers({ toUserIds, title, body, data, url }: PushParams) {
  if (toUserIds.length === 0) return
  try {
    await supabase.functions.invoke('send-push', {
      body: { toUserIds, title, body, data, url },
    })
  } catch {
  }
}
