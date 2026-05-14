export const COLORS = {
  bg:     '#0d0d1a',
  card:   '#1a1a2e',
  card2:  '#16213e',
  accent: '#e63946',
  gold:   '#ffd700',
  muted:  '#888888',
  white:  '#ffffff',
  green:  '#2ecc71',
}

export type RankName = 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Elite' | 'Titan'

export const RANKS: { name: RankName; xpRequired: number; color: string; icon: string }[] = [
  { name: 'Iron',   xpRequired: 0,      color: '#708090', icon: '⚔' },
  { name: 'Bronze', xpRequired: 1000,   color: '#cd7f32', icon: '🥉' },
  { name: 'Silver', xpRequired: 3000,   color: '#c0c0c0', icon: '🥈' },
  { name: 'Gold',   xpRequired: 7000,   color: '#ffd700', icon: '🥇' },
  { name: 'Elite',  xpRequired: 15000,  color: '#00bfff', icon: '💎' },
  { name: 'Titan',  xpRequired: 30000,  color: '#9b59b6', icon: '👑' },
]

export const XP_REWARDS = {
  WORKOUT:          100,
  PR_SBD:           50,
  STREAK_BONUS:     25,
  STREAK_THRESHOLD: 7,
}
