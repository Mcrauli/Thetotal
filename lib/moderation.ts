import { Alert } from 'react-native'
import { supabase } from './supabase'
import { t } from './i18n'

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
    reason: params.reason.trim() || t('mod.reasonOther'),
  })
  if (error) {
    Alert.alert(t('common.error'), error.message)
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
    Alert.alert(t('common.error'), error.message)
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
    Alert.alert(t('common.error'), error.message)
    return false
  }
  return true
}

const REPORT_REASON_KEYS = [
  'mod.reasonHarassment',
  'mod.reasonHate',
  'mod.reasonSpam',
  'mod.reasonFake',
  'mod.reasonSexual',
  'mod.reasonOther',
] as const

export function promptReport(onSubmit: (reason: string) => void) {
  Alert.alert(
    t('mod.report'),
    t('mod.reportBody'),
    [
      ...REPORT_REASON_KEYS.map(key => ({
        text: t(key),
        onPress: () => onSubmit(t(key)),
      })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ],
  )
}
