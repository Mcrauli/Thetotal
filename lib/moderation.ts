import { Alert } from 'react-native'
import { supabase } from './supabase'

export async function reportContent(params: {
  reporterId: string
  targetType: 'comment' | 'user' | 'pr'
  targetId: string
  reason: string
}) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason.trim() || 'Sopimaton sisältö',
  })
  if (error) {
    Alert.alert('Virhe', error.message)
    return false
  }
  return true
}

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.from('blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  })
  if (error && !error.message.includes('duplicate')) {
    Alert.alert('Virhe', error.message)
    return false
  }
  return true
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  if (error) {
    Alert.alert('Virhe', error.message)
    return false
  }
  return true
}

export const REPORT_REASONS = [
  'Häirintä tai kiusaaminen',
  'Vihapuhe tai syrjintä',
  'Spämmi',
  'Väärä tieto / huijaus',
  'Seksuaalinen sisältö',
  'Muu sopimaton sisältö',
]

export function promptReport(onSubmit: (reason: string) => void) {
  Alert.alert(
    'Ilmianna sisältö',
    'Miksi tämä on sopimaton?',
    [
      ...REPORT_REASONS.map(reason => ({
        text: reason,
        onPress: () => onSubmit(reason),
      })),
      { text: 'Peruuta', style: 'cancel' as const },
    ],
  )
}
