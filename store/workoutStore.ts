import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  defaultWeight?: number
  defaultReps?: number
}

interface WorkoutState {
  workoutName: string
  exercises: WorkoutExercise[]
  startedAt: number | null
  isActive: boolean

  startWorkout: () => void
  startFromTemplate: (name: string, exercises: { exerciseId: string; exerciseName: string }[], lastWeights?: Record<string, { weight: number; reps: number }>) => void
  setWorkoutName: (name: string) => void
  addExercise: (exerciseId: string, exerciseName: string) => void
  addSet: (exerciseId: string, weightKg: number, reps: number) => void
  copyLastSet: (exerciseId: string) => void
  removeExercise: (exerciseId: string) => void
  removeSet: (exerciseId: string, setId: string) => void
  updateSet: (exerciseId: string, setId: string, field: 'weightKg' | 'reps', value: number) => void
  clearWorkout: () => void
}

let setIdCounter = 0

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workoutName: 'Workout',
      exercises: [],
      startedAt: null,
      isActive: false,

      startWorkout: () => set({ isActive: true, startedAt: Date.now(), exercises: [], workoutName: 'Workout' }),

      startFromTemplate: (name, exs, lastWeights) => set({
        isActive: true,
        startedAt: Date.now(),
        workoutName: name,
        exercises: exs.map(ex => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: [],
          defaultWeight: lastWeights?.[ex.exerciseId]?.weight,
          defaultReps: lastWeights?.[ex.exerciseId]?.reps,
        })),
      }),

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

      removeExercise: (exerciseId) => set(state => ({
        exercises: state.exercises.filter(e => e.exerciseId !== exerciseId),
      })),

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
    }),
    {
      name: 'active-workout',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        workoutName: state.workoutName,
        exercises: state.exercises,
        startedAt: state.startedAt,
        isActive: state.isActive,
      }),
    }
  )
)
