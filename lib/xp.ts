import { RANKS, XP_REWARDS, type RankName } from './constants'

export function calculateXPGain({ prCount, streakDays }: { prCount: number; streakDays: number }): number {
  let xp = XP_REWARDS.WORKOUT
  xp += prCount * XP_REWARDS.PR_SBD
  if (streakDays >= XP_REWARDS.STREAK_THRESHOLD) xp += XP_REWARDS.STREAK_BONUS
  return xp
}

export function getRankForXP(xp: number): RankName {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.xpRequired) rank = r
  }
  return rank.name
}

export function getXPToNextRank(xp: number): number {
  const current = getRankForXP(xp)
  const idx = RANKS.findIndex(r => r.name === current)
  if (idx === RANKS.length - 1) return 0
  return RANKS[idx + 1].xpRequired - xp
}

export function getRankData(rankName: RankName) {
  return RANKS.find(r => r.name === rankName)!
}
