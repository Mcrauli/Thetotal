import { View, Text } from 'react-native'

const ALL_BADGES = [
  { id: 'first_workout', icon: '🏋️', label: 'First Workout' },
  { id: 'streak_7',      icon: '🔥', label: '7 Day Streak' },
  { id: 'streak_30',     icon: '⚡', label: '30 Day Streak' },
  { id: 'pr_bench',      icon: '💪', label: 'Bench PR' },
  { id: 'pr_squat',      icon: '🦵', label: 'Squat PR' },
  { id: 'pr_deadlift',   icon: '⚔', label: 'Deadlift PR' },
  { id: 'rank_bronze',   icon: '🥉', label: 'Bronze Rank' },
  { id: 'rank_gold',     icon: '🥇', label: 'Gold Rank' },
]

interface BadgeRowProps {
  xp: number
  streak: number
  hasBenchPR: boolean
  hasSquatPR: boolean
  hasDeadliftPR: boolean
  totalWorkouts: number
}

function getUnlockedBadges(props: BadgeRowProps): string[] {
  const badges: string[] = []
  if (props.totalWorkouts >= 1) badges.push('first_workout')
  if (props.streak >= 7)        badges.push('streak_7')
  if (props.streak >= 30)       badges.push('streak_30')
  if (props.hasBenchPR)         badges.push('pr_bench')
  if (props.hasSquatPR)         badges.push('pr_squat')
  if (props.hasDeadliftPR)      badges.push('pr_deadlift')
  if (props.xp >= 1000)         badges.push('rank_bronze')
  if (props.xp >= 7000)         badges.push('rank_gold')
  return badges
}

export function BadgeRow(props: BadgeRowProps) {
  const unlocked = new Set(getUnlockedBadges(props))
  return (
    <View className="bg-card rounded-2xl p-4">
      <Text className="text-muted text-xs tracking-widest mb-3">BADGES</Text>
      <View className="flex-row flex-wrap gap-2">
        {ALL_BADGES.map(b => (
          <View
            key={b.id}
            className={`rounded-xl p-3 items-center ${unlocked.has(b.id) ? 'bg-card2' : 'bg-bg opacity-30'}`}
          >
            <Text style={{ fontSize: 20 }}>{b.icon}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
