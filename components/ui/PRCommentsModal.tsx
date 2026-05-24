import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { sendPushToUsers } from '../../lib/notifications'
import { COLORS } from '../../lib/constants'

interface Comment {
  id: string
  user_id: string
  username: string
  body: string
  created_at: string
}

interface Props {
  visible: boolean
  prId: string | null
  prLabel?: string
  prOwnerId?: string
  onClose: () => void
}

export function PRCommentsModal({ visible, prId, prLabel, prOwnerId, onClose }: Props) {
  const { profile } = useUserStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!visible || !prId) return
    setLoading(true)
    setText('')
    supabase
      .from('pr_comments')
      .select('id, user_id, body, created_at, users!inner(username)')
      .eq('pr_id', prId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments((data ?? []).map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          username: c.users?.username ?? '?',
          body: c.body,
          created_at: c.created_at,
        })))
        setLoading(false)
      })
  }, [visible, prId])

  async function postComment() {
    if (!profile || !prId) return
    const body = text.trim()
    if (!body) return
    if (body.length > 500) { Alert.alert('Liian pitkä', 'Maksimi 500 merkkiä'); return }
    setPosting(true)
    const { data, error } = await supabase
      .from('pr_comments')
      .insert({ pr_id: prId, user_id: profile.id, body })
      .select('id, created_at')
      .single()
    setPosting(false)
    if (error) { Alert.alert('Virhe', error.message); return }
    setComments(prev => [...prev, {
      id: data.id, user_id: profile.id, username: profile.username,
      body, created_at: data.created_at,
    }])
    setText('')

    const notifyIds = new Set<string>()
    if (prOwnerId && prOwnerId !== profile.id) notifyIds.add(prOwnerId)
    for (const c of comments) {
      if (c.user_id !== profile.id) notifyIds.add(c.user_id)
    }
    if (notifyIds.size > 0) {
      await sendPushToUsers({
        toUserIds: [...notifyIds],
        title: `💬 ${profile.username}`,
        body: prLabel ? `${prLabel}: ${body}` : body,
      })
    }
  }

  async function deleteComment(id: string) {
    Alert.alert('Poista kommentti', 'Oletko varma?', [
      { text: 'Peruuta', style: 'cancel' },
      {
        text: 'Poista', style: 'destructive', onPress: async () => {
          await supabase.from('pr_comments').delete().eq('id', id)
          setComments(prev => prev.filter(c => c.id !== id))
        },
      },
    ])
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'nyt'
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days} pv`
    return new Date(iso).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.card }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>Kommentit</Text>
              {prLabel && <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>{prLabel}</Text>}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: COLORS.muted, fontSize: 15 }}>Sulje</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
              {comments.length === 0 ? (
                <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 40 }}>
                  Ole ensimmäinen kommentoija 💬
                </Text>
              ) : (
                comments.map(c => (
                  <View key={c.id} style={{ backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.accent, fontWeight: '700', fontSize: 13 }}>{c.username}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ color: COLORS.muted, fontSize: 11 }}>{timeAgo(c.created_at)}</Text>
                        {c.user_id === profile?.id && (
                          <TouchableOpacity onPress={() => deleteComment(c.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                            <Text style={{ color: COLORS.muted, fontSize: 14 }}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 14, lineHeight: 19 }}>{c.body}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.card }}>
            <TextInput
              style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', maxHeight: 100 }}
              placeholder="Kirjoita kommentti..."
              placeholderTextColor="#666"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={postComment}
              disabled={posting || !text.trim()}
              style={{
                backgroundColor: text.trim() ? COLORS.accent : COLORS.card2,
                borderRadius: 12,
                paddingHorizontal: 16,
                justifyContent: 'center',
                opacity: posting ? 0.5 : 1,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Lähetä</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}
