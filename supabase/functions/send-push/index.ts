import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Lähettää push-ilmoituksen palvelimelta. Client EI enää lue muiden tokeneita.
// Valtuutus: lähettäjä saa ilmoittaa vain hyväksytyille kavereilleen.
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

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
  if (!user || error) return new Response('Unauthorized', { status: 401 })

  let payload: { toUserIds?: string[]; title?: string; body?: string; data?: unknown }
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const toUserIds = (payload.toUserIds ?? []).filter((x): x is string => typeof x === 'string')
  const title = String(payload.title ?? '')
  const body = String(payload.body ?? '')
  if (toUserIds.length === 0 || !title) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

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
  if (allowed.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  const { data: devices } = await admin
    .from('user_devices')
    .select('push_token')
    .in('user_id', allowed)
  const tokens = (devices ?? []).map((d: any) => d.push_token).filter(Boolean)
  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens.map((to: string) => ({ to, title, body, data: payload.data }))),
    })
  } catch {
    // non-critical
  }

  return new Response(JSON.stringify({ sent: tokens.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
