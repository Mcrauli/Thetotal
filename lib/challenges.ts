export interface Challenge {
  id: string
  name: string
  description: string
  xp: number
  icon: string
}

export const CHALLENGES: Challenge[] = [
  { id: 'workout_1',    icon: '🏋️', name: 'Ensimmäinen treeni',    description: 'Kirjaa ensimmäinen treeni',         xp: 100 },
  { id: 'workout_5',    icon: '🔥', name: '5 treeniä',             description: 'Kirjaa 5 treeniä',                  xp: 200 },
  { id: 'workout_10',   icon: '💪', name: '10 treeniä',            description: 'Kirjaa 10 treeniä',                 xp: 400 },
  { id: 'workout_25',   icon: '⚡', name: '25 treeniä',            description: 'Kirjaa 25 treeniä',                 xp: 750 },
  { id: 'workout_50',   icon: '🏆', name: '50 treeniä',            description: 'Kirjaa 50 treeniä',                 xp: 1500 },
  { id: 'workout_100',  icon: '👑', name: '100 treeniä',           description: 'Kirjaa 100 treeniä',                xp: 3000 },
  { id: 'workout_250',  icon: '⚔',  name: '250 treeniä',           description: 'Kirjaa 250 treeniä',                xp: 6000 },
  { id: 'streak_3',     icon: '🔥', name: '3 päivän putki',        description: 'Treenaa 3 päivänä peräkkäin',       xp: 150 },
  { id: 'streak_7',     icon: '🔥', name: 'Viikon putki',          description: 'Treenaa 7 päivänä peräkkäin',       xp: 400 },
  { id: 'streak_14',    icon: '🔥', name: '2 viikon putki',        description: 'Treenaa 14 päivänä peräkkäin',      xp: 800 },
  { id: 'streak_30',    icon: '🔥', name: 'Kuukauden putki',       description: 'Treenaa 30 päivänä peräkkäin',      xp: 2000 },
  { id: 'squat_60',     icon: '🦵', name: 'Kyykky 60kg',          description: 'Kyykky vähintään 60kg',             xp: 150 },
  { id: 'squat_100',    icon: '🦵', name: 'Kyykky 100kg',         description: 'Kyykky vähintään 100kg',            xp: 350 },
  { id: 'squat_140',    icon: '🦵', name: 'Kyykky 140kg',         description: 'Kyykky vähintään 140kg',            xp: 750 },
  { id: 'squat_180',    icon: '🦵', name: 'Kyykky 180kg',         description: 'Kyykky vähintään 180kg',            xp: 1500 },
  { id: 'squat_220',    icon: '🦵', name: 'Kyykky 220kg',         description: 'Kyykky vähintään 220kg',            xp: 3000 },
  { id: 'bench_40',     icon: '💪', name: 'Penkkipunnerrus 40kg',  description: 'Penkkipunnerrus vähintään 40kg',    xp: 100 },
  { id: 'bench_60',     icon: '💪', name: 'Penkkipunnerrus 60kg',  description: 'Penkkipunnerrus vähintään 60kg',    xp: 200 },
  { id: 'bench_80',     icon: '💪', name: 'Penkkipunnerrus 80kg',  description: 'Penkkipunnerrus vähintään 80kg',    xp: 400 },
  { id: 'bench_100',    icon: '💪', name: 'Penkkipunnerrus 100kg', description: 'Penkkipunnerrus vähintään 100kg',   xp: 800 },
  { id: 'bench_140',    icon: '💪', name: 'Penkkipunnerrus 140kg', description: 'Penkkipunnerrus vähintään 140kg',   xp: 2000 },
  { id: 'deadlift_100', icon: '⚔',  name: 'Maastaveto 100kg',     description: 'Maastaveto vähintään 100kg',        xp: 200 },
  { id: 'deadlift_140', icon: '⚔',  name: 'Maastaveto 140kg',     description: 'Maastaveto vähintään 140kg',        xp: 400 },
  { id: 'deadlift_180', icon: '⚔',  name: 'Maastaveto 180kg',     description: 'Maastaveto vähintään 180kg',        xp: 800 },
  { id: 'deadlift_220', icon: '⚔',  name: 'Maastaveto 220kg',     description: 'Maastaveto vähintään 220kg',        xp: 1500 },
  { id: 'deadlift_260', icon: '⚔',  name: 'Maastaveto 260kg',     description: 'Maastaveto vähintään 260kg',        xp: 3000 },
  { id: 'total_200',    icon: '🏅', name: 'SBD total 200kg',      description: 'SBD yhteistulos vähintään 200kg',   xp: 300 },
  { id: 'total_300',    icon: '🏅', name: 'SBD total 300kg',      description: 'SBD yhteistulos vähintään 300kg',   xp: 600 },
  { id: 'total_400',    icon: '🏅', name: 'SBD total 400kg',      description: 'SBD yhteistulos vähintään 400kg',   xp: 1000 },
  { id: 'total_500',    icon: '🏅', name: 'SBD total 500kg',      description: 'SBD yhteistulos vähintään 500kg',   xp: 2000 },
  { id: 'total_600',    icon: '🏅', name: 'SBD total 600kg',      description: 'SBD yhteistulos vähintään 600kg',   xp: 4000 },
]

export interface ChallengeCheckInput {
  totalWorkouts: number
  streak: number
  squat: number
  bench: number
  deadlift: number
}

export function getNewlyCompleted(input: ChallengeCheckInput, alreadyDone: string[]): Challenge[] {
  const done = new Set(alreadyDone)
  const total = input.squat + input.bench + input.deadlift

  return CHALLENGES.filter(c => {
    if (done.has(c.id)) return false
    if (c.id === 'workout_1')    return input.totalWorkouts >= 1
    if (c.id === 'workout_5')    return input.totalWorkouts >= 5
    if (c.id === 'workout_10')   return input.totalWorkouts >= 10
    if (c.id === 'workout_25')   return input.totalWorkouts >= 25
    if (c.id === 'workout_50')   return input.totalWorkouts >= 50
    if (c.id === 'workout_100')  return input.totalWorkouts >= 100
    if (c.id === 'workout_250')  return input.totalWorkouts >= 250
    if (c.id === 'streak_3')     return input.streak >= 3
    if (c.id === 'streak_7')     return input.streak >= 7
    if (c.id === 'streak_14')    return input.streak >= 14
    if (c.id === 'streak_30')    return input.streak >= 30
    if (c.id === 'squat_60')     return input.squat >= 60
    if (c.id === 'squat_100')    return input.squat >= 100
    if (c.id === 'squat_140')    return input.squat >= 140
    if (c.id === 'squat_180')    return input.squat >= 180
    if (c.id === 'squat_220')    return input.squat >= 220
    if (c.id === 'bench_40')     return input.bench >= 40
    if (c.id === 'bench_60')     return input.bench >= 60
    if (c.id === 'bench_80')     return input.bench >= 80
    if (c.id === 'bench_100')    return input.bench >= 100
    if (c.id === 'bench_140')    return input.bench >= 140
    if (c.id === 'deadlift_100') return input.deadlift >= 100
    if (c.id === 'deadlift_140') return input.deadlift >= 140
    if (c.id === 'deadlift_180') return input.deadlift >= 180
    if (c.id === 'deadlift_220') return input.deadlift >= 220
    if (c.id === 'deadlift_260') return input.deadlift >= 260
    if (c.id === 'total_200')    return total >= 200
    if (c.id === 'total_300')    return total >= 300
    if (c.id === 'total_400')    return total >= 400
    if (c.id === 'total_500')    return total >= 500
    if (c.id === 'total_600')    return total >= 600
    return false
  })
}
