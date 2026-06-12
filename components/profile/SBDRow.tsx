import { View, Text, TouchableOpacity } from 'react-native'
import { useT } from '../../lib/i18n'
import { StatNumber } from '../ui/StatNumber'
import { COLORS } from '../../lib/constants'

interface SBDRowProps {
  squat: number
  bench: number
  deadlift: number
  squatVerified?: boolean
  benchVerified?: boolean
  deadliftVerified?: boolean
  onPress?: () => void
}

export function SBDRow({ squat, bench, deadlift, squatVerified, benchVerified, deadliftVerified, onPress }: SBDRowProps) {
  const t = useT()
  const total = squat + bench + deadlift
  const Wrapper: any = onPress ? TouchableOpacity : View
  return (
    <Wrapper onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View className="flex-row justify-between items-baseline mb-2">
        <Text className="text-muted text-xs tracking-widest">{t('profile.sbdRecords')}</Text>
        {onPress && <Text className="text-muted text-xs">{t('profile.editPin').toLowerCase()}</Text>}
      </View>
      <View className="flex-row gap-2 mb-4">
        {[
          { label: 'SQ',  value: squat,    highlight: false, verified: squatVerified },
          { label: 'BP',  value: bench,    highlight: false, verified: benchVerified },
          { label: 'DL',  value: deadlift, highlight: false, verified: deadliftVerified },
          { label: 'TTL', value: total,    highlight: true,  verified: undefined },
        ].map(({ label, value, highlight, verified }) => (
          <View
            key={label}
            className={`flex-1 rounded-xl p-3 items-center ${highlight ? 'bg-card2 border border-gold' : 'bg-card border border-cardEdge'}`}
          >
            <Text className={`text-xs ${highlight ? 'text-gold' : 'text-muted'}`}>{label}</Text>
            {value > 0 ? (
              <StatNumber value={value} unit="kg" size={highlight ? 26 : 22} color={highlight ? COLORS.gold : '#fff'} unitColor={COLORS.muted} style={{ marginTop: 2 }} />
            ) : (
              <Text className={`font-bold text-lg ${highlight ? 'text-gold' : 'text-white'}`} style={{ marginTop: 2 }}>—</Text>
            )}
            {value > 0 && verified !== undefined && (
              verified
                ? <Text style={{ color: '#4ade80', fontSize: 9, marginTop: 2, fontWeight: '700' }}>✓</Text>
                : <Text style={{ color: '#888', fontSize: 9, marginTop: 2 }}>{t('profile.notVerified')}</Text>
            )}
          </View>
        ))}
      </View>
    </Wrapper>
  )
}
