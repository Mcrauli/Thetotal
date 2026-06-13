export interface PresetTemplate {
  id: string
  name: string
  description: string
  exerciseNames: string[]
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'full-body',
    name: 'Full Body — Aloittelija',
    description: 'Koko kehon treeni 3× viikossa. Yksinkertaisin tapa aloittaa.',
    exerciseNames: ['Squat', 'Bench Press', 'Deadlift', 'Barbell Row'],
  },
  {
    id: 'sl-5x5-a',
    name: '5×5 — A',
    description: 'StrongLifts A-treeni. Vuorottele B:n kanssa 3× viikossa.',
    exerciseNames: ['Squat', 'Bench Press', 'Barbell Row'],
  },
  {
    id: 'sl-5x5-b',
    name: '5×5 — B',
    description: 'StrongLifts B-treeni. Vuorottele A:n kanssa 3× viikossa.',
    exerciseNames: ['Squat', 'Overhead Press', 'Deadlift'],
  },
  {
    id: 'push',
    name: 'Push (työntö)',
    description: 'Rinta, hartiat ja ojentajat. Osa PPL-splittiä.',
    exerciseNames: ['Bench Press', 'Overhead Press', 'Incline Bench Press', 'Lateral Raise', 'Tricep Pushdown'],
  },
  {
    id: 'pull',
    name: 'Pull (veto)',
    description: 'Selkä ja hauikset. Osa PPL-splittiä.',
    exerciseNames: ['Deadlift', 'Pull-up', 'Barbell Row', 'Lat Pulldown', 'Bicep Curl'],
  },
  {
    id: 'legs',
    name: 'Legs (jalat)',
    description: 'Jalkapäivä — kyykky, takareidet ja pohkeet. Osa PPL-splittiä.',
    exerciseNames: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
  },
  {
    id: 'strongman',
    name: 'Voimamies',
    description: 'Eventti-päivä: kanto, kivet ja prässi. Vaatii voimamiesvälineet.',
    exerciseNames: ['Log Press', 'Axle Deadlift', 'Atlas Stone to Shoulder', 'Farmers Walk', 'Yoke Walk'],
  },
]
