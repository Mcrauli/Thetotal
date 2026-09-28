import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform, Share } from 'react-native'
import { supabase } from './supabase'
import { sendPushToUsers } from './notifications'
import { t } from './i18n'

const PENDING_KEY = 'thetotal:pendingInvite'
const WEB_ORIGIN = 'https://thetotal.vercel.app'

export function inviteUrl(code: string): string {
  return `${WEB_ORIGIN}/invite/${code}`
}

export async function rememberInvite(code: string) {
  await AsyncStorage.setItem(PENDING_KEY, code).catch(() => undefined)
}

export async function inviteOwner(code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('invite_owner', { p_code: code })
  if (error) return null
  return (data as string | null) ?? null
}

async function friendshipState(meId: string, inviterName: string): Promise<{ inviterId: string | null; alreadyFriends: boolean }> {
  const { data: inviter } = await supabase.from('users').select('id').eq('username', inviterName).maybeSingle()
  const inviterId = (inviter as { id: string } | null)?.id ?? null
  if (!inviterId || inviterId === meId) return { inviterId: null, alreadyFriends: true }
  const { data: rows } = await supabase
    .from('friendships')
    .select('status')
    .or(`and(user_id.eq.${meId},friend_id.eq.${inviterId}),and(user_id.eq.${inviterId},friend_id.eq.${meId})`)
  const alreadyFriends = (rows ?? []).some((r: { status: string }) => r.status === 'accepted')
  return { inviterId, alreadyFriends }
}

export async function acceptInvite(code: string): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  const meId = session?.user?.id
  const inviterName = await inviteOwner(code)
  const before = meId && inviterName ? await friendshipState(meId, inviterName) : { inviterId: null, alreadyFriends: true }

  const { data, error } = await supabase.rpc('accept_invite', { p_code: code })
  if (error) return null
  await AsyncStorage.removeItem(PENDING_KEY).catch(() => undefined)

  if (meId && before.inviterId && !before.alreadyFriends) {
    const { data: me } = await supabase.from('users').select('username').eq('id', meId).maybeSingle()
    const myName = (me as { username: string } | null)?.username ?? ''
    sendPushToUsers({
      toUserIds: [before.inviterId],
      title: t('invite.joinedPushTitle', { name: myName }),
      body: t('invite.joinedPushBody'),
      url: '/social',
    }).catch(() => undefined)
  }
  return (data as string | null) ?? null
}

export async function consumePendingInvite(): Promise<string | null> {
  const code = await AsyncStorage.getItem(PENDING_KEY).catch(() => null)
  if (!code) return null
  const inviter = await acceptInvite(code)
  if (!inviter) await AsyncStorage.removeItem(PENDING_KEY).catch(() => undefined)
  return inviter
}

export async function shareInvite(text: string): Promise<'shared' | 'copied' | 'failed'> {
  const { data: code, error } = await supabase.rpc('my_invite_code')
  if (error || !code) return 'failed'
  const url = inviteUrl(code as string)
  if (Platform.OS !== 'web') {
    try {
      await Share.share({ message: `${text} ${url}`, url })
      return 'shared'
    } catch {
      return 'failed'
    }
  }
  const nav = window.navigator as any
  if (nav.share) {
    try {
      await nav.share({ title: 'TheTotal', text, url })
      return 'shared'
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'shared'
    }
  }
  try {
    await nav.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
