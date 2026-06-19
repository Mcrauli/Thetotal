import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// RevenueCat webhook -> päivittää users.is_supporter palvelinpuolella.
// Tämä on luotettava lähde: asiakas ei voi väärentää tukijastatusta.
//
// Asetukset:
//  1. RevenueCat dashboard -> Integrations -> Webhooks:
//     URL = https://<projektiref>.supabase.co/functions/v1/revenuecat-webhook
//     Authorization header = sama arvo kuin REVENUECAT_WEBHOOK_SECRET alla.
//  2. supabase secrets set REVENUECAT_WEBHOOK_SECRET=<satunnainen-salaisuus>
//  3. RevenueCatissa aseta App User ID = Supabasen käyttäjän id (tehdään appissa
//     Purchases.configure({ appUserID })).

const SUPPORTER_ENTITLEMENT = 'supporter'
const ACTIVE_TYPES = ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'TRANSFER']
const INACTIVE_TYPES = ['EXPIRATION', 'CANCELLATION', 'REFUND', 'SUBSCRIPTION_PAUSED']

Deno.serve(async (req) => {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
  if (secret && req.headers.get('Authorization') !== secret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const event = body?.event
  if (!event) return new Response('Bad Request', { status: 400 })

  const userId: string | undefined = event.app_user_id
  if (!userId) return new Response(JSON.stringify({ ignored: true }), { headers: { 'Content-Type': 'application/json' } })

  const entitlements: string[] = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : [])
  const touchesSupporter = entitlements.length === 0 || entitlements.includes(SUPPORTER_ENTITLEMENT)
  if (!touchesSupporter) return new Response(JSON.stringify({ ignored: true }), { headers: { 'Content-Type': 'application/json' } })

  let isSupporter: boolean | null = null
  if (ACTIVE_TYPES.includes(event.type)) isSupporter = true
  else if (INACTIVE_TYPES.includes(event.type)) isSupporter = false

  if (isSupporter === null) return new Response(JSON.stringify({ ignored: true }), { headers: { 'Content-Type': 'application/json' } })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  await admin.from('users').update({ is_supporter: isSupporter }).eq('id', userId)

  return new Response(JSON.stringify({ success: true, is_supporter: isSupporter }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
