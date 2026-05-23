import { View, Text, TouchableOpacity } from 'react-native'

interface SBDRowProps {
  squat: number
  bench: number
  deadlift: number
  onPress?: () => void
}

export function SBDRow({ squat, bench, deadlift, onPress }: SBDRowProps) {
  const total = squat + bench + deadlift
  const Wrapper: any = onPress ? TouchableOpacity : View
  return (
    <Wrapper onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View className="flex-row justify-between items-baseline mb-2">
        <Text className="text-muted text-xs tracking-widest">SBD ENNÄTYKSET</Text>
        {onPress && <Text className="text-muted text-xs">muokkaa ✎</Text>}
      </View>
      <View className="flex-row gap-2 mb-4">
        {[
          { label: 'SQ',  value: squat,    highlight: false },
          { label: 'BP',  value: bench,    highlight: false },
          { label: 'DL',  value: deadlift, highlight: false },
          { label: 'TTL', value: total,    highlight: true  },
        ].map(({ label, value, highlight }) => (
          <View
            key={label}
            className={`flex-1 rounded-xl p-3 items-center ${highlight ? 'bg-card2 border border-gold' : 'bg-card border border-cardEdge'}`}
          >
            <Text className={`text-xs ${highlight ? 'text-gold' : 'text-muted'}`}>{label}</Text>
            <Text className={`font-bold text-lg ${highlight ? 'text-gold' : 'text-white'}`}>
              {value > 0 ? `${value}kg` : '—'}
            </Text>
          </View>
        ))}
      </View>
    </Wrapper>
  )
}
