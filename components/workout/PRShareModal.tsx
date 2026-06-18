import { useRef, useState } from 'react'
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { useT } from '../../lib/i18n'
import { COLORS } from '../../lib/constants'

export interface PRShareItem {
  exerciseName: string
  weight: number
  reps: number
}

interface PRShareModalProps {
  visible: boolean
  onClose: () => void
  username: string
  dateLabel: string
  prs: PRShareItem[]
}

export function PRShareModal({ visible, onClose, username, dateLabel, prs }: PRShareModalProps) {
  const t = useT()
  const cardRef = useRef<View>(null)
  const [sharing, setSharing] = useState(false)

  const headline = prs[0]
  const rest = prs.slice(1)

  async function share() {
    try {
      setSharing(true)
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' })
      const available = await Sharing.isAvailableAsync()
      if (!available) { Alert.alert(t('common.error')); return }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('share.prDialogTitle') })
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '')
    } finally {
      setSharing(false)
    }
  }

  if (!headline) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View ref={cardRef} collapsable={false} style={{ width: 320, borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={[COLORS.gold + '40', COLORS.bg, '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '900', letterSpacing: 4 }}>THE TOTAL</Text>
            <Text style={{ color: COLORS.gold, fontSize: 18, fontWeight: '900', letterSpacing: 3, marginTop: 18 }}>
              {t('share.prTitle')}
            </Text>

            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginTop: 22, textAlign: 'center' }}>
              {headline.exerciseName.toUpperCase()}
            </Text>
            <Text style={{ color: COLORS.gold, fontSize: 44, fontWeight: '900', marginTop: 6 }}>
              {headline.weight}<Text style={{ fontSize: 20, fontWeight: '400' }}>kg</Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff' }}> × {headline.reps}</Text>
            </Text>

            {rest.length > 0 && (
              <View style={{ marginTop: 18, width: '100%' }}>
                {rest.map((p, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1}>{p.exerciseName}</Text>
                    <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '900' }}>{p.weight}kg × {p.reps}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 1, backgroundColor: COLORS.cardEdge, width: '100%', marginTop: 24, opacity: 0.5 }} />
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 14 }}>{dateLabel}</Text>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 }}>@{username}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 6, textAlign: 'center' }}>{t('share.cta')}</Text>
          </LinearGradient>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ backgroundColor: COLORS.card2, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('common.close')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={share}
            disabled={sharing}
            style={{ backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, opacity: sharing ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            {sharing && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#fff', fontWeight: '900' }}>{t('share.shareButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
