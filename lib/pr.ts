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
