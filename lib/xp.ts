import { RANKS, SBD_RANK_THRESHOLDS, XP_REWARDS, type RankName } from './constants'

export function calculateXPGain({ prCount, streakDays }: { prCount: number; streakDays: number }): { total: number; base: number; prBonus: number; streakBonus: number } {
  const base = XP_REWARDS.WORKOUT
  const prBonus = prCount * XP_REWARDS.PR
  const streakBonus = streakDays >= XP_REWARDS.STREAK_THRESHOLD ? XP_REWARDS.STREAK_BONUS : 0
  return { total: base + prBonus + streakBonus, base, prBonus, streakBonus }
}

export function getRankForXP(xp: number): RankName {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.xpRequired) rank = r
  }
  return rank.name
}

export function getRankData(rankName: RankName) {
  const rank = RANKS.find(r => r.name === rankName) ?? RANKS[0]
  return rank
}

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 500)) + 1
}

export function getLevelProgress(xp: number): {
  level: number
  progress: number
  xpInLevel: number
  xpNeeded: number
} {
  const level = getLevel(xp)
  const currentLevelXP = Math.pow(level - 1, 2) * 500
  const nextLevelXP = Math.pow(level, 2) * 500
  const xpInLevel = xp - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  return { level, progress: xpInLevel / xpNeeded, xpInLevel, xpNeeded }
}

export function calculateWilks(total: number, bodyweightKg: number, isMale: boolean): number {
  if (total <= 0 || bodyweightKg <= 0) return 0
  const bw = bodyweightKg
  let denom: number
  if (isMale) {
    denom = -216.0475144
          + 16.2606339   * bw
          - 0.002388645  * Math.pow(bw, 2)
          - 0.00113732   * Math.pow(bw, 3)
          + 7.01863e-6   * Math.pow(bw, 4)
          - 1.291e-8     * Math.pow(bw, 5)
  } else {
    denom = 594.31747775582
          - 27.23842536447 * bw
          + 0.82112226871  * Math.pow(bw, 2)
          - 0.00930733913  * Math.pow(bw, 3)
          + 4.731582e-5    * Math.pow(bw, 4)
          - 9.054e-8       * Math.pow(bw, 5)
  }
  return total * (500 / denom)
}

export function getSBDRank(total: number, bodyweightKg: number, _isMale = true): RankName {
  if (bodyweightKg <= 0 || total <= 0) return 'Aloittelija'
  const ratio = total / bodyweightKg
  let rank: RankName = 'Aloittelija'
  for (const t of SBD_RANK_THRESHOLDS) {
    if (ratio >= t.bwMultiple) rank = t.name
  }
  return rank
}

export function getXPToNextRank(xp: number): number {
  const current = getRankForXP(xp)
  const idx = RANKS.findIndex(r => r.name === current)
  if (idx === RANKS.length - 1) return 0
  return RANKS[idx + 1].xpRequired - xp
}

export function getSBDSubRank(total: number, bodyweightKg: number, _isMale = true): { rank: RankName; tier: 1 | 2 | 3 | 4; ratio: number } {
  const rank = getSBDRank(total, bodyweightKg)
  const ratio = bodyweightKg > 0 ? total / bodyweightKg : 0
  const idx = SBD_RANK_THRESHOLDS.findIndex(t => t.name === rank)
  if (idx < 0 || idx === SBD_RANK_THRESHOLDS.length - 1) return { rank, tier: 1, ratio }
  const min = SBD_RANK_THRESHOLDS[idx].bwMultiple
  const max = SBD_RANK_THRESHOLDS[idx + 1].bwMultiple
  const progress = (ratio - min) / (max - min)
  const tier = progress < 0.25 ? 4 : progress < 0.5 ? 3 : progress < 0.75 ? 2 : 1
  return { rank, tier: tier as 1 | 2 | 3 | 4, ratio }
}

export const TIER_ROMAN = ['', 'I', 'II', 'III', 'IV'] as const
