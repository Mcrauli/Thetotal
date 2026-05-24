import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../lib/constants'
import { estimateOneRepMax } from '../../lib/pr'

export interface ImprovementResult {
  exerciseName: string
  prevWeight: number
  prevReps: number
  newWeight: number
  newReps: number
  isAllTimePR: boolean
}

export interface ChallengeResult {
  name: string
  xp: number
}

interface XPBreakdown {
  base: number
  prBonus: number
  streakBonus: number
  challengeBonus: number
}

interface Props {
  visible: boolean
  xpGain: number
  xpBreakdown: XPBreakdown
  improvements: ImprovementResult[]
  challenges: ChallengeResult[]
  onDismiss: () => void
}

const { height } = Dimensions.get('window')

function XPChip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={{ backgroundColor: accent ? COLORS.accentDim : '#1a1a2e', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: accent ? COLORS.accent : COLORS.muted, fontSize: 11 }}>{label}</Text>
    </View>
  )
}

export function WorkoutResults({ visible, xpGain, xpBreakdown, improvements, challenges, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(80)).current

  useEffect(() => {
    if (visible) {
      translateY.setValue(80)
      Animated.spring(translateY, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }).start()
    }
  }, [visible])

  const hasContent = improvements.length > 0 || challenges.length > 0

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
    <View style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.88)',
      justifyContent: 'center',
    }}>
      <Animated.View style={{
        transform: [{ translateY }],
        marginHorizontal: 20,
        backgroundColor: COLORS.card,
        borderRadius: 24,
        overflow: 'hidden',
        maxHeight: height * 0.80,
      }}>
        <View style={{ height: 4, backgroundColor: COLORS.accent }} />

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 40, marginBottom: 6 }}>💪</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 }}>
              TREENI VALMIS
            </Text>
          </View>

          <View style={{
            backgroundColor: COLORS.bg,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            marginBottom: hasContent ? 20 : 0,
            borderWidth: 1,
            borderColor: COLORS.gold,
          }}>
            <Text style={{ color: COLORS.muted, fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>XP ANSAITTU</Text>
            <Text style={{ color: COLORS.gold, fontSize: 44, fontWeight: '900', lineHeight: 48 }}>+{xpGain}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <XPChip label={`${xpBreakdown.base} treeni`} />
              {xpBreakdown.prBonus > 0 && <XPChip label={`+${xpBreakdown.prBonus} PR`} accent />}
              {xpBreakdown.streakBonus > 0 && <XPChip label={`+${xpBreakdown.streakBonus} putki`} accent />}
              {xpBreakdown.challengeBonus > 0 && <XPChip label={`+${xpBreakdown.challengeBonus} haasteet`} accent />}
            </View>
          </View>

          {improvements.length > 0 && (
            <View style={{ marginBottom: challenges.length > 0 ? 20 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ionicons name="trending-up" size={16} color={COLORS.accent} />
                <Text style={{ color: COLORS.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>KEHITYSTÄ</Text>
              </View>
              {improvements.map(item => (
                <View key={item.exerciseName} style={{
                  backgroundColor: COLORS.bg,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: item.isAllTimePR ? COLORS.gold : COLORS.accent,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>{item.exerciseName}</Text>
                    {item.isAllTimePR && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="trophy" size={12} color={COLORS.gold} />
                        <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>PR</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {item.prevWeight > 0 && (
                      <>
                        <Text style={{ color: COLORS.muted, fontSize: 16, textDecorationLine: 'line-through' }}>
                          {item.prevWeight}kg×{item.prevReps}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
                      </>
                    )}
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>
                      {item.newWeight}kg×{item.newReps}
                    </Text>
                    {item.prevWeight > 0 && (
                      <View style={{ backgroundColor: COLORS.accentDim, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>
                          {item.newWeight > item.prevWeight
                            ? `+${Math.round((item.newWeight - item.prevWeight) * 10) / 10}kg`
                            : `+${item.newReps - item.prevReps} toistoa`}
                        </Text>
                      </View>
                    )}
                  </View>
                  {item.newReps > 1 && (
                    <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 6 }}>
                      ≈ {estimateOneRepMax(item.newWeight, item.newReps)} kg 1RM
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {challenges.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ionicons name="medal" size={16} color={COLORS.accent} />
                <Text style={{ color: COLORS.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>HAASTEET SUORITETTU</Text>
              </View>
              {challenges.map(c => (
                <View key={c.name} style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: COLORS.bg, borderRadius: 12, padding: 12, marginBottom: 8,
                }}>
                  <Text style={{ color: '#fff', fontWeight: '600', flex: 1 }}>{c.name}</Text>
                  <Text style={{ color: COLORS.gold, fontWeight: '700' }}>+{c.xp} XP</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}>
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.8}
            style={{ backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>JATKA</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
    </Modal>
  )
}
