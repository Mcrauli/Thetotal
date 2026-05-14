import { calculateXPGain, getRankForXP, getXPToNextRank, getRankData } from '../lib/xp'

describe('calculateXPGain', () => {
  it('gives 100 XP for a basic workout', () => {
    expect(calculateXPGain({ prCount: 0, streakDays: 0 })).toBe(100)
  })
  it('gives 150 XP for workout with one SBD PR', () => {
    expect(calculateXPGain({ prCount: 1, streakDays: 0 })).toBe(150)
  })
  it('gives 250 XP for workout with three SBD PRs', () => {
    expect(calculateXPGain({ prCount: 3, streakDays: 0 })).toBe(250)
  })
  it('adds streak bonus when streak >= 7 days', () => {
    expect(calculateXPGain({ prCount: 0, streakDays: 7 })).toBe(125)
  })
  it('no streak bonus when streak < 7 days', () => {
    expect(calculateXPGain({ prCount: 0, streakDays: 6 })).toBe(100)
  })
  it('stacks PR bonus and streak bonus', () => {
    expect(calculateXPGain({ prCount: 2, streakDays: 10 })).toBe(225)
  })
})

describe('getRankForXP', () => {
  it('returns Iron at 0 XP', () => {
    expect(getRankForXP(0)).toBe('Iron')
  })
  it('returns Iron just below Bronze threshold', () => {
    expect(getRankForXP(999)).toBe('Iron')
  })
  it('returns Bronze at exactly 1000 XP', () => {
    expect(getRankForXP(1000)).toBe('Bronze')
  })
  it('returns Titan at 30000 XP', () => {
    expect(getRankForXP(30000)).toBe('Titan')
  })
})

describe('getXPToNextRank', () => {
  it('returns 900 XP needed when at 100 XP (Iron -> Bronze)', () => {
    expect(getXPToNextRank(100)).toBe(900)
  })
  it('returns 0 for Titan (max rank)', () => {
    expect(getXPToNextRank(35000)).toBe(0)
  })
})

describe('getRankData', () => {
  it('returns correct data for Iron', () => {
    const data = getRankData('Iron')
    expect(data.name).toBe('Iron')
    expect(data.xpRequired).toBe(0)
    expect(data.icon).toBe('⚔')
  })

  it('returns correct data for Titan', () => {
    const data = getRankData('Titan')
    expect(data.name).toBe('Titan')
    expect(data.xpRequired).toBe(30000)
  })

  it('throws for invalid rank name', () => {
    expect(() => getRankData('Unknown' as any)).toThrow('Unknown rank: Unknown')
  })
})
