import { create } from 'zustand'

export interface WorkoutSet {
  id: string
  exerciseId: string
  exerciseName: string
  setNumber: number
  weightKg: number
  reps: number
  isPR: boolean
}

export interface WorkoutExercise {
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
}

interface WorkoutState {
  workoutName: string
  exercises: WorkoutExercise[]
  startedAt: Date | null
  isActive: boolean

  startWorkout: () => void
  setWorkoutName: (name: string) => void
  addExercise: (exerciseId: string, exerciseName: string) => void
  addSet: (exerciseId: string, weightKg: number, reps: number) => void
  copyLastSet: (exerciseId: string) => void
  removeSet: (exerciseId: string, setId: string) => void
  updateSet: (exerciseId: string, setId: string, field: 'weightKg' | 'reps', value: number) => void
  clearWorkout: () => void
}

let setIdCounter = 0

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workoutName: 'Workout',
  exercises: [],
  startedAt: null,
  isActive: false,

  startWorkout: () => set({ isActive: true, startedAt: new Date(), exercises: [], workoutName: 'Workout' }),

  setWorkoutName: (name) => set({ workoutName: name }),

  addExercise: (exerciseId, exerciseName) => set(state => ({
    exercises: [...state.exercises, { exerciseId, exerciseName, sets: [] }],
  })),

  addSet: (exerciseId, weightKg, reps) => set(state => ({
    exercises: state.exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      const setNumber = ex.sets.length + 1
      const newSet: WorkoutSet = {
        id: `set-${++setIdCounter}`,
        exerciseId,
        exerciseName: ex.exerciseName,
        setNumber,
        weightKg,
        reps,
        isPR: false,
      }
      return { ...ex, sets: [...ex.sets, newSet] }
    }),
  })),

  copyLastSet: (exerciseId) => {
    const ex = get().exercises.find(e => e.exerciseId === exerciseId)
    if (!ex || ex.sets.length === 0) return
    const last = ex.sets[ex.sets.length - 1]
    get().addSet(exerciseId, last.weightKg, last.reps)
  },

  removeSet: (exerciseId, setId) => set(state => ({
    exercises: state.exercises.map(ex =>
      ex.exerciseId !== exerciseId ? ex : {
        ...ex,
        sets: ex.sets.filter(s => s.id !== setId).map((s, i) => ({ ...s, setNumber: i + 1 })),
      }
    ),
  })),

  updateSet: (exerciseId, setId, field, value) => set(state => ({
    exercises: state.exercises.map(ex =>
      ex.exerciseId !== exerciseId ? ex : {
        ...ex,
        sets: ex.sets.map(s => s.id !== setId ? s : { ...s, [field]: value }),
      }
    ),
  })),

  clearWorkout: () => set({ exercises: [], startedAt: null, isActive: false, workoutName: 'Workout' }),
}))
