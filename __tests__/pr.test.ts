import { detectPRs, isBetterSet } from '../lib/pr'

describe('isBetterSet', () => {
  it('higher weight at same reps is a PR', () => {
    expect(isBetterSet({ weight: 100, reps: 5 }, { weight: 95, reps: 5 })).toBe(true)
  })
  it('higher weight at higher reps is a PR', () => {
    expect(isBetterSet({ weight: 100, reps: 8 }, { weight: 95, reps: 5 })).toBe(true)
  })
  it('same weight at same reps is not a PR', () => {
    expect(isBetterSet({ weight: 100, reps: 5 }, { weight: 100, reps: 5 })).toBe(false)
  })
  it('higher weight at fewer reps is not a PR', () => {
    expect(isBetterSet({ weight: 105, reps: 3 }, { weight: 100, reps: 5 })).toBe(false)
  })
  it('any set is a PR when no previous exists', () => {
    expect(isBetterSet({ weight: 60, reps: 5 }, null)).toBe(true)
  })
})

describe('detectPRs', () => {
  it('detects a PR for an exercise with no previous record', () => {
    const result = detectPRs(
      [{ exerciseId: 'ex-1', weight: 100, reps: 5 }],
      [],
    )
    expect(result).toEqual([{ exerciseId: 'ex-1', weight: 100, reps: 5 }])
  })
  it('detects PR when new set beats existing record', () => {
    const result = detectPRs(
      [{ exerciseId: 'ex-1', weight: 105, reps: 5 }],
      [{ exerciseId: 'ex-1', weight: 100, reps: 5 }],
    )
    expect(result).toEqual([{ exerciseId: 'ex-1', weight: 105, reps: 5 }])
  })
  it('returns empty when no PRs beaten', () => {
    const result = detectPRs(
      [{ exerciseId: 'ex-1', weight: 90, reps: 5 }],
      [{ exerciseId: 'ex-1', weight: 100, reps: 5 }],
    )
    expect(result).toEqual([])
  })
  it('picks best set per exercise across multiple sets', () => {
    const result = detectPRs(
      [
        { exerciseId: 'ex-1', weight: 90, reps: 5 },
        { exerciseId: 'ex-1', weight: 110, reps: 5 },
      ],
      [{ exerciseId: 'ex-1', weight: 100, reps: 5 }],
    )
    expect(result).toEqual([{ exerciseId: 'ex-1', weight: 110, reps: 5 }])
  })
})
