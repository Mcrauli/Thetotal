import { detectPRs, isBetterSet, isRepPR, detectRepPRs } from '../lib/pr'

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

describe('isRepPR', () => {
  const history = [{ weight: 100, reps: 5 }, { weight: 80, reps: 10 }]
  it('more reps at same weight is a PR', () => {
    expect(isRepPR({ weight: 100, reps: 6 }, history)).toBe(true)
  })
  it('0.1 kg more at same reps is a PR', () => {
    expect(isRepPR({ weight: 100.1, reps: 5 }, history)).toBe(true)
  })
  it('heavier at fewer reps is a PR', () => {
    expect(isRepPR({ weight: 105, reps: 3 }, history)).toBe(true)
  })
  it('more reps than ever at lighter weight is a PR', () => {
    expect(isRepPR({ weight: 60, reps: 11 }, history)).toBe(true)
  })
  it('a set already matched in history is not a PR', () => {
    expect(isRepPR({ weight: 90, reps: 5 }, history)).toBe(false)
    expect(isRepPR({ weight: 100, reps: 5 }, history)).toBe(false)
  })
  it('first time doing an exercise is not a PR', () => {
    expect(isRepPR({ weight: 100, reps: 5 }, [])).toBe(false)
  })
  it('empty sets are not PRs', () => {
    expect(isRepPR({ weight: 0, reps: 10 }, history)).toBe(false)
    expect(isRepPR({ weight: 120, reps: 0 }, history)).toBe(false)
  })
})

describe('detectRepPRs', () => {
  it('returns the heaviest PR set per exercise', () => {
    const result = detectRepPRs(
      [
        { exerciseId: 'a', weight: 100, reps: 6 },
        { exerciseId: 'a', weight: 102.5, reps: 5 },
        { exerciseId: 'a', weight: 90, reps: 5 },
        { exerciseId: 'b', weight: 50, reps: 5 },
        { exerciseId: 'c', weight: 40, reps: 8 },
      ],
      { a: [{ weight: 100, reps: 5 }], b: [{ weight: 50, reps: 5 }] },
    )
    expect(result).toEqual([{ exerciseId: 'a', weight: 102.5, reps: 5 }])
  })
})
