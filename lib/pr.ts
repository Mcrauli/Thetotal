import type { SetKind } from './strongman'
interface SetRecord {
  exerciseId: string
  weight: number
  reps: number
}

export function isBetterSet(
  candidate: { weight: number; reps: number },
  existing: { weight: number; reps: number } | null,
): boolean {
  if (!existing) return true
  return candidate.weight >= existing.weight && candidate.reps >= existing.reps && (
    candidate.weight > existing.weight || candidate.reps > existing.reps
  )
}

export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export function shouldShowEstimatedOneRepMax(reps: number): boolean {
  return reps >= 2 && reps <= 3
}

export function detectPRs(
  newSets: SetRecord[],
  existingRecords: SetRecord[],
): SetRecord[] {
  const bestNew = new Map<string, SetRecord>()
  for (const s of newSets) {
    const current = bestNew.get(s.exerciseId)
    if (!current || isBetterSet(s, current)) bestNew.set(s.exerciseId, s)
  }

  const prs: SetRecord[] = []
  for (const [exerciseId, best] of bestNew) {
    const existing = existingRecords.find(r => r.exerciseId === exerciseId) ?? null
    if (isBetterSet(best, existing)) prs.push(best)
  }
  return prs
}

export function isRepPR(
  candidate: { weight: number; reps: number },
  history: { weight: number; reps: number }[],
): boolean {
  if (candidate.weight <= 0 || candidate.reps <= 0 || history.length === 0) return false
  return !history.some(h => h.weight >= candidate.weight && h.reps >= candidate.reps)
}

export function detectRepPRs(
  newSets: SetRecord[],
  history: Record<string, { weight: number; reps: number }[]>,
): SetRecord[] {
  const best = new Map<string, SetRecord>()
  for (const s of newSets) {
    if (!isRepPR(s, history[s.exerciseId] ?? [])) continue
    const current = best.get(s.exerciseId)
    if (!current || s.weight > current.weight || (s.weight === current.weight && s.reps > current.reps)) best.set(s.exerciseId, s)
  }
  return [...best.values()]
}

export interface PRPoint {
  weight: number
  reps: number
  durationS?: number | null
  distanceM?: number | null
}

function prVector(kind: SetKind, s: PRPoint): number[] | null {
  if (kind === 'reps') return s.weight > 0 && s.reps > 0 ? [s.weight, s.reps] : null
  if (kind === 'hold') return s.weight >= 0 && (s.durationS ?? 0) > 0 ? [s.weight, s.durationS!] : null
  if (kind === 'carry') return s.weight >= 0 && (s.distanceM ?? 0) > 0 ? [s.weight, s.distanceM!, s.durationS ? -s.durationS : -Infinity] : null
  return null
}

export function isSetPR(kind: SetKind, candidate: PRPoint, history: PRPoint[]): boolean {
  const c = prVector(kind, candidate)
  if (!c) return false
  const past = history.map(h => prVector(kind, h)).filter((v): v is number[] => v !== null)
  if (past.length === 0) return false
  return !past.some(h => h.every((v, i) => v >= c[i]))
}

export function detectSetPRs<T extends PRPoint & { exerciseId: string; kind: SetKind }>(
  newSets: T[],
  history: Record<string, PRPoint[]>,
): T[] {
  const best = new Map<string, T>()
  for (const s of newSets) {
    if (!isSetPR(s.kind, s, history[s.exerciseId] ?? [])) continue
    const cur = best.get(s.exerciseId)
    if (!cur || s.weight > cur.weight || (s.weight === cur.weight && (s.reps > cur.reps || (s.durationS ?? 0) > (cur.durationS ?? 0) || (s.distanceM ?? 0) > (cur.distanceM ?? 0)))) best.set(s.exerciseId, s)
  }
  return [...best.values()]
}
