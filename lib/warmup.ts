export interface WarmupSet {
  weight: number
  reps: number
}

function roundToPlate(w: number): number {
  return Math.round(w / 2.5) * 2.5
}

// Lämmittelyramppi työsarjan painolle. Palauttaa sarjat tangosta työsarjaan asti.
export function calcWarmup(workWeight: number, bar = 20): WarmupSet[] {
  if (workWeight <= bar) return []
  const steps: { pct: number; reps: number }[] = [
    { pct: 0,    reps: 8 },  // tyhjä tanko
    { pct: 0.40, reps: 5 },
    { pct: 0.55, reps: 4 },
    { pct: 0.70, reps: 3 },
    { pct: 0.825, reps: 2 },
    { pct: 0.90, reps: 1 },
  ]
  const out: WarmupSet[] = []
  let prev = -1
  for (const s of steps) {
    const w = s.pct === 0 ? bar : roundToPlate(workWeight * s.pct)
    if (w < bar || w >= workWeight) continue
    if (w === prev) continue
    out.push({ weight: w, reps: s.reps })
    prev = w
  }
  return out
}
