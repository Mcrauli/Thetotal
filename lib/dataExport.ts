import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { supabase } from './supabase'

// Kerää käyttäjän kaiken datan ja jakaa sen JSON-tiedostona (GDPR: oikeus tietoihin).
export async function exportUserData(userId: string): Promise<boolean> {
  const [profile, workouts, prs, challenges, templates, friendCh, comments] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('workouts').select('*').eq('user_id', userId),
    supabase.from('personal_records').select('*').eq('user_id', userId),
    supabase.from('user_challenges').select('*').eq('user_id', userId),
    supabase.from('workout_templates').select('*').eq('user_id', userId),
    supabase.from('friend_challenges').select('*').or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`),
    supabase.from('pr_comments').select('*').eq('user_id', userId),
  ])

  const workoutIds = (workouts.data ?? []).map((w: any) => w.id)
  const sets = workoutIds.length > 0
    ? await supabase.from('workout_sets').select('*').in('workout_id', workoutIds)
    : { data: [] }

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    workouts: workouts.data,
    workout_sets: sets.data,
    personal_records: prs.data,
    achievements: challenges.data,
    workout_templates: templates.data,
    friend_challenges: friendCh.data,
    comments: comments.data,
  }

  const json = JSON.stringify(payload, null, 2)
  const uri = `${FileSystem.cacheDirectory}thetotal-data.json`
  await FileSystem.writeAsStringAsync(uri, json)

  if (!(await Sharing.isAvailableAsync())) return false
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'TheTotal' })
  return true
}
