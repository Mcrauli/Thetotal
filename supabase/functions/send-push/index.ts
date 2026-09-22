import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWebPush } from '../_shared/webpush.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

// Lähettää push-ilmoituksen palvelimelta. Client EI enää lue muiden tokeneita.
// Valtuutus: lähettäjä saa ilmoittaa vain hyväksytyille kavereilleen.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return json({ error: 'Unauthorized' }, 401)

  let payload: { toUserIds?: string[]; title?: string; body?: string; data?: unknown; url?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Bad Request' }, 400)
  }

  const toUserIds = (payload.toUserIds ?? []).filter((x): x is string => typeof x === 'string')
  const title = String(payload.title ?? '')
  const body = String(payload.body ?? '')
  const url = typeof payload.url === 'string' && payload.url.startsWith('/') ? payload.url : '/'
  if (toUserIds.length === 0 || !title) return json({ sent: 0 })

  // Salli vain hyväksytyt kaverit (estä mielivaltainen push-spämmäys).
  const { data: friends } = await admin
    .from('friendships')
    .select('user_id, friend_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
  const friendIds = new Set(
    (friends ?? []).map((f: any) => (f.user_id === user.id ? f.friend_id : f.user_id))
  )
  const allowed = toUserIds.filter((id) => friendIds.has(id))
  if (allowed.length === 0) return json({ sent: 0 })

  const { data: devices } = await admin
    .from('user_devices')
    .select('push_token')
    .in('user_id', allowed)
  const tokens = (devices ?? []).map((d: any) => d.push_token).filter(Boolean)

  if (tokens.length > 0) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokens.map((to: string) => ({ to, title, body, data: payload.data }))),
      })
    } catch {
      // non-critical
    }
  }

  const web = await sendWebPush(admin, allowed, () => ({ title, body, url }))

  return json({ sent: tokens.length, web })
})
