import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { isPushEndpoint } from '../_shared/webpush.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

// Lähettää testi-ilmoituksen vain kutsujan omiin laitteisiin ja kertoo tuloksen.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const { data: subs, error } = await admin
    .from('web_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', user.id)
  if (error) return json({ subscriptions: 0, error: error.message })

  const results: { host: string; ok: boolean; status?: number; detail?: string }[] = []
  for (const s of subs ?? []) {
    const host = (() => { try { return new URL(s.endpoint).hostname } catch { return '?' } })()
    if (!isPushEndpoint(s.endpoint)) {
      results.push({ host, ok: false, detail: 'endpoint not allowed' })
      continue
    }
    try {
      const res = await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: 'TheTotal', body: 'Testi-ilmoitus toimii 💪', url: '/profile' }),
      )
      results.push({ host, ok: true, status: res.statusCode })
    } catch (e) {
      const err = e as { statusCode?: number; body?: string; message?: string }
      results.push({ host, ok: false, status: err.statusCode, detail: (err.body || err.message || '').slice(0, 200) })
      if (err.statusCode === 404 || err.statusCode === 410) {
        await admin.from('web_push_subscriptions').delete().eq('id', s.id)
      }
    }
  }
  return json({ subscriptions: (subs ?? []).length, results })
})
