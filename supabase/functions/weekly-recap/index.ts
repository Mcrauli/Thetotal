import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Sends a weekly recap push to every user who trained this week.
// Triggered by pg_cron (Sunday evening). Protected by service-role bearer.
Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  if (auth !== `Bearer ${serviceKey}`) return new Response('Unauthorized', { status: 401 })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  // Week start: Monday 00:00 UTC
  const now = new Date()
  const day = (now.getUTCDay() + 6) % 7
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day, 0, 0, 0))
  const startISO = weekStart.toISOString()

  const { data: ws } = await admin
    .from('workouts')
    .select('user_id, total_volume_kg, started_at')
    .gte('started_at', startISO)

  const stats: Record<string, { count: number; volume: number }> = {}
  for (const w of (ws ?? []) as any[]) {
    const s = stats[w.user_id] ?? { count: 0, volume: 0 }
    s.count += 1
    s.volume += Number(w.total_volume_kg ?? 0)
    stats[w.user_id] = s
  }

  const activeIds = Object.keys(stats)
  if (activeIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  const { data: users } = await admin
    .from('users')
    .select('id, streak, push_token')
    .in('id', activeIds)
    .not('push_token', 'is', null)

  const messages = (users ?? [])
    .filter((u: any) => u.push_token)
    .map((u: any) => {
      const s = stats[u.id]
      const vol = Math.round(s.volume).toLocaleString('fi-FI')
      return {
        to: u.push_token,
        title: '📊 Viikkokooste',
        body: `Teit ${s.count} ${s.count === 1 ? 'treenin' : 'treeniä'} ja nostit ${vol} kg tällä viikolla. Putki: ${u.streak} 🔥`,
        sound: 'default',
      }
    })

  let sent = 0
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100)
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      })
      sent += chunk.length
    } catch (_) { /* non-critical */ }
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
