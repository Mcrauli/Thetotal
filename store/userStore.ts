import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { getRankForXP, getRankData } from '../lib/xp'
import type { RankName } from '../lib/constants'

export interface UserProfile {
  id: string
  username: string
  bio: string
  avatar_url: string
  xp: number
  rank: RankName
  streak: number
  last_workout_date: string | null
}

interface UserState {
  profile: UserProfile | null
  loading: boolean
  fetchProfile: () => Promise<void>
  updateXPAndRank: (newXP: number) => Promise<void>
  signOut: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  loading: false,

  fetchProfile: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    set({ profile: data ?? null, loading: false })
  },

  updateXPAndRank: async (newXP: number) => {
    const { profile } = get()
    if (!profile) return
    const newRank = getRankForXP(newXP)
    await supabase
      .from('users')
      .update({ xp: newXP, rank: newRank })
      .eq('id', profile.id)
    set({ profile: { ...profile, xp: newXP, rank: newRank } })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ profile: null })
  },
}))
