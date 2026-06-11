import { useRef, useState } from 'react'
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { RankBarbellIcon } from '../ui/RankBarbellIcon'
import { getRankData, TIER_ROMAN } from '../../lib/xp'
import { useT } from '../../lib/i18n'
import { COLORS } from '../../lib/constants'
import type { RankName } from '../../lib/constants'

interface ShareRankModalProps {
  visible: boolean
  onClose: () => void
  username: string
  sbdRank: RankName
  tier?: 1 | 2 | 3 | 4
  ratio: number
  sbdTotal: number
  streak: number
  totalWorkouts: number
  duelWins: number
}

export function ShareRankModal({
  visible, onClose, username, sbdRank, tier, ratio, sbdTotal, streak, totalWorkouts, duelWins,
}: ShareRankModalProps) {
  const t = useT()
  const cardRef = useRef<View>(null)
  const [sharing, setSharing] = useState(false)
  const rankData = getRankData(sbdRank)
  const tierLabel = tier ? ` ${TIER_ROMAN[tier]}` : ''

  async function share() {
    try {
      setSharing(true)
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' })
      const available = await Sharing.isAvailableAsync()
      if (!available) { Alert.alert(t('common.error')); return }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('share.dialogTitle') })
    } catch {
      Alert.alert(t('common.error'))
    } finally {
      setSharing(false)
    }
  }

  function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
    return (
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 2 }}>{value}</Text>
        <Text style={{ color: COLORS.muted, fontSize: 9, letterSpacing: 1, marginTop: 1 }}>{label.toUpperCase()}</Text>
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View ref={cardRef} collapsable={false} style={{ width: 320, borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={[rankData.color + '40', COLORS.bg, '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '900', letterSpacing: 4 }}>THE TOTAL</Text>

            <View style={{ marginTop: 16 }}>
              <RankBarbellIcon rank={sbdRank} width={120} height={120} />
            </View>
            <Text style={{ color: rankData.color, fontSize: 24, fontWeight: '900', letterSpacing: 2, marginTop: 10, textAlign: 'center' }}>
              {t(`rank.${sbdRank}` as any).toUpperCase()}{tierLabel}
            </Text>

            <View style={{ alignItems: 'center', marginTop: 18 }}>
              <Text style={{ color: COLORS.gold, fontSize: 44, fontWeight: '900' }}>
                {sbdTotal}<Text style={{ fontSize: 18, fontWeight: '400' }}>kg</Text>
              </Text>
              {ratio > 0 && (
                <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>{ratio.toFixed(2)}× {t('ranks.bw')}</Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', marginTop: 22, width: '100%' }}>
              <Stat icon="🔥" value={String(streak)} label={t('profile.streakLabel')} />
              <Stat icon="🏋️" value={String(totalWorkouts)} label={t('profile.workouts')} />
              <Stat icon="🥊" value={String(duelWins)} label={t('share.winsLabel')} />
            </View>

            <View style={{ height: 1, backgroundColor: COLORS.cardEdge, width: '100%', marginTop: 22, opacity: 0.5 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 14 }}>@{username}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{t('share.cta')}</Text>
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
