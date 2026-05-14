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
