import { View, Text, TouchableOpacity } from 'react-native'

export const ALL_BADGES = [
  { id: 'first_workout', icon: '🏋️', label: 'First Workout' },
  { id: 'streak_7',      icon: '🔥', label: '7 Day Streak' },
  { id: 'streak_30',     icon: '⚡', label: '30 Day Streak' },
  { id: 'pr_bench',      icon: '💪', label: 'Bench PR' },
  { id: 'pr_squat',      icon: '🦵', label: 'Squat PR' },
  { id: 'pr_deadlift',   icon: '⚔',  label: 'Deadlift PR' },
  { id: 'rank_bronze',   icon: '🥉', label: 'Bronze Rank' },
  { id: 'rank_gold',     icon: '🥇', label: 'Gold Rank' },
  { id: 'supporter',     icon: '⭐', label: 'Supporter' },
]

interface BadgeRowProps {
  xp: number
  streak: number
  hasBenchPR: boolean
  hasSquatPR: boolean
  hasDeadliftPR: boolean
  totalWorkouts: number
  isSupporter?: boolean
  featured?: string[]
  onEditPress?: () => void
  editLabel?: string
}

export function getUnlockedBadgeIds(props: BadgeRowProps): string[] {
  const badges: string[] = []
  if (props.totalWorkouts >= 1) badges.push('first_workout')
  if (props.streak >= 7)        badges.push('streak_7')
  if (props.streak >= 30)       badges.push('streak_30')
  if (props.hasBenchPR)         badges.push('pr_bench')
  if (props.hasSquatPR)         badges.push('pr_squat')
  if (props.hasDeadliftPR)      badges.push('pr_deadlift')
  if (props.xp >= 1000)         badges.push('rank_bronze')
  if (props.xp >= 7000)         badges.push('rank_gold')
  if (props.isSupporter)        badges.push('supporter')
  return badges
}

export function BadgeRow(props: BadgeRowProps) {
  const unlockedSet = new Set(getUnlockedBadgeIds(props))
  const toShow = props.featured && props.featured.length > 0
    ? ALL_BADGES.filter(b => props.featured!.includes(b.id) && unlockedSet.has(b.id))
    : ALL_BADGES.filter(b => unlockedSet.has(b.id))

  if (toShow.length === 0) return null

  return (
    <View className="bg-card rounded-2xl p-4 mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-muted text-xs tracking-widest">BADGES</Text>
        {props.onEditPress && (
          <TouchableOpacity onPress={props.onEditPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-accent" style={{ fontSize: 12 }}>{props.editLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {toShow.map(b => (
          <View key={b.id} className="bg-card2 rounded-xl px-3 py-2 items-center" style={{ minWidth: 72 }}>
            <Text style={{ fontSize: 20 }}>{b.icon}</Text>
            <Text className="text-xs mt-1" style={{ color: '#aaa', textAlign: 'center' }}>{b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
