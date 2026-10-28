export type SetKind = 'reps' | 'hold' | 'carry' | 'cardio'
export type StrongmanCategory = 'carry' | 'hold' | 'press' | 'pull' | 'stones'

const STRONGMAN: Record<string, { kind: SetKind; cat: StrongmanCategory }> = {
  "Conan's Walk": { kind: 'carry', cat: 'carry' },
  'Duck Walk': { kind: 'carry', cat: 'carry' },
  'Farmers Carry': { kind: 'carry', cat: 'carry' },
  'Farmers Walk': { kind: 'carry', cat: 'carry' },
  'Frame Carry': { kind: 'carry', cat: 'carry' },
  'Husafell Carry': { kind: 'carry', cat: 'carry' },
  'Keg Carry': { kind: 'carry', cat: 'carry' },
  'Sandbag Carry': { kind: 'carry', cat: 'carry' },
  'Yoke Walk': { kind: 'carry', cat: 'carry' },
  'Super Yoke': { kind: 'carry', cat: 'carry' },
  'Sled Drag': { kind: 'carry', cat: 'carry' },
  'Sled Push': { kind: 'carry', cat: 'carry' },
  'Truck Pull': { kind: 'carry', cat: 'carry' },
  'Arm Over Arm Pull': { kind: 'carry', cat: 'carry' },
  'Hercules Hold': { kind: 'hold', cat: 'hold' },
  'Farmers Hold': { kind: 'hold', cat: 'hold' },
  'Frame Hold': { kind: 'hold', cat: 'hold' },
  'Axle Hold': { kind: 'hold', cat: 'hold' },
  'Dinnie Stones Hold': { kind: 'hold', cat: 'hold' },
  'Log Press': { kind: 'reps', cat: 'press' },
  'Axle Press': { kind: 'reps', cat: 'press' },
  'Circus Dumbbell Press': { kind: 'reps', cat: 'press' },
  'Viking Press': { kind: 'reps', cat: 'press' },
  'Keg Toss': { kind: 'reps', cat: 'press' },
  "Fingal's Fingers": { kind: 'reps', cat: 'press' },
  'Tire Flip': { kind: 'reps', cat: 'pull' },
  '18-inch Deadlift': { kind: 'reps', cat: 'pull' },
  'Axle Deadlift': { kind: 'reps', cat: 'pull' },
  'Car Deadlift': { kind: 'reps', cat: 'pull' },
  'Atlas Stone over Bar': { kind: 'reps', cat: 'stones' },
  'Atlas Stone to Shoulder': { kind: 'reps', cat: 'stones' },
  'Stone Load Series': { kind: 'reps', cat: 'stones' },
  'Sandbag to Shoulder': { kind: 'reps', cat: 'stones' },
  'Sandbag Load Series': { kind: 'reps', cat: 'stones' },
  'Keg Load Series': { kind: 'reps', cat: 'stones' },
}

const OTHER_HOLDS = new Set(['Dead Hang', 'Plank', 'Side Plank', 'Hollow Hold'])

export function setKind(name: string, muscleGroup?: string | null): SetKind {
  if (muscleGroup === 'Kardio') return 'cardio'
  const sm = STRONGMAN[name]
  if (sm) return sm.kind
  if (OTHER_HOLDS.has(name)) return 'hold'
  return 'reps'
}

export function strongmanCategory(name: string): StrongmanCategory | null {
  return STRONGMAN[name]?.cat ?? null
}

export function formatSet(kind: SetKind, s: { weight: number; reps: number; durationS?: number | null; distanceM?: number | null }): string {
  if (kind === 'cardio') return `${s.weight}min ${s.reps}km`
  if (kind === 'hold') return `${s.weight}kg ${s.durationS ?? 0}s`
  if (kind === 'carry') return `${s.weight}kg ${s.distanceM ?? 0}m${s.durationS ? ` ${s.durationS}s` : ''}`
  return `${s.weight}×${s.reps}`
}
