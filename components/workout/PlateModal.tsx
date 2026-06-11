import { useState } from 'react'
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { calcPlates } from '../../lib/plates'
import { calcWarmup } from '../../lib/warmup'
import { PlateBar } from './PlateBar'
import { useT } from '../../lib/i18n'
import { COLORS } from '../../lib/constants'

interface PlateModalProps {
  visible: boolean
  onClose: () => void
}

const BARS = [20, 25, 15]

export function PlateModal({ visible, onClose }: PlateModalProps) {
  const t = useT()
  const [weight, setWeight] = useState('')
  const [bar, setBar] = useState(20)
  const w = parseFloat(weight) || 0
  const { plates, leftover } = calcPlates(w, bar)
  const warmup = calcWarmup(w, bar)

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{t('plate.title')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: COLORS.muted, fontSize: 15 }}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>{t('plate.weightLabel')}</Text>
          <TextInput
            style={{ backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 28, fontWeight: '900' }}
            placeholder="0"
            placeholderTextColor="#555"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            autoFocus
          />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {BARS.map(b => (
              <TouchableOpacity
                key={b}
                onPress={() => setBar(b)}
                style={{ flex: 1, backgroundColor: bar === b ? COLORS.accent : COLORS.card, borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
              >
                <Text style={{ color: bar === b ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{t('plate.bar')} {b}kg</Text>
              </TouchableOpacity>
            ))}
          </View>

          {w > bar && (
            <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginTop: 16, alignItems: 'center' }}>
              <PlateBar plates={plates} />
              <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 8 }}>
                {plates.length > 0 ? plates.join(' + ') : '—'} {t('plate.perSide')}
              </Text>
              {leftover > 0 && (
                <Text style={{ color: COLORS.accent, fontSize: 11, marginTop: 4 }}>{t('plate.leftover', { kg: String(leftover) })}</Text>
              )}
            </View>
          )}

          {warmup.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>{t('plate.warmup')}</Text>
              {warmup.map((s, i) => {
                const sp = calcPlates(s.weight, bar)
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 }}>
                    <View>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{s.weight}<Text style={{ fontSize: 12, fontWeight: '400' }}>kg</Text></Text>
                      <Text style={{ color: COLORS.muted, fontSize: 11 }}>× {s.reps}</Text>
                    </View>
                    <Text style={{ color: COLORS.muted, fontSize: 11, flex: 1, textAlign: 'right' }} numberOfLines={1}>
                      {sp.plates.length > 0 ? sp.plates.join('+') : t('plate.barOnly')}
                    </Text>
                  </View>
                )
              })}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.accentDim, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.accent }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{w}<Text style={{ fontSize: 12, fontWeight: '400' }}>kg</Text></Text>
                <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700' }}>{t('plate.workSet')}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}
