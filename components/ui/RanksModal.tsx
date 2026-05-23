import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native'
import { RANKS, SBD_RANK_THRESHOLDS, type RankName } from '../../lib/constants'
import { TIER_ROMAN } from '../../lib/xp'
import { RankBarbellIcon } from './RankBarbellIcon'

interface RanksModalProps {
  visible: boolean
  onClose: () => void
  currentRank: RankName
  currentTier?: 1 | 2 | 3 | 4
  ratio?: number
}

const RANK_DESC: Record<RankName, string> = {
  Aloittelija:    'Kaikki alkaa täältä. Perusliikeradat kuntoon.',
  Harrastaja:     'Perusvoima alkaa kehittyä. Säännöllinen harjoittelu näkyy tuloksissa.',
  Kilpailija:     'Selkeästi yli keskivertotason. Vahva harjoittelija.',
  Alueellinen:    'Huomattava voimataso. Kuulut vahvimpaan 20 %:iin harjoittelijoista.',
  Kansallinen:    'Poikkeuksellinen voima. Top 10 % harjoittelijoista.',
  Kansainvälinen: 'Harvinainen voimataso. Vain harva yltää tähän.',
  Eliitti:        'Äärimmäinen voimataso. Top 1 % harjoittelijoista.',
  Mestari:        'Vuosien kurinalaisuuden tulos. Poikkeuksellinen suoritus.',
  Maailmaluokka:  'Maailman kärkeä lähestyvä voimataso.',
  Legenda:        'Maailman huippu. Harva koskaan saavuttaa tämän.',
}

function getTierThresholds(rankIdx: number): { tier: 1|2|3|4; min: number; max: number }[] {
  const min = SBD_RANK_THRESHOLDS[rankIdx].bwMultiple
  const max = SBD_RANK_THRESHOLDS[rankIdx + 1]?.bwMultiple ?? min + 1
  const step = (max - min) / 4
  return [4, 3, 2, 1].map(tier => ({
    tier: tier as 1|2|3|4,
    min: +(min + step * (4 - tier)).toFixed(2),
    max: +(min + step * (5 - tier)).toFixed(2),
  }))
}

export function RanksModal({ visible, onClose, currentRank, currentTier, ratio }: RanksModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg">
        <View className="flex-row justify-between items-center px-6 pt-6 pb-2">
          <Text className="text-white text-xl font-black">SBD Ranks</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-muted text-base">Sulje</Text>
          </TouchableOpacity>
        </View>
        {ratio !== undefined && ratio > 0 && (
          <Text className="text-muted text-xs px-6 pb-4">SBD-yhteensä: {ratio.toFixed(2)}× oma paino</Text>
        )}

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {[...RANKS].reverse().map((rank) => {
            const idx = SBD_RANK_THRESHOLDS.findIndex(t => t.name === rank.name)
            const isLegend = rank.name === 'Legenda'
            const isCurrentRank = rank.name === currentRank
            const tiers = isLegend ? [] : getTierThresholds(idx)

            return (
              <View
                key={rank.name}
                style={{ borderLeftWidth: 3, borderLeftColor: isCurrentRank ? rank.color : 'transparent' }}
                className={`rounded-2xl p-4 mb-3 ${isCurrentRank ? 'bg-card2' : 'bg-card'}`}
              >
                <View style={{ marginBottom: 8 }}>
                  <RankBarbellIcon rank={rank.name} width={72} height={72} />
                </View>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-lg font-black" style={{ color: rank.color }}>
                    {rank.name.toUpperCase()}
                  </Text>
                  <Text className="text-muted text-xs">
                    {isLegend
                      ? `${SBD_RANK_THRESHOLDS[idx].bwMultiple}×+ BW`
                      : `${SBD_RANK_THRESHOLDS[idx].bwMultiple}–${SBD_RANK_THRESHOLDS[idx + 1].bwMultiple}× BW`}
                  </Text>
                </View>

                <Text className="text-muted text-xs mb-3">{RANK_DESC[rank.name]}</Text>

                {!isLegend && (
                  <View className="gap-1">
                    {tiers.map(({ tier, min, max }) => {
                      const isActive = isCurrentRank && currentTier === tier
                      return (
                        <View
                          key={tier}
                          className="flex-row justify-between items-center rounded-lg px-3 py-2"
                          style={{
                            backgroundColor: isActive ? rank.color + '25' : '#ffffff08',
                            borderWidth: isActive ? 1 : 0,
                            borderColor: rank.color,
                          }}
                        >
                          <Text className="text-sm font-bold" style={{ color: isActive ? rank.color : '#666' }}>
                            {rank.name} {TIER_ROMAN[tier]}
                            {isActive ? '  ← sinä' : ''}
                          </Text>
                          <Text className="text-xs" style={{ color: isActive ? rank.color : '#555' }}>
                            {min}–{max}× BW
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}
