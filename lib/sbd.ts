export type SbdLift = 'squat' | 'bench' | 'deadlift'

const MAIN: Record<string, SbdLift> = {
  Squat: 'squat',
  'Bench Press': 'bench',
  Deadlift: 'deadlift',
  'Sumo Deadlift': 'deadlift',
}

const VARIATIONS = new Set([
  'Pause Squat', 'Paused Squat', 'Box Squat', 'Safety Bar Squat', 'Front Squat', 'Pin Squat',
  'Pause Bench Press', 'Close Grip Bench Press', 'Spoto Press', 'Larsen Press', 'Floor Press',
  'Pause Deadlift', 'Deficit Deadlift', 'Block Pull', 'Rack Pull',
])

export function mainLiftOf(name: string): SbdLift | null {
  return MAIN[name] ?? null
}

export function isSbdLift(name: string): boolean {
  return name in MAIN || VARIATIONS.has(name)
}
