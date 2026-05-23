import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

  const id = user.id

  await admin.from('workout_sets').delete().in(
    'workout_id',
    (await admin.from('workouts').select('id').eq('user_id', id)).data?.map((w: any) => w.id) ?? []
  )
  await admin.from('workouts').delete().eq('user_id', id)
  await admin.from('personal_records').delete().eq('user_id', id)
  await admin.from('user_challenges').delete().eq('user_id', id)
  await admin.from('workout_templates').delete().eq('user_id', id)
  await admin.from('friendships').delete().or(`user_id.eq.${id},friend_id.eq.${id}`)
  await admin.from('users').delete().eq('id', id)
  await admin.auth.admin.deleteUser(id)

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
